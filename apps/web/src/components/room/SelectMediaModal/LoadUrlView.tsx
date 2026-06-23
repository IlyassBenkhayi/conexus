import React, { useState } from 'react';
import { Link } from 'lucide-react';

interface LoadUrlViewProps {
  placeholder: string;
  onChoose: (type: string, payload: Record<string, unknown>) => void;
  parseMediaUrl: (url: string) => { type: string; payload: Record<string, unknown> } | null;
}

export const LoadUrlView: React.FC<LoadUrlViewProps> = ({ placeholder, onChoose, parseMediaUrl }) => {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    const result = parseMediaUrl(urlInput);
    if (!result) {
      setUrlError('Unsupported URL. Try YouTube, Twitch, Vimeo, Dailymotion, Spotify, or SoundCloud.');
      return;
    }
    onChoose(result.type, result.payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-lg)',
        background: 'rgba(142, 61, 255, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-primary)'
      }}>
        <Link size={36} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>Open URL</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 400 }}>
          Paste a video URL from YouTube, Twitch, or other supported sites
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Video URL</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="text"
            className="input"
            placeholder={placeholder}
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
            autoFocus
            style={{ flex: 1, fontSize: '0.9rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>Open</button>
        </div>
        {urlError && <div style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: 'var(--space-2)' }}>{urlError}</div>}
      </form>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['YouTube', 'Twitch', 'Vimeo', 'Dailymotion', 'Spotify', 'SoundCloud'].map(name => (
          <span key={name} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
            fontSize: '0.7rem', color: 'var(--text-tertiary)'
          }}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
};
