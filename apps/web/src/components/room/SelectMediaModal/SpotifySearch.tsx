import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Play } from 'lucide-react';
import { Spotify, SpotifyWordmark } from '../icons';
import { searchSpotify } from '../../../lib/api';

interface SpotifySearchProps {
  onBack: () => void;
  onChoose: (type: string, payload: Record<string, unknown>) => void;
  parseMediaUrl: (url: string) => { type: string; payload: Record<string, unknown> } | null;
}

export const SpotifySearch: React.FC<SpotifySearchProps> = ({ onBack, onChoose, parseMediaUrl }) => {
  const [searchInput, setSearchInput] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    let active = true;
    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      setSearchError('');
      try {
        const results = await searchSpotify(searchInput);
        if (active) setSpotifyResults(results);
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
  const isDirectLink = parsedLink && parsedLink.type === 'spotify';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%', background: 'linear-gradient(180deg, rgba(29,185,84,0.08) 0%, transparent 30%)' }}>
      {/* Branded header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(29,185,84,0.18) 0%, rgba(20,120,60,0.1) 100%)',
        borderBottom: '1px solid rgba(29,185,84,0.15)',
      }}>
        <SpotifyWordmark size={28} />
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
            placeholder="Search Spotify tracks or paste a Spotify URL..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ paddingLeft: 36, fontSize: '0.85rem', background: 'rgba(29,185,84,0.04)', borderColor: 'rgba(29,185,84,0.15)' }}
            autoFocus
          />
        </div>
      </div>

      {/* Content grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {isDirectLink && (
          <div
            onClick={() => onChoose('spotify', parsedLink.payload)}
            style={{
              background: 'rgba(29,185,84,0.12)', border: '1px solid rgba(29,185,84,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.9rem',
            }}
          >
            <span style={{ color: '#1db954', fontWeight: 600 }}>Play direct Spotify link:</span>
            <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{searchInput}</span>
            <Play size={14} style={{ color: '#1db954' }} />
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ marginRight: '8px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #1db954', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            Searching Spotify...
          </div>
        )}

        {searchError && (
          <div style={{ color: 'var(--error)', padding: 'var(--space-4)', textAlign: 'center', fontSize: '0.85rem' }}>
            {searchError}
          </div>
        )}

        {!isLoading && !searchError && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {spotifyResults.map(track => (
              <div
                key={track.trackId}
                onClick={() => onChoose('spotify', {
                  embedUrl: `https://open.spotify.com/embed/track/${track.trackId}`,
                  url: `https://open.spotify.com/track/${track.trackId}`
                })}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(29,185,84,0.08)';
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
                      background: 'linear-gradient(135deg, #1db954 0%, #128c3e 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                    }}>
                      <Spotify size={48} />
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
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.album}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !searchError && spotifyResults.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
            No tracks match your search. Paste a full Spotify link in the search bar above to play it!
          </div>
        )}
      </div>
    </div>
  );
};
