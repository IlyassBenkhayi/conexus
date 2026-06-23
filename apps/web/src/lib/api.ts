const BASE_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('conexus-token');
}

export function saveToken(token: string) {
  localStorage.setItem('conexus-token', token);
}

export function clearToken() {
  localStorage.removeItem('conexus-token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function authRegister(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });
}

export async function deleteAccount(password: string): Promise<void> {
  return apiFetch<void>('/api/auth/delete-account', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ── Users ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  pronouns?: string;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/api/users/${userId}`);
}

export async function updateProfile(
  userId: string,
  data: Partial<Omit<UserProfile, 'id' | 'email'>>
): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export interface RoomRow {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  background: any;
  permissions: any;
  settings: any;
}

export async function getRooms(): Promise<RoomRow[]> {
  return apiFetch<RoomRow[]>('/api/rooms');
}

export async function createRoom(data: { name: string; slug: string }): Promise<RoomRow> {
  return apiFetch<RoomRow>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoom(roomId: string, data: any): Promise<void> {
  return apiFetch<void>(`/api/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRoom(roomId: string): Promise<void> {
  return apiFetch<void>(`/api/rooms/${roomId}`, {
    method: 'DELETE',
  });
}

export async function getRoomBySlug(slug: string): Promise<RoomRow> {
  return apiFetch<RoomRow>(`/api/rooms/slug/${slug}`);
}

export async function getRoomObjects(roomId: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/rooms/${roomId}/objects`);
}

export async function upsertRoomObject(roomId: string, objectId: string, data: any): Promise<void> {
  return apiFetch<void>(`/api/rooms/${roomId}/objects/${objectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoomObject(roomId: string, objectId: string): Promise<void> {
  return apiFetch<void>(`/api/rooms/${roomId}/objects/${objectId}`, {
    method: 'DELETE',
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function getChatMessages(roomId: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/rooms/${roomId}/chat`);
}

export async function sendChatMessage(roomId: string, data: any): Promise<void> {
  return apiFetch<void>(`/api/rooms/${roomId}/chat`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── File Upload ───────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  type: 'avatar' | 'banner' | 'background' | 'chat'
): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// ── Media Search ─────────────────────────────────────────────────────────────

export async function searchYoutube(query: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/media/youtube-search?q=${encodeURIComponent(query)}`);
}

export async function searchTwitch(query: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/media/twitch-search?q=${encodeURIComponent(query)}`);
}

export async function searchVimeo(query: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/media/vimeo-search?q=${encodeURIComponent(query)}`);
}

export async function searchDailymotion(query: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/media/dailymotion-search?q=${encodeURIComponent(query)}`);
}

export async function searchSpotify(query: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/media/spotify-search?q=${encodeURIComponent(query)}`);
}

export async function searchSoundCloud(query: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/media/soundcloud-search?q=${encodeURIComponent(query)}`);
}

