import React, { useState } from 'react';
import { Type, Image as ImageIcon, Play, Smile, Clock, ListChecks, BarChart3, PenTool } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { upsertRoomObject } from '../../lib/roomObjects';
import { STICKER_PACKS, ALL_STICKER_KEYS } from '../../lib/stickers';
import type { StickerPackKey } from '../../lib/stickers';
import type { RoomObject } from '@conexus/shared-types';
import { uploadFile } from '../../lib/api';
import { SelectMediaModal } from './SelectMediaModal';

interface ToolbarProps {
  roomId: string;
  socket: any;
}



export const Toolbar: React.FC<ToolbarProps> = React.memo(({ roomId, socket }) => {
  const addObject = useRoomStore(s => s.addObject);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [activeStickerPack, setActiveStickerPack] = useState<StickerPackKey>('reactions');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const getCenterSpawn = () => {
    const pos = useRoomStore.getState().localPosition;
    return {
      x: pos.x + 80 + (Math.random() * 40 - 20),
      y: pos.y + 20 + (Math.random() * 40 - 20)
    };
  };

  const handleCreateObject = async (obj: RoomObject) => {
    addObject(obj);
    if (socket) {
      socket.emit('add_object', roomId, obj);
    }
    try {
      await upsertRoomObject(roomId, obj);
    } catch (e) {
      console.error('Failed to save object', e);
    }
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleAddText = () => {
    const text = window.prompt("Enter text:");
    if (!text) return;
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'text', x: pos.x, y: pos.y, scale: 1,
      zIndex: Date.now() % 10000, payload: { text }
    });
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'image', x: pos.x, y: pos.y, width: 300, scale: 1,
      zIndex: Date.now() % 10000, payload: { url: imageUrl }
    });
    setImageUrl('');
    setActivePanel(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const { url } = await uploadFile(file, 'chat');
      setImageUrl(url);
    } catch (err) {
      console.error('Failed to upload file', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };



  const handleAddSticker = (emoji: string) => {
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'sticker', x: pos.x, y: pos.y, scale: 1,
      zIndex: Date.now() % 10000, payload: { emoji }
    });
    setActivePanel(null);
  };

  const handleAddTimer = () => {
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'timer', x: pos.x, y: pos.y, width: 220, scale: 1,
      zIndex: Date.now() % 10000,
      payload: { mode: 'stopwatch', startedAt: null, elapsed: 0, running: false }
    });
    setActivePanel(null);
  };

  const handleAddTodo = () => {
    const title = window.prompt("Todo list title:") || "Todo List";
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'todo', x: pos.x, y: pos.y, width: 260, scale: 1,
      zIndex: Date.now() % 10000,
      payload: { title, items: [] }
    });
    setActivePanel(null);
  };

  const handleAddPoll = () => {
    const question = window.prompt("Poll question:");
    if (!question) return;
    const optionsStr = window.prompt("Enter options separated by commas (e.g. Yes, No, Maybe):");
    if (!optionsStr) return;
    const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean);
    if (options.length < 2) { alert('Need at least 2 options'); return; }
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'poll', x: pos.x, y: pos.y, width: 280, scale: 1,
      zIndex: Date.now() % 10000,
      payload: { question, options, votes: Object.fromEntries(options.map(o => [o, 0])), voters: {} }
    });
    setActivePanel(null);
  };

  const handleAddWhiteboard = () => {
    const pos = getCenterSpawn();
    handleCreateObject({
      id: generateId(), type: 'whiteboard', x: pos.x, y: pos.y, width: 400, height: 300, scale: 1,
      zIndex: Date.now() % 10000,
      payload: { strokes: [] }
    });
    setActivePanel(null);
  };

  const btnStyle: React.CSSProperties = { borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <>
      <div style={{
        position: 'absolute', bottom: 'var(--space-8)', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-full)', zIndex: 50,
      }} className="glass-panel">
        <button className="btn btn-secondary" style={btnStyle} onClick={handleAddText} title="Add Text"><Type size={20} /></button>
        <button className="btn btn-secondary" style={btnStyle} onClick={() => togglePanel('image')} title="Add Image"><ImageIcon size={20} /></button>
        <button className="btn btn-secondary" style={btnStyle} onClick={() => setShowMediaModal(true)} title="Select Media"><Play size={20} /></button>
        <button className="btn btn-secondary" style={btnStyle} onClick={() => togglePanel('sticker')} title="Add Sticker"><Smile size={20} /></button>

        <div style={{ width: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

        <button className="btn btn-secondary" style={btnStyle} onClick={handleAddWhiteboard} title="Add Whiteboard"><PenTool size={20} /></button>
        <button className="btn btn-secondary" style={btnStyle} onClick={handleAddTimer} title="Add Timer"><Clock size={20} /></button>
        <button className="btn btn-secondary" style={btnStyle} onClick={handleAddTodo} title="Add Todo List"><ListChecks size={20} /></button>
        <button className="btn btn-secondary" style={btnStyle} onClick={handleAddPoll} title="Add Poll"><BarChart3 size={20} /></button>
      </div>

      {/* Image Panel */}
      {activePanel === 'image' && (
        <div className="glass-panel animate-fade-in" style={{
          position: 'absolute', bottom: '120px', left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto',
          padding: 'var(--space-4)', zIndex: 51, width: '380px'
        }}>
          <form onSubmit={handleAddImage} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input type="url" className="input" style={{ flex: 1 }} placeholder="Paste image URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} autoFocus disabled={isUploading} />
            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? '...' : 'Browse'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading}>Add</button>
            <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
          </form>
        </div>
      )}

      {/* Select Media Modal */}
      {showMediaModal && (
        <SelectMediaModal
          roomId={roomId}
          socket={socket}
          onClose={() => setShowMediaModal(false)}
          onMediaChosen={async (obj) => {
            await handleCreateObject(obj);
            setShowMediaModal(false);
          }}
        />
      )}

      {/* Sticker Picker */}
      {activePanel === 'sticker' && (
        <div className="glass-panel animate-fade-in" style={{
          position: 'absolute', bottom: '120px', left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto',
          padding: 'var(--space-4)', zIndex: 51, width: '320px'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
            {ALL_STICKER_KEYS.map(key => (
              <button 
                key={key} 
                className={`btn ghost ${activeStickerPack === key ? 'active-tab' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => setActiveStickerPack(key)}
              >
                {STICKER_PACKS[key].label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {STICKER_PACKS[activeStickerPack].stickers.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleAddSticker(emoji)}
                style={{
                  background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--radius-sm)',
                  fontSize: '1.8rem', padding: '6px', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.2)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
});
