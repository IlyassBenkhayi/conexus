import type { UserPosition, RoomObject } from './state';

export interface ClientToServerEvents {
  join_room: (roomId: string, user: { id: string; name: string; avatar_url?: string }) => void;
  leave_room: (roomId: string) => void;
  move: (roomId: string, position: { x: number; y: number }) => void;
  add_object: (roomId: string, object: RoomObject) => void;
  move_object: (roomId: string, objectId: string, position: { x: number; y: number }) => void;
  delete_object: (roomId: string, objectId: string) => void;
  chat: (roomId: string, message: { type: string; text?: string; src?: string }) => void;
  webrtc_signal: (roomId: string, targetUserId: string, data: { signal: any }) => void;
  webrtc_request: (roomId: string, objectId: string) => void;
  webrtc_stop: (roomId: string, objectId: string) => void;
}

export interface ServerToClientEvents {
  room_state: (state: { users: Record<string, { position: UserPosition; name: string; avatar_url?: string }>; objects: RoomObject[] }) => void;
  user_joined: (user: { id: string; name: string; avatar_url?: string; position: UserPosition }) => void;
  user_left: (userId: string) => void;
  user_moved: (userId: string, position: { x: number; y: number }) => void;
  object_added: (object: RoomObject) => void;
  object_moved: (objectId: string, position: { x: number; y: number }) => void;
  object_deleted: (objectId: string) => void;
  chat_message: (message: { id: string; userId: string; userName: string; type: string; text?: string; src?: string; ts: number }) => void;
  error: (message: string) => void;
  webrtc_signal: (fromUserId: string, data: { signal: any }) => void;
  webrtc_request: (fromUserId: string, objectId: string) => void;
  webrtc_stopped: (objectId: string) => void;
}
