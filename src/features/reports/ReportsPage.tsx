/* =========================================================
   FINANCIAL REPORTS & VISUAL ANALYTICS (Section 20)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise } from '../../utils/currency';
import {
  BarChart3,
  PieChart,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    transactions,
    categories,
    members,
    budget,
    savingsGoals,
    recurring,
  } = useFamilyFinance();

  const [reportPeriod, setReportPeriod] = useState<'current_month' | 'last_month' | 'year_to_date'>('current_month');

  // Compute financial metrics
  const totalIncomePaise = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensePaise = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavingsPaise = totalIncomePaise - totalExpensePaise;
  const savingsRate = totalIncomePaise > 0 ? Math.round((netSavingsPaise / totalIncomePaise) * 100) : 0;

  // Category breakdown
  const categorySpending = categories
    .map(cat => {
      const spent = transactions
        .filter(t => t.category_id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cat,
        spent,
        percentage: totalExpensePaise > 0 ? Math.round((spent / totalExpensePaise) * 100) : 0,
      };
    })
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Member spending breakdown
  const memberSpending = members.map(m => {
    const spent = transactions
      .filter(t => t.user_id === m.user_id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      member: m,
      spent,
      percentage: totalExpensePaise > 0 ? Math.round((spent / totalExpensePaise) * 100) : 0,
    };
  }).sort((a, b) => b.spent - a.spent);

  const handleExportFullReport = () => {
    const reportText = `FAMILY FINANCE SYNC — CONSOLIDATED STATEMENT\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `FINANCIAL SUMMARY:\n` +
      `Total Income: ${formatPaise(totalIncomePaise)}\n` +
      `Total Expenses: ${formatPaise(totalExpensePaise)}\n` +
      `Net Surplus: ${formatPaise(netSavingsPaise)} (${savingsRate}% savings rate)\n\n` +
      `CATEGORY BREAKDOWN:\n` +
      categorySpending.map(c => `- ${c.name}: ${formatPaise(c.spent)} (${c.percentage}%)`).join('\n') +
      `\n\nMEMBER EXPENDITURES:\n` +
      memberSpending.map(m => `- ${m.member.user.name} (${m.member.role}): ${formatPaise(m.spent)} (${m.percentage}%)`).join('\n');

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family_financial_statement_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
            Financial Reports & Trends
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
            Comprehensive analytics of income, category burn, member allocations, and cashflow
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={reportPeriod}
            onChange={e => setReportPeriod(e.target.value as any)}
          >
            <option value="current_month">September 2026 (Current Cycle)</option>
            <option value="last_month">August 2026</option>
            <option value="year_to_date">Year to Date (2026)</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleExportFullReport}>
            <Download size={14} /> Export Statement
          </button>
        </div>
      </div>

      {/* Cash-Flow Summary Strip (Section 20) */}
      <div className="grid-responsive-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--sage)' }}>
          <div className="stat-label">
            <span>Total Family Inflow</span>
            <ArrowUpRight size={16} color="var(--sage)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--sage)' }}>{formatPaise(totalIncomePaise)}</div>
          <div className="stat-meta">Deposited into family accounts</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--rust)' }}>
          <div className="stat-label">
            <span>Total Family Outflow</span>
            <ArrowDownLeft size={16} color="var(--rust)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--rust)' }}>{formatPaise(totalExpensePaise)}</div>
          <div className="stat-meta">Expenses across all members</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--brass)' }}>
          <div className="stat-label">
            <span>Net Liquid Surplus</span>
            <Wallet size={16} color="var(--brass)" />
          </div>
          <div className="stat-value">{formatPaise(netSavingsPaise)}</div>
          <div className="stat-meta">{savingsRate}% retention rate</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--sky)' }}>
          <div className="stat-label">
            <span>Committed Recurring</span>
            <Calendar size={16} color="var(--sky)" />
          </div>
          <div className="stat-value">
            {formatPaise(recurring.reduce((s, r) => s + r.amount, 0))}
          </div>
          <div className="stat-meta">5 automated obligations</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid-2col">
        {/* Category Breakdown Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Expenditure by Category</div>
              <div className="card-subtitle">Distribution of family expenses</div>
            </div>
            <div className="brand-icon-wrap" style={{ width: 34, height: 34 }}>
              <PieChart size={16} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categorySpending.map(cat => (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        backgroundColor: cat.color,
                      }}
                    ></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ fontWeight: 700 }}>{formatPaise(cat.spent)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>({cat.percentage}%)</span>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '7px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Spending Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Member Spending Distribution</div>
              <div className="card-subtitle">Expenditures traced by individual family member</div>
            </div>
            <div className="brand-icon-wrap" style={{ width: 34, height: 34 }}>
              <Users size={16} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {memberSpending.map(({ member, spent, percentage }) => (
              <div
                key={member.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: 'var(--paper-dim)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.user.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--brass)', fontWeight: 600 }}>
                        {member.role.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>
                      {formatPaise(spent)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      {percentage}% of family total
                    </div>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%`, backgroundColor: 'var(--brass)' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
