import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { ChatMessageWithUsernameRow } from '../types/database';

const router = Router();

// GET /api/rooms/:id/chat
router.get('/:id/chat', requireAuth, (req: Request, res: Response): void => {
  const rows = db.prepare(`
    SELECT c.*, u.username 
    FROM chat_messages c
    JOIN users u ON c.user_id = u.id
    WHERE c.room_id = ?
    ORDER BY c.created_at ASC
    LIMIT 50
  `).all(req.params.id) as ChatMessageWithUsernameRow[];

  res.json(rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    userName: r.username,
    type: r.type,
    text: r.content,
    src: r.src,
    ts: new Date(r.created_at).getTime()
  })));
});

// POST /api/rooms/:id/chat
router.post('/:id/chat', requireAuth, (req: Request, res: Response): void => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { id: msgId, type, content, src } = req.body;
  
  db.prepare(`
    INSERT INTO chat_messages (id, room_id, user_id, type, content, src)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msgId, req.params.id, auth.userId, type, content || null, src || null);

  res.json({ success: true });
});

export default router;
