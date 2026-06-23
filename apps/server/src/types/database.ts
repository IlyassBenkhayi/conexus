/**
 * Database row types matching the SQLite schema defined in db.ts.
 *
 * These interfaces represent raw rows returned by better-sqlite3 queries.
 * JSON columns (background, permissions, settings, payload) are stored as
 * TEXT in SQLite and must be parsed before use.
 */

// ── Users ────────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  pronouns: string | null;
  created_at: string;
}

/** Projection used for public-facing user responses (excludes password_hash). */
export interface UserPublicRow {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  pronouns: string | null;
}

/** Minimal projection for avatar lookups. */
export interface UserAvatarRow {
  avatar_url: string | null;
}

/** Minimal projection for password verification. */
export interface UserPasswordRow {
  password_hash: string;
}

/** Minimal projection for existence checks. */
export interface UserIdRow {
  id: string;
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export interface RoomRow {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  background: string | null;
  permissions: string | null;
  settings: string | null;
  created_at: string;
  updated_at: string;
}

/** Minimal projection for ownership checks. */
export interface RoomOwnerRow {
  owner_id: string;
}

/** Minimal projection for permission lookups. */
export interface RoomPermissionsRow {
  permissions: string | null;
}

// ── Room Objects ─────────────────────────────────────────────────────────────

export interface RoomObjectRow {
  id: string;
  room_id: string;
  type: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  scale: number;
  z_index: number;
  payload: string;
  pinned: number; // SQLite stores booleans as 0 | 1
  created_at: string;
}

// ── Chat Messages ────────────────────────────────────────────────────────────

export interface ChatMessageRow {
  id: string;
  room_id: string;
  user_id: string;
  type: string;
  content: string | null;
  src: string | null;
  created_at: string;
}

/** Extended projection that includes the joined username. */
export interface ChatMessageWithUsernameRow extends ChatMessageRow {
  username: string;
}

// ── External API Responses ───────────────────────────────────────────────────

/** Twitch GQL response for browsing top streams. */
export interface TwitchStreamEdge {
  node: {
    id: string;
    title: string;
    viewersCount: number;
    game: { name: string } | null;
    broadcaster: { login: string; displayName: string } | null;
  };
}

/** Twitch GQL response for channel search results. */
export interface TwitchChannelSearchItem {
  id: string;
  displayName: string;
  login: string;
  stream: {
    id: string;
    title: string;
    viewersCount: number;
    game: { name: string } | null;
  } | null;
}

/** Twitch GQL response for VOD edges. */
export interface TwitchVodEdge {
  node: {
    id: string;
    title: string;
    duration: string;
    viewCount: number;
    createdAt: string;
  };
}

/** Twitch GQL top-level response shape. */
export interface TwitchGqlResponse {
  data?: {
    streams?: { edges: TwitchStreamEdge[] };
    searchFor?: { channels?: { items: TwitchChannelSearchItem[] } };
    user?: { videos?: { edges: TwitchVodEdge[] } };
  };
}

/** Dailymotion API video item. */
export interface DailymotionVideoItem {
  id: string;
  title: string;
  'owner.screenname': string;
  duration: number;
  views_total: number;
  thumbnail_240_url: string;
}

/** Dailymotion API response shape. */
export interface DailymotionApiResponse {
  list?: DailymotionVideoItem[];
}

/** yt-search video result. */
export interface YtSearchVideo {
  videoId: string;
  title: string;
  author?: { name: string };
  timestamp?: string;
  duration?: number;
  thumbnail?: string;
  image?: string;
}
