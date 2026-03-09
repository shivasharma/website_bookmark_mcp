export type Bookmark = {
  id: number;
  user_id: number;
  url: string;
  title: string;
  description: string;
  tags: string[];
  favicon: string;
  notes: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type SaveBookmarkInput = {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  favicon?: string;
  notes?: string;
  user_id?: number;
};

export type UpdateBookmarkInput = {
  url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  favicon?: string;
  notes?: string;
  is_favorite?: boolean;
};

export type ListBookmarksInput = {
  search?: string;
  tag?: string;
  favorite?: boolean;
  user_id?: number;
  limit?: number;
  offset?: number;
};

export type BookmarkStats = {
  total: number;
  favorites: number;
  recent: number;
};

export type Notification = {
  id: number;
  user_id: number;
  action: "created" | "updated" | "deleted";
  source: "portal" | "mcp" | "server";
  bookmark_id: number;
  bookmark_title: string;
  bookmark_url: string;
  text: string;
  is_read: boolean;
  created_at: string;
};

export type User = {
  id: number;
  name: string;
  email: string | null;
  password_hash: string | null;
  auth_provider: "google" | "github" | "local" | null;
  provider_id: string | null;
  created_at: string;
};
