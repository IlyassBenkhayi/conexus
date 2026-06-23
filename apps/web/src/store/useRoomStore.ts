import { create } from 'zustand';
import type { RoomState, RoomObject, UserPosition } from '@conexus/shared-types';

export const AVATAR_SIZE_DEFAULT = 40;
export const AVATAR_SIZE_MIN = 48;
export const AVATAR_SIZE_MAX = 200;
const AVATAR_SIZE_KEY = 'conexus-avatar-size';

function loadAvatarSize(): number {
  try {
    const val = parseInt(localStorage.getItem(AVATAR_SIZE_KEY) || '', 10);
    return isNaN(val) ? AVATAR_SIZE_DEFAULT : Math.max(AVATAR_SIZE_MIN, Math.min(AVATAR_SIZE_MAX, val));
  } catch { return AVATAR_SIZE_DEFAULT; }
}

function saveAvatarSize(size: number) {
  try { localStorage.setItem(AVATAR_SIZE_KEY, String(size)); } catch {}
}

interface RoomStoreState {
  room: RoomState | null;
  objects: Record<string, RoomObject>;
  remoteUsers: Record<string, { id: string; name: string; avatar_url?: string; position: UserPosition }>;
  
  // Camera state for pan/zoom
  camera: { x: number; y: number; zoom: number };
  setCamera: (camera: Partial<{ x: number; y: number; zoom: number }>) => void;
  
  // Local user position
  localPosition: UserPosition;
  setLocalPosition: (pos: UserPosition) => void;
  
  // Controls preference
  movementType: 'wasd' | 'drag';
  setMovementType: (type: 'wasd' | 'drag') => void;

  // Avatar size (resizable via Shift+drag)
  avatarSize: number;
  setAvatarSize: (size: number) => void;
  
  setRoom: (room: RoomState | null) => void;
  setObjects: (objects: RoomObject[]) => void;
  addObject: (object: RoomObject) => void;
  updateObject: (id: string, updates: Partial<RoomObject>) => void;
  removeObject: (id: string) => void;
  
  addRemoteUser: (user: { id: string; name: string; avatar_url?: string; position: UserPosition }) => void;
  removeRemoteUser: (id: string) => void;
  updateRemoteUserPosition: (id: string, position: UserPosition) => void;
  setAllRemoteUsers: (users: Record<string, { position: UserPosition; name: string; avatar_url?: string }>) => void; // Used during hydration
  resetRoom: () => void; // Clear all room state for clean transitions
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  room: null,
  objects: {},
  remoteUsers: {},
  camera: { x: 0, y: 0, zoom: 1 },
  localPosition: { x: 0, y: 0 },
  movementType: 'wasd',
  avatarSize: loadAvatarSize(),

  setCamera: (updates) => set((state) => ({ camera: { ...state.camera, ...updates } })),
  setLocalPosition: (pos) => set({ localPosition: pos }),
  setMovementType: (type) => set({ movementType: type }),
  setAvatarSize: (size) => {
    const clamped = Math.max(AVATAR_SIZE_MIN, Math.min(AVATAR_SIZE_MAX, size));
    saveAvatarSize(clamped);
    set({ avatarSize: clamped });
  },

  setRoom: (room) => set({ room }),
  
  setObjects: (objectsArray) => set(() => {
    const newObjects: Record<string, RoomObject> = {};
    objectsArray.forEach(obj => {
      newObjects[obj.id] = obj;
    });
    return { objects: newObjects };
  }),

  addObject: (object) => set((state) => ({
    objects: { ...state.objects, [object.id]: object }
  })),

  updateObject: (id, updates) => set((state) => {
    if (!state.objects[id]) return state;
    return {
      objects: {
        ...state.objects,
        [id]: { ...state.objects[id], ...updates }
      }
    };
  }),

  removeObject: (id) => set((state) => {
    const newObjects = { ...state.objects };
    delete newObjects[id];
    return { objects: newObjects };
  }),

  addRemoteUser: (user) => set((state) => ({
    remoteUsers: { ...state.remoteUsers, [user.id]: { id: user.id, name: user.name, avatar_url: user.avatar_url, position: user.position } }
  })),

  removeRemoteUser: (id) => set((state) => {
    const newUsers = { ...state.remoteUsers };
    delete newUsers[id];
    return { remoteUsers: newUsers };
  }),

  updateRemoteUserPosition: (id, position) => set((state) => {
    if (!state.remoteUsers[id]) return state;
    return {
      remoteUsers: {
        ...state.remoteUsers,
        [id]: { ...state.remoteUsers[id], position }
      }
    };
  }),
  
  setAllRemoteUsers: (positions) => set((state) => {
    const newUsers = { ...state.remoteUsers };
    Object.entries(positions).forEach(([id, data]) => {
      if (!newUsers[id]) {
        newUsers[id] = { id, name: data.name, avatar_url: data.avatar_url, position: data.position };
      } else {
        newUsers[id].position = data.position;
        newUsers[id].name = data.name;
        if (data.avatar_url) newUsers[id].avatar_url = data.avatar_url;
      }
    });
    return { remoteUsers: newUsers };
  }),

  resetRoom: () => set({
    room: null,
    objects: {},
    remoteUsers: {},
    camera: { x: 0, y: 0, zoom: 1 }
  })
}));
