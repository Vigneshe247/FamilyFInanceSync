/* =========================================================
   IMMUTABLE AUDIT TRAIL & GOVERNANCE LOGS (Section 23)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatDate } from '../../utils/currency';
import {
  ScrollText,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useFamilyFinance();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.user_name.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(q)
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('CREATED')) return 'badge-sage';
    if (action.includes('DELETED') || action.includes('REJECTED') || action.includes('REMOVED')) return 'badge-rust';
    if (action.includes('UPDATED') || action.includes('OVERRIDE')) return 'badge-brass';
    return 'badge-sky';
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
            Immutable Family Audit Trail
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
            Cryptographically ordered operational record of all permission changes, approvals, and budget updates
          </p>
        </div>

        <div className="sync-chip">
          <ShieldCheck size={14} />
          <span>Tamper-Resistant Log</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-muted)',
            }}
          />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '2.2rem' }}
            placeholder="Search audit actions, members, budget changes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Authorized Actor</th>
                <th>Action Type</th>
                <th>Entity Affected</th>
                <th>Operation Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} />
                      <span>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                      <UserCheck size={13} color="var(--brass)" />
                      <span>{log.user_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getActionBadgeColor(log.action)}`} style={{ fontSize: '0.72rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                      {log.entity_type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--ink-2)' }}>
                    {log.metadata?.details
                      ? String(log.metadata.details)
                      : JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
