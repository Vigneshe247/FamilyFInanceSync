/* =========================================================
   SPENDING LIMITS & ALLOWANCES MANAGEMENT (Section 14 & 17)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../../utils/currency';
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  Edit2,
  ShieldCheck,
  User,
} from 'lucide-react';

export const SpendingLimitsPage: React.FC = () => {
  const { members, transactions, currentMember, updateMemberLimit, hasPermission } = useFamilyFinance();

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [limitInputRupees, setLimitInputRupees] = useState('');

  const isHead = currentMember.role === 'FAMILY_HEAD';

  const handleSave = (memberId: string) => {
    const paise = rupeesToPaise(limitInputRupees);
    if (paise >= 0) {
      updateMemberLimit(memberId, paise);
    }
    setEditingMemberId(null);
  };

  return (
    <div className="content-page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="brand-icon-wrap" style={{ width: 40, height: 40 }}>
            <Sliders size={22} color="var(--sky)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)' }}>
              Member Spending Limits & Allowances
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              Individual monthly spending caps for children and adult members
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        {members.map(member => {
          const spentPaise = transactions
            .filter(t => t.user_id === member.user_id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const limitPaise = member.monthly_spending_limit || 0;
          const pct = limitPaise > 0 ? Math.min(100, Math.round((spentPaise / limitPaise) * 100)) : 0;
          const isExceeded = limitPaise > 0 && spentPaise > limitPaise;
          const isEditing = editingMemberId === member.id;

          return (
            <div key={member.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={member.user.avatar_url}
                    alt={member.user.name}
                    style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                      {member.user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brass)', fontWeight: 600 }}>
                      {member.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <span className={`badge ${isExceeded ? 'badge-rust' : 'badge-sage'}`}>
                  {limitPaise === 0 ? 'NO LIMIT (HEAD)' : `${pct}% OF CAP USED`}
                </span>
              </div>

              {limitPaise > 0 ? (
                <>
                  <div className="progress-bar-container" style={{ height: '8px', marginBottom: '0.75rem' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isExceeded ? 'var(--rust)' : pct > 80 ? 'var(--amber)' : 'var(--sage)',
                      }}
                    ></div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'var(--paper-dim)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>SPENT THIS MONTH</div>
                      <div style={{ fontWeight: 700, color: 'var(--rust)' }}>{formatPaise(spentPaise)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>MONTHLY CAP</div>
                      <div style={{ fontWeight: 700 }}>{formatPaise(limitPaise)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '0.75rem', background: 'var(--paper-dim)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Family Head has full discretionary expenditure privileges.
                </div>
              )}

              {isHead && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        className="input"
                        style={{ flex: 1, padding: '0.35rem 0.6rem' }}
                        value={limitInputRupees}
                        onChange={e => setLimitInputRupees(e.target.value)}
                        placeholder="Limit in ₹"
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleSave(member.id)}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingMemberId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingMemberId(member.id);
                        setLimitInputRupees(String(paiseToRupees(member.monthly_spending_limit || 0)));
                      }}
                    >
                      <Edit2 size={13} /> Adjust Monthly Limit
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
