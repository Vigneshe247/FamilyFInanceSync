/* =========================================================
   FUTURE INNOVATION: OPEN BANKING INTEGRATION HUB (Section 32)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise } from '../../utils/currency';
import {
  Landmark,
  ShieldCheck,
  Lock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const BankSyncPage: React.FC = () => {
  const { accounts } = useFamilyFinance();
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const supportedBanks = [
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC0000123', status: 'Connected • Ready', iconColor: 'var(--sky)' },
    { id: 'sbi', name: 'State Bank of India', code: 'SBIN0004567', status: 'Connected • Ready', iconColor: 'var(--sky)' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICIC0008910', status: 'Consent Pending', iconColor: 'var(--amber)' },
    { id: 'axis', name: 'Axis Bank', code: 'UTIB0001122', status: 'Available to Link', iconColor: 'var(--ink-muted)' },
  ];

  const handleSyncAccount = (bankId: string) => {
    setIsSyncing(bankId);
    setTimeout(() => {
      setIsSyncing(null);
    }, 1500);
  };

  return (
    <div className="content-page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="brand-icon-wrap" style={{ width: 40, height: 40 }}>
            <Landmark size={22} color="var(--sky)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)' }}>
              Open Banking & Account Aggregator Hub
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              RBI-regulated Account Aggregator (AA) consent framework architecture (Section 32)
            </p>
          </div>
        </div>
      </div>

      {/* Zero Credential Warning & Trust Banner */}
      <div
        className="card"
        style={{
          border: '1px solid var(--sage)',
          background: 'var(--sage-light)',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <ShieldCheck size={26} color="var(--sage)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>
              Cryptographic Token Exchange — Zero Credential Risk
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--ink-2)', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Family Finance Sync operates strictly via the authorized <strong>Account Aggregator (AA)</strong> standard. The application NEVER prompts for or stores your netbanking passwords, debit card PINs, UPI PINs, CVVs, or OTPs. Financial statement data is fetched through read-only digital consents that can be revoked by the Family Head at any moment.
            </p>
          </div>
        </div>
      </div>

      {/* Connected Financial Institutions Grid */}
      <div className="grid-2col">
        {supportedBanks.map(bank => {
          const isCurrentSyncing = isSyncing === bank.id;
          const isConnected = bank.status.includes('Connected');

          return (
            <div key={bank.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="brand-icon-wrap" style={{ width: 44, height: 44 }}>
                    <Landmark size={22} color={bank.iconColor} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>
                      {bank.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                      IFSC Pattern: {bank.code}
                    </div>
                  </div>
                </div>

                <span
                  className={`badge ${
                    isConnected ? 'badge-sage' : bank.status.includes('Pending') ? 'badge-brass' : 'badge-sky'
                  }`}
                >
                  {bank.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  {isConnected ? 'Sync Status: Reconciled' : 'Auth Protocol: OAuth2 / AA'}
                </span>

                {isConnected ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSyncAccount(bank.id)}
                    disabled={isCurrentSyncing}
                  >
                    <RefreshCw size={13} className={isCurrentSyncing ? 'animate-spin' : ''} style={{ animation: isCurrentSyncing ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{isCurrentSyncing ? 'Synchronizing...' : 'Pull Feed'}</span>
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm">
                    <ExternalLink size={13} /> Link via Consent
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
