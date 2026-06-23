import React, { useRef, useEffect, useCallback } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { ZoomIn, ZoomOut, Target } from 'lucide-react';

// Fixed dimensions for the minimap
const MINIMAP_SIZE = 150;
const WORLD_SCALE = 0.05; // 1 pixel in minimap = 20 pixels in world

// The minimap now uses a canvas rendered via rAF instead of React elements.
// This eliminates React re-renders during panning, zooming, or object movement.
const MinimapInner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the minimap throttled to ~20fps — plenty for a tiny overview
  useEffect(() => {
    let rafId: number;
    let lastDrawTime = 0;
    const DRAW_INTERVAL = 50; // ms (~20fps)

    const draw = (time: number) => {
      if (time - lastDrawTime < DRAW_INTERVAL) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      lastDrawTime = time;

      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId = requestAnimationFrame(draw); return; }

      const { objects, remoteUsers, camera, localPosition } = useRoomStore.getState();
      const centerX = MINIMAP_SIZE / 2;
      const centerY = MINIMAP_SIZE / 2;

      // Clear
      ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

      // Objects
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (const obj of Object.values(objects)) {
        const ox = centerX + (obj.x - localPosition.x) * WORLD_SCALE;
        const oy = centerY + (obj.y - localPosition.y) * WORLD_SCALE;
        const ow = (obj.width || 100) * WORLD_SCALE;
        const oh = (obj.height || 100) * WORLD_SCALE;
        ctx.fillRect(ox, oy, ow, oh);
      }

      // Remote users
      ctx.fillStyle = '#ff3d8e'; // --accent-secondary
      for (const rUser of Object.values(remoteUsers)) {
        const rx = centerX + (rUser.position.x - localPosition.x) * WORLD_SCALE;
        const ry = centerY + (rUser.position.y - localPosition.y) * WORLD_SCALE;
        ctx.beginPath();
        ctx.arc(rx, ry, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Local user (always centered)
      ctx.fillStyle = '#8e3dff'; // --accent-primary
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Glow
      ctx.shadowColor = '#8e3dff';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Viewport indicator
      const viewportWidth = window.innerWidth / camera.zoom;
      const viewportHeight = window.innerHeight / camera.zoom;
      const viewportX = camera.x - viewportWidth / 2;
      const viewportY = camera.y - viewportHeight / 2;
      const vx = centerX + (viewportX - localPosition.x) * WORLD_SCALE;
      const vy = centerY + (viewportY - localPosition.y) * WORLD_SCALE;
      const vw = viewportWidth * WORLD_SCALE;
      const vh = viewportHeight * WORLD_SCALE;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy, vw, vh);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(vx, vy, vw, vh);

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleZoomIn = useCallback(() => {
    const cam = useRoomStore.getState().camera;
    useRoomStore.getState().setCamera({ zoom: Math.min(cam.zoom * 1.2, 5) });
  }, []);

  const handleZoomOut = useCallback(() => {
    const cam = useRoomStore.getState().camera;
    useRoomStore.getState().setCamera({ zoom: Math.max(cam.zoom * 0.8, 0.1) });
  }, []);

  const handleResetCamera = useCallback(() => {
    const pos = useRoomStore.getState().localPosition;
    useRoomStore.getState().setCamera({ x: pos.x, y: pos.y });
  }, []);

  return (
    <div style={{ position: 'absolute', bottom: 'var(--space-4)', left: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', zIndex: 40 }}>
      <div
        style={{
          width: `${MINIMAP_SIZE}px`,
          height: `${MINIMAP_SIZE}px`,
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          background: 'rgba(26, 22, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          className="btn btn-secondary"
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          onClick={handleZoomIn} title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button
          className="btn btn-secondary"
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          onClick={handleResetCamera} title="Reset Camera"
        >
          <Target size={20} />
        </button>
        <button
          className="btn btn-secondary"
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          onClick={handleZoomOut} title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
      </div>
    </div>
  );
};

export const Minimap = React.memo(MinimapInner);
