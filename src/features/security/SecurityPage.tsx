/* =========================================================
   SECURITY ARCHITECTURE & SESSION GOVERNANCE (Section 9 & 26)
   ========================================================= */

import React from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
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
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const { family, currentMember } = useFamilyFinance();

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
