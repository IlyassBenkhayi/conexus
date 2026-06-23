import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Play } from 'lucide-react';
import { TwitchWordmark } from '../icons';
import { searchTwitch } from '../../../lib/api';

interface TwitchSearchProps {
  onBack: () => void;
  onChoose: (type: string, payload: Record<string, unknown>) => void;
  parseMediaUrl: (url: string) => { type: string; payload: Record<string, unknown> } | null;
}

export const TwitchSearch: React.FC<TwitchSearchProps> = ({ onBack, onChoose, parseMediaUrl }) => {
  const [searchInput, setSearchInput] = useState('');
  const [twitchResults, setTwitchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    let active = true;
    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      setSearchError('');
      try {
        const results = await searchTwitch(searchInput);
        if (active) setTwitchResults(results);
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
  const isDirectLink = parsedLink && parsedLink.type === 'twitch';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%', background: 'linear-gradient(180deg, rgba(145,70,255,0.08) 0%, transparent 30%)' }}>
      {/* Branded header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(145,70,255,0.18) 0%, rgba(100,50,200,0.1) 100%)',
        borderBottom: '1px solid rgba(145,70,255,0.15)',
      }}>
        <TwitchWordmark size={26} />
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
            placeholder="Search Twitch streams or paste a Twitch channel/video URL..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ paddingLeft: 36, fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(145,70,255,0.15)' }}
            autoFocus
          />
        </div>
      </div>

      {/* Content grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {isDirectLink && (
          <div
            onClick={() => onChoose('twitch', parsedLink.payload)}
            style={{
              background: 'rgba(145,70,255,0.12)', border: '1px solid rgba(145,70,255,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.9rem',
            }}
          >
            <span style={{ color: '#9146ff', fontWeight: 600 }}>Play direct Twitch link:</span>
            <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{searchInput}</span>
            <Play size={14} style={{ color: '#9146ff' }} />
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ marginRight: '8px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #9146ff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            Searching Twitch...
          </div>
        )}

        {searchError && (
          <div style={{ color: 'var(--error)', padding: 'var(--space-4)', textAlign: 'center', fontSize: '0.85rem' }}>
            {searchError}
          </div>
        )}

        {!isLoading && !searchError && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {twitchResults.map((stream, idx) => (
              <div
                key={`${stream.channel}-${stream.videoId || idx}`}
                onClick={() => {
                  if (stream.isLive) {
                    onChoose('twitch', { channel: stream.channel });
                  } else if (stream.videoId) {
                    onChoose('twitch', { videoId: stream.videoId, channel: stream.channel });
                  } else {
                    onChoose('twitch', { channel: stream.channel });
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(145,70,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#111' }}>
                  <img
                    src={stream.thumbnail}
                    alt={stream.displayName}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div style={{
                    position: 'absolute', top: 4, left: 4,
                    background: stream.isLive ? '#ff0000' : 'rgba(145, 70, 255, 0.4)',
                    padding: '1px 5px', borderRadius: 3,
                    fontSize: '0.5rem', color: '#fff', fontWeight: 800,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    {stream.isLive ? 'LIVE' : 'VOD'}
                  </div>
                  {stream.isLive && (
                    <div style={{
                      position: 'absolute', bottom: 3, right: 3,
                      background: 'rgba(0,0,0,0.85)', padding: '1px 5px',
                      borderRadius: 3, fontSize: '0.55rem', color: '#fff', fontWeight: 600,
                    }}>
                      👤 {stream.viewers}
                    </div>
                  )}
                </div>
                <div style={{ padding: '6px 6px 8px' }}>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-primary)',
                    lineHeight: '1.25', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: 3,
                  }}>
                    {stream.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stream.displayName}</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>{stream.game}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !searchError && twitchResults.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
            No streams match your search. Paste a full Twitch channel/video link in the search bar above to play it!
          </div>
        )}
      </div>
    </div>
  );
};
