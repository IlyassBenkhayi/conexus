export interface UserPosition {
  x: number;
  y: number;
}

export interface RoomObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  zIndex: number;
  payload?: Record<string, unknown>;
  pinned?: boolean;
}

export interface RoomBackground {
  type: 'color' | 'pattern' | 'image' | 'solid' | 'none';
  color?: string;
  imageUrl?: string;
  url?: string;
  scale?: number;
}

export interface RoomPermissions {
  camera: boolean;
  mic: boolean;
  addContent: boolean;
  public: boolean;
}

export interface RoomSettings {
  chatColor?: string;
  chatFont?: string;
  chatNotifications?: boolean;
  spawnPoint?: { x: number; y: number };
  notifications?: {
    joins?: boolean;
  };
}

export interface RoomState {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  background: RoomBackground;
  permissions: RoomPermissions;
  settings?: RoomSettings;
}

