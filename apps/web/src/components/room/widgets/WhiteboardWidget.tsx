import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { RoomObject } from '@conexus/shared-types';
import { useRoomStore } from '../../../store/useRoomStore';

interface WhiteboardWidgetProps {
  object: RoomObject;
  roomId: string;
  socket: any;
}

const WhiteboardWidgetInner: React.FC<WhiteboardWidgetProps> = ({ object, roomId, socket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const updateObject = useRoomStore(s => s.updateObject);
  
  const currentStrokeRef = useRef<{x: number, y: number}[]>([]);
  const resizeStartRef = useRef<{ pointerX: number, pointerY: number, width: number, height: number } | null>(null);
  
  const payload = (object.payload as { strokes?: {x: number, y: number}[][] }) || {};
  const strokes = payload.strokes || [];
  
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    
    // Draw all saved strokes
    strokes.forEach((stroke) => {
      if (!stroke || stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
    
    // Draw current stroke
    const curr = currentStrokeRef.current;
    if (curr && curr.length > 0) {
      ctx.beginPath();
      ctx.moveTo(curr[0].x, curr[0].y);
      for (let i = 1; i < curr.length; i++) {
        ctx.lineTo(curr[i].x, curr[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);
  
  useEffect(() => {
    redraw();
  }, [redraw]);
  
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    
    currentStrokeRef.current = [{ x: x * scaleX, y: y * scaleY }];
    redraw();
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    
    currentStrokeRef.current.push({ x: x * scaleX, y: y * scaleY });
    redraw();
  };
  
  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (currentStrokeRef.current.length > 0) {
      const newStrokes = [...strokes, currentStrokeRef.current];
      currentStrokeRef.current = [];
      const newPayload = { ...payload, strokes: newStrokes };
      
      updateObject(object.id, { payload: newPayload });
      
      if (socket) {
        socket.emit('add_object', roomId, { ...object, payload: newPayload });
      }
      
      try {
        const { upsertRoomObject } = await import('../../../lib/roomObjects');
        await upsertRoomObject(roomId, { ...object, payload: newPayload });
      } catch (err) {
        console.error("Failed to save whiteboard", err);
      }
    }
  };
  
  const clearBoard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPayload = { ...payload, strokes: [] };
    updateObject(object.id, { payload: newPayload });
    if (socket) socket.emit('add_object', roomId, { ...object, payload: newPayload });
    try {
      const { upsertRoomObject } = await import('../../../lib/roomObjects');
      await upsertRoomObject(roomId, { ...object, payload: newPayload });
    } catch {}
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      width: object.width || 400,
      height: object.height || 300
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    e.stopPropagation();
    
    const { camera } = useRoomStore.getState();
    const dx = (e.clientX - resizeStartRef.current.pointerX) / camera.zoom;
    const dy = (e.clientY - resizeStartRef.current.pointerY) / camera.zoom;
    
    const newWidth = Math.max(200, resizeStartRef.current.width + dx);
    const newHeight = Math.max(150, resizeStartRef.current.height + dy);
    
    updateObject(object.id, { width: newWidth, height: newHeight });
  };

  const handleResizePointerUp = async (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.stopPropagation();
    setIsResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    resizeStartRef.current = null;
    
    if (socket) {
      socket.emit('add_object', roomId, object);
    }
    
    try {
      const { upsertRoomObject } = await import('../../../lib/roomObjects');
      await upsertRoomObject(roomId, object);
    } catch {}
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Whiteboard</span>
        <button onClick={clearBoard} onPointerDown={e => e.stopPropagation()} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'white', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>Clear</button>
      </div>
      <canvas 
        ref={canvasRef}
        width={object.width || 400} 
        height={(object.height || 300) - 35}
        style={{ flex: 1, touchAction: 'none', cursor: 'crosshair', display: 'block', width: '100%', height: 'calc(100% - 35px)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {/* Resize Handle */}
      <div 
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'nwse-resize',
          zIndex: 10
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '100%', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
          <path d="M15 21L21 15M9 21L21 9M21 21V21.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

export const WhiteboardWidget = React.memo(WhiteboardWidgetInner);
