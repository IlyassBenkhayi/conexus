import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { UserPublicRow } from '../types/database';

const router = Router();

// GET /:id
router.get('/:id', requireAuth, (req: Request, res: Response): void => {
  const user = db.prepare(
    'SELECT id, email, username, avatar_url, banner_url, bio, pronouns FROM users WHERE id = ?'
  ).get(req.params.id) as UserPublicRow | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// PATCH /:id
router.patch('/:id', requireAuth, (req: Request, res: Response): void => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (auth.userId !== req.params.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { username, bio, pronouns, avatar_url, banner_url } = req.body;

  if (username) {
    const existing = db.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ?'
    ).get(username, auth.userId);
    if (existing) {
      res.status(409).json({ error: 'That username is already taken' });
      return;
    }
  }

  db.prepare(`
    UPDATE users SET
      username = COALESCE(?, username),
      bio = COALESCE(?, bio),
      pronouns = COALESCE(?, pronouns),
      avatar_url = COALESCE(?, avatar_url),
      banner_url = COALESCE(?, banner_url)
    WHERE id = ?
  `).run(username ?? null, bio ?? null, pronouns ?? null, avatar_url ?? null, banner_url ?? null, auth.userId);

  const updated = db.prepare(
    'SELECT id, email, username, avatar_url, banner_url, bio, pronouns FROM users WHERE id = ?'
  ).get(auth.userId);

  res.json(updated);
});

export default router;
