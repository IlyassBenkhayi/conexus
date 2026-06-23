import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/handlers';
import { socketAuthMiddleware } from './socket/auth';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import roomsRouter from './routes/rooms';
import chatRouter from './routes/chat';
import mediaRouter from './routes/media';
import uploadRouter, { UPLOADS_DIR } from './routes/upload';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files publicly
app.use('/uploads', express.static(UPLOADS_DIR));

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/rooms', chatRouter);
app.use('/api/media', mediaRouter);
app.use('/api/upload', uploadRouter);

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.use(socketAuthMiddleware);
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ CONEXUS server running on port ${PORT}`);
});
