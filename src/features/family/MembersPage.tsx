/* =========================================================
   MEMBERS & ROLES MANAGEMENT (Sections 6 & 14)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { SystemRoleType } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Sliders,
} from 'lucide-react';
import { InvitationModal } from '../../components/modals/InvitationModal';

export const MembersPage: React.FC = () => {
  const {
    members,
    currentMember,
    roles,
    updateMemberRole,
    updateMemberLimit,
    inviteMember,
    removeMember,
    invitations,
    revokeInvitation,
  } = useFamilyFinance();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingLimitMemberId, setEditingLimitMemberId] = useState<string | null>(null);
  const [limitRupeesInput, setLimitRupeesInput] = useState('');

  const isHead = currentMember.role === 'FAMILY_HEAD';

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');

  const handleSaveLimit = (memberId: string) => {
    const paise = rupeesToPaise(limitRupeesInput);
    updateMemberLimit(memberId, paise);
    setEditingLimitMemberId(null);
  };

  return (
    <div className="content-page">
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
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)' }}>
            Family Members & System Roles
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
            Multi-tenant membership directory, permission roles, and allowance controls
          </p>
        </div>

        {isHead && (
          <button className="btn btn-primary btn-sm" onClick={() => setInviteModalOpen(true)}>
            <UserPlus size={15} /> Invite Family Member
          </button>
        )}
      </div>

      {/* Active Pending Invitations Section */}
      {isHead && pendingInvitations.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--mint-primary)', background: 'var(--mint-light)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--mint-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Users size={18} /> Active Pending Invitations ({pendingInvitations.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingInvitations.map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-canvas)', padding: '0.6rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>Code: {inv.invite_code}</span> • Role: <span className="badge badge-brass" style={{ fontSize: '0.65rem' }}>{inv.invited_role.replace('_', ' ')}</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Link: {inv.invite_link}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => revokeInvitation(inv.id)}
                  style={{ color: '#EB5757', borderColor: '#EB5757', fontSize: '0.7rem' }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid-2col">
        {members.map(m => {
          const isMe = m.id === currentMember.id;
          const isThisHead = m.role === 'FAMILY_HEAD';
          const isEditingLimit = editingLimitMemberId === m.id;

          return (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={m.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={m.user.name}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--line)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>
                        {m.user.name}
                      </span>
                      {isMe && <span className="badge badge-sky">YOU</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={12} /> {m.user.email}
                    </div>
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  {isHead ? (
                    <select
                      className="select"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', fontWeight: 600 }}
                      value={m.role}
                      onChange={e => updateMemberRole(m.id, e.target.value as SystemRoleType)}
                      disabled={isThisHead && members.filter(x => x.role === 'FAMILY_HEAD').length <= 1}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.name}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="badge badge-brass" style={{ fontSize: '0.75rem' }}>
                      {m.role.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Allowance & Spending Limit details */}
              <div
                style={{
                  background: 'var(--paper-dim)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 600 }}>
                    Monthly Spending Limit
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {formatPaise(m.monthly_spending_limit || 0)}
                  </div>
                </div>

                {isHead && !isEditingLimit && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingLimitMemberId(m.id);
                      setLimitRupeesInput(String(paiseToRupees(m.monthly_spending_limit || 0)));
                    }}
                  >
                    <Sliders size={13} /> Adjust Cap
                  </button>
                )}
              </div>

              {/* Inline Limit Editor */}
              {isEditingLimit && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--paper-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--brass)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <input
                    type="number"
                    className="input"
                    value={limitRupeesInput}
                    onChange={e => setLimitRupeesInput(e.target.value)}
                    placeholder="Limit in ₹"
                    style={{ padding: '0.35rem 0.6rem' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleSaveLimit(m.id)}>
                    Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingLimitMemberId(null)}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Actions */}
              {isHead && !isThisHead && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-icon btn-sm"
                    title="Remove member"
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove ${m.user.name} from ${m.family_id}?`)) {
                        removeMember(m.id);
                      }
                    }}
                  >
                    <Trash2 size={14} color="var(--rust)" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Member Modal */}
      <InvitationModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </div>
  );
};
