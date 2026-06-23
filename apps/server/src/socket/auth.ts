import { Socket } from 'socket.io';
import { verifyToken } from '../auth/utils';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const payload = verifyToken(token);

    if (!payload) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    // Attach decoded user info directly — no DB round-trip needed
    socket.data.user = { id: payload.userId, email: payload.email, username: payload.username };
    next();
  } catch {
    next(new Error('Authentication error: Server error'));
  }
};
