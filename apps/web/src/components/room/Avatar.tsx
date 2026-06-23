import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore, AVATAR_SIZE_MIN, AVATAR_SIZE_MAX } from '../../store/useRoomStore';
import { useMediaStore } from '../../store/useMediaStore';
import { useUIStore } from '../../store/useUIStore';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface AvatarProps {
  id: string;
  name: string;
  isLocal?: boolean;
  avatar_url?: string;
  onMove?: (pos: { x: number; y: number }) => void;
}

const AvatarInner: React.FC<AvatarProps> = ({ id, name, isLocal = false, avatar_url, onMove }) => {
  const movementType = useRoomStore(s => s.movementType);
  const setLocalPosition = useRoomStore(s => s.setLocalPosition);
  const avatarSize = useRoomStore(s => s.avatarSize);
  const setAvatarSize = useRoomStore(s => s.setAvatarSize);
  const { localStream, isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio } = useMediaStore();
  const separateCameraElement = useUIStore(s => s.separateCameraElement);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialAvatarPos = useRef({ x: 0, y: 0 });
  const scaleStartRef = useRef<{ size: number; pointerY: number } | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);

  // Read initial position on mount for first render transform
  const initialPos = useRef(
    isLocal 
      ? useRoomStore.getState().localPosition 
      : useRoomStore.getState().remoteUsers[id]?.position || { x: 0, y: 0 }
  ).current;

  // Directly manipulate DOM transform — only when position changes
  useEffect(() => {
    let lastPos = isLocal 
      ? useRoomStore.getState().localPosition
      : useRoomStore.getState().remoteUsers[id]?.position;
    
    const apply = (pos: typeof lastPos) => {
      if (pos && avatarRef.current) {
        avatarRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
    };
    apply(lastPos);

    const unsub = useRoomStore.subscribe((state) => {
      const currentPos = isLocal 
        ? state.localPosition
        : state.remoteUsers[id]?.position;
      if (currentPos !== lastPos) {
        lastPos = currentPos;
        apply(lastPos);
      }
    });
    return () => unsub();
  }, [isLocal, id]);

  useEffect(() => {
    if (!isDragging && !isScaling) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isScaling && scaleStartRef.current) {
        const dy = e.clientY - scaleStartRef.current.pointerY;
        const newSize = Math.max(AVATAR_SIZE_MIN, Math.min(AVATAR_SIZE_MAX, scaleStartRef.current.size + dy * 0.2));
        setAvatarSize(Math.round(newSize));
        return;
      }

      if (!isDragging) return;
      const zoom = useRoomStore.getState().camera.zoom;
      const dx = (e.clientX - dragStartPos.current.x) / zoom;
      const dy = (e.clientY - dragStartPos.current.y) / zoom;
      
      const newPos = {
        x: initialAvatarPos.current.x + dx,
        y: initialAvatarPos.current.y + dy
      };
      
      setLocalPosition(newPos);
      onMove?.(newPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsScaling(false);
      scaleStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isScaling, setLocalPosition, setAvatarSize, onMove]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isLocal) return;
    if (e.pointerType === 'touch') {
      setIsHovered(prev => !prev);
      return;
    }
    // Shift + Drag = Scale
    if (e.shiftKey) {
      e.stopPropagation();
      setIsScaling(true);
      scaleStartRef.current = {
        size: useRoomStore.getState().avatarSize,
        pointerY: e.clientY
      };
      return;
    }
    if (movementType === 'drag') {
      e.stopPropagation();
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      initialAvatarPos.current = useRoomStore.getState().localPosition;
    }
  };

  // Attach local stream to embedded video element when camera is active in avatar mode
  const showEmbeddedCamera = isLocal && isVideoEnabled && localStream && !separateCameraElement;
  useEffect(() => {
    if (videoRef.current && showEmbeddedCamera) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, showEmbeddedCamera]);

  // Dismiss hover on outside click (for touch devices)
  useEffect(() => {
    if (!isHovered || !isLocal) return;
    const handler = () => {
      setIsHovered(false);
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [isHovered, isLocal]);

  // Clean up hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Use first letter of name for initial
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const buttonOffset = Math.round(avatarSize / 2 + 8);
  const initialFontSize = Math.min(18, Math.round(avatarSize * 0.45));

  const handleMouseEnter = () => {
    if (!isLocal) return;
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isLocal) return;
    if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
      hoverTimerRef.current = null;
    }, 200);
  };

  return (
    <div
      ref={avatarRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate3d(${initialPos.x}px, ${initialPos.y}px, 0) translate(-50%, -50%)`,
        transition: isLocal ? 'none' : 'transform 50ms linear',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: isLocal ? 'auto' : 'none',
        cursor: isLocal ? (isScaling ? 'ns-resize' : movementType === 'drag' ? 'grab' : 'default') : 'default',
        zIndex: 100,
        willChange: isLocal ? 'transform' : undefined,
      }}
      onPointerDown={handlePointerDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar circle wrapper — holds the circle and overlays */}
      <div style={{ position: 'relative', width: `${avatarSize}px`, height: `${avatarSize}px`, margin: '0 auto 6px', pointerEvents: isLocal ? 'auto' : undefined }}>
        {/* Avatar circle */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: !avatar_url ? (isLocal ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)') : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: `${initialFontSize}px`,
            fontWeight: 'bold',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {showEmbeddedCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', userSelect: 'none' }}
            />
          ) : avatar_url ? (
            <img src={avatar_url} alt={name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }} />
          ) : (
            initial
          )}
        </div>

        {/* Hover controls — only for local user */}
        {isLocal && (
          <>
            {/* Camera button — upper-left diagonal */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(20, 18, 35, 0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isVideoEnabled ? 'white' : 'var(--error)',
                pointerEvents: isHovered ? 'auto' : 'none',
                  transform: isHovered
                    ? `translate(-50%, -50%) translate(-${buttonOffset}px, -${buttonOffset}px) scale(1)`
                    : 'translate(-50%, -50%) translate(0, 0) scale(0)',
                opacity: isHovered ? 1 : 0,
                transition: isHovered
                  ? 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease-out'
                  : 'transform 160ms ease-in, opacity 150ms ease-in',
                zIndex: 10,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => { e.stopPropagation(); toggleVideo(!isVideoEnabled); }}
              title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
            >
              {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
            </div>

            {/* Microphone button — upper-right diagonal */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(20, 18, 35, 0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isAudioEnabled ? 'white' : 'var(--error)',
                pointerEvents: isHovered ? 'auto' : 'none',
                transform: isHovered
                    ? `translate(-50%, -50%) translate(${buttonOffset}px, -${buttonOffset}px) scale(1)`
                    : 'translate(-50%, -50%) translate(0, 0) scale(0)',
                opacity: isHovered ? 1 : 0,
                transition: isHovered
                  ? 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1) 40ms, opacity 220ms ease-out 40ms'
                  : 'transform 160ms ease-in 30ms, opacity 150ms ease-in 30ms',
                zIndex: 10,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => { e.stopPropagation(); toggleAudio(!isAudioEnabled); }}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </div>
          </>
        )}
      </div>

      {/* Name tag — use solid bg instead of backdrop-filter for perf */}
      <div
        style={{
          background: 'rgba(10, 8, 20, 0.85)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          border: isLocal ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isLocal ? '0 0 10px rgba(142, 61, 255, 0.5)' : 'none',
        }}
      >
        {name} {isLocal && '(You)'}
      </div>
    </div>
  );
};

export const Avatar = React.memo(AvatarInner);
