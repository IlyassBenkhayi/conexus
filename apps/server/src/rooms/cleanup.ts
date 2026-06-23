import { isRoomEmpty, deleteRoomState } from './state';

export const handleRoomEmpty = (roomId: string) => {
  if (isRoomEmpty(roomId)) {
    deleteRoomState(roomId);
  }
};
