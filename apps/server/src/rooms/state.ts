import { UserPosition } from '@conexus/shared-types';

interface RoomData {
  users: Record<string, { id: string; name: string; avatar_url?: string; position: UserPosition }>;
  permissions?: { addContent?: boolean; camera?: boolean; mic?: boolean; public?: boolean };
}

const rooms = new Map<string, RoomData>();

export const getRoom = (roomId: string): RoomData => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: {} });
  }
  return rooms.get(roomId)!;
};

export const setRoomPermissions = (roomId: string, permissions: any) => {
  const room = getRoom(roomId);
  room.permissions = permissions;
};

export const addUserToRoom = (roomId: string, user: { id: string; name: string; avatar_url?: string; position?: UserPosition }) => {
  const room = getRoom(roomId);
  room.users[user.id] = {
    ...user,
    position: user.position || { x: 1500, y: 620 }
  };
};

export const removeUserFromRoom = (roomId: string, userId: string) => {
  const room = getRoom(roomId);
  if (room.users[userId]) {
    delete room.users[userId];
  }
};

export const updateUserPosition = (roomId: string, userId: string, position: UserPosition) => {
  const room = getRoom(roomId);
  if (room.users[userId]) {
    room.users[userId].position = position;
  }
};

export const isRoomEmpty = (roomId: string): boolean => {
  const room = getRoom(roomId);
  return Object.keys(room.users).length === 0;
};

export const deleteRoomState = (roomId: string) => {
  rooms.delete(roomId);
};
