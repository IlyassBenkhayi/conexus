import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@conexus/shared-types';
import { getRoom, addUserToRoom, removeUserFromRoom, updateUserPosition, setRoomPermissions } from '../rooms/state';
import { handleRoomEmpty } from '../rooms/cleanup';
import db from '../db';
import { UserAvatarRow, RoomPermissionsRow } from '../types/database';

// Helper: ensure the socket user is authenticated
function requireAuth(socket: Socket): string | null {
  return socket.data.userId || null;
}

// Helper: ensure the user is a member of the specified room
function requireRoomMembership(socket: Socket, roomId: string): boolean {
  const userId = socket.data.userId;
  if (!userId) return false;
  const room = getRoom(roomId);
  return !!room.users[userId];
}

// Helper: clamp a position to reasonable world bounds
function sanitizePosition(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.max(-50000, Math.min(50000, Number(pos.x) || 0)),
    y: Math.max(-50000, Math.min(50000, Number(pos.y) || 0)),
  };
}

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  io.on('connection', (socket: Socket) => {
    // Track which rooms this socket is in
    const userRooms = new Set<string>();

    socket.on('join_room', (roomId, user) => {
      // The authenticated user ID comes from the JWT, not the client payload
      const authUserId = socket.data.user?.id;
      if (!authUserId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      // Look up stored avatar_url from database
      const userRow = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(authUserId) as UserAvatarRow | undefined;
      const avatarUrl = userRow?.avatar_url || user.avatar_url || undefined;

      socket.join(roomId);
      userRooms.add(roomId);
      socket.data.userId = authUserId;
      socket.data.userName = user.name;

      addUserToRoom(roomId, { id: authUserId, name: user.name, avatar_url: avatarUrl });

      const roomState = getRoom(roomId);

      // Send full snapshot to the joining user
      const usersPositionRecord = Object.fromEntries(
        Object.entries(roomState.users).map(([id, u]) => [id, { position: u.position, name: u.name, avatar_url: u.avatar_url }])
      );

      socket.emit('room_state', {
        users: usersPositionRecord,
        objects: [],
      });

      // Broadcast to others
      socket.to(roomId).emit('user_joined', {
        id: authUserId,
        name: user.name,
        avatar_url: avatarUrl,
        position: roomState.users[authUserId].position,
      });

      // Fetch and cache permissions from SQLite (synchronous, no async needed)
      if (!roomState.permissions) {
        const roomRow = db.prepare('SELECT permissions FROM rooms WHERE id = ?').get(roomId) as RoomPermissionsRow | undefined;
        if (roomRow?.permissions) {
          try {
            setRoomPermissions(roomId, JSON.parse(roomRow.permissions));
          } catch {
            // malformed permissions JSON — ignore
          }
        }
      }
    });

    socket.on('move', (roomId, position) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;

      const safePos = sanitizePosition(position);
      updateUserPosition(roomId, userId, safePos);
      socket.to(roomId).emit('user_moved', userId, safePos);
    });

    socket.on('add_object', (roomId, object) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;

      const room = getRoom(roomId);
      if (room.permissions && room.permissions.addContent === false) return;

      socket.to(roomId).emit('object_added', object);
    });

    socket.on('move_object', (roomId, objectId, position) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;

      const room = getRoom(roomId);
      if (room.permissions && room.permissions.addContent === false) return;

      const safePos = sanitizePosition(position);
      socket.to(roomId).emit('object_moved', objectId, safePos);
    });

    socket.on('delete_object', (roomId, objectId) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;

      const room = getRoom(roomId);
      if (room.permissions && room.permissions.addContent === false) return;

      socket.to(roomId).emit('object_deleted', objectId);
    });

    socket.on('chat', (roomId, message) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;
      const userName = socket.data.userName;

      socket.to(roomId).emit('chat_message', {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        userName,
        type: message.type,
        text: message.text,
        src: message.src,
        ts: Date.now(),
      });
    });

    // ── WebRTC signaling relay for screen sharing ──
    socket.on('webrtc_signal', (roomId, targetUserId, data) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;
      io.to(roomId).emit('webrtc_signal', userId, data);
    });

    socket.on('webrtc_request', (roomId, objectId) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;
      socket.to(roomId).emit('webrtc_request', userId, objectId);
    });

    socket.on('webrtc_stop', (roomId, objectId) => {
      const userId = requireAuth(socket);
      if (!userId || !requireRoomMembership(socket, roomId)) return;
      socket.to(roomId).emit('webrtc_stopped', objectId);
    });

    socket.on('leave_room', (roomId) => {
      handleLeave(roomId);
    });

    socket.on('disconnect', () => {
      userRooms.forEach((roomId) => {
        handleLeave(roomId);
      });
    });

    function handleLeave(roomId: string) {
      const userId = socket.data.userId;
      if (!userId) return;

      removeUserFromRoom(roomId, userId);
      socket.to(roomId).emit('user_left', userId);
      userRooms.delete(roomId);
      socket.leave(roomId);
      handleRoomEmpty(roomId);
    }
  });
};
