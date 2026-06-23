import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, ImagePlus, Smile } from 'lucide-react';
import { getChatMessages, sendChatMessage, uploadFile } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { STICKER_PACKS, ALL_STICKER_KEYS, type StickerPackKey } from '../../lib/stickers';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  type: string;
  text?: string;
  src?: string;
  ts: number;
}

interface ChatPanelProps {
  roomId: string;
  socket: any;
}

export const ChatPanel: React.FC<ChatPanelProps> = React.memo(({ roomId, socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [activeStickerPack, setActiveStickerPack] = useState<StickerPackKey>('reactions');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    // Fetch initial chat history
    async function fetchHistory() {
      try {
        const history = await getChatMessages(roomId);
        setMessages(history);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    }
    fetchHistory();
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat_message', handleNewMessage);
    
    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    // Scroll to bottom on new message safely without shifting entire UI
    if (messagesEndRef.current?.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const text = input.trim();
    setInput('');

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Optimistic local append
    setMessages(prev => [...prev, {
      id: msgId,
      userId: user.id,
      userName: user.username,
      type: 'text',
      text,
      ts: Date.now()
    }]);

    // Broadcast via socket
    if (socket) {
      socket.emit('chat', roomId, { type: 'text', text });
    }

    // Persist to API
    try {
      await sendChatMessage(roomId, {
        id: msgId,
        type: 'text',
        content: text
      });
    } catch (err) {
      console.error('Failed to save chat message', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const { url } = await uploadFile(file, 'chat');

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      // Optimistic local append
      setMessages(prev => [...prev, {
        id: msgId,
        userId: user.id,
        userName: user.username,
        type: 'image',
        src: url,
        ts: Date.now()
      }]);

      // Broadcast via socket
      if (socket) {
        socket.emit('chat', roomId, { type: 'image', src: url });
      }

      // Persist to API
      await sendChatMessage(roomId, {
        id: msgId,
        type: 'image',
        src: url
      });
    } catch (err) {
      console.error('Failed to upload chat image', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendSticker = async (emoji: string) => {
    if (!user) return;
    
    setShowStickers(false);

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    setMessages(prev => [...prev, {
      id: msgId,
      userId: user.id,
      userName: user.username,
      type: 'sticker',
      text: emoji,
      ts: Date.now()
    }]);

    if (socket) {
      socket.emit('chat', roomId, { type: 'sticker', text: emoji });
    }

    try {
      await sendChatMessage(roomId, {
        id: msgId,
        type: 'sticker',
        content: emoji
      });
    } catch (err) {
      console.error('Failed to save sticker message', err);
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 'var(--space-8)',
          right: 'var(--space-4)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          cursor: 'pointer',
          border: 'none',
          color: 'var(--text-primary)'
        }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        bottom: 'var(--space-4)',
        right: 'var(--space-4)',
        width: '320px',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: 'var(--space-3)', 
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Room Chat</h3>
        <button 
          className="close-icon-btn" 
          onClick={() => setIsOpen(false)}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {!isMe && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '2px', marginLeft: '4px' }}>{msg.userName}</div>}
              {msg.type === 'sticker' ? (
                <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{msg.text}</div>
              ) : msg.type === 'image' && msg.src ? (
                <div style={{ 
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <img 
                    src={msg.src} 
                    alt="Shared image" 
                    style={{ width: '100%', maxWidth: '240px', display: 'block', cursor: 'pointer' }}
                    onClick={() => window.open(msg.src, '_blank')}
                  />
                </div>
              ) : (
                <div style={{ 
                  padding: 'var(--space-2) var(--space-3)', 
                  background: isMe ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  borderBottomRightRadius: isMe ? '4px' : '16px',
                  borderBottomLeftRadius: !isMe ? '4px' : '16px',
                  fontSize: '0.9rem',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ position: 'relative' }}>
        {showStickers && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: 'var(--space-2)',
            zIndex: 60
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', overflowX: 'auto', paddingBottom: '4px' }}>
              {ALL_STICKER_KEYS.map(key => (
                <button 
                  key={key} 
                  className={`btn ghost ${activeStickerPack === key ? 'active-tab' : ''}`}
                  style={{ padding: '2px 6px', fontSize: '0.7rem', flexShrink: 0 }}
                  onClick={() => setActiveStickerPack(key)}
                  type="button"
                >
                  {STICKER_PACKS[key].label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {STICKER_PACKS[activeStickerPack].stickers.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendSticker(emoji)}
                  style={{
                    background: 'transparent', border: 'none', borderRadius: '4px',
                    fontSize: '1.4rem', padding: '4px', cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSend} style={{ 
          padding: 'var(--space-3)', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center'
        }}>
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
          <button 
            type="button" 
            className="btn" 
            style={{ padding: 'var(--space-2)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', flexShrink: 0 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Send an image"
          >
            <ImagePlus size={18} />
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ padding: 'var(--space-2)', background: 'transparent', border: 'none', color: showStickers ? 'var(--accent-primary)' : 'var(--text-secondary)', flexShrink: 0 }}
            onClick={() => setShowStickers(!showStickers)}
            title="Send a sticker"
          >
            <Smile size={18} />
          </button>
          <input 
            type="text" 
            className="input" 
            placeholder="Say something..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onClick={() => setShowStickers(false)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: 'var(--space-2)' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
});
