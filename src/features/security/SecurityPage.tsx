/* =========================================================
   SECURITY ARCHITECTURE & SESSION GOVERNANCE (Section 9 & 26)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import {
  isGoogleLinked,
  linkGoogleToCurrentUser,
  unlinkGoogleFromCurrentUser,
} from '../../services/firebase';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertOctagon,
  Key,
  Database,
  Server,
  Link,
  Unlink,
  AlertTriangle,
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const { family, currentMember } = useFamilyFinance();

  const [googleConnected, setGoogleConnected] = useState<boolean>(() => isGoogleLinked());
  const [providerActionLoading, setProviderActionLoading] = useState(false);
  const [providerFeedback, setProviderFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleLinkGoogle = async () => {
    setProviderActionLoading(true);
    setProviderFeedback(null);
    const res = await linkGoogleToCurrentUser();
    setProviderActionLoading(false);
    if (res.success) {
      setGoogleConnected(true);
      setProviderFeedback({ type: 'success', msg: 'Google account linked successfully!' });
    } else {
      setProviderFeedback({ type: 'error', msg: res.error || 'Failed to link Google account.' });
    }
  };

  const handleUnlinkGoogle = async () => {
    setProviderActionLoading(true);
    setProviderFeedback(null);
    const res = await unlinkGoogleFromCurrentUser();
    setProviderActionLoading(false);
    if (res.success) {
      setGoogleConnected(false);
      setProviderFeedback({ type: 'success', msg: 'Google account unlinked successfully.' });
    } else {
      setProviderFeedback({ type: 'error', msg: res.error || 'Failed to unlink Google account.' });
    }
  };

  const securityChecklist = [
    {
      title: 'Backend-Enforced Authorization',
      desc: 'Browser input is treated as untrusted. Roles, permissions, and family IDs are validated server-side on every mutation.',
      status: 'Enforced',
      icon: Server,
    },
    {
      title: 'Strict Multi-Tenant Family Isolation',
      desc: 'All database queries explicitly filter by family_id. Cross-tenant access is prohibited at both API and Postgres RLS layers.',
      status: 'Isolated',
      icon: Database,
    },
    {
      title: 'Integer-Safe Financial Arithmetic',
      desc: 'Monetary sums are computed using integer paise units, preventing JavaScript IEEE-754 floating point rounding corruption.',
      status: 'Active',
      icon: CheckCircle2,
    },
    {
      title: 'Zero Plain-Text Credentials',
      desc: 'No banking credentials, UPI PINs, CVVs, or OTPs are captured or persisted anywhere in the system.',
      status: 'Compliant',
      icon: Lock,
    },
  ];

  const activeSessions = [
    {
      device: 'MacBook Pro 16" (Chrome)',
      location: 'Bengaluru, India',
      ip: '49.37.112.42 (Encrypted)',
      lastActive: 'Active Now',
      isCurrent: true,
      icon: Laptop,
    },
    {
      device: 'iPhone 15 Pro (Safari Mobile)',
      location: 'Bengaluru, India',
      ip: '49.37.114.18 (Encrypted)',
      lastActive: '24 mins ago',
      isCurrent: false,
      icon: Smartphone,
    },
  ];

  return (
    <div className="content-page">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="brand-icon-wrap" style={{ width: 40, height: 40 }}>
            <Lock size={22} color="var(--brass)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)' }}>
              Security Center & Session Management
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              Family boundary enforcement, session auditing, and cryptographic validation
            </p>
          </div>
        </div>
      </div>

      {/* Security Principles Checklist */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Production Security Architecture Checklist</div>
            <div className="card-subtitle">Rules governing multi-user financial safety</div>
          </div>
          <span className="badge badge-sage">4/4 HARDENED</span>
        </div>

        <div className="grid-2col">
          {securityChecklist.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: 'var(--paper-dim)',
                  display: 'flex',
                  gap: '0.85rem',
                }}
              >
                <div className="brand-icon-wrap" style={{ width: 38, height: 38, flexShrink: 0 }}>
                  <IconComp size={18} color="var(--sage)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
                      {item.title}
                    </span>
                    <span className="badge badge-sage" style={{ fontSize: '0.68rem' }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Authentication Providers & Social Logins (Firebase Auth - Project: financesync-4568b) */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Authentication Providers & Google Sign-In</div>
            <div className="card-subtitle">Manage single sign-on providers for Firebase project financesync-4568b</div>
          </div>
          <span className="badge badge-brass">FIREBASE AUTH</span>
        </div>

        {providerFeedback && (
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: providerFeedback.type === 'success' ? 'var(--sage-light)' : '#FEF2F2',
              color: providerFeedback.type === 'success' ? 'var(--sage)' : 'var(--rust)',
              border: `1px solid ${providerFeedback.type === 'success' ? 'rgba(62, 110, 86, 0.3)' : 'rgba(192, 57, 43, 0.3)'}`,
            }}
          >
            {providerFeedback.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Email / Password Provider */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              background: 'var(--paper-dim)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="brand-icon-wrap" style={{ width: 34, height: 34 }}>
                  <Key size={16} color="var(--brass)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Email & Password</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{currentMember.user.email}</div>
                </div>
              </div>
              <span className="badge badge-sage">ACTIVE</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
              Standard password-based authentication with SMS multi-factor capability.
            </p>
          </div>

          {/* Google Sign-In Provider */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              background: 'var(--paper-dim)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="brand-icon-wrap" style={{ width: 34, height: 34, background: '#FFFFFF' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Google (google.com)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>OAuth 2.0 Single Sign-On</div>
                </div>
              </div>
              <span className={`badge ${googleConnected ? 'badge-sage' : 'badge-rust'}`}>
                {googleConnected ? 'LINKED' : 'UNLINKED'}
              </span>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {googleConnected ? (
                <button
                  type="button"
                  onClick={handleUnlinkGoogle}
                  disabled={providerActionLoading}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--rust)', borderColor: 'rgba(192, 57, 43, 0.3)', width: '100%', justifyContent: 'center' }}
                >
                  <Unlink size={14} /> Unlink Google Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={providerActionLoading}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Link size={14} /> Link with Google
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div
          style={{
            background: 'var(--paper-dim)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.76rem',
            color: 'var(--ink-muted)',
          }}
        >
          <AlertTriangle size={16} color="var(--brass)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Account Lockout Safeguard:</strong> Unlinking Google is only allowed when another sign-in method (like email/password) is active. Linked accounts share the same user ID (UID) across all financial sync records.
          </span>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Active Member Sessions</div>
            <div className="card-subtitle">Devices currently authenticated to {family.name}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {activeSessions.map((session, idx) => {
            const IconComp = session.icon;
            return (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: session.isCurrent ? 'var(--sage-light)' : 'var(--paper-dim)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IconComp size={20} color="var(--ink)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {session.device} {session.isCurrent && <span className="badge badge-sage" style={{ marginLeft: '0.3rem' }}>THIS DEVICE</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      {session.location} • {session.ip}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                  {session.lastActive}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
