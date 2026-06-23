import React, { useState } from 'react';
import type { RoomObject } from '@conexus/shared-types';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { upsertRoomObject } from '../../../lib/roomObjects';

interface PollWidgetProps {
  object: RoomObject;
  roomId: string;
}

const PollWidgetInner: React.FC<PollWidgetProps> = ({ object, roomId }) => {
  const updateObject = useRoomStore(s => s.updateObject);
  const user = useAuthStore(state => state.user);
  const p = object.payload as Record<string, unknown> || {};
  const question = String(p.question || 'Poll');
  const options = (p.options as string[]) || [];
  const [votes, setVotes] = useState<Record<string, number>>((p.votes as Record<string, number>) || {});
  const [voters, setVoters] = useState<Record<string, string>>((p.voters as Record<string, string>) || {});

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const myVote = user ? voters[user.id] : null;

  const castVote = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    if (!user || myVote) return;

    const newVotes = { ...votes, [option]: (votes[option] || 0) + 1 };
    const newVoters = { ...voters, [user.id]: option };
    setVotes(newVotes);
    setVoters(newVoters);

    const newPayload = { ...p, votes: newVotes, voters: newVoters };
    updateObject(object.id, { payload: newPayload });
    upsertRoomObject(roomId, { ...object, payload: newPayload }).catch(() => {});
  };

  return (
    <div onPointerDown={e => e.stopPropagation()} style={{ padding: 'var(--space-3)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--space-3)' }}>
        📊 {question}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {options.map((option) => {
          const count = votes[option] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyChoice = myVote === option;

          return (
            <button
              key={option}
              onClick={(e) => castVote(e, option)}
              disabled={!!myVote}
              style={{
                position: 'relative',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.2)',
                border: isMyChoice ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: myVote ? 'default' : 'pointer',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                overflow: 'hidden',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              {/* Progress bar background */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${pct}%`,
                background: isMyChoice ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.05)',
                transition: 'width 0.4s ease',
                borderRadius: 'var(--radius-sm)'
              }} />
              <span style={{ position: 'relative', zIndex: 1 }}>{option}</span>
              {myVote && (
                <span style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {pct}% ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      {totalVotes > 0 && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'right' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export const PollWidget = React.memo(PollWidgetInner);
