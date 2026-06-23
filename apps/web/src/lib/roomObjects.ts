import { upsertRoomObject as apiUpsertObject, deleteRoomObject as apiDeleteObject } from './api';
import type { RoomObject } from '@conexus/shared-types';

export const upsertRoomObject = async (roomId: string, obj: RoomObject) => {
  try {
    await apiUpsertObject(roomId, obj.id, {
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width || null,
      height: obj.height || null,
      scale: obj.scale,
      z_index: obj.zIndex,
      payload: obj.payload,
      pinned: obj.pinned || false
    });
  } catch (error) {
    console.error('Error upserting room object:', error);
    throw error;
  }
};

export const deleteRoomObject = async (id: string, roomId: string) => {
  try {
    await apiDeleteObject(roomId, id);
  } catch (error) {
    console.error('Error deleting room object:', error);
    throw error;
  }
};

