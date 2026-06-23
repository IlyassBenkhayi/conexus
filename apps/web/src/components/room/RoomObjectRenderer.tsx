import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { RoomObject } from '@conexus/shared-types';
import { useRoomStore } from '../../store/useRoomStore';
import { upsertRoomObject, deleteRoomObject } from '../../lib/roomObjects';
import { Trash2, Pin, PinOff, Copy, Edit2 } from 'lucide-react';
import { MediaScreen } from './MediaScreen';
import { SelectMediaModal } from './SelectMediaModal';

// Import modular widgets
import { TimerWidget } from './widgets/TimerWidget';
import { TodoWidget } from './widgets/TodoWidget';
import { PollWidget } from './widgets/PollWidget';
import { WhiteboardWidget } from './widgets/WhiteboardWidget';

const DRAG_EMIT_THROTTLE_MS = 50; // 20 emits/sec max during drag

interface RoomObjectProps {
  object: RoomObject;
  roomId: string;
  socket: any;
}

const RoomObjectRendererInner: React.FC<RoomObjectProps> = ({ object, roomId, socket }) => {
  const { id, type, payload, width, height, zIndex } = object;
  const updateObject = useRoomStore(s => s.updateObject);
  const removeObject = useRoomStore(s => s.removeObject);
  const addObject = useRoomStore(s => s.addObject);
  
  // Local drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editText, setEditText] = useState("");
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // Change media flow
  const [showChangeMediaFor, setShowChangeMediaFor] = useState<string | null>(null);

  // Position/scale refs — initialized from the store's live values (not the memoized object prop)
  const posRef = useRef({ x: useRoomStore.getState().objects[id]?.x ?? 0, y: useRoomStore.getState().objects[id]?.y ?? 0 });
  const localScaleRef = useRef(useRoomStore.getState().objects[id]?.scale ?? 1);
  const dragStartRef = useRef<{ x: number, y: number, pointerX: number, pointerY: number } | null>(null);
  const scaleStartRef = useRef<{ scale: number, pointerY: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastDragEmitRef = useRef<number>(0);

  // Sync internal transform if store changes (from remote events)
  useEffect(() => {
    let lastX = useRoomStore.getState().objects[id]?.x ?? 0;
    let lastY = useRoomStore.getState().objects[id]?.y ?? 0;
    let lastScale = useRoomStore.getState().objects[id]?.scale ?? 1;

    const applyTransform = (x: number, y: number, s: number) => {
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
      }
    };

    // Apply initial position
    applyTransform(lastX, lastY, lastScale);

    const unsub = useRoomStore.subscribe((state) => {
      const obj = state.objects[id];
      if (!obj) return;
      if (obj.x !== lastX || obj.y !== lastY || (obj.scale ?? 1) !== lastScale) {
        lastX = obj.x;
        lastY = obj.y;
        lastScale = obj.scale ?? 1;
        
        // Only update refs and DOM if we are not actively dragging/scaling locally
        if (!isDragging && !isScaling) {
          posRef.current = { x: lastX, y: lastY };
          localScaleRef.current = lastScale;
          applyTransform(lastX, lastY, lastScale);
        }
      }
    });

    return () => unsub();
  }, [id, isDragging, isScaling]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSelected(true);
    setContextMenu(null);
    if (object.pinned) return;

    wrapperRef.current?.setPointerCapture(e.pointerId);

    // Shift + Drag = Scale
    if (e.shiftKey) {
      setIsScaling(true);
      scaleStartRef.current = {
        scale: localScaleRef.current,
        pointerY: e.clientY
      };
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: posRef.current.x,
      y: posRef.current.y,
      pointerX: e.clientX,
      pointerY: e.clientY
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isScaling && scaleStartRef.current) {
      const dy = e.clientY - scaleStartRef.current.pointerY;
      const newScale = Math.max(0.2, Math.min(5, scaleStartRef.current.scale + dy * 0.005));
      localScaleRef.current = newScale;
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(${newScale})`;
      }
      return;
    }

    if (!isDragging || !dragStartRef.current) return;
    const zoom = useRoomStore.getState().camera.zoom;
    const dx = (e.clientX - dragStartRef.current.pointerX) / zoom;
    const dy = (e.clientY - dragStartRef.current.pointerY) / zoom;
    
    const newX = dragStartRef.current.x + dx;
    const newY = dragStartRef.current.y + dy;
    
    posRef.current = { x: newX, y: newY };
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale(${localScaleRef.current})`;
    }
    
    // Time-based throttle for real-time drag sync
    const now = performance.now();
    if (socket && now - lastDragEmitRef.current > DRAG_EMIT_THROTTLE_MS) {
      socket.emit('move_object', roomId, id, { x: newX, y: newY });
      lastDragEmitRef.current = now;
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    wrapperRef.current?.releasePointerCapture(e.pointerId);

    if (isScaling) {
      setIsScaling(false);
      scaleStartRef.current = null;
      const finalScale = localScaleRef.current;
      updateObject(id, { scale: finalScale });
      try {
        await upsertRoomObject(roomId, { ...object, scale: finalScale });
      } catch {
        console.error("Failed to save object scale");
      }
      return;
    }

    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;

    const finalPos = posRef.current;

    // Save final position
    updateObject(id, { x: finalPos.x, y: finalPos.y });
    
    if (socket) {
      socket.emit('move_object', roomId, id, { x: finalPos.x, y: finalPos.y });
    }

    try {
      await upsertRoomObject(roomId, { ...object, x: finalPos.x, y: finalPos.y });
    } catch {
      console.error("Failed to save object position");
    }
  };

  // Deselect if clicked outside
  useEffect(() => {
    const handleGlobalClick = () => { setIsSelected(false); setContextMenu(null); };
    if (isSelected || contextMenu) {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('close-context-menus', handleGlobalClick);
    }
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('close-context-menus', handleGlobalClick);
    };
  }, [isSelected, contextMenu]);

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('close-context-menus'));
    setIsSelected(true);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleEditText = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    setIsEditingText(true);
    setEditText(String(payload?.text || ''));
  };

  const handleDelete = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setContextMenu(null);

    // Revoke local video blob URL if it exists
    const localUrl = payload?.localUrl;
    if (localUrl && typeof localUrl === 'string' && localUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(localUrl);
      } catch (err) {
        console.error('Failed to revoke blob URL:', err);
      }
    }

    removeObject(id);
    if (socket) {
      socket.emit('delete_object', roomId, id);
    }
    try {
      await deleteRoomObject(id, roomId);
    } catch (e) {
      console.error("Failed to delete object", e);
    }
  }, [id, payload?.localUrl, removeObject, socket, roomId]);

  const handleChangeMedia = useCallback(() => {
    setShowChangeMediaFor(id);
  }, [id]);

  const handleStopMedia = useCallback(() => {
    handleDelete();
  }, [handleDelete]);

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    const newPinned = !object.pinned;
    updateObject(id, { pinned: newPinned });
    try {
      await upsertRoomObject(roomId, { ...object, pinned: newPinned });
    } catch {
      console.error("Failed to toggle pin");
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    const newObj: RoomObject = {
      ...object,
      id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      x: object.x + 30,
      y: object.y + 30,
      pinned: false
    };
    addObject(newObj);
    if (socket) {
      socket.emit('add_object', roomId, newObj);
    }
    try {
      await upsertRoomObject(roomId, newObj);
    } catch {
      console.error('Failed to duplicate object');
    }
  };

  const noChrome = ['sticker'].includes(type);

  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(${localScaleRef.current})`,
    transformOrigin: 'top left',
    width: width ? width + 'px' : 'auto',
    height: height ? height + 'px' : 'auto',
    zIndex: isSelected ? 1000 : (zIndex || 1),
    background: noChrome ? 'transparent' : (isDragging || isScaling ? 'rgba(15, 12, 28, 0.95)' : 'rgba(26, 22, 42, 0.85)'),
    border: type === 'sticker' ? (isSelected ? '2px dashed var(--accent-primary)' : 'none') : (isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)'),
    borderRadius: 'var(--radius-md)',
    padding: noChrome ? '0' : 'var(--space-2)',
    boxShadow: isDragging ? '0 12px 24px rgba(0,0,0,0.5)' : (type === 'sticker' ? 'none' : 'var(--shadow-sm)'),
    color: 'var(--text-primary)',
    cursor: object.pinned ? 'default' : (isDragging ? 'grabbing' : (isScaling ? 'ns-resize' : 'grab')),
    touchAction: 'none',
    userSelect: 'none',
    transition: isDragging || isScaling ? 'none' : 'transform 0.1s ease',
    overflow: 'visible',
    willChange: 'transform',
  };

  const renderContent = () => {
    switch (type) {
      case 'text':
        if (isEditingText) {
          return (
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={async () => {
                setIsEditingText(false);
                const newPayload = { ...payload, text: editText };
                updateObject(id, { payload: newPayload });
                if (socket) {
                  socket.emit('add_object', roomId, { ...object, payload: newPayload });
                }
                try {
                  await upsertRoomObject(roomId, { ...object, payload: newPayload });
                } catch {
                  console.error("Failed to update text");
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: 'var(--space-2)',
                fontSize: '1.2rem',
                background: 'rgba(0,0,0,0.5)',
                color: 'var(--text-primary)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                resize: 'both',
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap'
              }}
            />
          );
        }
        return <p style={{ margin: 0, padding: 'var(--space-2)', fontSize: '1.2rem', whiteSpace: 'pre-wrap' }}>{String(payload?.text || 'Text Object')}</p>;
      case 'image':
        return <img src={String(payload?.url || '')} alt="Room object" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />;
      case 'youtube':
      case 'twitch':
      case 'vimeo':
      case 'dailymotion':
      case 'spotify':
      case 'soundcloud':
      case 'local-video':
      case 'localvideo':
      case 'screenshare':
      case 'webview':
        return (
          <MediaScreen
            object={object}
            roomId={roomId}
            socket={socket}
            onChangeMedia={handleChangeMedia}
            onStop={handleStopMedia}
          />
        );
      case 'sticker':
        return <div style={{ fontSize: '4rem', lineHeight: 1, padding: '8px' }}>{String(payload?.emoji || '😀')}</div>;
      case 'timer':
        return <div style={{ width: '100%', height: '100%' }}><TimerWidget object={object} roomId={roomId} /></div>;
      case 'todo':
        return <div style={{ width: '100%', height: '100%' }}><TodoWidget object={object} roomId={roomId} /></div>;
      case 'poll':
        return <div style={{ width: '100%', height: '100%' }}><PollWidget object={object} roomId={roomId} /></div>;
      case 'whiteboard':
        return <div style={{ width: '100%', height: '100%' }}><WhiteboardWidget object={object} roomId={roomId} socket={socket} /></div>;
      default:
        return <div>Unknown object: {type}</div>;
    }
  };

  return (
    <div 
      ref={wrapperRef}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => { e.stopPropagation(); setIsSelected(true); }}
      onContextMenu={handleContextMenu}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: type === 'sticker' ? 'visible' : 'hidden', pointerEvents: (isDragging || isScaling) ? 'none' : 'auto' }}>
        {renderContent()}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && createPortal(
        <div 
          className="glass-panel animate-fade-in"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
            minWidth: '160px',
            padding: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {object.type === 'text' && (
            <button 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
                padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={handleEditText}
            >
              <Edit2 size={14} /> Edit Text
            </button>
          )}
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
              padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={handleTogglePin}
          >
            {object.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            {object.pinned ? 'Unpin Object' : 'Pin Object'}
          </button>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
              padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={handleDuplicate}
          >
            <Copy size={14} /> Duplicate
          </button>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
              padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--error)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,75,75,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={handleDelete}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>,
        document.body
      )}

      {/* Change Media Modal */}
      {showChangeMediaFor === id && (
        <SelectMediaModal
          roomId={roomId}
          socket={socket}
          onClose={() => setShowChangeMediaFor(null)}
          onMediaChosen={async (newObj) => {
            const updates: Partial<RoomObject> = {
              type: newObj.type,
              payload: newObj.payload,
            };
            if (newObj.width) updates.width = newObj.width;
            if (newObj.height) updates.height = newObj.height;
            updateObject(id, updates);
            if (socket) {
              socket.emit('add_object', roomId, { ...object, ...updates });
            }
            try {
              await upsertRoomObject(roomId, { ...object, ...updates });
            } catch {
              console.error('Failed to update media');
            }
            setShowChangeMediaFor(null);
          }}
        />
      )}
    </div>
  );
};

export const RoomObjectRenderer = React.memo(RoomObjectRendererInner);
