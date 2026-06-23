import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useMediaStore } from '../../store/useMediaStore';
import { getRoomBySlug, getRoomObjects } from '../../lib/api';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@conexus/shared-types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Avatar } from '../../components/room/Avatar';
import { useWASD } from '../../hooks/useWASD';
import { RoomObjectRenderer } from '../../components/room/RoomObjectRenderer';
import { Toolbar } from '../../components/room/Toolbar';
import { ChatPanel } from '../../components/room/ChatPanel';
import { LocalCamera } from '../../components/room/LocalCamera';
import { RoomSettings } from '../../components/room/RoomSettings';
import { Minimap } from '../../components/room/Minimap';
import { useShallow } from 'zustand/react/shallow';

interface Toast {
  id: string;
  message: string;
}

// ─── ObjectsLayer ─────────────────────────────────────────────────────────────
// Isolated component that only re-renders when objects are added or removed.
const ObjectsLayer = React.memo(({ socket, roomId }: { socket: any; roomId: string }) => {
  const objectIds = useRoomStore(useShallow(s => Object.keys(s.objects)));
  return (
    <>
      {objectIds.map(id => (
        <ObjectSlot key={id} id={id} roomId={roomId} socket={socket} />
      ))}
    </>
  );
});

// Individual object slot — only re-renders when non-transform properties change
const ObjectSlot = React.memo(({ id, roomId, socket }: { id: string; roomId: string; socket: any }) => {
  const object = useRoomStore(
    useShallow(s => {
      const obj = s.objects[id];
      if (!obj) return null;
      return {
        ...obj,
        x: 0,
        y: 0,
        scale: 1,
      };
    })
  );
  if (!object) return null;
  return <RoomObjectRenderer object={object} roomId={roomId} socket={socket} />;
});

// Slot for remote avatars to prevent AvatarsLayer re-renders on remote position changes
const RemoteAvatarSlot = React.memo(({ id }: { id: string }) => {
  const name = useRoomStore(s => s.remoteUsers[id]?.name || '');
  const avatar_url = useRoomStore(s => s.remoteUsers[id]?.avatar_url);
  return <Avatar id={id} name={name} avatar_url={avatar_url} />;
});

// ─── AvatarsLayer ─────────────────────────────────────────────────────────────
const AvatarsLayer = React.memo(({ onMove }: { onMove: (pos: { x: number; y: number }) => void }) => {
  const remoteUserIds = useRoomStore(useShallow(s => Object.keys(s.remoteUsers)));
  const user = useAuthStore(state => state.user);

  return (
    <>
      {remoteUserIds.map(id => (
        <RemoteAvatarSlot key={id} id={id} />
      ))}
      {user && (
        <Avatar id={user.id} name={user.username} avatar_url={user.avatar_url} isLocal onMove={onMove} />
      )}
    </>
  );
});

// ─── RoomViewport ─────────────────────────────────────────────────────────────
// Camera transform is applied directly via DOM refs — no React re-render on pan/scroll.
const RoomViewport = React.memo(({ socket, onMove, roomId }: { socket: any; onMove: (pos: { x: number; y: number }) => void; roomId: string }) => {
  const room = useRoomStore(s => s.room);
  const canvasRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // Pan state is kept entirely in refs to avoid React re-renders
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  // We need a single state for cursor style changes (panning/not panning)
  const [isPanningForCursor, setIsPanningForCursor] = useState(false);

  // Apply camera transform directly to the DOM on every animation frame
  useEffect(() => {
    let lastCam = useRoomStore.getState().camera;

    const applyCamera = (cam: typeof lastCam) => {
      if (!worldRef.current) return;
      const camX = window.innerWidth / 2 - cam.x * cam.zoom;
      const camY = window.innerHeight / 2 - cam.y * cam.zoom;
      worldRef.current.style.transform = `translate3d(${camX}px, ${camY}px, 0) scale(${cam.zoom})`;
    };
    applyCamera(lastCam);

    // Only write DOM when camera ref changes
    const unsub = useRoomStore.subscribe((state) => {
      if (state.camera !== lastCam) {
        lastCam = state.camera;
        applyCamera(lastCam);
      }
    });
    // Handle window resize
    const onResize = () => applyCamera(useRoomStore.getState().camera);
    window.addEventListener('resize', onResize);
    return () => { unsub(); window.removeEventListener('resize', onResize); };
  }, []);

  // Camera wheel/scroll handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setCamera = useRoomStore.getState().setCamera;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const currentCamera = useRoomStore.getState().camera;
        const newZoom = Math.min(Math.max(currentCamera.zoom * zoomFactor, 0.1), 5);

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - window.innerWidth / 2) / currentCamera.zoom + currentCamera.x;
        const worldY = (mouseY - window.innerHeight / 2) / currentCamera.zoom + currentCamera.y;

        const newX = worldX - (mouseX - window.innerWidth / 2) / newZoom;
        const newY = worldY - (mouseY - window.innerHeight / 2) / newZoom;

        setCamera({ zoom: newZoom, x: newX, y: newY });
      } else {
        const currentCamera = useRoomStore.getState().camera;
        setCamera({
          x: currentCamera.x + e.deltaX / currentCamera.zoom,
          y: currentCamera.y + e.deltaY / currentCamera.zoom
        });
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 0) {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setIsPanningForCursor(true);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    const currentCamera = useRoomStore.getState().camera;
    useRoomStore.getState().setCamera({
      x: currentCamera.x - dx / currentCamera.zoom,
      y: currentCamera.y - dy / currentCamera.zoom
    });

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.button === 0) {
      isPanningRef.current = false;
      setIsPanningForCursor(false);
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    isPanningRef.current = false;
    setIsPanningForCursor(false);
  }, []);

  const getBackgroundStyle = (): React.CSSProperties => {
    if (!room?.background) return { background: '#0a0a10' };
    const { type, color, imageUrl } = room.background;
    if (type === 'image' && imageUrl) {
      return { background: '#0a0a10', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' };
    }
    if (type === 'solid') return { background: color };
    if (type === 'none') return { background: '#0a0a10' };
    return { background: color || '#0a0a10', backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' };
  };

  return (
    <div
      ref={canvasRef}
      id="room-canvas-bg"
      style={{
        width: '100vw', height: '100vh', overflow: 'hidden',
        position: 'absolute', top: 0, left: 0,
        cursor: isPanningForCursor ? 'grabbing' : 'default',
        touchAction: 'none', zIndex: 0,
        ...getBackgroundStyle(), backgroundPosition: 'center',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).id === 'room-canvas-bg') {
          e.preventDefault();
        }
      }}
    >
      <div
        ref={worldRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <ObjectsLayer socket={socket} roomId={roomId} />
        <AvatarsLayer onMove={onMove} />
      </div>
    </div>
  );
});

// ─── ActiveRoom ─────────────────────────────────────────────────────────────
function ActiveRoom({ roomSlug, onLeave }: { roomSlug: string; onLeave: () => void }) {
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const room = useRoomStore(s => s.room);

  const setAllRemoteUsers = useRoomStore(s => s.setAllRemoteUsers);
  const addRemoteUser = useRoomStore(s => s.addRemoteUser);
  const removeRemoteUser = useRoomStore(s => s.removeRemoteUser);
  const updateRemoteUserPosition = useRoomStore(s => s.updateRemoteUserPosition);
  const addObject = useRoomStore(s => s.addObject);
  const updateObject = useRoomStore(s => s.updateObject);
  const removeObject = useRoomStore(s => s.removeObject);

  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  socketRef.current = socket;



  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleMove = useCallback((pos: { x: number; y: number }) => {
    if (room?.id) {
      socketRef.current?.emit('move', room.id, pos);
    }
  }, [room?.id]);

  const spawnPoint = useMemo(() => {
    return room?.settings?.spawnPoint || { x: 500, y: 500 };
  }, [room?.settings?.spawnPoint]);

  // Initialize camera to spawn point once
  const setCamera = useRoomStore(s => s.setCamera);
  const initialized = useRef(false);
  useEffect(() => {
    if (room && !initialized.current) {
      setCamera({ x: spawnPoint.x, y: spawnPoint.y, zoom: 1 });
      initialized.current = true;
    }
  }, [room, spawnPoint, setCamera]);

  useWASD(spawnPoint, handleMove);

  // Connect to socket — use JWT token from session for authentication
  useEffect(() => {
    if (!roomSlug || !user || !session || !room) return;

    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
      auth: { token: session.token }  // our JWT token
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_room', room.id, { id: user.id, name: user.username });
    });

    newSocket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
    });

    newSocket.on('room_state', (state) => {
      const others = { ...state.users };
      delete others[user.id];
      setAllRemoteUsers(others);
    });

    newSocket.on('user_joined', (newUser) => {
      if (newUser.id !== user.id) {
        addRemoteUser(newUser);
        addToast(`${newUser.name} joined the room`);
      }
    });

    newSocket.on('user_left', (userId) => {
      const leavingUser = useRoomStore.getState().remoteUsers[userId];
      if (leavingUser) {
        addToast(`${leavingUser.name} left the room`);
      }
      removeRemoteUser(userId);
    });

    newSocket.on('user_moved', (userId, pos) => {
      updateRemoteUserPosition(userId, pos);
    });

    newSocket.on('object_added', (obj) => { addObject(obj); });
    newSocket.on('object_moved', (objId, pos) => { updateObject(objId, { x: pos.x, y: pos.y }); });
    newSocket.on('object_deleted', (objId) => { removeObject(objId); });

    setSocket(newSocket);

    return () => { newSocket.disconnect(); };
  }, [roomSlug, user, session, room, setAllRemoteUsers, addRemoteUser, removeRemoteUser, updateRemoteUserPosition, addObject, updateObject, removeObject, addToast]);

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <div className="glass-panel" style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: 'var(--space-2)' }}>Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <RoomViewport socket={socketRef.current} onMove={handleMove} roomId={room?.id || ''} />

      <div style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', zIndex: 10 }}>
        <button onClick={onLeave} className="btn" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'rgba(26, 22, 42, 0.85)', color: 'white', border: '1px solid var(--border-subtle)' }}>
          <ArrowLeft size={16} /> Leave Room
        </button>
      </div>


      {room && <RoomSettings roomDatabaseId={room.id} />}
      <LocalCamera />
      {room && <ChatPanel roomId={room.id} socket={socketRef.current} />}
      {room && <Toolbar roomId={room.id} socket={socketRef.current} />}
      <Minimap />

      <div style={{ position: 'absolute', bottom: 'var(--space-4)', right: 'var(--space-4)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {toasts.map(toast => (
          <div key={toast.id} className="glass-panel animate-fade-in" style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem' }}>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── RoomContainer ──────────────────────────────────────────────────────────
export default function RoomContainer() {
  const { id: roomSlug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const room = useRoomStore(s => s.room);
  const setRoom = useRoomStore(s => s.setRoom);
  const setObjects = useRoomStore(s => s.setObjects);
  const {
    devices, localStream, isVideoEnabled, isAudioEnabled,
    selectedVideoDeviceId, selectedAudioDeviceId,
    initializeDevices, toggleVideo, toggleAudio, setVideoDevice, setAudioDevice, stopStream
  } = useMediaStore();

  const [joined, setJoined] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!joined && !checking && !error) {
      initializeDevices();
    }
    return () => { if (!joined) stopStream(); };
  }, [joined, checking, error, initializeDevices, stopStream]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoEnabled]);

  useEffect(() => {
    async function checkRoom() {
      if (!roomSlug) return;
      setChecking(true);

      try {
        const roomData = await getRoomBySlug(roomSlug);

        setRoom({
          id: roomData.id,
          name: roomData.name,
          slug: roomData.slug,
          ownerId: roomData.owner_id,
          background: roomData.background,
          permissions: roomData.permissions,
          settings: roomData.settings,
        });

        const objectsData = await getRoomObjects(roomData.id);
        const mappedObjects = objectsData.map((obj: any) => ({
          id: obj.id,
          type: obj.type,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          scale: obj.scale || 1,
          zIndex: obj.z_index || 1,
          payload: obj.payload,
          pinned: obj.pinned,
        }));
        setObjects(mappedObjects);
      } catch {
        setError('Room not found');
      }

      setChecking(false);
    }
    checkRoom();
  }, [roomSlug, setRoom, setObjects]);

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <div className="glass-panel" style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: 'var(--space-2)' }}>Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="page-shell here-bg">
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">Join {room?.name || 'Room'}</h2>
              <button className="close-btn" type="button" aria-label="Close" onClick={() => navigate('/')}>×</button>
            </div>

            <div className="media-preview" style={{ height: '240px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
              {isVideoEnabled && localStream ? (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : user?.avatar_url ? (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
                  <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              {!isVideoEnabled && (
                <div className="subtle" style={{ position: 'absolute', bottom: '12px' }}>Camera is off</div>
              )}
            </div>

            <div className="toggle-row" style={{ marginTop: '16px', padding: '0 var(--space-6)' }}>
              <span>Join with camera on</span>
              <button className={`switch ${isVideoEnabled ? 'is-on' : ''}`} type="button" aria-label="Toggle camera" onClick={() => toggleVideo(!isVideoEnabled)}></button>
              <span>Join with mic on</span>
              <button className={`switch ${isAudioEnabled ? 'is-on' : ''}`} type="button" aria-label="Toggle microphone" onClick={() => toggleAudio(!isAudioEnabled)}></button>
            </div>

            <div className="form-grid" style={{ marginTop: '12px', paddingBottom: '0' }}>
              <label>
                <span>Camera</span>
                <select className="select" value={selectedVideoDeviceId || ''} onChange={(e) => setVideoDevice(e.target.value)} disabled={!isVideoEnabled}>
                  {devices.filter(d => d.kind === 'videoinput').map(device => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId.slice(0, 5)}...`}</option>
                  ))}
                  {devices.filter(d => d.kind === 'videoinput').length === 0 && <option value="">No cameras found</option>}
                </select>
              </label>
              <label>
                <span>Microphone</span>
                <select className="select" value={selectedAudioDeviceId || ''} onChange={(e) => setAudioDevice(e.target.value)} disabled={!isAudioEnabled}>
                  {devices.filter(d => d.kind === 'audioinput').map(device => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}</option>
                  ))}
                  {devices.filter(d => d.kind === 'audioinput').length === 0 && <option value="">No microphones found</option>}
                </select>
              </label>
            </div>

            <div className="join-actions">
              <button className="btn ghost" type="button" onClick={() => navigate('/')}>Cancel</button>
              <button className="btn primary btn-primary" type="button" onClick={() => setJoined(true)}>Join Room</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ActiveRoom roomSlug={roomSlug!} onLeave={() => {
    useRoomStore.getState().resetRoom();
    navigate('/');
  }} />;
}
