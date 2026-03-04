import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  deleteBookmark,
  ensureLocalDefaultUser,
  getBookmarkById,
  getOrCreateOAuthUser,
  getStats,
  getUserById,
  getUserByEmail,
  initDb,
  listBookmarks,
  saveBookmark,
  updateBookmark,
} from "./db.js";
import type { User } from "./types.js";

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
const SESSION_SECRET = process.env.SESSION_SECRET ?? "change-me-in-prod";
const ALLOW_LOCAL_FALLBACK = process.env.ALLOW_LOCAL_FALLBACK !== "false";
const CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB ?? process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET_GITHUB = process.env.CLIENT_SECRET_GITHUB ?? process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL_GITHUB =
  process.env.CALLBACK_URL_GITHUB ??
  process.env.GITHUB_CALLBACK_URL ??
  "http://localhost:3001/auth/github/callback";

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://66.179.137.126:3001",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

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
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:3001/auth/google/callback",
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

function getUserId(req: express.Request): number {
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

app.get("/", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

app.get("/register", (_req, res) => {
  res.sendFile(path.join(dashboardDir, "register.html"));
});

app.get("/auth/google", (req, res, next) => {
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

app.get("/auth/github", (req, res, next) => {
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
  if (req.isAuthenticated() && req.user?.id) {
    const current = await getUserById(req.user.id);
    if (current) {
      res.json({ success: true, data: toPublicUser(current) });
      return;
    }
    res.json({ success: true, data: req.user });
    return;
  }
  res.status(401).json({ success: false, error: "Not authenticated" });
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

app.get("/api/bookmarks", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
    const favorite = req.query.favorite === "true";
    const user_id = getUserId(req);

    const bookmarks = await listBookmarks({ search, tag, favorite, user_id });
    res.json({ success: true, data: bookmarks, total: bookmarks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(401).json({ success: false, error: message });
  }
});

app.get("/api/bookmarks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
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

app.post("/api/bookmarks", async (req, res) => {
  try {
    const bookmark = await saveBookmark({ ...req.body, user_id: getUserId(req) });
    return res.status(201).json({ success: true, data: bookmark });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
});

app.patch("/api/bookmarks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = getUserId(req);
    const existing = await getBookmarkById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    const updated = await updateBookmark(id, req.body, userId);
    return res.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
});

app.delete("/api/bookmarks/:id", async (req, res) => {
  try {
    const deleted = await deleteBookmark(Number(req.params.id), getUserId(req));
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ success: false, error: message });
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
const defaultUserId = await ensureLocalDefaultUser();
process.env.DEFAULT_USER_ID = String(defaultUserId);

app.listen(PORT, HOST, () => {
  console.log(`Bookmark API running at http://${HOST}:${PORT}`);
  console.log(`Register/Login page: http://${HOST}:${PORT}/register`);
  if (HOST === "0.0.0.0") {
    console.log(`Public URL: http://66.179.137.126:${PORT}/register`);
  }
});
