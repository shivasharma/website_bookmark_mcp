import "dotenv/config";
import { EventEmitter } from "node:events";
import { Client, Pool } from "pg";
import { randomUUID } from "node:crypto";
import type {
  Bookmark,
  BookmarkStats,
  ListBookmarksInput,
  SaveBookmarkInput,
  UpdateBookmarkInput,
  User,
} from "./types.js";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/bookmark_mcp";

const pool = new Pool({ connectionString });
const realtimeEvents = new EventEmitter();
realtimeEvents.setMaxListeners(200);
const BOOKMARKS_CHANNEL = "bookmark_events";
let listenerClient: Client | null = null;
let listenerStarted = false;

type AuthProvider = "google" | "github" | "local";
type BookmarkEvent = {
  action: "created" | "updated" | "deleted";
  user_id: number;
  bookmark_id: number;
  at: string;
};

async function emitBookmarkEvent(event: BookmarkEvent): Promise<void> {
  await pool.query(`SELECT pg_notify($1, $2)`, [BOOKMARKS_CHANNEL, JSON.stringify(event)]);
}

export async function initRealtimeListener(): Promise<void> {
  if (listenerStarted) {
    return;
  }
  listenerStarted = true;
  listenerClient = new Client({ connectionString });
  await listenerClient.connect();
  await listenerClient.query(`LISTEN ${BOOKMARKS_CHANNEL}`);
  listenerClient.on("notification", (msg) => {
    if (msg.channel !== BOOKMARKS_CHANNEL || !msg.payload) {
      return;
    }
    try {
      const parsed = JSON.parse(msg.payload) as BookmarkEvent;
      realtimeEvents.emit(BOOKMARKS_CHANNEL, parsed);
    } catch {
      // Ignore invalid event payloads
    }
  });
  listenerClient.on("error", () => {
    listenerStarted = false;
  });
}

export function subscribeBookmarkEvents(handler: (event: BookmarkEvent) => void): () => void {
  realtimeEvents.on(BOOKMARKS_CHANNEL, handler);
  return () => {
    realtimeEvents.off(BOOKMARKS_CHANNEL, handler);
  };
}

function rowToBookmark(row: Record<string, unknown>): Bookmark {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    url: String(row.url),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    favicon: String(row.favicon ?? ""),
    notes: String(row.notes ?? ""),
    is_favorite: Boolean(row.is_favorite),
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      auth_provider TEXT,
      provider_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`);
  await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_auth_provider_provider_id_unique
    ON users (auth_provider, provider_id)
    WHERE auth_provider IS NOT NULL AND provider_id IS NOT NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT[] NOT NULL DEFAULT '{}',
      favicon TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, url)
    );
  `);
}

export async function registerUser(input: {
  name: string;
  email: string | null;
  passwordHash?: string | null;
  authProvider?: AuthProvider;
  providerId?: string | null;
}): Promise<User> {
  const { rows } = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, auth_provider, provider_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, password_hash, auth_provider, provider_id, created_at
    `,
    [input.name, input.email, input.passwordHash ?? null, input.authProvider ?? null, input.providerId ?? null],
  );
  const row = rows[0];
  return {
    id: Number(row.id),
    name: String(row.name),
    email: row.email ? String(row.email) : null,
    password_hash: row.password_hash ? String(row.password_hash) : null,
    auth_provider: (row.auth_provider ? String(row.auth_provider) : null) as User["auth_provider"],
    provider_id: row.provider_id ? String(row.provider_id) : null,
    created_at: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query(
    `SELECT id, name, email, password_hash, auth_provider, provider_id, created_at FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  if (!rows.length) {
    return null;
  }
  const row = rows[0];
  return {
    id: Number(row.id),
    name: String(row.name),
    email: row.email ? String(row.email) : null,
    password_hash: row.password_hash ? String(row.password_hash) : null,
    auth_provider: (row.auth_provider ? String(row.auth_provider) : null) as User["auth_provider"],
    provider_id: row.provider_id ? String(row.provider_id) : null,
    created_at: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await pool.query(
    `SELECT id, name, email, password_hash, auth_provider, provider_id, created_at FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  if (!rows.length) {
    return null;
  }
  const row = rows[0];
  return {
    id: Number(row.id),
    name: String(row.name),
    email: row.email ? String(row.email) : null,
    password_hash: row.password_hash ? String(row.password_hash) : null,
    auth_provider: (row.auth_provider ? String(row.auth_provider) : null) as User["auth_provider"],
    provider_id: row.provider_id ? String(row.provider_id) : null,
    created_at: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getOrCreateOAuthUser(input: {
  provider: AuthProvider;
  providerId: string;
  email?: string | null;
  name: string;
}): Promise<User> {
  const byProvider = await pool.query(
    `
      SELECT id, name, email, password_hash, auth_provider, provider_id, created_at
      FROM users
      WHERE auth_provider = $1 AND provider_id = $2
      LIMIT 1
    `,
    [input.provider, input.providerId],
  );

  if (byProvider.rows.length > 0) {
    const row = byProvider.rows[0];
    return {
      id: Number(row.id),
      name: String(row.name),
      email: row.email ? String(row.email) : null,
      password_hash: row.password_hash ? String(row.password_hash) : null,
      auth_provider: (row.auth_provider ? String(row.auth_provider) : null) as User["auth_provider"],
      provider_id: row.provider_id ? String(row.provider_id) : null,
      created_at: new Date(String(row.created_at)).toISOString(),
    };
  }

  if (input.email) {
    const existingByEmail = await getUserByEmail(input.email);
    if (existingByEmail) {
      const { rows } = await pool.query(
        `
          UPDATE users
          SET
            auth_provider = $1,
            provider_id = $2,
            name = COALESCE(NULLIF($3, ''), name)
          WHERE id = $4
          RETURNING id, name, email, password_hash, auth_provider, provider_id, created_at
        `,
        [input.provider, input.providerId, input.name, existingByEmail.id],
      );
      const row = rows[0];
      return {
        id: Number(row.id),
        name: String(row.name),
        email: row.email ? String(row.email) : null,
        password_hash: row.password_hash ? String(row.password_hash) : null,
        auth_provider: (row.auth_provider ? String(row.auth_provider) : null) as User["auth_provider"],
        provider_id: row.provider_id ? String(row.provider_id) : null,
        created_at: new Date(String(row.created_at)).toISOString(),
      };
    }
  }

  const { rows } = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, auth_provider, provider_id)
      VALUES ($1, $2, NULL, $3, $4)
      RETURNING id, name, email, password_hash, auth_provider, provider_id, created_at
    `,
    [input.name, input.email ?? null, input.provider, input.providerId],
  );
  const row = rows[0];
  return {
    id: Number(row.id),
    name: String(row.name),
    email: row.email ? String(row.email) : null,
    password_hash: row.password_hash ? String(row.password_hash) : null,
    auth_provider: (row.auth_provider ? String(row.auth_provider) : null) as User["auth_provider"],
    provider_id: row.provider_id ? String(row.provider_id) : null,
    created_at: new Date(String(row.created_at)).toISOString(),
  };
}

export async function ensureLocalDefaultUser(): Promise<number> {
  const email = process.env.DEFAULT_USER_EMAIL ?? "local@bookmark.local";
  const existing = await getUserByEmail(email);
  if (existing) {
    return existing.id;
  }

  const user = await registerUser({
    name: process.env.DEFAULT_USER_NAME ?? "Local User",
    email,
    passwordHash: randomUUID(),
    authProvider: "local",
    providerId: randomUUID(),
  });
  return user.id;
}

export async function saveBookmark(input: SaveBookmarkInput): Promise<Bookmark> {
  const userId = input.user_id ?? Number(process.env.DEFAULT_USER_ID ?? 1);

  const existing = await pool.query(
    `
      SELECT * FROM bookmarks
      WHERE user_id = $1 AND url = $2
      LIMIT 1
    `,
    [userId, input.url],
  );

  if (existing.rows.length > 0) {
    const updated = await updateBookmark(
      Number(existing.rows[0].id),
      {
      title: input.title,
      description: input.description,
      tags: input.tags,
      favicon: input.favicon,
      notes: input.notes,
      },
      userId,
    );
    if (!updated) {
      throw new Error("Failed to update existing bookmark");
    }
    return updated;
  }

  const { rows } = await pool.query(
    `
      INSERT INTO bookmarks (user_id, url, title, description, tags, favicon, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      userId,
      input.url,
      input.title ?? "",
      input.description ?? "",
      input.tags ?? [],
      input.favicon ?? "",
      input.notes ?? "",
    ],
  );
  const created = rowToBookmark(rows[0]);
  await emitBookmarkEvent({
    action: "created",
    user_id: created.user_id,
    bookmark_id: created.id,
    at: new Date().toISOString(),
  });
  return created;
}

export async function getBookmarkById(id: number, userId?: number): Promise<Bookmark | null> {
  const effectiveUserId = userId ?? Number(process.env.DEFAULT_USER_ID ?? 1);
  const { rows } = await pool.query(
    `
      SELECT * FROM bookmarks
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [id, effectiveUserId],
  );
  if (!rows.length) {
    return null;
  }
  return rowToBookmark(rows[0]);
}

export async function listBookmarks(input: ListBookmarksInput = {}): Promise<{ items: Bookmark[]; total: number }> {
  const values: unknown[] = [input.user_id ?? Number(process.env.DEFAULT_USER_ID ?? 1)];
  const where: string[] = ["user_id = $1"];
  let arg = 2;
  const limit = Math.max(1, Math.min(100, Number(input.limit ?? 30)));
  const offset = Math.max(0, Number(input.offset ?? 0));

  if (input.search) {
    where.push(
      `(LOWER(title) LIKE $${arg} OR LOWER(url) LIKE $${arg} OR LOWER(description) LIKE $${arg} OR LOWER(notes) LIKE $${arg})`,
    );
    values.push(`%${input.search.toLowerCase()}%`);
    arg += 1;
  }

  if (input.tag) {
    where.push(`$${arg} = ANY(tags)`);
    values.push(input.tag);
    arg += 1;
  }

  if (input.favorite) {
    where.push("is_favorite = TRUE");
  }

  const { rows: countRows } = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM bookmarks
      WHERE ${where.join(" AND ")}
    `,
    values,
  );

  const pageValues = [...values, limit, offset];
  const { rows } = await pool.query(
    `
      SELECT *
      FROM bookmarks
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${arg}
      OFFSET $${arg + 1}
    `,
    pageValues,
  );
  return {
    items: rows.map((row: Record<string, unknown>) => rowToBookmark(row)),
    total: Number(countRows[0]?.total ?? 0),
  };
}

export async function updateBookmark(id: number, fields: UpdateBookmarkInput, userId?: number): Promise<Bookmark | null> {
  const effectiveUserId = userId ?? Number(process.env.DEFAULT_USER_ID ?? 1);
  const current = await getBookmarkById(id, effectiveUserId);
  if (!current) {
    return null;
  }

  const merged: Bookmark = {
    ...current,
    url: fields.url ?? current.url,
    title: fields.title ?? current.title,
    description: fields.description ?? current.description,
    tags: fields.tags ?? current.tags,
    favicon: fields.favicon ?? current.favicon,
    notes: fields.notes ?? current.notes,
    is_favorite: fields.is_favorite ?? current.is_favorite,
    updated_at: new Date().toISOString(),
  };

  const { rows } = await pool.query(
    `
      UPDATE bookmarks
      SET
        url = $1,
        title = $2,
        description = $3,
        tags = $4,
        favicon = $5,
        notes = $6,
        is_favorite = $7,
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `,
    [
      merged.url,
      merged.title,
      merged.description,
      merged.tags,
      merged.favicon,
      merged.notes,
      merged.is_favorite,
      id,
      effectiveUserId,
    ],
  );

  if (!rows.length) {
    return null;
  }
  const updated = rowToBookmark(rows[0]);
  await emitBookmarkEvent({
    action: "updated",
    user_id: effectiveUserId,
    bookmark_id: updated.id,
    at: new Date().toISOString(),
  });
  return updated;
}

export async function deleteBookmark(id: number, userId?: number): Promise<Bookmark | null> {
  const effectiveUserId = userId ?? Number(process.env.DEFAULT_USER_ID ?? 1);
  const { rows } = await pool.query(
    `
      DELETE FROM bookmarks
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [id, effectiveUserId],
  );
  if (!rows.length) {
    return null;
  }
  const deleted = rowToBookmark(rows[0]);
  await emitBookmarkEvent({
    action: "deleted",
    user_id: effectiveUserId,
    bookmark_id: deleted.id,
    at: new Date().toISOString(),
  });
  return deleted;
}

export async function getStats(userId?: number): Promise<BookmarkStats> {
  const effectiveUserId = userId ?? Number(process.env.DEFAULT_USER_ID ?? 1);
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_favorite = TRUE)::int AS favorites,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS recent
      FROM bookmarks
      WHERE user_id = $1
    `,
    [effectiveUserId],
  );
  const row = rows[0] ?? { total: 0, favorites: 0, recent: 0 };
  return {
    total: Number(row.total),
    favorites: Number(row.favorites),
    recent: Number(row.recent),
  };
}

export async function getDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  serverTime: string | null;
}> {
  const startedAt = Date.now();
  try {
    const { rows } = await pool.query(`SELECT NOW() AS now`);
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      serverTime: rows[0]?.now ? new Date(String(rows[0].now)).toISOString() : null,
    };
  } catch {
    return {
      ok: false,
      latencyMs: null,
      serverTime: null,
    };
  }
}

export async function closeDb(): Promise<void> {
  if (listenerClient) {
    await listenerClient.end();
    listenerClient = null;
  }
  await pool.end();
}
