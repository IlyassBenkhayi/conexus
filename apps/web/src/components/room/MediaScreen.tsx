import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FolderOpen, Square, Play, Pause, Volume2, VolumeX,
  Maximize2, Monitor, Globe, X
} from 'lucide-react';
import type { RoomObject } from '@conexus/shared-types';
import type SimplePeer from 'simple-peer';
import { Youtube, Twitch, Spotify, Vimeo, Dailymotion, SoundCloud } from './icons';
import { useAuthStore } from '../../store/useAuthStore';

interface MediaScreenProps {
  object: RoomObject;
  roomId: string;
  socket: any;
  onChangeMedia: () => void;
  onStop: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getServiceInfo(type: string): { icon: React.ReactNode; label: string; color: string } {
  switch (type) {
    case 'youtube':     return { icon: <Youtube size={14} />, label: 'YouTube', color: '#ff0000' };
    case 'twitch':      return { icon: <Twitch size={14} />,   label: 'Twitch', color: '#9146ff' };
    case 'vimeo':       return { icon: <Vimeo size={14} />,    label: 'Vimeo', color: '#1ab7ea' };
    case 'dailymotion': return { icon: <Dailymotion size={14} />, label: 'Dailymotion', color: '#0066dc' };
    case 'spotify':     return { icon: <Spotify size={14} />,   label: 'Spotify', color: '#1db954' };
    case 'soundcloud':  return { icon: <SoundCloud size={14} />,  label: 'SoundCloud', color: '#ff5500' };
    case 'local-video':
    case 'localvideo':  return { icon: <Play size={14} />,    label: 'Local File', color: 'var(--text-tertiary)' };
    case 'screenshare': return { icon: <Monitor size={14} />, label: 'Screen Share', color: 'var(--accent-primary)' };
    case 'webview':     return { icon: <Globe size={14} />,   label: 'Web View', color: 'var(--accent-tertiary)' };
    default:            return { icon: <Play size={14} />,    label: 'Media', color: 'var(--text-tertiary)' };
  }
}

function getSourceName(object: RoomObject): string {
  const p = object.payload as Record<string, unknown> || {};
  switch (object.type) {
    case 'youtube':     return `youtube.com/watch?v=${p.videoId}`;
    case 'twitch':      return `twitch.tv/${p.channel}`;
    case 'vimeo':       return `vimeo.com/${p.videoId}`;
    case 'dailymotion': return `dailymotion.com/video/${p.videoId}`;
    case 'spotify':     return String(p.url || 'Spotify');
    case 'soundcloud':  return String(p.url || 'SoundCloud');
    case 'local-video':
    case 'localvideo':  return String(p.fileName || 'Local File');
    case 'screenshare': return 'Screen Share';
    case 'webview':     return String(p.url || 'Web Page');
    default:            return 'Media';
  }
}

const isNativeVideoType = (type: string) => type === 'local-video' || type === 'localvideo' || type === 'screenshare';
const isIframeType = (type: string) => ['youtube', 'twitch', 'vimeo', 'dailymotion', 'spotify', 'soundcloud', 'webview'].includes(type);

// ── Component ────────────────────────────────────────────────────────────────

const MediaScreenInner: React.FC<MediaScreenProps> = ({ object, roomId, socket, onChangeMedia, onStop }) => {
  const payload = (object.payload as Record<string, unknown>) || {};
  const service = getServiceInfo(object.type);
  const sourceName = getSourceName(object);

  const videoRef = useRef<HTMLVideoElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const sharingStartedRef = useRef(false);
  const user = useAuthStore(state => state.user);

  // Stable ref for onStop to prevent useEffect re-triggers
  const onStopRef = useRef(onStop);
  useEffect(() => { onStopRef.current = onStop; }, [onStop]);

  // ── Screen share: initiator logic ────────────────────────────────────────

  const isInitiator = !!(object.type === 'screenshare' && user && payload.initiatorId === user.id);

  const [SimplePeerClass, setSimplePeerClass] = useState<any>(null);

  useEffect(() => {
    if (object.type === 'screenshare' && !SimplePeerClass) {
      import('simple-peer')
        .then((m) => {
          setSimplePeerClass(() => m.default);
        })
        .catch((err) => {
          console.error('Failed to load simple-peer dynamically:', err);
        });
    }
  }, [object.type, SimplePeerClass]);

  useEffect(() => {
    if (object.type !== 'screenshare' || !isInitiator || !socket || !SimplePeerClass) return;
    // Prevent re-triggering getDisplayMedia if already started
    if (sharingStartedRef.current) return;

    let cancelled = false;
    sharingStartedRef.current = true;

    const startCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // When the user stops sharing via the browser UI
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          sharingStartedRef.current = false;
          socket.emit('webrtc_stop', roomId, object.id);
          onStopRef.current();
        });
      } catch (err) {
        // User cancelled or permission denied — do NOT delete the object
        console.warn('Screen share cancelled or failed:', err);
        sharingStartedRef.current = false;
        // Reset video element so user can try again
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    };

    startCapture();

    // Handle viewer connection requests
    const handleRequest = (fromUserId: string, objectId: string) => {
      if (objectId !== object.id || !streamRef.current) return;
      const peer = new SimplePeerClass({ initiator: true, trickle: false, stream: streamRef.current });

      peer.on('signal', (signalData: any) => {
        socket.emit('webrtc_signal', roomId, fromUserId, { signal: signalData });
      });

      peer.on('error', (err: any) => console.error('Peer error (initiator):', err));

      peersRef.current.set(fromUserId, peer);
    };

    const handleSignal = (fromUserId: string, data: { signal: any }) => {
      const peer = peersRef.current.get(fromUserId);
      if (peer) peer.signal(data.signal);
    };

    socket.on('webrtc_request', handleRequest);
    socket.on('webrtc_signal', handleSignal);

    return () => {
      cancelled = true;
      socket.off('webrtc_request', handleRequest);
      socket.off('webrtc_signal', handleSignal);
      streamRef.current?.getTracks().forEach(t => t.stop());
      peersRef.current.forEach(p => p.destroy());
      peersRef.current.clear();
      sharingStartedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.type, object.id, isInitiator, roomId, socket, SimplePeerClass]);

  // ── Screen share: viewer logic ───────────────────────────────────────────

  useEffect(() => {
    if (object.type !== 'screenshare' || isInitiator || !socket || !SimplePeerClass) return;

    const peer = new SimplePeerClass({ initiator: false, trickle: false });

    peer.on('signal', (signalData: any) => {
      socket.emit('webrtc_signal', roomId, String(payload.initiatorId), { signal: signalData });
    });

    peer.on('stream', (stream: any) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    });

    peer.on('error', (err: any) => console.error('Peer error (viewer):', err));

    const handleSignal = (_fromUserId: string, data: { signal: any }) => {
      try { peer.signal(data.signal); } catch {}
    };

    const handleStopped = (objectId: string) => {
      if (objectId === object.id) onStopRef.current();
    };

    socket.on('webrtc_signal', handleSignal);
    socket.on('webrtc_stopped', handleStopped);

    socket.emit('webrtc_request', roomId, object.id);

    return () => {
      socket.off('webrtc_signal', handleSignal);
      socket.off('webrtc_stopped', handleStopped);
      peer.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.type, object.id, isInitiator, roomId, socket, payload.initiatorId, SimplePeerClass]);

  // ── Video progress tracking (local-video) ───────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || (object.type !== 'local-video' && object.type !== 'localvideo')) return;

    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [object.type]);

  // ── Controls ─────────────────────────────────────────────────────────────

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play().catch(() => {}); }
    else { video.pause(); }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
    setProgress(video.currentTime);
  }, []);

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = contentAreaRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  // ── Render media content ─────────────────────────────────────────────────

  const renderMedia = () => {
    const iframeWrap = (children: React.ReactNode) => (
      <div onPointerDown={e => e.stopPropagation()} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    );

    switch (object.type) {
      case 'youtube':
        return iframeWrap(
          <iframe
            key={`iframe-youtube-${object.id}-${payload.videoId}`}
            src={`https://www.youtube.com/embed/${payload.videoId}?autoplay=1&rel=0`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );

      case 'twitch':
        const twitchSrc = payload.videoId
          ? `https://player.twitch.tv/?video=${payload.videoId}&parent=${window.location.hostname}&autoplay=true`
          : `https://player.twitch.tv/?channel=${payload.channel}&parent=${window.location.hostname}&autoplay=true`;
        return iframeWrap(
          <iframe
            key={`iframe-twitch-${object.id}-${payload.channel || payload.videoId}`}
            src={twitchSrc}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
          />
        );

      case 'vimeo':
        return iframeWrap(
          <iframe
            key={`iframe-vimeo-${object.id}-${payload.videoId}`}
            src={`https://player.vimeo.com/video/${payload.videoId}?autoplay=0`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );

      case 'dailymotion':
        return iframeWrap(
          <iframe
            key={`iframe-dailymotion-${object.id}-${payload.videoId}`}
            src={`https://www.dailymotion.com/embed/video/${payload.videoId}`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
          />
        );

      case 'spotify':
        return iframeWrap(
          <iframe
            key={`iframe-spotify-${object.id}-${payload.embedUrl}`}
            src={String(payload.embedUrl)}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        );

      case 'soundcloud':
        return iframeWrap(
          <iframe
            key={`iframe-soundcloud-${object.id}-${payload.url}`}
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(String(payload.url))}&color=%238e3dff&auto_play=false&show_artwork=true`}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        );

      case 'local-video':
      case 'localvideo':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '6px 12px', background: 'rgba(0,0,0,0.6)',
              fontSize: '0.7rem', color: 'var(--text-secondary)', zIndex: 2,
              textAlign: 'center',
            }}>
              Local file — only visible to you
            </div>
            <video
              key={`video-local-${object.id}`}
              ref={videoRef}
              src={String(payload.localUrl)}
              style={{ width: '100%', height: '100%', background: '#000' }}
              playsInline
              controls={false}
              onPointerDown={e => e.stopPropagation()}
            />
          </div>
        );

      case 'screenshare':
        return (
          <video
            key={`video-screenshare-${object.id}`}
            ref={videoRef}
            style={{ width: '100%', height: '100%', background: '#000' }}
            playsInline
            controls={false}
            autoPlay
            muted={isInitiator}
            onPointerDown={e => e.stopPropagation()}
          />
        );

      case 'webview':
        return iframeWrap(
          <iframe
            key={`iframe-webview-${object.id}-${payload.url}`}
            src={String(payload.url)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        );

      default:
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>Unsupported media type</div>;
    }
  };

  // ── Layout ───────────────────────────────────────────────────────────────

  const controlBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
    transition: 'all var(--transition-fast)',
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      borderRadius: 'inherit', overflow: 'hidden', background: '#000',
      willChange: 'transform',
    }}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div style={{
        height: 36, minHeight: 36, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 12px',
        background: 'rgba(10, 8, 20, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'grab',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)', color: 'var(--accent-primary)',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px',
          }}>
            CONEXUS
          </span>
          <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
          <span style={{ color: service.color, display: 'flex', alignItems: 'center' }}>{service.icon}</span>
          <span style={{
            fontSize: '0.75rem', color: 'var(--text-secondary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200,
          }}>
            {sourceName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleFullscreen}
            onPointerDown={e => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onStop(); }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--error)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Media Content ───────────────────────────────────────────── */}
      <div ref={contentAreaRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#000' }}>
        {renderMedia()}
      </div>

      {/* ── Control Bar ─────────────────────────────────────────────── */}
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{
          height: 44, minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
          background: 'rgba(10, 8, 20, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Change button */}
        <button
          style={controlBtnStyle}
          onClick={(e) => { e.stopPropagation(); onChangeMedia(); }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <FolderOpen size={14} /> Change
        </button>

        {/* Stop button */}
        <button
          style={{ ...controlBtnStyle }}
          onClick={(e) => { e.stopPropagation(); onStop(); }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 75, 75, 0.15)'; e.currentTarget.style.color = 'var(--error)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        >
          <Square size={14} />
        </button>

        {/* Play/Pause (only native video types) */}
        {isNativeVideoType(object.type) && (
          <button style={controlBtnStyle} onClick={togglePlay}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}

        {/* Volume (only native video types) */}
        {isNativeVideoType(object.type) && (
          <button style={controlBtnStyle} onClick={toggleMute}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}

        {/* Progress bar (only local-video) */}
        {(object.type === 'local-video' || object.type === 'localvideo') && duration > 0 && (
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            style={{
              flex: 1, height: 4, cursor: 'pointer',
              accentColor: 'var(--accent-primary)',
            }}
          />
        )}

        {/* Spacer for iframe types */}
        {isIframeType(object.type) && (
          <>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{service.label}</span>
            </div>
          </>
        )}

        {/* Spacer for screenshare or local-video without duration */}
        {object.type === 'screenshare' && <div style={{ flex: 1 }} />}
        {(object.type === 'local-video' || object.type === 'localvideo') && duration === 0 && <div style={{ flex: 1 }} />}

        {/* Fullscreen button */}
        <button
          style={controlBtnStyle}
          onClick={handleFullscreen}
          title="Fullscreen"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const MediaScreen = React.memo(MediaScreenInner);
