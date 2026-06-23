import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Play } from 'lucide-react';
import { SoundCloud, SoundCloudWordmark } from '../icons';
import { searchSoundCloud } from '../../../lib/api';

interface SoundCloudSearchProps {
  onBack: () => void;
  onChoose: (type: string, payload: Record<string, unknown>) => void;
  parseMediaUrl: (url: string) => { type: string; payload: Record<string, unknown> } | null;
}

export const SoundCloudSearch: React.FC<SoundCloudSearchProps> = ({ onBack, onChoose, parseMediaUrl }) => {
  const [searchInput, setSearchInput] = useState('');
  const [soundcloudResults, setSoundcloudResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    let active = true;
    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      setSearchError('');
      try {
        const results = await searchSoundCloud(searchInput);
        if (active) setSoundcloudResults(results);
      } catch (err: any) {
        if (active) setSearchError(err.message || 'Failed to retrieve search results');
      } finally {
        if (active) setIsLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [searchInput]);

  const parsedLink = parseMediaUrl(searchInput.trim());
  const isDirectLink = parsedLink && parsedLink.type === 'soundcloud';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%', background: 'linear-gradient(180deg, rgba(255,85,0,0.08) 0%, transparent 30%)' }}>
      {/* Branded header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(255,85,0,0.18) 0%, rgba(200,60,0,0.1) 100%)',
        borderBottom: '1px solid rgba(255,85,0,0.15)',
      }}>
        <SoundCloudWordmark size={28} />
      </div>

      {/* Back + Search row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '6px 8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', transition: 'all 0.15s ease',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search SoundCloud tracks or paste a SoundCloud URL..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ paddingLeft: 36, fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,85,0,0.15)' }}
            autoFocus
          />
        </div>
      </div>

      {/* Content grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {isDirectLink && (
          <div
            onClick={() => onChoose('soundcloud', parsedLink.payload)}
            style={{
              background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.9rem',
            }}
          >
            <span style={{ color: '#ff5500', fontWeight: 600 }}>Play direct SoundCloud link:</span>
            <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{searchInput}</span>
            <Play size={14} style={{ color: '#ff5500' }} />
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ marginRight: '8px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #ff5500', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            Searching SoundCloud...
          </div>
        )}

        {searchError && (
          <div style={{ color: 'var(--error)', padding: 'var(--space-4)', textAlign: 'center', fontSize: '0.85rem' }}>
            {searchError}
          </div>
        )}

        {!isLoading && !searchError && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {soundcloudResults.map((track, idx) => (
              <div
                key={`${track.trackUrl}-${idx}`}
                onClick={() => onChoose('soundcloud', { url: track.trackUrl })}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,85,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#111' }}>
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, #ff5500 0%, #ff7700 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                    }}>
                      <SoundCloud size={48} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 3, right: 3,
                    background: 'rgba(0,0,0,0.85)',
                    padding: '1px 5px', borderRadius: 3,
                    fontSize: '0.6rem', color: '#fff', fontWeight: 700,
                  }}>
                    {track.duration}
                  </div>
                </div>
                <div style={{ padding: '6px 6px 8px' }}>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-primary)',
                    lineHeight: '1.25', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: 3,
                  }}>
                    {track.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{track.artist}</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>{track.plays} plays</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !searchError && soundcloudResults.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
            No tracks match your search. Paste a full SoundCloud link in the search bar above to play it!
          </div>
        )}
      </div>
    </div>
  );
};
