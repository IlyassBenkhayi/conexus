import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db';
import { hashPassword, verifyPassword, signToken } from '../auth/utils';
import { requireAuth } from '../middleware/auth';
import { UserPublicRow, UserRow, UserPasswordRow } from '../types/database';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    res.status(400).json({ error: 'email, password and username are required' });
    return;
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUsername) {
    res.status(409).json({ error: 'That username is already taken' });
    return;
  }

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);

  db.prepare(
    'INSERT INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)'
  ).run(id, email, password_hash, username);

  const user = db.prepare('SELECT id, email, username, avatar_url, banner_url, bio, pronouns FROM users WHERE id = ?').get(id) as UserPublicRow | undefined;
  const token = signToken({ userId: id, email, username });

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const { password_hash: _ph, ...user } = row;
  const token = signToken({ userId: row.id, email: row.email, username: row.username });

  res.json({ token, user });
});

// POST /api/auth/delete-account
router.post('/delete-account', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: 'password is required' });
    return;
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(auth.userId) as UserPasswordRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(auth.userId);
  res.json({ message: 'Account deleted successfully' });
});

export default router;
