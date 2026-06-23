import React, { useState, useRef, useEffect } from 'react';
import {
  X, Monitor, Link, FolderOpen, Search, Globe, Compass, Layers, Gamepad2
} from 'lucide-react';
import { Youtube, Twitch, Spotify, Vimeo, Dailymotion, SoundCloud } from './icons';
import { useRoomStore } from '../../store/useRoomStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { RoomObject } from '@conexus/shared-types';

import { YoutubeSearch } from './SelectMediaModal/YoutubeSearch';
import { TwitchSearch } from './SelectMediaModal/TwitchSearch';
import { VimeoSearch } from './SelectMediaModal/VimeoSearch';
import { DailymotionSearch } from './SelectMediaModal/DailymotionSearch';
import { SpotifySearch } from './SelectMediaModal/SpotifySearch';
import { SoundCloudSearch } from './SelectMediaModal/SoundCloudSearch';
import { ScreenshareView } from './SelectMediaModal/ScreenshareView';
import { LoadUrlView } from './SelectMediaModal/LoadUrlView';
import { LoadFileView } from './SelectMediaModal/LoadFileView';

interface SelectMediaModalProps {
  roomId: string;
  socket: any;
  onClose: () => void;
  onMediaChosen: (object: RoomObject) => void;
}

type SidebarTab = 'discover' | 'streaming' | 'activities' | 'websearch';
type FilterChip = 'all' | 'video' | 'music' | 'live';
type SubView = null | 'screenshare' | 'loadurl' | 'loadfile' | 'youtube-search' | 'twitch-search' | 'vimeo-search' | 'dailymotion-search' | 'spotify-search' | 'soundcloud-search';

interface ServiceCard {
  name: string;
  type: string;
  color: string;
  category: 'Video' | 'Music' | 'Live' | 'Activity';
  icon: React.ReactNode;
  placeholder?: string;
}

const SERVICE_CARDS: ServiceCard[] = [
  { name: 'YouTube', type: 'youtube', color: '#ff0000', category: 'Video', icon: <Youtube size={32} />, placeholder: 'Paste a YouTube URL e.g. https://youtu.be/dQw4w9WgXcQ' },
  { name: 'Twitch', type: 'twitch', color: '#9146ff', category: 'Live', icon: <Twitch size={32} />, placeholder: 'Paste a Twitch URL e.g. https://twitch.tv/channelname' },
  { name: 'Vimeo', type: 'vimeo', color: '#1ab7ea', category: 'Video', icon: <Vimeo size={32} />, placeholder: 'Paste a Vimeo URL e.g. https://vimeo.com/123456789' },
  { name: 'Dailymotion', type: 'dailymotion', color: '#0066dc', category: 'Video', icon: <Dailymotion size={32} />, placeholder: 'Paste a Dailymotion URL e.g. https://dailymotion.com/video/x8abc12' },
  { name: 'Spotify', type: 'spotify', color: '#1db954', category: 'Music', icon: <Spotify size={32} />, placeholder: 'Paste a Spotify URL e.g. https://open.spotify.com/track/...' },
  { name: 'SoundCloud', type: 'soundcloud', color: '#ff5500', category: 'Music', icon: <SoundCloud size={32} />, placeholder: 'Paste a SoundCloud URL e.g. https://soundcloud.com/artist/track' },
  { name: 'Screen Share', type: 'screenshare', color: 'var(--accent-primary)', category: 'Activity', icon: <Monitor size={32} /> },
  { name: 'Local File', type: 'local-file', color: 'var(--text-tertiary)', category: 'Activity', icon: <FolderOpen size={32} /> },
];

const SIDEBAR_TABS: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { key: 'discover', label: 'Discover', icon: <Compass size={16} /> },
  { key: 'streaming', label: 'Streaming', icon: <Layers size={16} /> },
  { key: 'activities', label: 'Activities', icon: <Gamepad2 size={16} /> },
  { key: 'websearch', label: 'Web Search', icon: <Globe size={16} /> },
];

const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Video' },
  { key: 'music', label: 'Music' },
  { key: 'live', label: 'Live' },
];

// ── URL Parsing ──────────────────────────────────────────────────────────────
export function parseMediaUrl(url: string): { type: string; payload: Record<string, unknown> } | null {
  const trimmed = url.trim();

  // YouTube
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of ytPatterns) {
    const m = trimmed.match(p);
    if (m) return { type: 'youtube', payload: { videoId: m[1], url: trimmed } };
  }

  // Twitch VOD
  const twitchVideoMatch = trimmed.match(/twitch\.tv\/videos\/(\d+)/);
  if (twitchVideoMatch) return { type: 'twitch', payload: { videoId: twitchVideoMatch[1], url: trimmed } };

  // Twitch
  const twitchMatch = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) return { type: 'twitch', payload: { channel: twitchMatch[1], url: trimmed } };

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', payload: { videoId: vimeoMatch[1], url: trimmed } };

  // Dailymotion
  const dmMatch = trimmed.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dmMatch) return { type: 'dailymotion', payload: { videoId: dmMatch[1], url: trimmed } };

  // Spotify
  const spotifyMatch = trimmed.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    const embedUrl = `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
    return { type: 'spotify', payload: { embedUrl, url: trimmed } };
  }

  // SoundCloud
  const scMatch = trimmed.match(/soundcloud\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/);
  if (scMatch) return { type: 'soundcloud', payload: { url: trimmed } };

  return null;
}

// ── Component ────────────────────────────────────────────────────────────────
export const SelectMediaModalInner: React.FC<SelectMediaModalProps> = ({ onClose, onMediaChosen }) => {
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState<SidebarTab>('discover');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [subView, setSubView] = useState<SubView>(null);
  const [urlPlaceholder, setUrlPlaceholder] = useState('Paste a YouTube, Twitch, Vimeo, Dailymotion, or Spotify URL');
  const [searchInput, setSearchInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gridSearch, setGridSearch] = useState('');
  const [debouncedGridSearch, setDebouncedGridSearch] = useState('');

  // Debounce main grid search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGridSearch(gridSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [gridSearch]);

  const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const getCenterSpawn = () => {
    const pos = useRoomStore.getState().localPosition;
    return {
      x: pos.x + 80 + (Math.random() * 40 - 20),
      y: pos.y + 20 + (Math.random() * 40 - 20)
    };
  };

  const makeObject = (type: string, payload: Record<string, unknown>, extraProps?: Partial<RoomObject>): RoomObject => {
    const pos = getCenterSpawn();
    return {
      id: generateId(),
      type,
      x: pos.x,
      y: pos.y,
      width: 560,
      height: 315,
      scale: 1,
      zIndex: Date.now() % 10000,
      payload,
      ...extraProps,
    };
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChoose = (type: string, payload: Record<string, unknown>) => {
    onMediaChosen(makeObject(type, payload));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    onMediaChosen(makeObject('local-video', {
      localUrl,
      fileName: file.name,
      mimeType: file.type,
    }));
  };

  const handleScreenShare = async () => {
    try {
      const userId = user?.id || 'local';
      onMediaChosen(makeObject('screenshare', {
        initiatorId: userId,
        objectId: generateId(),
      }));
    } catch (err) {
      console.error('Screen share failed:', err);
    }
  };

  const handleCardClick = (card: ServiceCard) => {
    if (card.type === 'screenshare') {
      setSubView('screenshare');
      return;
    }
    if (card.type === 'local-file') {
      fileInputRef.current?.click();
      return;
    }
    if (card.type === 'youtube') {
      setSubView('youtube-search');
      setSearchInput('');
      return;
    }
    if (card.type === 'twitch') {
      setSubView('twitch-search');
      setSearchInput('');
      return;
    }
    if (card.type === 'vimeo') {
      setSubView('vimeo-search');
      setSearchInput('');
      return;
    }
    if (card.type === 'dailymotion') {
      setSubView('dailymotion-search');
      setSearchInput('');
      return;
    }
    if (card.type === 'spotify') {
      setSubView('spotify-search');
      setSearchInput('');
      return;
    }
    if (card.type === 'soundcloud') {
      setSubView('soundcloud-search');
      setSearchInput('');
      return;
    }
    setSubView('loadurl');
    setUrlPlaceholder(card.placeholder || 'Paste a URL...');
  };

  const handleWebSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const parsed = parseMediaUrl(searchInput.trim());
    if (parsed) {
      onMediaChosen(makeObject(parsed.type, parsed.payload));
      return;
    }
    let finalUrl = searchInput.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    onMediaChosen(makeObject('webview', { url: finalUrl }));
  };

  const getFilteredCards = (): ServiceCard[] => {
    let cards = SERVICE_CARDS;

    if (activeTab === 'streaming') {
      cards = cards.filter(c => c.category === 'Video' || c.category === 'Live' || c.category === 'Music');
    } else if (activeTab === 'activities') {
      cards = cards.filter(c => c.category === 'Activity');
    }

    if (activeFilter === 'video') cards = cards.filter(c => c.category === 'Video');
    else if (activeFilter === 'music') cards = cards.filter(c => c.category === 'Music');
    else if (activeFilter === 'live') cards = cards.filter(c => c.category === 'Live');

    if (debouncedGridSearch.trim()) {
      const query = debouncedGridSearch.toLowerCase();
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    return cards;
  };

  // ── Render sub-views ─────────────────────────────────────────────────────
  const renderSubView = () => {
    switch (subView) {
      case 'screenshare':
        return <ScreenshareView onStart={handleScreenShare} />;
      case 'loadurl':
        return (
          <LoadUrlView
            placeholder={urlPlaceholder}
            onChoose={handleChoose}
            parseMediaUrl={parseMediaUrl}
          />
        );
      case 'loadfile':
        return <LoadFileView onChooseFileClick={() => fileInputRef.current?.click()} />;
      case 'youtube-search':
        return <YoutubeSearch onBack={() => setSubView(null)} onChoose={handleChoose} parseMediaUrl={parseMediaUrl} />;
      case 'twitch-search':
        return <TwitchSearch onBack={() => setSubView(null)} onChoose={handleChoose} parseMediaUrl={parseMediaUrl} />;
      case 'vimeo-search':
        return <VimeoSearch onBack={() => setSubView(null)} onChoose={handleChoose} parseMediaUrl={parseMediaUrl} />;
      case 'dailymotion-search':
        return <DailymotionSearch onBack={() => setSubView(null)} onChoose={handleChoose} parseMediaUrl={parseMediaUrl} />;
      case 'spotify-search':
        return <SpotifySearch onBack={() => setSubView(null)} onChoose={handleChoose} parseMediaUrl={parseMediaUrl} />;
      case 'soundcloud-search':
        return <SoundCloudSearch onBack={() => setSubView(null)} onChoose={handleChoose} parseMediaUrl={parseMediaUrl} />;
      default:
        return null;
    }
  };

  // ── Main grid / websearch view ───────────────────────────────────────────
  const renderMainContent = () => {
    if (subView) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {renderSubView()}
          </div>
        </div>
      );
    }

    if (activeTab === 'websearch') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--radius-lg)',
            background: 'rgba(142, 61, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Globe size={36} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>Open Any URL</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 400 }}>
              Enter any website URL to open it as a shared web view in the room
            </p>
          </div>
          <form onSubmit={handleWebSearch} style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                className="input"
                placeholder="Enter a URL e.g. https://example.com"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                autoFocus
                style={{ flex: 1, fontSize: '0.9rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                <Globe size={16} /> Open
              </button>
            </div>
          </form>
        </div>
      );
    }

    const cards = getFilteredCards();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', overflowX: 'auto' }}>
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.key}
              onClick={() => setActiveFilter(chip.key)}
              style={{
                padding: '4px 14px', borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                border: activeFilter === chip.key ? 'none' : '1px solid var(--border-strong)',
                background: activeFilter === chip.key ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                color: activeFilter === chip.key ? '#fff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)', whiteSpace: 'nowrap',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search apps and media content"
              style={{ paddingLeft: 36, fontSize: '0.85rem' }}
              value={gridSearch}
              onChange={e => setGridSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Card grid */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '0 var(--space-4) var(--space-4)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-3)', alignContent: 'start',
        }}>
          {cards.map(card => (
            <button
              key={card.name}
              onClick={() => handleCardClick(card)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--space-2)', padding: 'var(--space-4)',
                background: 'rgba(26, 22, 42, 0.6)', backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
                cursor: 'pointer', transition: 'all var(--transition-fast)',
                minHeight: 120, color: 'var(--text-primary)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(142, 61, 255, 0.1)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(26, 22, 42, 0.6)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: `${card.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color,
              }}>
                {card.icon}
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 500 }}>{card.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{card.category}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: 880, maxWidth: '95vw', height: 560, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          willChange: 'transform, opacity',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setSubView('screenshare')}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
              title="Screen Share"
            >
              <Monitor size={18} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setSubView('loadurl'); setUrlPlaceholder('Paste a YouTube, Twitch, Vimeo, Dailymotion, or Spotify URL'); }}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
              title="Load URL"
            >
              <Link size={18} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSubView('loadfile')}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
              title="Load File"
            >
              <FolderOpen size={18} />
            </button>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600,
            color: 'var(--text-primary)', margin: 0,
          }}>
            Select Media
          </h2>

          <button onClick={onClose} className="close-icon-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{
            width: 160, minWidth: 160,
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column',
            padding: 'var(--space-3) 0',
          }}>
            {SIDEBAR_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSubView(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: activeTab === tab.key ? 'rgba(142, 61, 255, 0.15)' : 'transparent',
                  borderLeft: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderLeftStyle: 'solid',
                  borderLeftWidth: '2px',
                  borderLeftColor: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                }}
                onMouseOver={e => {
                  if (activeTab !== tab.key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseOut={e => {
                  if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent';
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {renderMainContent()}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="video/*,audio/*,.mp4,.webm,.ogg,.mp3,.wav,.m4a"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileSelect}
          onClick={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export const SelectMediaModal = React.memo(SelectMediaModalInner);
