import React, { useState } from 'react';
import { Settings, X, Shield, Bell, Users, Globe, Lock, Palette, Upload, Loader2, Trash2, Gamepad2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateRoom, deleteRoom, uploadFile } from '../../lib/api';
import { useRoomStore } from '../../store/useRoomStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useShallow } from 'zustand/react/shallow';
import type { RoomBackground } from '@conexus/shared-types';

interface MemberItemProps {
  id: string;
  ownerId?: string;
}

const MemberItem: React.FC<MemberItemProps> = React.memo(({ id, ownerId }) => {
  const name = useRoomStore(s => s.remoteUsers[id]?.name || '');
  return (
    <div className="member-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
        {name.charAt(0).toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{name} {ownerId === id ? '(Owner)' : ''}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Online</div>
      </div>
    </div>
  );
});

interface MembersTabProps {
  room: any;
  user: any;
}

const MembersTab: React.FC<MembersTabProps> = React.memo(({ room, user }) => {
  const remoteUserIds = useRoomStore(useShallow(s => Object.keys(s.remoteUsers)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
        Active Participants ({1 + remoteUserIds.length})
      </div>
      {/* Current user (always shown) */}
      <div className="member-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.username || 'You'} {room?.ownerId === user?.id ? '(Owner)' : ''}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Online — You</div>
        </div>
      </div>
      {/* Remote users */}
      {remoteUserIds.map(id => (
        <MemberItem key={id} id={id} ownerId={room?.ownerId} />
      ))}
      {remoteUserIds.length === 0 && (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          No other users in the room.
        </div>
      )}
    </div>
  );
});

interface RoomSettingsProps {
  roomDatabaseId: string;
}

const CameraSeparateToggleInner: React.FC = () => {
  const separateCameraElement = useUIStore(s => s.separateCameraElement);
  const setSeparateCameraElement = useUIStore(s => s.setSeparateCameraElement);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Camera size={14} />
        <div>
          <div style={{ fontWeight: 500 }}>Display Camera as Separate Room Element</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>When disabled, your camera feed appears inside your avatar</div>
        </div>
      </div>
      <button
        type="button"
        className={`switch ${separateCameraElement ? 'is-on' : ''}`}
        onClick={() => setSeparateCameraElement(!separateCameraElement)}
      ></button>
    </div>
  );
};

export const RoomSettings: React.FC<RoomSettingsProps> = ({ roomDatabaseId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'permissions' | 'notifications' | 'members' | 'controls' | 'advanced'>('appearance');
  const room = useRoomStore(s => s.room);
  const setRoom = useRoomStore(s => s.setRoom);
  const movementType = useRoomStore(s => s.movementType);
  const setMovementType = useRoomStore(s => s.setMovementType);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [deletingRoom, setDeletingRoom] = useState(false);
  
  // Local state for settings form
  const [backgroundType, setBackgroundType] = useState(room?.background?.type || 'pattern');
  const [backgroundColor, setBackgroundColor] = useState(room?.background?.color || '#5a1adb');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(room?.background?.imageUrl || '');
  const [uploadingBg, setUploadingBg] = useState(false);
  
  const [isPublic, setIsPublic] = useState(room?.permissions?.public || false);
  const [canCamera, setCanCamera] = useState(room?.permissions?.camera ?? true);
  const [canMic, setCanMic] = useState(room?.permissions?.mic ?? true);
  const [canAddContent, setCanAddContent] = useState(room?.permissions?.addContent ?? true);
  
  const [notifyJoins, setNotifyJoins] = useState(room?.settings?.notifications?.joins ?? true);
  const [notifyChat, setNotifyChat] = useState(room?.settings?.chatNotifications ?? true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    const newBackground = {
      ...room.background,
      type: backgroundType,
      color: backgroundColor,
      imageUrl: backgroundImageUrl
    };

    const newPermissions = {
      ...room.permissions,
      public: isPublic,
      camera: canCamera,
      mic: canMic,
      addContent: canAddContent
    };

    const newSettings = {
      ...room.settings,
      chatNotifications: notifyChat,
      notifications: {
        ...room.settings?.notifications,
        joins: notifyJoins
      }
    };

    const updatedRoom = { 
      ...room, 
      background: newBackground,
      permissions: newPermissions,
      settings: newSettings
    };

    // Optimistic UI update
    setRoom(updatedRoom);
    setIsOpen(false);

    // Save to API
    try {
      await updateRoom(roomDatabaseId, { 
        background: newBackground,
        permissions: newPermissions,
        settings: newSettings
      });
    } catch (err) {
      console.error('Failed to update room settings', err);
    }
  };

  return (
    <>
      <button 
        className="glass-panel"
        style={{
          position: 'absolute',
          top: 'var(--space-4)',
          right: 'var(--space-4)',
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)'
        }}
        onClick={() => setIsOpen(true)}
        title="Room Settings"
      >
        <Settings size={18} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '850px', height: '600px', padding: 0, display: 'flex', overflow: 'hidden' }}>
            
            {/* Sidebar */}
            <div style={{ width: '240px', background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--border-subtle)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-4)', padding: '0 var(--space-2)' }}>Room Settings</h2>
              
              <button 
                type="button"
                className="btn ghost" 
                onClick={() => setActiveTab('appearance')}
                style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: activeTab === 'appearance' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'appearance' ? 'white' : 'var(--text-secondary)' }}
              >
                <Palette size={16} /> Background
              </button>
              
              <button 
                type="button"
                className="btn ghost" 
                onClick={() => setActiveTab('members')}
                style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: activeTab === 'members' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'members' ? 'white' : 'var(--text-secondary)' }}
              >
                <Users size={16} /> Members
              </button>

              <button 
                type="button"
                className="btn ghost" 
                onClick={() => setActiveTab('notifications')}
                style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: activeTab === 'notifications' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'notifications' ? 'white' : 'var(--text-secondary)' }}
              >
                <Bell size={16} /> Notifications
              </button>

              <button 
                type="button"
                className="btn ghost" 
                onClick={() => setActiveTab('permissions')}
                style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: activeTab === 'permissions' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'permissions' ? 'white' : 'var(--text-secondary)' }}
              >
                <Shield size={16} /> Permissions
              </button>

              <button 
                type="button"
                className="btn ghost" 
                onClick={() => setActiveTab('controls')}
                style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: activeTab === 'controls' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'controls' ? 'white' : 'var(--text-secondary)' }}
              >
                <Gamepad2 size={16} /> Controls
              </button>

              {room?.ownerId === user?.id && (
                <button 
                  type="button"
                  className="btn ghost" 
                  onClick={() => setActiveTab('advanced')}
                  style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: activeTab === 'advanced' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'advanced' ? 'white' : 'var(--text-secondary)' }}
                >
                  <Trash2 size={16} /> Advanced
                </button>
              )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto', position: 'relative' }}>
              <button className="close-icon-btn" style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)' }} onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
                {activeTab === 'appearance' ? 'Background' : activeTab === 'members' ? 'Members' : activeTab === 'notifications' ? 'Notifications' : activeTab === 'permissions' ? 'Permissions' : activeTab === 'advanced' ? 'Advanced' : 'Controls'}
              </h2>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {activeTab === 'appearance' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Background Type</label>
                    <select 
                      className="select" 
                      value={backgroundType} 
                      onChange={(e) => setBackgroundType(e.target.value as RoomBackground['type'])}
                      style={{ width: '100%' }}
                    >
                      <option value="pattern">Pattern Grid</option>
                      <option value="solid">Solid Color</option>
                      <option value="image">Custom Image</option>
                      <option value="none">Dark Space</option>
                    </select>
                  </div>

                  {(backgroundType === 'pattern' || backgroundType === 'solid') && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Theme Color</label>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input 
                          type="color" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="input" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  )}

                  {backgroundType === 'image' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Background Image</label>
                      {backgroundImageUrl && (
                        <div style={{
                          width: '100%', height: '120px', borderRadius: 'var(--radius-md)',
                          overflow: 'hidden', marginBottom: 'var(--space-2)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <img src={backgroundImageUrl} alt="Background preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'rgba(0, 0, 0, 0.2)', border: '1px dashed var(--border-strong)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        color: 'var(--text-secondary)', fontSize: '0.9rem',
                        transition: 'border-color 0.2s'
                      }}>
                        {uploadingBg ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        <span>{uploadingBg ? 'Uploading...' : 'Choose an image'}</span>
                        <input 
                          type="file" 
                          hidden 
                          accept="image/*" 
                          disabled={uploadingBg}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingBg(true);
                            try {
                              const { url } = await uploadFile(file, 'background');
                              setBackgroundImageUrl(url);
                            } catch (err) {
                              console.error('Background upload error:', err);
                              alert('Failed to upload background image');
                            } finally {
                              setUploadingBg(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'permissions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                        Public Room
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Anyone with the link can join</div>
                    </div>
                    <button 
                      type="button"
                      className={`switch ${isPublic ? 'is-on' : ''}`}
                      onClick={() => setIsPublic(!isPublic)}
                    ></button>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Guest Cameras</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow guests to use video</div>
                    </div>
                    <button 
                      type="button"
                      className={`switch ${canCamera ? 'is-on' : ''}`}
                      onClick={() => setCanCamera(!canCamera)}
                    ></button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Guest Microphones</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow guests to use audio</div>
                    </div>
                    <button 
                      type="button"
                      className={`switch ${canMic ? 'is-on' : ''}`}
                      onClick={() => setCanMic(!canMic)}
                    ></button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Add Content</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow guests to add objects</div>
                    </div>
                    <button 
                      type="button"
                      className={`switch ${canAddContent ? 'is-on' : ''}`}
                      onClick={() => setCanAddContent(!canAddContent)}
                    ></button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Join Alerts</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Notify when someone enters</div>
                    </div>
                    <button 
                      type="button"
                      className={`switch ${notifyJoins ? 'is-on' : ''}`}
                      onClick={() => setNotifyJoins(!notifyJoins)}
                    ></button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Chat Sound</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Play sound for new messages</div>
                    </div>
                    <button 
                      type="button"
                      className={`switch ${notifyChat ? 'is-on' : ''}`}
                      onClick={() => setNotifyChat(!notifyChat)}
                    ></button>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <MembersTab room={room} user={user} />
              )}

              {activeTab === 'controls' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Movement Mode</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 'var(--space-3)', 
                          padding: 'var(--space-4)', background: 'rgba(255,255,255,0.05)', 
                          borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          border: movementType === 'wasd' ? '1px solid var(--accent-primary)' : '1px solid transparent'
                        }}
                      >
                        <input 
                          type="radio" 
                          name="movementType" 
                          checked={movementType === 'wasd'} 
                          onChange={() => setMovementType('wasd')}
                        />
                        <div>
                          <div style={{ fontWeight: 500 }}>WASD Keys</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Move your avatar using W, A, S, and D keys</div>
                        </div>
                      </label>
                      <label 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 'var(--space-3)', 
                          padding: 'var(--space-4)', background: 'rgba(255,255,255,0.05)', 
                          borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          border: movementType === 'drag' ? '1px solid var(--accent-primary)' : '1px solid transparent'
                        }}
                      >
                        <input 
                          type="radio" 
                          name="movementType" 
                          checked={movementType === 'drag'} 
                          onChange={() => setMovementType('drag')}
                        />
                        <div>
                          <div style={{ fontWeight: 500 }}>Mouse Dragging</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click and drag your avatar to move it around</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

                  <CameraSeparateToggleInner />
                </div>
              )}


              {activeTab === 'advanced' && room?.ownerId === user?.id && (
                <div style={{ padding: 'var(--space-4) 0' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 500, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={14} /> Danger Zone
                  </div>
                  <button
                    type="button"
                    className="btn"
                    disabled={deletingRoom}
                    style={{ background: 'rgba(255, 75, 75, 0.1)', color: 'var(--error)', border: '1px solid rgba(255, 75, 75, 0.2)', width: '100%', fontSize: '0.85rem' }}
                    onClick={async () => {
                      if (!confirm('Are you sure you want to permanently delete this room? This cannot be undone.')) return;
                      setDeletingRoom(true);
                      try {
                        await deleteRoom(roomDatabaseId);
                        useRoomStore.getState().resetRoom();
                        navigate('/');
                      } catch (err) {
                        console.error('Failed to delete room:', err);
                        alert('Failed to delete room');
                        setDeletingRoom(false);
                      }
                    }}
                  >
                    {deletingRoom ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete Room Permanently
                  </button>
                </div>
              )}

              {activeTab !== 'advanced' && (
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                  Save Changes
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
      )}
    </>
  );
};
