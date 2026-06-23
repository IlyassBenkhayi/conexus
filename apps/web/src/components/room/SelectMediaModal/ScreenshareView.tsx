import React from 'react';
import { Monitor } from 'lucide-react';

interface ScreenshareViewProps {
  onStart: () => void;
}

export const ScreenshareView: React.FC<ScreenshareViewProps> = ({ onStart }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-lg)',
        background: 'rgba(142, 61, 255, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-primary)'
      }}>
        <Monitor size={36} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>Share Your Screen</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 360 }}>
          Your screen will be visible to everyone in the room via WebRTC
        </p>
      </div>
      <button className="btn btn-primary" onClick={onStart} style={{ padding: 'var(--space-3) var(--space-8)', fontSize: '1rem' }}>
        <Monitor size={18} /> Start Screen Share
      </button>
    </div>
  );
};
