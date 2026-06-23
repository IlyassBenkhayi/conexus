import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { RoomRow, RoomOwnerRow, RoomObjectRow } from '../types/database';

const router = Router();

// Helper to handle JSON fields safely in SQLite
function safeJson(val: unknown): unknown {
  if (val == null) return null;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// GET /api/rooms
router.get('/', requireAuth, (req: Request, res: Response): void => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const rows = db.prepare('SELECT * FROM rooms WHERE owner_id = ? ORDER BY created_at DESC').all(auth.userId) as RoomRow[];
  const rooms = rows.map(r => ({
    ...r,
    background: safeJson(r.background),
    permissions: safeJson(r.permissions),
    settings: safeJson(r.settings),
  }));
  res.json(rooms);
});

// POST /api/rooms
router.post('/', requireAuth, (req: Request, res: Response): void => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { name, slug } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'name and slug are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM rooms WHERE slug = ?').get(slug);
  if (existing) {
    res.status(409).json({ error: 'A room with that slug already exists' });
    return;
  }

  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO rooms (id, slug, name, owner_id) VALUES (?, ?, ?, ?)'
  ).run(id, slug, name, auth.userId);

  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow | undefined;
  if (!row) {
    res.status(500).json({ error: 'Failed to create room' });
    return;
  }
  res.status(201).json({
    ...row,
    background: safeJson(row.background),
    permissions: safeJson(row.permissions),
    settings: safeJson(row.settings),
  });
});

// PATCH /api/rooms/:id
router.patch('/:id', requireAuth, (req: Request, res: Response) => {
  const auth = req.auth;
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const roomId = req.params.id;
  
  const room = db.prepare('SELECT owner_id FROM rooms WHERE id = ?').get(roomId) as RoomOwnerRow | undefined;
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.owner_id !== auth.userId) return res.status(403).json({ error: 'Forbidden' });

  const { background, permissions, settings } = req.body;

  db.prepare(`
    UPDATE rooms SET
      background = COALESCE(?, background),
      permissions = COALESCE(?, permissions),
      settings = COALESCE(?, settings),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    background ? JSON.stringify(background) : null,
    permissions ? JSON.stringify(permissions) : null,
    settings ? JSON.stringify(settings) : null,
    roomId
  );

  res.json({ success: true });
});

// DELETE /api/rooms/:id
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const auth = req.auth;
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const roomId = req.params.id;
  
  const room = db.prepare('SELECT owner_id FROM rooms WHERE id = ?').get(roomId) as RoomOwnerRow | undefined;
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.owner_id !== auth.userId) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
  res.json({ success: true });
});

// GET /api/rooms/slug/:slug
router.get('/slug/:slug', requireAuth, (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM rooms WHERE slug = ?').get(req.params.slug) as RoomRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    ...row,
    background: safeJson(row.background),
    permissions: safeJson(row.permissions),
    settings: safeJson(row.settings),
  });
});

// ── Room Objects Routes ──────────────────────────────────────────────────────

// GET /api/rooms/:id/objects
router.get('/:id/objects', requireAuth, (req: Request, res: Response): void => {
  const rows = db.prepare('SELECT * FROM room_objects WHERE room_id = ?').all(req.params.id) as RoomObjectRow[];
  const objects = rows.map(obj => ({
    ...obj,
    payload: safeJson(obj.payload),
    pinned: obj.pinned === 1,
  }));
  res.json(objects);
});

// PUT /api/rooms/:id/objects/:objectId (Upsert)
router.put('/:id/objects/:objectId', requireAuth, (req: Request, res: Response): void => {
  const { id, objectId } = req.params;
  const { type, x, y, width, height, scale, z_index, payload, pinned } = req.body;

  db.prepare(`
    INSERT INTO room_objects (id, room_id, type, x, y, width, height, scale, z_index, payload, pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      x = excluded.x,
      y = excluded.y,
      width = excluded.width,
      height = excluded.height,
      scale = excluded.scale,
      z_index = excluded.z_index,
      payload = excluded.payload,
      pinned = excluded.pinned
  `).run(
    objectId, id, type, x, y, width ?? null, height ?? null, scale ?? 1.0, z_index ?? 1, 
    payload ? JSON.stringify(payload) : '{}', pinned ? 1 : 0
  );

  res.json({ success: true });
});

// DELETE /api/rooms/:id/objects/:objectId
router.delete('/:id/objects/:objectId', requireAuth, (req: Request, res: Response): void => {
  db.prepare('DELETE FROM room_objects WHERE id = ? AND room_id = ?').run(req.params.objectId, req.params.id);
  res.json({ success: true });
});

export default router;
