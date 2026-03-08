import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac, timingSafeEqual } from "node:crypto";
import { deleteBookmark, ensureLocalDefaultUser, getBookmarkById, getOrCreateOAuthUser, getStats, getUserById, initRealtimeListener, initDb, listBookmarks, saveBookmark, subscribeBookmarkEvents, updateBookmark, } from "./db.js";
import { z } from "zod";
const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "https://ai.shivaprogramming.com").replace(/\/+$/, "");
const SESSION_SECRET = process.env.SESSION_SECRET ?? "change-me-in-prod";
const ALLOW_LOCAL_FALLBACK = process.env.ALLOW_LOCAL_FALLBACK !== "false";
const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === "true"
    ? true
    : process.env.SESSION_COOKIE_SECURE === "false"
        ? false
        : process.env.NODE_ENV === "production";
const CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB ?? process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET_GITHUB = process.env.CLIENT_SECRET_GITHUB ?? process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL_GITHUB = process.env.CALLBACK_URL_GITHUB ??
    process.env.GITHUB_CALLBACK_URL ??
    `${PUBLIC_BASE_URL}/auth/github/callback`;
const CORS_ORIGINS = (process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://localhost:3001",
        "https://127.0.0.1:3001",
        "https://ai.shivaprogramming.com",
    ]).filter(Boolean);
const MAX_JSON_BODY = process.env.MAX_JSON_BODY ?? "64kb";
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (CORS_ORIGINS.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
}));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === "production",
    referrerPolicy: { policy: "no-referrer" },
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
}));
app.use(express.json({ limit: MAX_JSON_BODY, strict: true }));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: SESSION_COOKIE_SECURE,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));
app.use(passport.initialize());
app.use(passport.session());
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
const tokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await getUserById(id);
        if (user) {
            done(null, { id: user.id, name: user.name, email: user.email });
            return;
        }
        done(null, { id, name: "OAuth User", email: null });
    }
    catch (error) {
        done(error);
    }
});
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? `${PUBLIC_BASE_URL}/auth/google/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value ?? null;
            const user = await getOrCreateOAuthUser({
                provider: "google",
                providerId: profile.id,
                email,
                name: profile.displayName || "Google User",
            });
            done(null, { id: user.id, name: user.name, email: user.email });
        }
        catch (error) {
            done(error);
        }
    }));
}
if (CLIENT_ID_GITHUB && CLIENT_SECRET_GITHUB) {
    passport.use(new GitHubStrategy({
        clientID: CLIENT_ID_GITHUB,
        clientSecret: CLIENT_SECRET_GITHUB,
        callbackURL: CALLBACK_URL_GITHUB,
        scope: ["user:email"],
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value ?? null;
            const user = await getOrCreateOAuthUser({
                provider: "github",
                providerId: profile.id,
                email,
                name: profile.displayName || profile.username || "GitHub User",
            });
            done(null, { id: user.id, name: user.name, email: user.email });
        }
        catch (error) {
            done(error);
        }
    }));
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardDir = path.join(__dirname, "../dashboard");
app.use(express.static(dashboardDir));
const MCP_TOKEN_PREFIX = "mcpv1";
function toBase64Url(input) {
    return Buffer.from(input, "utf8").toString("base64url");
}
function fromBase64Url(input) {
    return Buffer.from(input, "base64url").toString("utf8");
}
function signTokenPayload(payloadBase64) {
    return createHmac("sha256", SESSION_SECRET).update(`${MCP_TOKEN_PREFIX}.${payloadBase64}`).digest("base64url");
}
function generateMcpToken(userId, expiresInDays = 30) {
    const exp = Math.floor(Date.now() / 1000) + Math.max(1, Math.min(expiresInDays, 365)) * 24 * 60 * 60;
    const payloadBase64 = toBase64Url(JSON.stringify({ sub: userId, exp }));
    const signature = signTokenPayload(payloadBase64);
    return `${MCP_TOKEN_PREFIX}.${payloadBase64}.${signature}`;
}
function verifyMcpToken(token) {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== MCP_TOKEN_PREFIX) {
        return null;
    }
    const payloadBase64 = parts[1];
    const signature = parts[2];
    const expected = signTokenPayload(payloadBase64);
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (signatureBuffer.length !== expectedBuffer.length) {
        return null;
    }
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }
    try {
        const parsed = JSON.parse(fromBase64Url(payloadBase64));
        const userId = Number(parsed.sub);
        const exp = Number(parsed.exp);
        const now = Math.floor(Date.now() / 1000);
        if (!Number.isInteger(userId) || userId <= 0 || !Number.isFinite(exp) || exp <= now) {
            return null;
        }
        return userId;
    }
    catch {
        return null;
    }
}
function getBearerToken(req) {
    const header = req.header("authorization");
    if (!header) {
        return null;
    }
    const [scheme, token] = header.split(" ");
    if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
        return null;
    }
    return token.trim() || null;
}
function getUserId(req) {
    const bearer = getBearerToken(req);
    if (bearer) {
        const userId = verifyMcpToken(bearer);
        if (userId) {
            return userId;
        }
        throw new Error("Invalid or expired API token");
    }
    if (req.isAuthenticated() && req.user?.id) {
        return req.user.id;
    }
    if (ALLOW_LOCAL_FALLBACK) {
        return Number(process.env.DEFAULT_USER_ID ?? 1);
    }
    throw new Error("Authentication required");
}
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
    };
}
function getHttpStatusForError(message, fallback = 400) {
    if (message === "Authentication required" ||
        message === "Invalid or expired API token" ||
        message === "Not authenticated") {
        return 401;
    }
    return fallback;
}
const saveBookmarkSchema = z.object({
    url: z.string().trim().url().max(2048),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().max(2000).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    notes: z.string().trim().max(4000).optional(),
    favicon: z.string().trim().url().max(2048).optional(),
});
const updateBookmarkSchema = z.object({
    url: z.string().trim().url().max(2048).optional(),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().max(2000).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    notes: z.string().trim().max(4000).optional(),
    favicon: z.string().trim().url().max(2048).optional(),
    is_favorite: z.boolean().optional(),
});
const idParamSchema = z.coerce.number().int().positive();
const listBookmarksQuerySchema = z.object({
    search: z.string().trim().max(200).optional(),
    tag: z.string().trim().min(1).max(50).optional(),
    favorite: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).max(100000).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
const tokenDaysSchema = z.coerce.number().int().min(1).max(365);
function ensureUrlProtocol(input) {
    const value = input.trim();
    return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) ? value : `https://${value}`;
}
function normalizeBookmarkPayload(input) {
    if (!input || typeof input !== "object") {
        return {};
    }
    const payload = { ...input };
    const keys = ["title", "description", "notes", "favicon"];
    for (const key of keys) {
        if (typeof payload[key] === "string") {
            const trimmed = payload[key].trim();
            payload[key] = trimmed === "" ? undefined : trimmed;
        }
    }
    if (typeof payload.url === "string" && payload.url.trim() !== "") {
        payload.url = ensureUrlProtocol(payload.url);
    }
    if (Array.isArray(payload.tags)) {
        const tags = payload.tags
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag) => tag.length > 0);
        payload.tags = tags.length ? tags : undefined;
    }
    return payload;
}
app.get("/", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/dashboard", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/dashboard/:section", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/bookmarks", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/projects/:slug", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/app", (_req, res) => {
    res.redirect("/bookmarks");
});
app.get("/register", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "register.html"));
});
app.get("/mcp-setup", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "mcp-setup.html"));
});
app.get("/syshealth", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/mcp", (_req, res) => {
    res.sendFile(path.join(dashboardDir, "react-shell.html"));
});
app.get("/auth/google", authLimiter, (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        res.status(400).json({ success: false, error: "Google OAuth is not configured" });
        return;
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/register?error=google_auth_failed" }), (_req, res) => {
    res.redirect("/");
});
app.get("/auth/github", authLimiter, (req, res, next) => {
    if (!CLIENT_ID_GITHUB || !CLIENT_SECRET_GITHUB) {
        res.status(400).json({ success: false, error: "GitHub OAuth is not configured" });
        return;
    }
    passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});
app.get("/auth/github/callback", (req, res, next) => {
    passport.authenticate("github", (error, user) => {
        if (error) {
            console.error("GitHub OAuth callback error:", error);
            res.redirect("/register?error=github_callback_error");
            return;
        }
        if (!user) {
            res.redirect("/register?error=github_auth_failed");
            return;
        }
        req.logIn(user, (loginError) => {
            if (loginError) {
                console.error("GitHub OAuth login session error:", loginError);
                res.redirect("/register?error=github_session_error");
                return;
            }
            res.redirect("/");
        });
    })(req, res, next);
});
app.get("/api/me", async (req, res) => {
    try {
        const userId = getUserId(req);
        const current = await getUserById(userId);
        if (current) {
            res.json({ success: true, data: toPublicUser(current) });
            return;
        }
        res.status(404).json({ success: false, error: "User not found" });
    }
    catch {
        res.status(401).json({ success: false, error: "Not authenticated" });
    }
});
app.post("/api/mcp-token", tokenLimiter, async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
        res.status(401).json({ success: false, error: "Login required" });
        return;
    }
    const parsedDays = tokenDaysSchema.safeParse(req.body?.expires_in_days ?? 30);
    if (!parsedDays.success) {
        res.status(400).json({ success: false, error: "Invalid expires_in_days (must be 1-365)" });
        return;
    }
    const expiresInDays = parsedDays.data;
    const token = generateMcpToken(req.user.id, expiresInDays);
    res.json({
        success: true,
        data: {
            token,
            expires_in_days: expiresInDays,
        },
    });
});
app.get("/api/mcp-token", tokenLimiter, async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
        res.status(401).json({ success: false, error: "Login required" });
        return;
    }
    const parsedDays = tokenDaysSchema.safeParse(req.query.expires_in_days ?? 30);
    if (!parsedDays.success) {
        res.status(400).json({ success: false, error: "Invalid expires_in_days (must be 1-365)" });
        return;
    }
    const token = generateMcpToken(req.user.id, parsedDays.data);
    res.json({
        success: true,
        data: {
            token,
            expires_in_days: parsedDays.data,
        },
        how_to_use: "Set this value as BOOKMARK_API_TOKEN in your MCP client config",
    });
});
app.post("/api/logout", (req, res) => {
    req.logout((error) => {
        if (error) {
            res.status(500).json({ success: false, error: "Logout failed" });
            return;
        }
        req.session.destroy(() => {
            res.json({ success: true });
        });
    });
});
app.get("/api/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
});
app.get("/api/events", (req, res) => {
    let userId;
    try {
        userId = getUserId(req);
    }
    catch {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    const unsubscribe = subscribeBookmarkEvents((event) => {
        if (event.user_id !== userId) {
            return;
        }
        res.write(`event: bookmark\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    const keepAlive = setInterval(() => {
        res.write(`event: ping\ndata: {}\n\n`);
    }, 25000);
    req.on("close", () => {
        clearInterval(keepAlive);
        unsubscribe();
    });
});
app.get("/api/bookmarks", async (req, res) => {
    try {
        const parsedQuery = listBookmarksQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            res.status(400).json({ success: false, error: "Invalid bookmarks query" });
            return;
        }
        const search = parsedQuery.data.search;
        const tag = parsedQuery.data.tag;
        const favorite = parsedQuery.data.favorite === "true";
        const page = parsedQuery.data.page ?? 1;
        const pageSize = parsedQuery.data.pageSize ?? 30;
        const offset = (page - 1) * pageSize;
        const user_id = getUserId(req);
        const { items, total } = await listBookmarks({
            search,
            tag,
            favorite,
            user_id,
            limit: pageSize,
            offset,
        });
        res.json({
            success: true,
            data: items,
            total,
            page,
            pageSize,
            hasMore: offset + items.length < total,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(401).json({ success: false, error: message });
    }
});
app.get("/api/bookmarks/:id", async (req, res) => {
    try {
        const parsedId = idParamSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            return res.status(400).json({ success: false, error: "Invalid bookmark id" });
        }
        const id = parsedId.data;
        const userId = getUserId(req);
        const bookmark = await getBookmarkById(id, userId);
        if (!bookmark) {
            return res.status(404).json({ success: false, error: "Not found" });
        }
        return res.json({ success: true, data: bookmark });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return res.status(401).json({ success: false, error: message });
    }
});
app.post("/api/bookmarks", writeLimiter, async (req, res) => {
    try {
        const parsed = saveBookmarkSchema.safeParse(normalizeBookmarkPayload(req.body));
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return res.status(400).json({
                success: false,
                error: firstIssue ? `Invalid field "${firstIssue.path.join(".")}": ${firstIssue.message}` : "Invalid bookmark payload",
            });
        }
        const bookmark = await saveBookmark({ ...parsed.data, user_id: getUserId(req) });
        return res.status(201).json({ success: true, data: bookmark });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return res.status(getHttpStatusForError(message, 400)).json({ success: false, error: message });
    }
});
app.patch("/api/bookmarks/:id", writeLimiter, async (req, res) => {
    try {
        const parsedId = idParamSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            return res.status(400).json({ success: false, error: "Invalid bookmark id" });
        }
        const id = parsedId.data;
        const userId = getUserId(req);
        const existing = await getBookmarkById(id, userId);
        if (!existing) {
            return res.status(404).json({ success: false, error: "Not found" });
        }
        const parsed = updateBookmarkSchema.safeParse(normalizeBookmarkPayload(req.body));
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return res.status(400).json({
                success: false,
                error: firstIssue
                    ? `Invalid field "${firstIssue.path.join(".")}": ${firstIssue.message}`
                    : "Invalid bookmark update payload",
            });
        }
        const updated = await updateBookmark(id, parsed.data, userId);
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return res.status(getHttpStatusForError(message, 400)).json({ success: false, error: message });
    }
});
app.delete("/api/bookmarks/:id", writeLimiter, async (req, res) => {
    try {
        const parsedId = idParamSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            res.status(400).json({ success: false, error: "Invalid bookmark id" });
            return;
        }
        const deleted = await deleteBookmark(parsedId.data, getUserId(req));
        if (!deleted) {
            return res.status(404).json({ success: false, error: "Not found" });
        }
        res.json({ success: true, data: deleted });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(getHttpStatusForError(message, 400)).json({ success: false, error: message });
    }
});
app.get("/api/stats", async (req, res) => {
    try {
        const stats = await getStats(getUserId(req));
        res.json({ success: true, data: stats });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(401).json({ success: false, error: message });
    }
});
await initDb();
await initRealtimeListener();
const defaultUserId = await ensureLocalDefaultUser();
process.env.DEFAULT_USER_ID = String(defaultUserId);
app.listen(PORT, HOST, () => {
    console.log(`Bookmark API running at http://${HOST}:${PORT}`);
    console.log(`Register/Login page: http://${HOST}:${PORT}/register`);
    if (HOST === "0.0.0.0") {
        console.log(`Public URL: ${PUBLIC_BASE_URL}/register`);
    }
});
