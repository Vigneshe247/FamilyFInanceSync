/* =========================================================
   ROLE-BASED PERMISSIONS MATRIX & OVERRIDES (Section 7)
   Upgraded: Interactive toggle switches, batch actions,
   search/filter, override badges, normalizeRole detection
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { SYSTEM_PERMISSIONS } from '../../data/seedData';
import { PermissionKey } from '../../types';
import { normalizeRole, ROLE_DISPLAY_NAMES } from '../../utils/permissions';
import {
  KeyRound,
  Check,
  X,
  Info,
  Search,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  ChevronDown,
  BadgeCheck,
} from 'lucide-react';

export const PermissionsMatrixPage: React.FC = () => {
  const {
    members,
    roles,
    currentMember,
    toggleMemberPermission,
    grantAllMemberPermissions,
    revokeAllMemberPermissions,
    resetMemberPermissions,
  } = useFamilyFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [expandedMemberActions, setExpandedMemberActions] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ memberId: string; action: 'grant' | 'revoke' | 'reset' } | null>(null);

  const normRole = normalizeRole(currentMember.role);
  const isHead = normRole === 'family_head' || currentMember.role === 'FAMILY_HEAD';

  // Group permissions by category
  const permissionGroups = ['Family', 'Members', 'Transactions', 'Budgets', 'Accounts', 'Requests', 'Goals', 'Reports', 'Audit'];

  const filteredGroups = permissionGroups.filter(group =>
    filterGroup === 'all' || filterGroup === group
  );

  const filteredPermissions = SYSTEM_PERMISSIONS.filter(p => {
    const matchesGroup = filterGroup === 'all' || p.group === filterGroup;
    const matchesSearch = !searchQuery ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Count overrides for a member
  const countOverrides = (member: typeof members[0]) => {
    return Object.keys(member.custom_permissions || {}).length;
  };

  // Check if a permission is an override (different from role default)
  const isOverridden = (member: typeof members[0], permKey: PermissionKey): boolean => {
    return member.custom_permissions != null &&
      Object.prototype.hasOwnProperty.call(member.custom_permissions, permKey);
  };

  const handleBatchAction = (memberId: string, action: 'grant' | 'revoke' | 'reset') => {
    setConfirmAction(null);
    if (action === 'grant') grantAllMemberPermissions(memberId);
    else if (action === 'revoke') revokeAllMemberPermissions(memberId);
    else resetMemberPermissions(memberId);
    setExpandedMemberActions(null);
  };

  const getRoleColor = (role: string) => {
    const n = normalizeRole(role);
    if (n === 'family_head') return '#22A05B';
    if (n === 'spouse') return '#3E8BF5';
    if (n === 'child') return '#9B51E0';
    if (n === 'grandparent') return '#E5A11E';
    return '#6B7280';
  };

  const getRoleLabel = (role: string) => {
    return ROLE_DISPLAY_NAMES[normalizeRole(role)] || role.replace(/_/g, ' ');
  };

  return (
    <div className="content-page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="brand-icon-wrap" style={{ width: 40, height: 40 }}>
            <KeyRound size={22} color="var(--brass)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)' }}>
              Permissions Matrix &amp; Member Overrides
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              Granular access control capability matrix.
              {isHead
                ? ' As Family Head, you can toggle individual permissions and grant/revoke access per member.'
                : ' Your current access level is shown below based on your role and any custom overrides.'}
            </p>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div
        style={{
          background: 'var(--paper-card)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.82rem',
        }}
      >
        <Info size={18} color="var(--brass)" />
        <span>
          <strong>Architecture Principle:</strong> Authorization is never hardcoded as <code>if role === &quot;admin&quot;</code>. Every action evaluates strict permission capability keys.
          {isHead && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--mint-primary)', fontWeight: 600 }}>
              ● You can toggle any permission below — changes apply instantly.
            </span>
          )}
        </span>
      </div>

      {/* Member Batch Action Cards (only visible to admin) */}
      {isHead && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {members
            .filter(m => normalizeRole(m.role) !== 'family_head' && m.role !== 'FAMILY_HEAD')
            .map(member => {
              const overrideCount = countOverrides(member);
              const isOpen = expandedMemberActions === member.id;
              return (
                <div
                  key={member.id}
                  style={{
                    background: 'var(--paper-card)',
                    border: '1px solid var(--line)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.name}
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.user.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: getRoleColor(member.role), fontWeight: 600, textTransform: 'uppercase' }}>
                        {getRoleLabel(member.role)}
                      </div>
                    </div>
                    {overrideCount > 0 && (
                      <span
                        style={{
                          background: 'rgba(217, 119, 6, 0.15)',
                          color: '#D97706',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(217, 119, 6, 0.3)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm btn-sage"
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem', flex: 1 }}
                      onClick={() => setConfirmAction({ memberId: member.id, action: 'grant' })}
                      title={`Grant all permissions to ${member.user.name}`}
                    >
                      <ShieldCheck size={11} /> Grant All
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem', flex: 1 }}
                      onClick={() => setConfirmAction({ memberId: member.id, action: 'revoke' })}
                      title={`Revoke all permissions from ${member.user.name}`}
                    >
                      <ShieldOff size={11} /> Revoke
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem', width: '100%', marginTop: '0.2rem' }}
                      onClick={() => setConfirmAction({ memberId: member.id, action: 'reset' })}
                      title={`Reset ${member.user.name} to role defaults`}
                    >
                      <RotateCcw size={11} /> Reset to Role Defaults
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (() => {
        const member = members.find(m => m.id === confirmAction.memberId);
        if (!member) return null;
        const actionLabel = confirmAction.action === 'grant' ? 'grant ALL permissions to' : confirmAction.action === 'revoke' ? 'REVOKE ALL permissions from' : 'reset permissions to defaults for';
        const actionColor = confirmAction.action === 'grant' ? 'var(--mint-primary)' : confirmAction.action === 'revoke' ? 'var(--rust)' : 'var(--brass)';
        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setConfirmAction(null)}
          >
            <div
              style={{
                background: 'var(--paper-card)', borderRadius: '18px', padding: '1.5rem',
                maxWidth: 380, width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.6rem', color: 'var(--ink)' }}>
                Confirm Permission Change
              </h3>
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.87rem', marginBottom: '1.2rem' }}>
                Are you sure you want to <strong style={{ color: actionColor }}>{actionLabel}</strong>{' '}
                <strong>{member.user.name}</strong>? This change takes effect immediately.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm"
                  style={{
                    flex: 2,
                    background: actionColor,
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                  }}
                  onClick={() => handleBatchAction(confirmAction.memberId, confirmAction.action)}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.65rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.82rem' }}
          />
        </div>
        <select
          className="select"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          style={{ width: 'auto', height: '36px', fontSize: '0.82rem' }}
        >
          <option value="all">All Groups</option>
          {permissionGroups.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {(searchQuery || filterGroup !== 'all') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearchQuery(''); setFilterGroup('all'); }}
          >
            <X size={13} /> Clear
          </button>
        )}
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginLeft: 'auto' }}>
          Showing {filteredPermissions.length} of {SYSTEM_PERMISSIONS.length} permissions
        </span>
      </div>

      {/* Permissions Matrix Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: '200px' }}>Permission Key</th>
                <th style={{ minWidth: '180px' }}>Description</th>
                {members.map(m => {
                  const isHeadMember = normalizeRole(m.role) === 'family_head' || m.role === 'FAMILY_HEAD';
                  const overrideCount = countOverrides(m);
                  return (
                    <th key={m.id} style={{ textAlign: 'center', minWidth: '130px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                        <img
                          src={m.user.avatar_url}
                          alt={m.user.name}
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.15rem' }}
                        />
                        <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{m.user.name}</div>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: getRoleColor(m.role), fontWeight: 700, letterSpacing: '0.04em' }}>
                          {getRoleLabel(m.role)}
                        </div>
                        {!isHeadMember && overrideCount > 0 && (
                          <span
                            style={{
                              background: 'rgba(217, 119, 6, 0.15)',
                              color: '#D97706',
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.3rem',
                              borderRadius: '4px',
                            }}
                          >
                            {overrideCount} custom
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map(group => {
                const permsInGroup = filteredPermissions.filter(p => p.group === group);
                if (permsInGroup.length === 0) return null;

                return (
                  <React.Fragment key={group}>
                    {/* Group Header Row */}
                    <tr style={{ background: 'var(--paper-dim)' }}>
                      <td
                        colSpan={2 + members.length}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--ink-muted)',
                          padding: '0.55rem 1rem',
                        }}
                      >
                        {group} Capabilities
                      </td>
                    </tr>

                    {permsInGroup.map(perm => (
                      <tr key={perm.key}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {perm.key}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                          {perm.description}
                        </td>

                        {members.map(m => {
                          const isHeadMember = normalizeRole(m.role) === 'family_head' || m.role === 'FAMILY_HEAD';
                          const roleDef = roles.find(r =>
                            r.name.toLowerCase() === m.role.toLowerCase() ||
                            normalizeRole(r.name) === normalizeRole(m.role)
                          );
                          const defaultAllowed = roleDef?.default_permissions?.includes(perm.key) || false;
                          const customOverride = m.custom_permissions?.[perm.key as PermissionKey];
                          const effectiveAllowed = isHeadMember
                            ? true
                            : customOverride !== undefined
                            ? Boolean(customOverride)
                            : defaultAllowed;
                          const hasOverride = isOverridden(m, perm.key as PermissionKey);

                          return (
                            <td key={m.id} style={{ textAlign: 'center', padding: '0.5rem' }}>
                              {isHeadMember ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                                  <BadgeCheck size={16} color="#22A05B" />
                                  <span style={{ color: 'var(--sage)', fontWeight: 700, fontSize: '0.72rem' }}>
                                    All
                                  </span>
                                </div>
                              ) : isHead ? (
                                /* Admin can click to toggle */
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                  <button
                                    style={{
                                      position: 'relative',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      width: '44px',
                                      height: '24px',
                                      borderRadius: '9999px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      background: effectiveAllowed
                                        ? 'linear-gradient(90deg, #16A34A, #22A05B)'
                                        : 'var(--paper-dim)',
                                      transition: 'background 0.2s ease',
                                      boxShadow: effectiveAllowed
                                        ? '0 0 0 2px rgba(22, 163, 74, 0.25)'
                                        : '0 0 0 1px var(--line)',
                                      outline: 'none',
                                    }}
                                    onClick={() => toggleMemberPermission(m.id, perm.key as PermissionKey, !effectiveAllowed)}
                                    title={`${effectiveAllowed ? 'Revoke' : 'Grant'} ${perm.key} for ${m.user.name}`}
                                  >
                                    <span
                                      style={{
                                        position: 'absolute',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#FFF',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                        transition: 'transform 0.2s ease',
                                        transform: effectiveAllowed ? 'translateX(22px)' : 'translateX(3px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      {effectiveAllowed
                                        ? <Check size={10} color="#16A34A" />
                                        : <X size={10} color="#6B7280" />}
                                    </span>
                                  </button>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <span
                                      style={{
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        color: effectiveAllowed ? 'var(--sage)' : 'var(--ink-muted)',
                                      }}
                                    >
                                      {effectiveAllowed ? 'Allowed' : 'Denied'}
                                    </span>
                                    {hasOverride && (
                                      <span
                                        style={{
                                          fontSize: '0.55rem',
                                          background: 'rgba(217, 119, 6, 0.15)',
                                          color: '#D97706',
                                          padding: '0.05rem 0.2rem',
                                          borderRadius: '3px',
                                          fontWeight: 700,
                                        }}
                                        title="Custom override applied (differs from role default)"
                                      >
                                        OVR
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Non-admin: read-only display */
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: '50%',
                                      background: effectiveAllowed
                                        ? 'rgba(22, 163, 74, 0.12)'
                                        : 'rgba(235, 87, 87, 0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {effectiveAllowed
                                      ? <Check size={13} color="var(--sage)" />
                                      : <X size={13} color="var(--rust)" />}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 600,
                                      color: effectiveAllowed ? 'var(--sage)' : 'var(--rust)',
                                    }}
                                  >
                                    {effectiveAllowed ? 'Allowed' : 'Denied'}
                                  </span>
                                  {hasOverride && (
                                    <span
                                      style={{
                                        fontSize: '0.55rem',
                                        background: 'rgba(217, 119, 6, 0.15)',
                                        color: '#D97706',
                                        padding: '0.05rem 0.2rem',
                                        borderRadius: '3px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      OVR
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPermissions.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--ink-muted)',
            fontSize: '0.88rem',
          }}
        >
          <Search size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <div>No permissions match your search. <button className="btn btn-secondary btn-sm" onClick={() => { setSearchQuery(''); setFilterGroup('all'); }}>Clear filters</button></div>
        </div>
      )}
    </div>
  );
};
