/* =========================================================
   ROLE-BASED PERMISSIONS MATRIX & OVERRIDES (Section 7)
   ========================================================= */

import React from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { SYSTEM_PERMISSIONS } from '../../data/seedData';
import { PermissionKey } from '../../types';
import {
  KeyRound,
  Check,
  X,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const PermissionsMatrixPage: React.FC = () => {
  const {
    members,
    roles,
    currentMember,
    toggleMemberPermission,
  } = useFamilyFinance();

  const isHead = currentMember.role === 'FAMILY_HEAD';

  // Group permissions by category
  const permissionGroups = ['Family', 'Members', 'Transactions', 'Budgets', 'Accounts', 'Requests', 'Goals', 'Reports', 'Audit'];

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
              Permissions Matrix & Member Overrides
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              Granular access control capability matrix. Family Head can toggle individual overrides per member.
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
          <strong>Architecture Principle:</strong> Authorization is never hardcoded as <code>if role === "admin"</code>. Every action evaluates strict permission capability keys.
        </span>
      </div>

      {/* Permissions Matrix Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Permission Key</th>
                <th>Description</th>
                {members.map(m => (
                  <th key={m.id} style={{ textAlign: 'center', minWidth: '110px' }}>
                    <div style={{ fontWeight: 700 }}>{m.user.name}</div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--brass)' }}>
                      {m.role.replace('_', ' ')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map(group => {
                const permsInGroup = SYSTEM_PERMISSIONS.filter(p => p.group === group);
                if (permsInGroup.length === 0) return null;

                return (
                  <React.Fragment key={group}>
                    {/* Group Header Row */}
                    <tr style={{ background: 'var(--paper-dim)' }}>
                      <td colSpan={2 + members.length} style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>
                        {group} Capabilities
                      </td>
                    </tr>

                    {permsInGroup.map(perm => (
                      <tr key={perm.key}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                          {perm.key}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                          {perm.description}
                        </td>

                        {members.map(m => {
                          const isHeadMember = m.role === 'FAMILY_HEAD';
                          const roleDef = roles.find(r => r.name === m.role);
                          const defaultAllowed = roleDef?.default_permissions.includes(perm.key) || false;
                          const customOverride = m.custom_permissions?.[perm.key];
                          const effectiveAllowed = isHeadMember ? true : customOverride !== undefined ? customOverride : defaultAllowed;

                          return (
                            <td key={m.id} style={{ textAlign: 'center' }}>
                              {isHeadMember ? (
                                <span title="Family Head holds all capabilities" style={{ color: 'var(--sage)', fontWeight: 700 }}>
                                  ✓ All
                                </span>
                              ) : isHead ? (
                                <button
                                  className={`btn btn-sm ${effectiveAllowed ? 'btn-sage' : 'btn-secondary'}`}
                                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                                  onClick={() => toggleMemberPermission(m.id, perm.key, !effectiveAllowed)}
                                  title={`Toggle ${perm.key} for ${m.user.name}`}
                                >
                                  {effectiveAllowed ? <Check size={13} /> : <X size={13} />}
                                  <span style={{ marginLeft: '0.25rem' }}>{effectiveAllowed ? 'Allowed' : 'Denied'}</span>
                                </button>
                              ) : (
                                <span style={{ color: effectiveAllowed ? 'var(--sage)' : 'var(--rust)', fontWeight: 600, fontSize: '0.8rem' }}>
                                  {effectiveAllowed ? '✓ Allowed' : '✕ Denied'}
                                </span>
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
    </div>
  );
};
