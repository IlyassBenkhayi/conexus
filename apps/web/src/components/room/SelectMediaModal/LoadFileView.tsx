import React from 'react';
import { FolderOpen } from 'lucide-react';

interface LoadFileViewProps {
  onChooseFileClick: () => void;
}

export const LoadFileView: React.FC<LoadFileViewProps> = ({ onChooseFileClick }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-lg)',
        background: 'rgba(142, 61, 255, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-primary)'
      }}>
        <FolderOpen size={36} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>Play Local File</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 360 }}>
          Select a video file from your device to watch together
        </p>
      </div>
      <button className="btn btn-primary" onClick={onChooseFileClick} style={{ padding: 'var(--space-3) var(--space-8)', fontSize: '1rem' }}>
        <FolderOpen size={18} /> Choose File
      </button>
      <div style={{
        padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 75, 75, 0.08)', border: '1px solid rgba(255, 75, 75, 0.15)',
        fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 400, textAlign: 'center'
      }}>
        ⚠️ Local files are only visible to you. Others in the room will see a placeholder.
      </div>
    </div>
  );
};
