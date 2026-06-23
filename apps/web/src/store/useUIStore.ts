import { create } from 'zustand';

const SEPARATE_CAMERA_KEY = 'conexus-camera-separate';

function loadSeparateCamera(): boolean {
  try {
    return localStorage.getItem(SEPARATE_CAMERA_KEY) === 'true';
  } catch { return false; }
}

function saveSeparateCamera(value: boolean) {
  try { localStorage.setItem(SEPARATE_CAMERA_KEY, value ? 'true' : 'false'); } catch {}
}

interface UIState {
  isSidebarOpen: boolean;
  activeModal: 'none' | 'create_room' | 'settings' | 'profile';
  separateCameraElement: boolean;
  
  toggleSidebar: () => void;
  openModal: (modal: 'create_room' | 'settings' | 'profile') => void;
  closeModal: () => void;
  setSeparateCameraElement: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  activeModal: 'none',
  separateCameraElement: loadSeparateCamera(),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: 'none' }),
  setSeparateCameraElement: (value) => {
    saveSeparateCamera(value);
    set({ separateCameraElement: value });
  },
}));
