/* =========================================================
   PROFILE MODAL — PERSONAL IDENTITY & USER INFORMATION ONLY
   Specification: Sections 3, 4, 30
   Strictly personal info. NO authentication or security settings.
   Supports avatar upload, preview, replace, and removal.
   ========================================================= */

import React, { useState, useRef, useEffect } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { usePermissions } from '../../context/FamilyContext';
import { ROLE_DISPLAY_NAMES, normalizeRole } from '../../utils/permissions';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Home,
  Camera,
  Trash2,
  Edit2,
  Check,
  Upload,
  Info,
  ChevronDown,
} from 'lucide-react';

// Helper: convert display string like "24 February 2007" → "2007-02-24" for <input type="date">
function toISODate(display: string): string {
  if (!display) return '';
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
  const parsed = new Date(display);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
}

// Helper: convert ISO "2007-02-24" → "24 February 2007" for display
function toDisplayDate(iso: string): string {
  if (!iso) return '';
  const parsed = new Date(iso + 'T00:00:00');
  if (isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentMember, family, members, updateUserProfile } = useFamilyFinance();
  const { isFamilyHead } = usePermissions();

  // Family Head can switch which member they are editing
  const [selectedMemberId, setSelectedMemberId] = useState(currentMember.id);
  const activeMember = (members ?? []).find(m => m.id === selectedMemberId) || currentMember;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(activeMember.user.name || '');
  const [email, setEmail] = useState(activeMember.user.email || '');
  const [phone, setPhone] = useState(activeMember.user.phone || '+91 98765 43210');
  // Store DOB as ISO string internally for the date input
  const [dobIso, setDobIso] = useState(toISODate(activeMember.user.date_of_birth || ''));
  const [gender, setGender] = useState(activeMember.user.gender || 'Male');
  const [location, setLocation] = useState(activeMember.user.location || 'Madurai, Tamil Nadu');
  const [bio, setBio] = useState(activeMember.user.bio || 'Family member profile');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    activeMember.user.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  );
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever activeMember changes or modal opens/member switches
  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(currentMember.id);
    }
  }, [isOpen]);

  useEffect(() => {
    setName(activeMember.user.name || '');
    setEmail(activeMember.user.email || '');
    setPhone(activeMember.user.phone || '+91 98765 43210');
    setDobIso(toISODate(activeMember.user.date_of_birth || ''));
    setGender(activeMember.user.gender || 'Male');
    setLocation(activeMember.user.location || 'Madurai, Tamil Nadu');
    setBio(activeMember.user.bio || 'Family member profile');
    setAvatarUrl(activeMember.user.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80');
    setPreviewAvatar(null);
    setIsEditing(false);
  }, [selectedMemberId, isOpen]);

  if (!isOpen) return null;

  const roleName = ROLE_DISPLAY_NAMES[normalizeRole(currentMember.role)] || currentMember.role.replace(/_/g, ' ');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        const result = evt.target?.result as string;
        if (result) {
          setPreviewAvatar(result);
          setAvatarUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
    setAvatarUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name, email, avatarUrl, {
      phone,
      date_of_birth: toDisplayDate(dobIso) || dobIso,
      gender,
      location,
      bio,
    });
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '95%',
          borderRadius: '24px',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--border-card)',
          background: 'var(--card-bg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(34, 160, 91, 0.12)',
                color: 'var(--mint-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Personal Profile
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {isFamilyHead ? 'Manage any family member\'s profile' : 'Personal member identity & household details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              width: 38,
              height: 38,
              minWidth: 38,
              minHeight: 38,
              borderRadius: '50%',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid var(--border-card)',
              background: 'var(--card-bg-subtle)',
              color: 'var(--text-main)',
              transition: 'all 0.18s ease',
            }}
            title="Close"
          >
            <X size={19} />
          </button>
        </div>

        {saveSuccess && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(34, 160, 91, 0.12)',
              border: '1px solid rgba(34, 160, 91, 0.25)',
              color: 'var(--mint-primary)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <Check size={16} /> Profile updated successfully!
          </div>
        )}

        {/* Family Head: Member Switcher */}
        {isFamilyHead && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" style={{ fontSize: '0.72rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={13} color="var(--mint-primary)" />
              Editing Member (Family Head)
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="select"
                value={selectedMemberId}
                onChange={e => { setSelectedMemberId(e.target.value); }}
                style={{ paddingRight: '2.2rem', fontWeight: 600, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {(members ?? []).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.user.name} {m.id === currentMember.id ? '(You)' : `— ${ROLE_DISPLAY_NAMES[normalizeRole(m.role)] || m.role}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
        )}

        {/* Profile Avatar Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.25rem',
            borderRadius: '18px',
            background: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
            <img
              src={previewAvatar || avatarUrl}
              alt={name}
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #FFFFFF',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              }}
            />

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new image"
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                background: 'var(--mint-primary)',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Avatar Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', gap: '0.35rem' }}
            >
              <Upload size={12} /> Replace
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRemoveAvatar}
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', gap: '0.35rem', color: '#EB5757' }}
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>

          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {name || currentMember.user.name}
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {email || currentMember.user.email}
          </span>

          <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: isFamilyHead ? 'rgba(34, 160, 91, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                color: isFamilyHead ? '#16A34A' : '#D97706',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {roleName}
            </span>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(62, 139, 245, 0.12)',
                color: '#2563EB',
              }}
            >
              {family.name}
            </span>
          </div>
        </div>

        {/* Profile Content / Editing Form */}
        {!isEditing ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Email Address
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email || currentMember.user.email}
                </div>
              </div>

              <div style={{ background: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Phone Number
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {phone}
                </div>
              </div>

              <div style={{ background: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Date of Birth
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {dobIso ? toDisplayDate(dobIso) : '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Gender
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {gender}
                </div>
              </div>

              <div style={{ background: 'var(--bg-canvas)', padding: '0.75rem', borderRadius: '14px', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Location
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {location}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-canvas)', padding: '0.75rem 0.85rem', borderRadius: '14px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                About / Personal Description
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                {bio}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem', padding: '0 0.25rem' }}>
              <span>Account Created: <strong>24 February 2026</strong></span>
              <span>Status: <strong style={{ color: '#16A34A' }}>Active Member</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
                style={{ flex: 1, justifyContent: 'center', fontWeight: 700, gap: '0.5rem' }}
              >
                <Edit2 size={15} /> Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label className="label" style={{ fontSize: '0.72rem' }}>Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vignesh"
                  required
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.72rem' }}>Email Address</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. vignesh@family.demo"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label className="label" style={{ fontSize: '0.72rem' }}>Phone Number</label>
                <input
                  type="text"
                  className="input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} color="var(--mint-primary)" /> Date of Birth
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={dateInputRef}
                    type="date"
                    className="input hide-native-date-picker"
                    value={dobIso}
                    onChange={e => setDobIso(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ paddingRight: '2.6rem', cursor: 'pointer' }}
                    required
                  />
                  <button
                    type="button"
                    title="Open calendar"
                    onClick={() => dateInputRef.current?.showPicker?.()}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      background: 'var(--mint-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label className="label" style={{ fontSize: '0.72rem' }}>Gender</label>
                <select
                  className="select"
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.72rem' }}>Location</label>
                <input
                  type="text"
                  className="input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Madurai, Tamil Nadu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ fontSize: '0.72rem' }}>Short Personal Description</label>
              <textarea
                className="input"
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={2}
                placeholder="Family member profile..."
              />
            </div>

            {/* Read-Only Role Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-canvas)',
                padding: '0.5rem 0.65rem',
                borderRadius: '10px',
              }}
            >
              <Info size={14} color="var(--mint-primary)" />
              <span>Role (<strong>{roleName}</strong>) & permissions can only be modified by the Family Head.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
