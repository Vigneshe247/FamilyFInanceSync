import React, { useState } from 'react';
import { useFamilyFinance } from '../../../context/FamilyFinanceContext';
import { formatPaise, formatDate } from '../../../utils/currency';
import {
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Target,
  Users,
  ShieldAlert,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface PrivateFinancesViewProps {
  onOpenNewTx: (initialType?: 'expense' | 'income') => void;
}

export const PrivateFinancesView: React.FC<PrivateFinancesViewProps> = ({ onOpenNewTx }) => {
  const {
    activeFamily,
    currentMember,
    privateSummary,
    privateTransactions,
    privateGoals,
    privateLoans,
    categories,
    updateTransactionVisibility,
  } = useFamilyFinance();

  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleShareWithFamily = (txId: string) => {
    updateTransactionVisibility(txId, 'family', activeFamily.id);
    setConfirmTxId(null);
    setSuccessMsg(`Transaction moved to ${activeFamily.name} shared ledger!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
      {/* Privacy Notice Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.15rem 1.35rem',
          borderRadius: '20px',
          background: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: 'rgba(217, 119, 6, 0.15)',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lock size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                My Private Finances
              </h2>
              <span
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                }}
              >
                ONLY YOU
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Private income, personal expenses, and confidential targets. Excluded from {activeFamily.name} dashboard & reports.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onOpenNewTx('expense')}
          style={{ gap: '0.4rem', fontWeight: 700 }}
        >
          <Plus size={15} /> Add Private Transaction
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            background: 'rgba(34, 160, 91, 0.12)',
            border: '1px solid rgba(34, 160, 91, 0.25)',
            color: 'var(--mint-primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* 3 Core Metric Cards (Section 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Private Income */}
        <div className="neo-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Private Income
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--mint-primary)', marginTop: '0.35rem' }}>
                {formatPaise(privateSummary.privateIncome)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Personal earnings & consulting
              </div>
            </div>
            <div className="pastel-icon-box" style={{ background: 'rgba(5, 150, 105, 0.12)', color: 'var(--mint-primary)' }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
        </div>

        {/* Private Expenses */}
        <div className="neo-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Private Expenses
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--coral-accent)', marginTop: '0.35rem' }}>
                {formatPaise(privateSummary.privateExpenses)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Personal shopping & discretionary
              </div>
            </div>
            <div className="pastel-icon-box" style={{ background: 'rgba(235, 87, 87, 0.12)', color: 'var(--coral-accent)' }}>
              <ArrowDownLeft size={22} />
            </div>
          </div>
        </div>

        {/* Private Savings */}
        <div className="neo-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Private Savings
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#2563EB', marginTop: '0.35rem' }}>
                {formatPaise(privateSummary.privateSavings)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Retained personal surplus
              </div>
            </div>
            <div className="pastel-icon-box" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
              <PiggyBank size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Private Goals & Private Debts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Private Savings Goals */}
        <div className="neo-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="#2563EB" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Private Goals
              </h4>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {privateGoals.length} Personal
            </span>
          </div>

          {privateGoals.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No private savings goals created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {privateGoals.map(g => {
                const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                return (
                  <div key={g.id} style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{g.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB' }}>{percent}%</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{g.description}</div>
                    <div className="progress-bar-container" style={{ height: '6px', borderRadius: '9999px', background: 'var(--border-subtle)' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: '#2563EB', borderRadius: '9999px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                      <span>Saved: <strong>{formatPaise(g.current_amount)}</strong></span>
                      <span>Target: <strong>{formatPaise(g.target_amount)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Private Debts & Loans */}
        <div className="neo-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="#D97706" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Private Debts & Loans
              </h4>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {privateLoans.length} Personal
            </span>
          </div>

          {privateLoans.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No private debt records logged.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {privateLoans.map(l => (
                <div key={l.id} style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{l.name}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--coral-accent)' }}>
                      {formatPaise(l.remaining_balance)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Lender: {l.lender_or_borrower}</span>
                    <span>EMI: {formatPaise(l.monthly_emi)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Private Transactions Table */}
      <div className="neo-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Private Transactions
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Only you can see these entries. Click "Share with Family" to move an entry to {activeFamily.name}.
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706' }}>
            {privateTransactions.length} Records
          </span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center', width: '170px' }}>Privacy Action</th>
              </tr>
            </thead>
            <tbody>
              {privateTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No private transactions yet. When you record expenses with visibility "Private", they appear here.
                  </td>
                </tr>
              ) : (
                privateTransactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.category_id);
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--bg-canvas-subtle)', border: `1px solid ${cat?.color || 'var(--border-subtle)'}`, color: 'var(--text-main)', fontSize: '0.72rem' }}>
                          {cat?.name || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Lock size={12} color="#D97706" />
                          <span>{tx.description}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {tx.payment_method}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: isExpense ? 'var(--coral-accent)' : 'var(--mint-primary)', whiteSpace: 'nowrap' }}>
                        {isExpense ? `-${formatPaise(tx.amount)}` : `+${formatPaise(tx.amount)}`}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {confirmTxId === tx.id ? (
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleShareWithFamily(tx.id)}
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setConfirmTxId(null)}
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setConfirmTxId(tx.id)}
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', gap: '0.35rem', color: 'var(--mint-primary)' }}
                            title="Share with family"
                          >
                            <Users size={12} /> Share
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
