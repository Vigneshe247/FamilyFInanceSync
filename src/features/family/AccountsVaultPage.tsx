/* =========================================================
   ACCOUNTS & LIQUID VAULTS (Section 8 & 32 & Module 5)
   Multi-bank, Cash, UPI, Credit Cards, and Inter-Account Transfers
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise } from '../../utils/currency';
import {
  Wallet,
  Landmark,
  Coins,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Lock,
  Trash2,
  TrendingUp,
  Banknote,
} from 'lucide-react';
import { NewAccountModal } from '../../components/modals/NewAccountModal';
import { AccountTransferModal } from '../../components/modals/AccountTransferModal';
import { AccountType } from '../../types';

export const AccountsVaultPage: React.FC = () => {
  const { accounts, hasPermission, deleteAccount } = useFamilyFinance();

  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const totalBalancePaise = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
      case 'savings':
        return <Landmark size={22} color="var(--sky-accent)" />;
      case 'cash':
        return <Coins size={22} color="var(--amber-accent)" />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCard size={22} color="var(--coral-accent)" />;
      case 'investment':
        return <TrendingUp size={22} color="var(--mint-primary)" />;
      case 'loan':
        return <Banknote size={22} color="var(--coral-accent)" />;
      default:
        return <Wallet size={22} color="var(--mint-primary)" />;
    }
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
          <h1>Family Accounts & Vaults</h1>
          <p style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Multi-bank liquidity, cash reserves, credit lines, and digital wallets
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft size={14} /> Transfer Funds
          </button>
          {hasPermission('accounts.create') && (
            <button className="btn btn-primary btn-sm" onClick={() => setAddAccountOpen(true)}>
              <Plus size={15} /> Add Account
            </button>
          )}
        </div>
      </div>

      {/* Security Guarantee Banner */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '0.95rem 1.35rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.82rem',
          color: 'var(--text-main)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Lock size={18} color="var(--mint-primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Zero Sensitive Credentials Stored:</strong> Family Finance Sync never stores banking passwords, UPI PINs, CVVs, OTPs, or card numbers. All balances use ledger reconciliations.
        </span>
      </div>

      {/* Total Liquid Card */}
      <div className="stat-card" style={{ borderLeft: '4px solid var(--mint-primary)', marginBottom: '1.75rem' }}>
        <div className="stat-label">
          <span>Consolidated Family Liquid Balance</span>
          <Landmark size={18} color="var(--mint-primary)" />
        </div>
        <div className="stat-value" style={{ color: 'var(--mint-primary)' }}>
          {formatPaise(totalBalancePaise)}
        </div>
        <div className="stat-meta">Across {accounts.length} verified family repositories</div>
      </div>

      {/* Accounts Grid */}
      <div className="grid-2col">
        {accounts.map(acc => {
          return (
            <div key={acc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div className="brand-icon-wrap" style={{ width: 46, height: 46 }}>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {acc.account_number_mask ? acc.account_number_mask : acc.type.replace('_', ' ').toUpperCase()} • {acc.currency}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${acc.is_shared ? 'badge-sky' : 'badge-brass'}`}>
                    {acc.is_shared ? 'SHARED FAMILY' : 'INDIVIDUAL'}
                  </span>
                  {hasPermission('accounts.delete') && accounts.length > 1 && (
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                      title="Delete Account"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-canvas-subtle)',
                  padding: '1.1rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Current Balance
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)' }}>
                  {formatPaise(acc.balance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <NewAccountModal
        isOpen={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
      />

      <AccountTransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
    </div>
  );
};
