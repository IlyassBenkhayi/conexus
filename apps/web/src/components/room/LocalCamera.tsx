import React, { useEffect, useRef, useState } from 'react';
import { CameraOff } from 'lucide-react';
import { useMediaStore } from '../../store/useMediaStore';
import { useUIStore } from '../../store/useUIStore';

export const LocalCamera: React.FC = () => {
  const { localStream, isVideoEnabled, toggleVideo } = useMediaStore();
  const separateCameraElement = useUIStore(s => s.separateCameraElement);

  // All hooks MUST be before any early return (React Rules of Hooks)
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, pointerX: number, pointerY: number } | null>(null);
  const posRef = useRef(pos);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: posRef.current.x,
      y: posRef.current.y,
      pointerX: e.clientX,
      pointerY: e.clientY
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const newX = dragStartRef.current.x + dx;
    const newY = dragStartRef.current.y + dy;
    
    posRef.current = { x: newX, y: newY };
    
    if (wrapperRef.current) {
      wrapperRef.current.style.left = `${newX}px`;
      wrapperRef.current.style.top = `${newY}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragStartRef.current = null;
    setPos(posRef.current);
  };

  // Early returns (after all hooks)
  if (!isVideoEnabled || !localStream || !separateCameraElement) {
    return null;
  }

  return (
    <div 
      ref={wrapperRef}
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        width: '200px',
        height: '150px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        zIndex: 51,
        boxShadow: isDragging ? '0 12px 24px rgba(0,0,0,0.5)' : 'var(--shadow-md)',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        padding: '4px 8px', 
        background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 2
      }}>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleVideo(false); }}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '2px' }}
        >
          <CameraOff size={14} />
        </button>
      </div>

      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          pointerEvents: 'none', // let the wrapper handle drag
          transform: 'scaleX(-1)' // Mirror local video
        }} 
      />
    </div>
  );
};
