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
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  clearNotifications,
  deleteBookmark,
  ensureLocalDefaultUser,
  getDatabaseHealth,
  getBookmarkById,
  getOrCreateOAuthUser,
  getStats,
  getUserById,
  getUserByEmail,
  initRealtimeListener,
  initDb,
  listBookmarks,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveBookmark,
  subscribeBookmarkEvents,
  updateBookmark,
} from "./db.js";
import type { User } from "./types.js";
import { z } from "zod";

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string | null;
    }
  }
}

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "https://ai.shivaprogramming.com").replace(/\/+$/, "");
const SESSION_SECRET = process.env.SESSION_SECRET ?? "change-me-in-prod";
const ALLOW_LOCAL_FALLBACK = process.env.ALLOW_LOCAL_FALLBACK !== "false";
const SESSION_COOKIE_SECURE =
  process.env.SESSION_COOKIE_SECURE === "true"
    ? true
    : process.env.SESSION_COOKIE_SECURE === "false"
      ? false
      : process.env.NODE_ENV === "production";
const CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB ?? process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET_GITHUB = process.env.CLIENT_SECRET_GITHUB ?? process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL_GITHUB =
  process.env.CALLBACK_URL_GITHUB ??
  process.env.GITHUB_CALLBACK_URL ??
  `${PUBLIC_BASE_URL}/auth/github/callback`;
const CORS_ORIGINS = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://localhost:3001",
        "https://127.0.0.1:3001",
        "https://ai.shivaprogramming.com",
      ]
).filter(Boolean);
const MAX_JSON_BODY = process.env.MAX_JSON_BODY ?? "64kb";
const AUTO_TAGGING_ENABLED = process.env.AUTO_TAGGING_ENABLED !== "false";

const TAG_KEYWORDS: Array<{ tag: string; keywords: string[] }> = [
  { tag: "ai", keywords: ["ai", "llm", "gpt", "openai", "anthropic", "prompt", "machine learning", "neural"] },
  { tag: "dev", keywords: ["developer", "programming", "coding", "javascript", "typescript", "python", "api", "backend", "frontend"] },
  { tag: "design", keywords: ["design", "ux", "ui", "figma", "prototype", "wireframe"] },
  { tag: "docs", keywords: ["documentation", "docs", "guide", "reference", "manual"] },
  { tag: "video", keywords: ["youtube", "vimeo", "video", "watch", "podcast"] },
  { tag: "tutorial", keywords: ["tutorial", "learn", "course", "how to", "walkthrough"] },
  { tag: "news", keywords: ["news", "release", "announcement", "update", "blog"] },
  { tag: "tool", keywords: ["tool", "app", "plugin", "extension", "software", "platform"] },
  { tag: "cloud", keywords: ["aws", "azure", "gcp", "cloud", "kubernetes", "docker"] },
  { tag: "security", keywords: ["security", "auth", "oauth", "jwt", "vulnerability", "encryption"] },
  { tag: "database", keywords: ["database", "sql", "postgres", "mysql", "mongodb", "redis"] },
  { tag: "productivity", keywords: ["productivity", "workflow", "automation", "organize", "management"] },
];

const DOMAIN_TAGS: Array<{ match: RegExp; tags: string[] }> = [
  { match: /github\.com$/i, tags: ["dev", "code"] },
  { match: /stackoverflow\.com$/i, tags: ["dev", "qna"] },
  { match: /docs\./i, tags: ["docs"] },
  { match: /youtube\.com$|youtu\.be$/i, tags: ["video"] },
  { match: /medium\.com$/i, tags: ["article"] },
  { match: /notion\.so$/i, tags: ["productivity"] },
  { match: /openai\.com$|anthropic\.com$|huggingface\.co$/i, tags: ["ai"] },
];

function normalizeTag(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function uniqueTags(tags: string[], max = 30): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const rawTag of tags) {
    const tag = normalizeTag(rawTag);
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    result.push(tag);
    if (result.length >= max) {
      break;
    }
  }
  return result;
}

function inferSmartTags(input: { url?: string; title?: string; description?: string; notes?: string }): string[] {
  const combined = [input.title, input.description, input.notes, input.url]
    .map((part) => String(part || "").toLowerCase())
    .join(" ");
  const inferred: string[] = [];

  for (const rule of TAG_KEYWORDS) {
    if (rule.keywords.some((keyword) => combined.includes(keyword))) {
      inferred.push(rule.tag);
    }
  }

  if (input.url) {
    try {
      const host = new URL(input.url).hostname.toLowerCase();
      for (const domainRule of DOMAIN_TAGS) {
        if (domainRule.match.test(host)) {
          inferred.push(...domainRule.tags);
        }
      }
    } catch {}
  }

  return uniqueTags(inferred, 10);
}

function mergeTags(existing: string[] | undefined, inferred: string[]): string[] | undefined {
  const merged = uniqueTags([...(existing || []), ...inferred]);
  return merged.length ? merged : undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  cors({
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
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === "production",
    referrerPolicy: { policy: "no-referrer" },
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.GLOBAL_RATE_LIMIT ?? 1200),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Please retry shortly." },
    skip: (req) => {
      const routePath = String(req.path || "");
      if (routePath === "/mcp" || routePath === "/mcp-setup") {
        return true;
      }
      if (routePath === "/api/events") {
        return true;
      }
      if (routePath.startsWith("/api/") && Boolean(getBearerToken(req))) {
        return true;
      }
      return false;
    },
  }),
);
app.use(express.json({ limit: MAX_JSON_BODY, strict: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: SESSION_COOKIE_SECURE,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
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

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await getUserById(id);
    if (user) {
      done(null, { id: user.id, name: user.name, email: user.email });
      return;
    }
    done(null, { id, name: "OAuth User", email: null });
  } catch (error) {
    done(error);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? `${PUBLIC_BASE_URL}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const user = await getOrCreateOAuthUser({
            provider: "google",
            providerId: profile.id,
            email,
            name: profile.displayName || "Google User",
          });
          done(null, { id: user.id, name: user.name, email: user.email });
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );
}

if (CLIENT_ID_GITHUB && CLIENT_SECRET_GITHUB) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: CLIENT_ID_GITHUB,
        clientSecret: CLIENT_SECRET_GITHUB,
        callbackURL: CALLBACK_URL_GITHUB,
        scope: ["user:email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: { id: string; displayName?: string; username?: string; emails?: Array<{ value: string }> },
        done: (error: Error | null, user?: Express.User | false) => void,
      ) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const user = await getOrCreateOAuthUser({
            provider: "github",
            providerId: profile.id,
            email,
            name: profile.displayName || profile.username || "GitHub User",
          });
          done(null, { id: user.id, name: user.name, email: user.email });
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardDir = path.join(__dirname, "../dashboard");
app.use(express.static(dashboardDir));

const MCP_TOKEN_PREFIX = "mcpv1";

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signTokenPayload(payloadBase64: string): string {
  return createHmac("sha256", SESSION_SECRET).update(`${MCP_TOKEN_PREFIX}.${payloadBase64}`).digest("base64url");
}

function generateMcpToken(userId: number, expiresInDays = 30): string {
  const exp = Math.floor(Date.now() / 1000) + Math.max(1, Math.min(expiresInDays, 365)) * 24 * 60 * 60;
  const payloadBase64 = toBase64Url(JSON.stringify({ sub: userId, exp }));
  const signature = signTokenPayload(payloadBase64);
  return `${MCP_TOKEN_PREFIX}.${payloadBase64}.${signature}`;
}

function verifyMcpToken(token: string): number | null {
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
    const parsed = JSON.parse(fromBase64Url(payloadBase64)) as { sub?: unknown; exp?: unknown };
    const userId = Number(parsed.sub);
    const exp = Number(parsed.exp);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(userId) || userId <= 0 || !Number.isFinite(exp) || exp <= now) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

function getBearerToken(req: express.Request): string | null {
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

function getRequestSource(req: express.Request): "portal" | "mcp" | "server" {
  const explicitSource = String(req.header("x-bookmark-source") || "").trim().toLowerCase();
  if (explicitSource === "mcp") {
    return "mcp";
  }
  if (explicitSource === "server") {
    return "server";
  }
  return getBearerToken(req) ? "mcp" : "portal";
}

function getUserId(req: express.Request): number {
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

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    auth_provider: user.auth_provider,
    created_at: user.created_at,
  };
}

function getHttpStatusForError(message: string, fallback = 400): number {
  if (
    message === "Authentication required" ||
    message === "Invalid or expired API token" ||
    message === "Not authenticated"
  ) {
    return 401;
  }
  return fallback;
}

const saveBookmarkSchema = z.object({
  url: z.string().trim().url().max(2048).refine((value) => isHttpUrl(value), "URL must use http or https"),
  title: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  notes: z.string().trim().max(4000).optional(),
  favicon: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine((value) => isHttpUrl(value), "Favicon URL must use http or https")
    .optional(),
});

const updateBookmarkSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine((value) => isHttpUrl(value), "URL must use http or https")
    .optional(),
  title: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  notes: z.string().trim().max(4000).optional(),
  favicon: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine((value) => isHttpUrl(value), "Favicon URL must use http or https")
    .optional(),
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

const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});

const metadataQuerySchema = z.object({
  url: z.string().trim().min(1).max(2048),
});

const tokenDaysSchema = z.coerce.number().int().min(1).max(365);
const notificationIdParamSchema = z.coerce.number().int().positive();

function ensureUrlProtocol(input: string): string {
  const value = input.trim();
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) ? value : `https://${value}`;
}

function normalizeBookmarkPayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") {
    return {};
  }
  const payload = { ...(input as Record<string, unknown>) };
  const keys = ["title", "description", "notes", "favicon"] as const;
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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function parseMetaTags(html: string): Array<Record<string, string>> {
  const tags: Array<Record<string, string>> = [];
  const metaMatches = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of metaMatches.slice(0, 200)) {
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(tag))) {
      const key = String(match[1] || "").toLowerCase();
      const value = String(match[3] ?? match[4] ?? match[5] ?? "").trim();
      if (key) {
        attrs[key] = value;
      }
    }
    if (Object.keys(attrs).length) {
      tags.push(attrs);
    }
  }
  return tags;
}

function extractMetadataFromHtml(html: string): { title: string; description: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const tags = parseMetaTags(html);

  const findMeta = (keys: string[]): string => {
    for (const tag of tags) {
      const name = String(tag.name || tag.property || "").toLowerCase();
      if (!name || !keys.includes(name)) {
        continue;
      }
      const content = stripHtml(tag.content || "");
      if (content) {
        return content;
      }
    }
    return "";
  };

  const title =
    findMeta(["og:title", "twitter:title"]) ||
    stripHtml(titleMatch?.[1] || "");
  const description = findMeta(["description", "og:description", "twitter:description"]);
  return {
    title: title.slice(0, 300),
    description: description.slice(0, 2000),
  };
}

function toCandidateUrls(rawUrl: string): string[] {
  const input = String(rawUrl || "").trim();
  if (!input) {
    return [];
  }
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(input)) {
    return [input];
  }
  return [`https://${input}`, `http://${input}`];
}

function titleFromHostname(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    const base = host.split(".")[0] || host;
    return `${base.charAt(0).toUpperCase()}${base.slice(1)} - Website`;
  } catch {
    return "Website";
  }
}

async function fetchUrlMetadata(rawUrl: string): Promise<{ url: string; title: string; description: string; protocol: "http" | "https" | "unknown" }> {
  const candidates = toCandidateUrls(rawUrl);
  if (!candidates.length) {
    throw new Error("URL is required");
  }

  let lastResolved = candidates[0];

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(candidate, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "BookmarkFetcher/1.0 (+https://ai.shivaprogramming.com)",
          accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeout);

      lastResolved = response.url || candidate;
      const type = String(response.headers.get("content-type") || "").toLowerCase();
      if (!type.includes("text/html")) {
        const fallbackTitle = titleFromHostname(lastResolved);
        return {
          url: lastResolved,
          title: fallbackTitle,
          description: `Saved from ${new URL(lastResolved).hostname.replace(/^www\./i, "")}`,
          protocol: lastResolved.startsWith("https://") ? "https" : lastResolved.startsWith("http://") ? "http" : "unknown",
        };
      }

      const html = await response.text();
      const { title, description } = extractMetadataFromHtml(html);
      const fallbackTitle = titleFromHostname(lastResolved);
      return {
        url: lastResolved,
        title: title || fallbackTitle,
        description: description || `Saved from ${new URL(lastResolved).hostname.replace(/^www\./i, "")}`,
        protocol: lastResolved.startsWith("https://") ? "https" : lastResolved.startsWith("http://") ? "http" : "unknown",
      };
    } catch {
      clearTimeout(timeout);
    }
  }

  const fallbackUrl = ensureUrlProtocol(rawUrl);
  return {
    url: fallbackUrl,
    title: titleFromHostname(fallbackUrl),
    description: `Saved from ${safeHost(fallbackUrl)}`,
    protocol: fallbackUrl.startsWith("https://") ? "https" : fallbackUrl.startsWith("http://") ? "http" : "unknown",
  };
}

function safeHost(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return value;
  }
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/dashboard/:section", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/bookmarks", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/projects/:slug", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/app", (_req, res) => {
  res.redirect("/");
});

app.get("/register", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "register.html"));
});

app.get("/mcp-setup", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "mcp-setup.html"));
});

app.get("/syshealth", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/mcp", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/notifications", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/auth/google", authLimiter, (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(400).json({ success: false, error: "Google OAuth is not configured" });
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/register?error=google_auth_failed" }),
  (_req, res) => {
    res.redirect("/");
  },
);

app.get("/auth/github", authLimiter, (req, res, next) => {
  if (!CLIENT_ID_GITHUB || !CLIENT_SECRET_GITHUB) {
    res.status(400).json({ success: false, error: "GitHub OAuth is not configured" });
    return;
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

app.get(
  "/auth/github/callback",
  (req, res, next) => {
    passport.authenticate("github", (error: unknown, user: Express.User | false) => {
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
  },
);

app.get("/api/me", async (req, res) => {
  try {
    const userId = getUserId(req);
    const current = await getUserById(userId);
    if (current) {
      res.json({ success: true, data: toPublicUser(current) });
      return;
    }
    res.status(404).json({ success: false, error: "User not found" });
  } catch {
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

app.get("/api/url-metadata", tokenLimiter, async (req, res) => {
  const parsed = metadataQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Invalid url query" });
    return;
  }
  try {
    const data = await fetchUrlMetadata(parsed.data.url);
    res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch metadata";
    res.status(400).json({ success: false, error: message });
  }
});

app.get("/api/system-health", async (_req, res) => {
  const db = await getDatabaseHealth();
  const memory = process.memoryUsage();
  const [loadAvg1, loadAvg5, loadAvg15] = os.loadavg();

  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      api: {
        status: "ok",
        uptimeSec: Math.floor(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
      },
      database: {
        status: db.ok ? "ok" : "down",
        latencyMs: db.latencyMs,
        serverTime: db.serverTime,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        cpuCount: os.cpus().length,
        loadAvg1,
        loadAvg5,
        loadAvg15,
        memory: {
          rss: memory.rss,
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          external: memory.external,
        },
      },
    },
  });
});

app.get("/api/events", (req, res) => {
  let userId: number;
  try {
    userId = getUserId(req);
  } catch {
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

app.get("/api/notifications", async (req, res) => {
  try {
    const parsedQuery = listNotificationsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({ success: false, error: "Invalid notifications query" });
      return;
    }

    const userId = getUserId(req);
    const pageSize = parsedQuery.data.pageSize ?? parsedQuery.data.limit ?? 50;
    const page = parsedQuery.data.page ?? 1;
    const offset = (page - 1) * pageSize;
    const { items, total, unread } = await listNotifications(userId, pageSize, offset);
    res.json({
      success: true,
      data: items,
      unread,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(401).json({ success: false, error: message });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const parsedId = notificationIdParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ success: false, error: "Invalid notification id" });
      return;
    }

    const updated = await markNotificationRead(parsedId.data, getUserId(req));
    if (!updated) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(401).json({ success: false, error: message });
  }
});

app.post("/api/notifications/read-all", async (req, res) => {
  try {
    const count = await markAllNotificationsRead(getUserId(req));
    res.json({ success: true, data: { updated: count } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(401).json({ success: false, error: message });
  }
});

app.delete("/api/notifications", async (req, res) => {
  try {
    const count = await clearNotifications(getUserId(req));
    res.json({ success: true, data: { deleted: count } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(401).json({ success: false, error: message });
  }
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
  } catch (error) {
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
  } catch (error) {
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
    const userId = getUserId(req);
    const source = getRequestSource(req);
    const bookmark = await saveBookmark({ ...parsed.data, user_id: userId }, source);
    console.info(`[bookmark-event] action=created source=${source} user=${userId} id=${bookmark.id} title=${bookmark.title || "(untitled)"}`);
    return res.status(201).json({ success: true, data: bookmark });
  } catch (error) {
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
    const source = getRequestSource(req);
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
    const updated = await updateBookmark(id, parsed.data, userId, source);
    if (updated) {
      console.info(`[bookmark-event] action=updated source=${source} user=${userId} id=${updated.id} title=${updated.title || "(untitled)"}`);
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
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
    const userId = getUserId(req);
    const source = getRequestSource(req);
    const deleted = await deleteBookmark(parsedId.data, userId, source);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    console.info(`[bookmark-event] action=deleted source=${source} user=${userId} id=${deleted.id} title=${deleted.title || "(untitled)"}`);
    res.json({ success: true, data: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(getHttpStatusForError(message, 400)).json({ success: false, error: message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getStats(getUserId(req));
    res.json({ success: true, data: stats });
  } catch (error) {
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
