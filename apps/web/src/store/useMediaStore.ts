import { create } from 'zustand';

interface MediaState {
  devices: MediaDeviceInfo[];
  selectedVideoDeviceId: string | null;
  selectedAudioDeviceId: string | null;
  localStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  
  initializeDevices: () => Promise<void>;
  startStream: () => Promise<void>;
  stopStream: () => void;
  toggleVideo: (enabled: boolean) => void;
  toggleAudio: (enabled: boolean) => void;
  setVideoDevice: (deviceId: string) => void;
  setAudioDevice: (deviceId: string) => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  devices: [],
  selectedVideoDeviceId: null,
  selectedAudioDeviceId: null,
  localStream: null,
  isVideoEnabled: false,
  isAudioEnabled: false,

  initializeDevices: async () => {
    try {
      // Request initial permissions gracefully. We try audio and video independently 
      // so we don't hit a NotFoundError if one hardware type is entirely missing.
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { console.warn('Audio permission/device not available'); }
      try { await navigator.mediaDevices.getUserMedia({ video: true }); } catch (e) { console.warn('Video permission/device not available'); }
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const validDevices = allDevices.filter(d => d.deviceId !== '');
      
      const videoDevices = validDevices.filter(d => d.kind === 'videoinput');
      const audioDevices = validDevices.filter(d => d.kind === 'audioinput');

      set({ 
        devices: validDevices,
        selectedVideoDeviceId: videoDevices.length > 0 ? videoDevices[0].deviceId : null,
        selectedAudioDeviceId: audioDevices.length > 0 ? audioDevices[0].deviceId : null,
      });
      
      // Stop any ad-hoc stream created for permissions if not managed by store
      const { localStream } = get();
      if (!localStream) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
        navigator.mediaDevices.getUserMedia({ video: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
      }
    } catch (err) {
      console.error('Error initializing devices:', err);
    }
  },

  startStream: async () => {
    const { isVideoEnabled, isAudioEnabled, selectedVideoDeviceId, selectedAudioDeviceId, localStream } = get();
    
    // Stop old stream if it exists
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }

    if (!isVideoEnabled && !isAudioEnabled) {
      set({ localStream: null });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled ? (selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId }, width: 320, height: 240 } : { width: 320, height: 240 }) : false,
        audio: isAudioEnabled ? (selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true) : false
      });
      set({ localStream: stream });
    } catch (err) {
      console.error('Error starting media stream:', err);
      // Fallback: If exact device fails, try without exact device
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled ? { width: 320, height: 240 } : false,
          audio: isAudioEnabled
        });
        set({ localStream: stream });
      } catch (fallbackErr) {
         console.error('Fallback stream also failed:', fallbackErr);
         set({ localStream: null, isVideoEnabled: false, isAudioEnabled: false });
      }
    }
  },

  stopStream: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      set({ localStream: null });
    }
  },

  toggleVideo: (enabled: boolean) => {
    set({ isVideoEnabled: enabled });
    get().startStream();
  },

  toggleAudio: (enabled: boolean) => {
    set({ isAudioEnabled: enabled });
    get().startStream();
  },

  setVideoDevice: (deviceId: string) => {
    set({ selectedVideoDeviceId: deviceId });
    if (get().isVideoEnabled) {
      get().startStream();
    }
  },

  setAudioDevice: (deviceId: string) => {
    set({ selectedAudioDeviceId: deviceId });
    if (get().isAudioEnabled) {
      get().startStream();
    }
  }
}));
