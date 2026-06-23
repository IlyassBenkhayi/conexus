import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { RoomObject } from '@conexus/shared-types';
import { useRoomStore } from '../../../store/useRoomStore';
import { upsertRoomObject } from '../../../lib/roomObjects';

interface TodoItem { text: string; done: boolean; }

interface TodoWidgetProps {
  object: RoomObject;
  roomId: string;
}

const TodoWidgetInner: React.FC<TodoWidgetProps> = ({ object, roomId }) => {
  const updateObject = useRoomStore(s => s.updateObject);
  const p = object.payload as Record<string, unknown> || {};
  const title = String(p.title || 'Todo');
  const [items, setItems] = useState<TodoItem[]>((p.items as TodoItem[]) || []);
  const [newItem, setNewItem] = useState('');

  const persist = useCallback((newItems: TodoItem[]) => {
    const newPayload = { ...p, items: newItems };
    updateObject(object.id, { payload: newPayload });
    upsertRoomObject(roomId, { ...object, payload: newPayload }).catch(() => {});
  }, [object, roomId, p, updateObject]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newItem.trim()) return;
    const updated = [...items, { text: newItem.trim(), done: false }];
    setItems(updated);
    setNewItem('');
    persist(updated);
  };

  const toggleItem = (e: React.MouseEvent<HTMLInputElement>, idx: number) => {
    e.stopPropagation();
    const updated = items.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setItems(updated);
    persist(updated);
  };

  const removeItem = (e: React.MouseEvent<HTMLButtonElement>, idx: number) => {
    e.stopPropagation();
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    persist(updated);
  };

  return (
    <div onPointerDown={e => e.stopPropagation()} style={{ padding: 'var(--space-3)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        📝 {title}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
          {items.filter(i => i.done).length}/{items.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto', marginBottom: 'var(--space-2)' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => {}}
              onClick={(e) => toggleItem(e, i)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ 
              flex: 1, fontSize: '0.85rem', 
              textDecoration: item.done ? 'line-through' : 'none', 
              color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
              transition: 'all 0.2s'
            }}>
              {item.text}
            </span>
            <button 
              onClick={(e) => removeItem(e, i)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', fontSize: '0.7rem' }}
            >
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>No items yet</div>
        )}
      </div>

      <form onSubmit={addItem} style={{ display: 'flex', gap: '4px' }}>
        <input
          type="text"
          className="input"
          placeholder="Add item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          style={{ flex: 1, fontSize: '0.8rem', padding: '4px 8px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px' }}>
          <Plus size={14} />
        </button>
      </form>
    </div>
  );
};

export const TodoWidget = React.memo(TodoWidgetInner);
