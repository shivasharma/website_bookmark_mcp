import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import pg from "pg";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const { Pool } = pg;

// ── Database ─────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || [],
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.SESSION_COOKIE_SECURE === "true",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ── Passport serialization ───────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});

// ── Helper: upsert user ──────────────────────────────────────────────
async function upsertUser({ provider, providerId, name, email, avatar }) {
  const { rows } = await pool.query(
    `INSERT INTO users (provider, provider_id, name, email, avatar, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (provider, provider_id)
     DO UPDATE SET name = $3, email = $4, avatar = $5
     RETURNING *`,
    [provider, providerId, name, email || null, avatar || null]
  );
  return rows[0];
}

// ── Google OAuth ─────────────────────────────────────────────────────
if (process.env.CLIENT_ID_GOOGLE) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID_GOOGLE,
        clientSecret: process.env.CLIENT_SECRET_GOOGLE,
        callbackURL: process.env.CALLBACK_URL_GOOGLE,
      },
      async (_at, _rt, profile, done) => {
        try {
          const user = await upsertUser({
            provider: "google",
            providerId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

// ── GitHub OAuth ─────────────────────────────────────────────────────
if (process.env.CLIENT_ID_GITHUB) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.CLIENT_ID_GITHUB,
        clientSecret: process.env.CLIENT_SECRET_GITHUB,
        callbackURL: process.env.CALLBACK_URL_GITHUB,
      },
      async (_at, _rt, profile, done) => {
        try {
          const user = await upsertUser({
            provider: "github",
            providerId: String(profile.id),
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

// ── Auth routes ──────────────────────────────────────────────────────
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=google_failed" }),
  (_req, res) => res.redirect("/dashboard")
);

app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=github_failed" }),
  (_req, res) => res.redirect("/dashboard")
);

app.post("/auth/logout", (req, res) => {
  req.logout(() => res.json({ success: true }));
});

// ── API routes ───────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ success: true, uptime: process.uptime() })
);

app.get("/api/me", (req, res) => {
  if (req.isAuthenticated()) {
    const { id, name, email, avatar } = req.user;
    res.json({ success: true, data: { id, name, email, avatar } });
  } else {
    res.json({ success: false });
  }
});

app.post("/api/token", async (req, res) => {
  const allowFallback = process.env.ALLOW_LOCAL_FALLBACK === "true";
  if (!req.isAuthenticated() && !allowFallback) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  const token = "ls_" + crypto.randomBytes(24).toString("hex");
  try {
    await pool.query(
      "INSERT INTO api_tokens (user_id, token, created_at) VALUES ($1, $2, NOW())",
      [req.user?.id ?? null, token]
    );
  } catch {
    // Continue in dev/offline mode
  }
  res.json({ success: true, token });
});

// ── Serve React frontend ─────────────────────────────────────────────
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

// ── DB schema init ───────────────────────────────────────────────────
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      provider    TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      name        TEXT,
      email       TEXT,
      avatar      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (provider, provider_id)
    );
    CREATE TABLE IF NOT EXISTS api_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

initDb()
  .then(() =>
    app.listen(PORT, HOST, () =>
      console.log(`LinkSync server running on ${HOST}:${PORT}`)
    )
  )
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
