/* =========================================================
   MEMBERS & ROLES MANAGEMENT
   Sections 6, 16, 17, 18, 19, 31
   ========================================================= */

import React, { useState, useMemo } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { usePermissions } from '../../context/FamilyContext';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { ROLE_DISPLAY_NAMES, normalizeRole } from '../../utils/permissions';
import { SystemRoleType, FamilyMember } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldPlus,
  AlertTriangle,
  X,
  Phone,
  Calendar,
  MapPin,
} from 'lucide-react';
import { InvitationModal } from '../../components/modals/InvitationModal';
import { CreateRoleModal } from '../../components/modals/CreateRoleModal';
import { AccessRestricted } from '../../components/auth/AccessRestricted';

interface MembersPageProps {
  onNavigatePermissions?: () => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({ onNavigatePermissions }) => {
  const {
    members,
    currentMember,
    roles,
    transactions,
    updateMemberRole,
    updateMemberLimit,
    updateMemberSharing,
    removeMember,
    invitations,
    revokeInvitation,
  } = useFamilyFinance();

  const { can, isFamilyHead } = usePermissions();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editingLimitMemberId, setEditingLimitMemberId] = useState<string | null>(null);
  const [limitRupeesInput, setLimitRupeesInput] = useState('');

  // Remove Member Confirmation Dialog State (Section 31)
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);

  // View Member Profile Modal State
  const [memberToView, setMemberToView] = useState<FamilyMember | null>(null);

  if (!can('viewMembers')) {
    return <AccessRestricted message="You don't have permission to view family members." />;
  }

  const isHead = isFamilyHead;
  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');

  const handleSaveLimit = (memberId: string) => {
    const paise = rupeesToPaise(limitRupeesInput);
    updateMemberLimit(memberId, paise);
    setEditingLimitMemberId(null);
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;
    removeMember(memberToRemove.id);
    setMemberToRemove(null);
  };

  return (
    <div className="content-page" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Family Members & Roles
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Manage family member access, financial sharing settings, and customized roles
          </p>
        </div>

        {isHead && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCreateRoleModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ShieldPlus size={15} color="var(--primary)" />
              <span>Create Role</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => setInviteModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <UserPlus size={15} />
              <span>Invite Family Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Pending Invitations Section */}
      {isHead && pendingInvitations.length > 0 && (
        <div
          className="neo-card"
          style={{
            marginBottom: '1.5rem',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            background: 'rgba(5, 150, 105, 0.05)',
            padding: '1.15rem',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#059669',
              marginBottom: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Users size={18} /> Active Pending Invitations ({pendingInvitations.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingInvitations.map(inv => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-canvas, #FFF)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>Code: {inv.invite_code}</span> • Role:{' '}
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {ROLE_DISPLAY_NAMES[normalizeRole(inv.invited_role)] || inv.invited_role}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Link: {inv.invite_link}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => revokeInvitation(inv.id)}
                  style={{ color: '#EF4444', borderColor: '#EF4444', fontSize: '0.72rem' }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Grid (Section 16) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {members.map(m => {
          const isMe = m.id === currentMember.id;
          const isThisHead = normalizeRole(m.role) === 'family_head';
          const isEditingLimit = editingLimitMemberId === m.id;

          // Member monthly stats
          const memberTxs = transactions.filter(t => t.user_id === m.user_id);
          const memberIncome = memberTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const memberExpense = memberTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

          return (
            <div
              key={m.id}
              className="neo-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: isThisHead ? '4px solid #059669' : undefined,
              }}
            >
              <div>
                {/* Member Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={m.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=member'}
                      alt={m.user.name}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {m.user.name}
                        </span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#6366F1',
                            }}
                          >
                            YOU
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(5, 150, 105, 0.12)',
                            color: '#059669',
                          }}
                        >
                          ACTIVE
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                        <Mail size={12} /> {m.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Role Badge / Switcher */}
                  <div>
                    {isHead && !isThisHead ? (
                      <select
                        className="select"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', fontWeight: 600 }}
                        value={m.role}
                        onChange={e => updateMemberRole(m.id, e.target.value as SystemRoleType)}
                      >
                        <option value="spouse">Spouse</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="grandparent">Grand Parent</option>
                        <option value="viewer">Viewer</option>
                        {roles.filter(r => r.is_custom).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} (Custom)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: isThisHead ? 'rgba(5, 150, 105, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                          color: isThisHead ? '#059669' : '#6366F1',
                          textTransform: 'uppercase',
                        }}
                      >
                        {ROLE_DISPLAY_NAMES[normalizeRole(m.role)] || m.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Monthly Financial Stats (Income & Expense) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.65rem',
                    background: 'var(--bg-canvas, rgba(0,0,0,0.02))',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Monthly Income
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.98rem', color: '#059669', marginTop: '0.15rem' }}>
                      {formatPaise(memberIncome)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Monthly Expenses
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.98rem', color: '#EF4444', marginTop: '0.15rem' }}>
                      {formatPaise(memberExpense)}
                    </div>
                  </div>
                </div>

                {/* Financial Sharing Controls (Section 8 & 16) */}
                <div
                  style={{
                    background: 'var(--bg-card-secondary, rgba(0,0,0,0.015))',
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Shared Financial Data
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Income Sharing</span>
                    <button
                      type="button"
                      disabled={!isHead && !isMe}
                      onClick={() => updateMemberSharing(m.id, !m.income_sharing_enabled, m.expense_sharing_enabled !== false)}
                      style={{
                        border: 'none',
                        background: m.income_sharing_enabled ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                        color: m.income_sharing_enabled ? '#059669' : '#EF4444',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: (isHead || isMe) ? 'pointer' : 'default',
                      }}
                    >
                      {m.income_sharing_enabled ? '✓ Enabled' : '✕ Disabled'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Expense Sharing</span>
                    <button
                      type="button"
                      disabled={!isHead && !isMe}
                      onClick={() => updateMemberSharing(m.id, m.income_sharing_enabled !== false, !m.expense_sharing_enabled)}
                      style={{
                        border: 'none',
                        background: m.expense_sharing_enabled ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                        color: m.expense_sharing_enabled ? '#059669' : '#EF4444',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: (isHead || isMe) ? 'pointer' : 'default',
                      }}
                    >
                      {m.expense_sharing_enabled ? '✓ Enabled' : '✕ Disabled'}
                    </button>
                  </div>
                </div>

                {/* Allowance or Spending Limit Cap */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-canvas, rgba(0,0,0,0.02))',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      Spending Cap:{' '}
                    </span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatPaise(m.monthly_spending_limit || 0)}
                    </strong>
                  </div>

                  {isHead && !isEditingLimit && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => {
                        setEditingLimitMemberId(m.id);
                        setLimitRupeesInput(String(paiseToRupees(m.monthly_spending_limit || 0)));
                      }}
                    >
                      <Sliders size={12} /> Adjust Cap
                    </button>
                  )}
                </div>

                {/* Inline Limit Editor */}
                {isEditingLimit && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      gap: '0.35rem',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="number"
                      className="input"
                      value={limitRupeesInput}
                      onChange={e => setLimitRupeesInput(e.target.value)}
                      placeholder="Amount in ₹"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveLimit(m.id)}>
                      Save
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingLimitMemberId(null)}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons: [ View ] [ Permissions ] [ Remove ] (Section 16 & 31) */}
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setMemberToView(m)}
                >
                  <Eye size={13} /> View
                </button>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {onNavigatePermissions && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem' }}
                      onClick={onNavigatePermissions}
                    >
                      <Shield size={13} /> Permissions
                    </button>
                  )}

                  {isHead && !isThisHead && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.78rem' }}
                      onClick={() => setMemberToRemove(m)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= SECTION 31: REMOVE MEMBER CONFIRMATION DIALOG ================= */}
      {memberToRemove && (
        <div className="modal-backdrop" onClick={() => setMemberToRemove(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="#EF4444" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#EF4444', margin: 0 }}>
                  Remove Family Member?
                </h3>
              </div>
              <button className="btn btn-icon btn-sm" onClick={() => setMemberToRemove(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>
                Are you sure you want to remove this member?
              </p>

              <div
                style={{
                  background: 'var(--bg-canvas, rgba(0,0,0,0.03))',
                  padding: '1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <img
                  src={memberToRemove.user.avatar_url}
                  alt={memberToRemove.user.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{memberToRemove.user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Role: {ROLE_DISPLAY_NAMES[normalizeRole(memberToRemove.role)] || memberToRemove.role}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                This will remove their active membership from this family workspace. Their historical financial logs will remain preserved in the ledger for accounting integrity.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setMemberToRemove(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmRemove}
                style={{ fontWeight: 600 }}
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Member Profile Modal */}
      {memberToView && (
        <div className="modal-backdrop" onClick={() => setMemberToView(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Family Member Profile</h3>
              <button className="btn btn-icon btn-sm" onClick={() => setMemberToView(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={memberToView.user.avatar_url}
                  alt={memberToView.user.name}
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                    {memberToView.user.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {memberToView.user.email}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.35rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#6366F1',
                    }}
                  >
                    {ROLE_DISPLAY_NAMES[normalizeRole(memberToView.role)] || memberToView.role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Phone</span>
                  <div style={{ fontWeight: 600 }}>{memberToView.user.phone || '+91 98401 23456'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date of Birth</span>
                  <div style={{ fontWeight: 600 }}>{memberToView.user.date_of_birth || '24 February 2007'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Location</span>
                  <div style={{ fontWeight: 600 }}>{memberToView.user.location || 'Madurai, Tamil Nadu'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Account Created</span>
                  <div style={{ fontWeight: 600 }}>1 Jan 2026</div>
                </div>
              </div>

              {memberToView.user.bio && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>About</span>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>{memberToView.user.bio}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMemberToView(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Role Modal */}
      <CreateRoleModal
        isOpen={createRoleModalOpen}
        onClose={() => setCreateRoleModalOpen(false)}
      />

      {/* Invite Member Modal */}
      <InvitationModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};
