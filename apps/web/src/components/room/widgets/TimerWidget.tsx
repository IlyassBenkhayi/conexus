import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { RoomObject } from '@conexus/shared-types';
import { useRoomStore } from '../../../store/useRoomStore';
import { upsertRoomObject } from '../../../lib/roomObjects';

interface TimerWidgetProps {
  object: RoomObject;
  roomId: string;
}

const TimerWidgetInner: React.FC<TimerWidgetProps> = ({ object, roomId }) => {
  const updateObject = useRoomStore(s => s.updateObject);
  const p = object.payload as Record<string, unknown> || {};
  const [elapsed, setElapsed] = useState<number>(Number(p.elapsed) || 0);
  const [running, setRunning] = useState(Boolean(p.running));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const persist = useCallback((newPayload: Record<string, unknown>) => {
    updateObject(object.id, { payload: newPayload });
    upsertRoomObject(roomId, { ...object, payload: newPayload }).catch(() => {});
  }, [object, roomId, updateObject]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !running;
    setRunning(next);
    persist({ ...p, running: next, elapsed });
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRunning(false);
    setElapsed(0);
    persist({ ...p, running: false, elapsed: 0 });
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div onPointerDown={e => e.stopPropagation()} style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '4px', letterSpacing: '1px' }}>Stopwatch</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', marginBottom: 'var(--space-3)' }}>
        {formatTime(elapsed)}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
        <button onClick={toggle} className="btn btn-primary" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="btn btn-secondary" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
};

export const TimerWidget = React.memo(TimerWidgetInner);
