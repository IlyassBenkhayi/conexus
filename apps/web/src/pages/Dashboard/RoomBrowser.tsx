import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom, updateRoom, updateProfile, uploadFile, deleteAccount, clearToken, deleteRoom, getRoomObjects, upsertRoomObject } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, Camera, Upload, Trash2, ShieldAlert, Star, Copy } from 'lucide-react';
import type { RoomState } from '@conexus/shared-types';
import './RoomBrowser.css';

export default function RoomBrowser() {
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Room Form
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createLocked, setCreateLocked] = useState(false);
  const [createTemplate, setCreateTemplate] = useState('blank');
  const [creating, setCreating] = useState(false);

  // Profile Form state
  const [profileUsername, setProfileUsername] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePronouns, setProfilePronouns] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileBannerUrl, setProfileBannerUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete Account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const setSession = useAuthStore(state => state.setSession);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    if (user) {
      setProfileUsername(user.username || '');
      setProfileBio(user.bio || '');
      setProfilePronouns(user.pronouns || '');
      setProfileAvatarUrl(user.avatar_url || '');
      setProfileBannerUrl(user.banner_url || '');
      
      const storedFavorites = localStorage.getItem(`conexus-favorites-${user.id}`);
      if (storedFavorites) {
        try { setFavorites(JSON.parse(storedFavorites)); } catch (e) {}
      }
    }
  }, [user]);

  const toggleFavorite = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const newFavorites = favorites.includes(roomId) 
      ? favorites.filter(id => id !== roomId)
      : [...favorites, roomId];
    setFavorites(newFavorites);
    localStorage.setItem(`conexus-favorites-${user.id}`, JSON.stringify(newFavorites));
  };

  const handleDuplicateRoom = async (room: RoomState, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const newSlug = `${room.slug}-copy-${Math.random().toString(36).substr(2, 4)}`;
      const newRoom = await createRoom({ name: `${room.name} (Copy)`, slug: newSlug });
      
      // Copy background, settings, and permissions
      await updateRoom(newRoom.id, {
        background: room.background,
        settings: room.settings,
        permissions: room.permissions
      });

      const objects = await getRoomObjects(room.id);
      for (const obj of objects) {
        const newObjId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await upsertRoomObject(newRoom.id, newObjId, { ...obj, id: newObjId });
      }
      
      fetchRooms();
    } catch (err) {
      console.error('Failed to duplicate room', err);
      alert('Failed to duplicate room');
    }
  };

  const handleDeleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this room and its contents?')) return;
    try {
      await deleteRoom(roomId);
      fetchRooms();
    } catch (err) {
      console.error('Failed to delete room', err);
      alert('Failed to delete room');
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await getRooms();
      const mapped: RoomState[] = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        ownerId: r.owner_id,
        background: r.background,
        permissions: r.permissions,
        settings: r.settings,
      }));
      setRooms(mapped);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
    setLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    setCreating(true);

    const slug = createSlug.trim() || `room-${Math.random().toString(36).substr(2, 6)}`;
    const name = createName.trim() || `${user.username}'s Room`;

    try {
      const data = await createRoom({ name, slug });
      setIsCreateModalOpen(false);
      navigate(`/room/${data.slug}`);
    } catch (err: any) {
      console.error('Failed to create room', err);
      alert(err.message || 'Failed to create room');
    }
    setCreating(false);
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('conexus-user-id');
    setUser(null);
    setSession(null);
    navigate('/login');
  };

  const handleFinalDelete = async () => {
    if (!user?.id) return;
    setDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount(deletePassword);
      handleLogout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const openCreateModal = (template: string) => {
    setCreateTemplate(template);
    setCreateName('');
    setCreateSlug('');
    setIsCreateModalOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const { url } = await uploadFile(file, type);
      if (type === 'avatar') setProfileAvatarUrl(url);
      else setProfileBannerUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    try {
      const updated = await updateProfile(user.id, {
        username: profileUsername,
        bio: profileBio,
        pronouns: profilePronouns,
        avatar_url: profileAvatarUrl,
        banner_url: profileBannerUrl,
      });
      setUser(updated);
      setIsProfileModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    }
    setSavingProfile(false);
  };

  return (
    <div className="page-shell index-shell here-bg">
      <header className="index-topbar">
        <div className="index-topbar-left">
          <div className="app-logo" aria-label="Conexus logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Conexus" style={{ height: '32px' }} />
          </div>
          <nav className="index-tabs" aria-label="Room categories">
            <button className="index-tab active" type="button">Your Rooms</button>
            <button className="index-tab" type="button">Public Rooms <span className="badge">COMING SOON</span></button>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn ghost" style={{ padding: '8px', color: 'var(--text-secondary)' }} onClick={handleLogout} title="Logout">
            Logout
          </button>
          <button onClick={() => setIsProfileModalOpen(true)} className="btn index-avatar-btn" type="button" title="Profile">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" />
            ) : (
              user?.username?.charAt(0) || 'U'
            )}
          </button>
        </div>
      </header>

      <main className="index-main">
        <section className="launcher-panel" aria-label="Room launch options">
          <button className="launch-card" type="button" onClick={() => document.getElementById('roomGrid')?.scrollIntoView({ behavior: 'smooth' })}>
            <strong>Select a room</strong>
            <span className="subtle">Browse and join from your saved rooms.</span>
          </button>
          <button className="launch-card" type="button" onClick={() => openCreateModal('blank')}>
            <strong>Start with a blank room</strong>
            <span className="subtle">Create a new empty room from scratch.</span>
          </button>
          <button className="launch-card" type="button" onClick={() => openCreateModal('surprise')}>
            <strong>Algorithm Surprise</strong>
            <span className="subtle">Generate a random room setup.</span>
          </button>
        </section>

        <section id="roomGrid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Your Saved Rooms</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search rooms..."
                className="input"
                style={{ width: '240px', padding: '8px 12px', fontSize: '0.9rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
            </div>
          ) : rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="launch-card" style={{ textAlign: 'center', padding: 'var(--space-12)', alignItems: 'center', cursor: 'default' }}>
              <p className="subtle" style={{ marginBottom: 'var(--space-4)' }}>{searchQuery ? 'No rooms match your search.' : 'No rooms found. Be the first to create one!'}</p>
              {!searchQuery && (
                <button onClick={() => openCreateModal('blank')} className="btn btn-primary">
                  Create your first room
                </button>
              )}
            </div>
          ) : (
            <div className="room-grid">
              {rooms
                .filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => {
                  const aFav = favorites.includes(a.id);
                  const bFav = favorites.includes(b.id);
                  if (aFav && !bFav) return -1;
                  if (!aFav && bFav) return 1;
                  return 0;
                })
                .map(room => (
                  <div
                    key={room.id}
                    className="room-card"
                    onClick={() => navigate(`/room/${room.slug}`)}
                  >
                    <div className="room-card-preview"></div>
                    <div className="room-card-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="room-card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.name}</div>
                        <div className="subtle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>/{room.slug}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'var(--space-2)' }}>
                        <button 
                          className="btn ghost" 
                          style={{ padding: '4px', color: favorites.includes(room.id) ? '#ffd700' : 'var(--text-tertiary)' }} 
                          onClick={(e) => toggleFavorite(room.id, e)}
                          title="Favorite"
                        >
                          <Star size={16} fill={favorites.includes(room.id) ? "currentColor" : "none"} />
                        </button>
                        <button 
                          className="btn ghost" 
                          style={{ padding: '4px', color: 'var(--text-secondary)' }} 
                          onClick={(e) => handleDuplicateRoom(room, e)}
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          className="btn ghost" 
                          style={{ padding: '4px', color: 'var(--error)' }} 
                          onClick={(e) => handleDeleteRoom(room.id, e)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">Create Your Room</h2>
              <button className="close-btn" type="button" aria-label="Close" onClick={() => setIsCreateModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              <label className="single-col">
                <span>Room Name</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Your room name"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                />
              </label>

              <label>
                <span>Custom Room Link</span>
                <input
                  className="input"
                  type="text"
                  placeholder="optional-custom-link"
                  value={createSlug}
                  onChange={e => setCreateSlug(e.target.value)}
                />
              </label>

              <div>
                <span>Lock Room</span>
                <div className="toggle-row" style={{ marginTop: '4px' }}>
                  <button
                    className={`switch ${createLocked ? 'is-on' : ''}`}
                    type="button"
                    aria-label="Lock room"
                    onClick={() => setCreateLocked(!createLocked)}
                  ></button>
                  <span className="subtle" style={{ fontSize: '0.75rem' }}>Only invited guests can join.</span>
                </div>
              </div>

              <label className="single-col">
                <span>Template</span>
                <select
                  className="select"
                  value={createTemplate}
                  onChange={e => setCreateTemplate(e.target.value)}
                >
                  <option value="blank">Blank</option>
                  <option value="kawaii">Kawaii</option>
                  <option value="workspace">Workspace</option>
                  <option value="city">City Lights</option>
                  <option value="surprise">Surprise</option>
                </select>
              </label>
            </div>

            <div className="join-actions">
              <button className="btn ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
              <button className="btn primary btn-primary" type="button" onClick={handleCreateRoom} disabled={creating}>
                {creating ? <Loader2 className="animate-spin" size={16} /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-banner-edit">
              {profileBannerUrl ? (
                <img src={profileBannerUrl} alt="Banner" className="banner-img" />
              ) : (
                <div className="banner-placeholder"></div>
              )}
              <label className="banner-upload-btn">
                <Camera size={18} />
                <span>Change Banner</span>
                <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
              </label>
            </div>

            <div className="modal-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div className="profile-avatar-edit">
                <div className="avatar-wrapper">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">{profileUsername?.charAt(0) || 'U'}</div>
                  )}
                  <label className="avatar-upload-overlay">
                    <Upload size={16} />
                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                  </label>
                </div>
              </div>
              <button className="close-btn" type="button" aria-label="Close" onClick={() => setIsProfileModalOpen(false)}>×</button>
            </div>

            <div className="form-grid" style={{ paddingTop: 'var(--space-2)' }}>
              <label className="single-col">
                <span>Display Name</span>
                <input
                  className="input"
                  type="text"
                  value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value)}
                />
              </label>
              <label className="single-col">
                <span>Pronouns</span>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. they/them"
                  value={profilePronouns}
                  onChange={e => setProfilePronouns(e.target.value)}
                />
              </label>
              <label className="single-col">
                <span>Bio</span>
                <textarea
                  className="textarea"
                  placeholder="Tell us about yourself..."
                  value={profileBio}
                  onChange={e => setProfileBio(e.target.value)}
                ></textarea>
              </label>
            </div>
            <div className="join-actions">
              <button className="btn ghost" type="button" onClick={() => setIsProfileModalOpen(false)}>Cancel</button>
              <button className="btn primary btn-primary" type="button" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="animate-spin" size={16} /> : 'Save Profile'}
              </button>
            </div>

            <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
              <h3 style={{ color: 'var(--error)', fontSize: '1rem', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} /> Danger Zone
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                className="btn"
                style={{ background: 'rgba(255, 75, 75, 0.1)', color: 'var(--error)', border: '1px solid rgba(255, 75, 75, 0.2)', width: '100%' }}
                onClick={() => { setIsProfileModalOpen(false); setIsDeleteModalOpen(true); }}
              >
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2 style={{ color: 'var(--error)' }}>Delete Account</h2>
              <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>×</button>
            </div>

            <div style={{ padding: 'var(--space-4)' }}>
              {deleteError && (
                <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>
                  <ShieldAlert size={18} />
                  <span>{deleteError}</span>
                </div>
              )}

              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                Enter your password to permanently delete your account. This cannot be undone.
              </p>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                />
              </div>
              <div className="join-actions">
                <button className="btn ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={handleFinalDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="animate-spin" size={16} /> : 'Permanently Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
