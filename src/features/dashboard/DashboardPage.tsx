/* =========================================================
   FINOVA & CREXTIO DASHBOARD (Exact 3-Column Luxury Neo-Mint UI)
   Restored from version control with live data synchronization
   ========================================================= */

import React, { useState, useMemo } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { usePermissions } from '../../context/FamilyContext';
import { formatPaise, formatDate } from '../../utils/currency';
import { ROLE_DISPLAY_NAMES, normalizeRole } from '../../utils/permissions';
import {
  Eye,
  EyeOff,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Plus,
  Send,
  Calculator,
  Landmark,
  PiggyBank,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Target,
  ListTodo,
  CheckSquare,
  Square,
  Trash2,
  UploadCloud,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenNewTx: (initialType?: 'expense' | 'income') => void;
  onOpenNewRequest: () => void;
  onOpenAffordability?: () => void;
  setActiveTab: (tab: string) => void;
  onOpenImportModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewTx,
  onOpenNewRequest,
  onOpenAffordability,
  setActiveTab,
  onOpenImportModal,
}) => {
  const {
    currentMember,
    members,
    categories,
    transactions,
    accounts,
    requests,
    auditLogs,
    createGoal,
  } = useFamilyFinance();

  const {
    isFamilyHead,
    isSon,
    isDaughter,
    isChild: isPermChild,
  } = usePermissions();

  const isHead = isFamilyHead || currentMember.role === 'FAMILY_HEAD';
  const isChild =
    isPermChild ||
    isSon ||
    isDaughter ||
    currentMember.role === 'CHILD' ||
    currentMember.role === 'SON' ||
    currentMember.role === 'DAUGHTER';

  const [balanceVisible, setBalanceVisible] = useState(true);

  // Financial Plan To-Do Tasks State
  const [planTasks, setPlanTasks] = useState<Array<{ id: string; title: string; completed: boolean; tag: string }>>([
    { id: '1', title: 'Rebalance Emergency Vault (₹2.5L)', completed: true, tag: 'Vault' },
    { id: '2', title: 'Approve child allowance request', completed: false, tag: 'Requests' },
    { id: '3', title: 'Set up auto-pay for utility bills', completed: true, tag: 'Bills' },
    { id: '4', title: 'Auto-transfer ₹10,000 to Savings', completed: false, tag: 'Savings' },
    { id: '5', title: 'Review Q3 financial budget allocations', completed: false, tag: 'Audit' },
  ]);

  const [newTaskInput, setNewTaskInput] = useState('');
  const [convertedGoalMsg, setConvertedGoalMsg] = useState<string>('');

  const handleToggleTask = (id: string) => {
    setPlanTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setPlanTasks(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newTaskInput.trim(),
        completed: false,
        tag: 'Plan',
      },
    ]);
    setNewTaskInput('');
  };

  const handleDeleteTask = (id: string) => {
    setPlanTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleConvertTaskToGoal = (task: { id: string; title: string; tag: string }) => {
    createGoal({
      name: `Plan: ${task.title}`,
      description: `Converted from Financial Action Plan item (${task.tag})`,
      target_amount: 15000000,
      target_date: '2027-03-31',
      created_by: currentMember.user_id,
      status: 'in_progress',
    });
    setPlanTasks(prev => prev.map(t => (t.id === task.id ? { ...t, completed: true } : t)));
    setConvertedGoalMsg(`✓ Converted "${task.title}" to Active Family Goal!`);
    setTimeout(() => setConvertedGoalMsg(''), 3500);
  };

  // Interactive Timeframe Dropdown State
  const [overviewTimeframe, setOverviewTimeframe] = useState<'this_month' | 'last_month' | 'q3' | 'yearly'>('this_month');

  // Role-Based Data Privacy Scoping (RBAC):
  // Family Head: Monitors ALL family data & wealth
  // Adult Member: Views shared family accounts + personal transactions
  // Child: Views ONLY child pocket balance, allowance tracker, child transactions & requests
  const scopedTransactions = useMemo(() => {
    if (isHead) return transactions;
    if (isChild) return transactions.filter(t => t.user_id === currentMember.user_id);
    return transactions.filter(t => t.is_shared || t.user_id === currentMember.user_id);
  }, [isHead, isChild, transactions, currentMember.user_id]);

  const scopedAccounts = useMemo(() => {
    if (isHead) return accounts;
    if (isChild) {
      const childAccounts = accounts.filter(
        a => a.name.toLowerCase().includes('pocket') || a.name.toLowerCase().includes('child')
      );
      return childAccounts.length > 0 ? childAccounts : accounts.slice(0, 1);
    }
    return accounts.filter(a => a.is_shared || a.name.includes(currentMember.user.name));
  }, [isHead, isChild, accounts, currentMember.user.name]);

  // Timeframe multiplier simulation
  const timeframeMultiplier = overviewTimeframe === 'last_month' ? 1.08 : overviewTimeframe === 'q3' ? 3.1 : overviewTimeframe === 'yearly' ? 11.5 : 1;

  // Financial aggregates
  const totalIncomePaise = useMemo(() => {
    return Math.round(
      scopedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) * timeframeMultiplier
    );
  }, [scopedTransactions, timeframeMultiplier]);

  const totalExpensePaise = useMemo(() => {
    return Math.round(
      scopedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) * timeframeMultiplier
    );
  }, [scopedTransactions, timeframeMultiplier]);

  const totalLiquidPaise = useMemo(() => {
    return scopedAccounts.reduce((sum, a) => sum + a.balance, 0);
  }, [scopedAccounts]);

  // Child metrics
  const childAllowancePaise = currentMember.monthly_allowance || 500000;
  const childTransactions = useMemo(() => {
    return transactions.filter(t => t.user_id === currentMember.user_id && t.type === 'expense');
  }, [transactions, currentMember.user_id]);

  const childSpentPaise = useMemo(() => {
    return childTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [childTransactions]);

  const childRemainingPaise = Math.max(0, childAllowancePaise - childSpentPaise);
  const childSpendPercent = childAllowancePaise > 0
    ? Math.min(100, Math.round((childSpentPaise / childAllowancePaise) * 100))
    : 0;

  const childRequests = useMemo(() => {
    return requests.filter(r => r.requested_by === currentMember.user_id);
  }, [requests, currentMember.user_id]);

  // Dynamic Spending Breakdown by Category
  const categorySpending = useMemo(() => {
    const map = new Map<string, { categoryId: string; name: string; color: string; amount: number }>();
    scopedTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catName = t.custom_category ? `Other (${t.custom_category})` : (cat?.name || 'General');
        const color = cat?.color || '#22A05B';

        const existing = map.get(t.category_id) || { categoryId: t.category_id, name: catName, color, amount: 0 };
        existing.amount += t.amount;
        map.set(t.category_id, existing);
      });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [scopedTransactions, categories]);

  const totalSpendingPaise = useMemo(() => {
    return categorySpending.reduce((sum, c) => sum + c.amount, 0);
  }, [categorySpending]);

  const formatActionText = (action: string) => {
    switch (action) {
      case 'SPENDING_LIMIT_UPDATED': return 'Spending limit adjusted';
      case 'REQUEST_SUBMITTED': return 'New expense request filed';
      case 'REQUEST_APPROVED': return 'Expense request approved';
      case 'BUDGET_UPDATED': return 'Monthly budget adjusted';
      case 'ROLE_PERMISSION_UPDATED': return 'Security permissions updated';
      case 'TRANSACTION_RECORDED': return 'Transaction recorded';
      case 'SAVINGS_GOAL_CREATED': return 'Savings goal created';
      default: return action.toLowerCase().replace(/_/g, ' ');
    }
  };

  const activeMembersCount = members.filter(m => m.status === 'active').length;

  return (
    <div className="neo-page-body">
      {/* ================= CHILD MODE: CREXTIO DESIGN ================= */}
      {isChild ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Welcome In & Status Segments Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome in, {currentMember.user.name}
              </h1>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#1B241E', color: '#FFF', borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 600 }}>
                  Allowance {childSpendPercent}%
                </div>
                <div style={{ background: 'var(--mint-primary)', color: '#FFF', borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 600 }}>
                  Pocket Balance {100 - childSpendPercent}%
                </div>
                <div style={{ background: 'rgba(34, 160, 91, 0.2)', color: 'var(--mint-dark)', borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, border: '1px dashed var(--mint-primary)' }}>
                  Education Goal 60%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {formatPaise(childRemainingPaise)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pocket Balance</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--amber-accent)' }}>
                  {childRequests.filter(r => r.status === 'pending').length}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Requests</div>
              </div>
            </div>
          </div>

          {/* Child Cards Grid (Crextio style) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Profile Card with Balance Pill */}
            <div className="neo-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '170px' }}>
                <img
                  src={currentMember.user.avatar_url}
                  alt={currentMember.user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(16, 24, 20, 0.65)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    padding: '0.5rem 0.85rem',
                    color: '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{currentMember.user.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#D5F2E2' }}>
                      {ROLE_DISPLAY_NAMES[normalizeRole(currentMember.role)] || 'Child Member'}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {formatPaise(childRemainingPaise)}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={onOpenNewRequest}
                >
                  <Plus size={15} /> Ask Family Head (+ Request)
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onOpenNewTx('expense')}
                >
                  <ArrowDownLeft size={15} /> Record Expense
                </button>
              </div>
            </div>

            {/* Progress / Activity Bar Chart */}
            <div className="neo-card">
              <div className="neo-card-header">
                <div>
                  <div className="neo-card-title">Allowance Progress</div>
                  <div className="neo-card-subtitle">{formatPaise(childSpentPaise)} of {formatPaise(childAllowancePaise)}</div>
                </div>
                <span className="badge badge-sage">{childSpendPercent}% SPENT</span>
              </div>

              {/* Vertical Bar Chart (Crextio style) */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', padding: '0 0.5rem', marginTop: '1rem' }}>
                {[
                  { day: 'S', h: '30%', active: false },
                  { day: 'M', h: '60%', active: false },
                  { day: 'T', h: '45%', active: false },
                  { day: 'W', h: '85%', active: false },
                  { day: 'T', h: '70%', active: false },
                  { day: 'F', h: `${Math.min(95, Math.max(25, childSpendPercent))}%`, active: true, val: formatPaise(childSpentPaise) },
                  { day: 'S', h: '20%', active: false },
                ].map((col, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    {col.active && (
                      <span style={{ fontSize: '0.68rem', background: 'var(--mint-primary)', color: '#FFF', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700 }}>
                        {col.val}
                      </span>
                    )}
                    <div
                      style={{
                        width: '12px',
                        height: col.h,
                        borderRadius: '9999px',
                        background: col.active ? 'var(--mint-primary)' : 'var(--text-main)',
                      }}
                    ></div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{col.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time / Allowance Ring Gauge Tracker */}
            <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div className="neo-card-title" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>
                Pocket Allowance Tracker
              </div>
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0.5rem 0' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--bg-canvas)"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--mint-primary)"
                    strokeWidth="3.5"
                    strokeDasharray={`${Math.min(100, Math.max(0, 100 - childSpendPercent))}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {formatPaise(childRemainingPaise)}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available</span>
                </div>
              </div>
            </div>

            {/* Dark Onboarding Task / Request Card */}
            <div
              style={{
                background: 'var(--card-dark)',
                borderRadius: 'var(--radius-card)',
                padding: '1.35rem',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>My Requests & Tasks</div>
                <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.78rem' }}>
                  {childRequests.filter(r => r.status === 'approved').length} / {childRequests.length} Resolved
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {childRequests.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#8A9E93', fontSize: '0.8rem' }}>
                    No requests submitted yet.
                  </div>
                ) : (
                  childRequests.slice(0, 4).map(r => (
                    <div
                      key={r.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.75rem',
                        borderRadius: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94A69C' }}>{formatPaise(r.amount)}</div>
                      </div>
                      {r.status === 'approved' ? (
                        <CheckCircle2 size={18} color="var(--mint-vibrant)" />
                      ) : (
                        <span className="badge badge-brass" style={{ fontSize: '0.68rem' }}>PENDING</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= EXECUTIVE FINOVA 3-COLUMN VIEW ================= */
        <div className="finova-grid-3col">
          {/* ================= COLUMN 1 (LEFT) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* 1. Total Balance Card */}
            <div className="neo-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>{isHead ? 'Total Family Balance' : 'Total Balance'}</span>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
                      onClick={() => setBalanceVisible(!balanceVisible)}
                    >
                      {balanceVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>

                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                    {balanceVisible ? formatPaise(totalLiquidPaise) : '••••••••'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--mint-primary)', fontWeight: 600 }}>
                    <TrendingUp size={14} />
                    <span>+12.5% from last month</span>
                  </div>
                </div>

                {/* Money bag green pill icon */}
                <div
                  className="pastel-icon-box"
                  style={{ background: '#D5F2E2', color: 'var(--mint-primary)' }}
                >
                  <PiggyBank size={22} />
                </div>
              </div>
            </div>

            {/* 2. Financial Action Plan & To-Do List Widget */}
            <div
              style={{
                background: 'var(--card-dark)',
                borderRadius: 'var(--radius-card)',
                padding: '1.25rem',
                color: '#FFFFFF',
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                position: 'relative',
              }}
            >
              {/* Widget Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '10px',
                      background: 'rgba(34, 160, 91, 0.2)',
                      color: 'var(--mint-vibrant)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ListTodo size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF', lineHeight: 1.2 }}>
                      Action Plan & To-Do
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A69C' }}>
                      Financial Milestones & Goal Converter
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {onOpenImportModal && (
                    <button
                      type="button"
                      style={{
                        background: 'rgba(62, 139, 245, 0.2)',
                        color: 'var(--sky-accent)',
                        border: '1px solid rgba(62, 139, 245, 0.4)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      onClick={onOpenImportModal}
                      title="Import Family Excel / DOCX / PDF"
                    >
                      <UploadCloud size={12} /> Import
                    </button>
                  )}
                  <span
                    style={{
                      background: 'rgba(38, 194, 109, 0.2)',
                      color: '#4ADE80',
                      border: '1px solid rgba(38, 194, 109, 0.35)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {planTasks.filter(t => t.completed).length} / {planTasks.length} Done
                  </span>
                </div>
              </div>

              {/* Converted Goal Success Toast */}
              {convertedGoalMsg && (
                <div
                  style={{
                    background: 'rgba(34, 160, 91, 0.25)',
                    border: '1px solid var(--mint-primary)',
                    color: '#D5F2E2',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <CheckCircle2 size={14} color="var(--mint-vibrant)" />
                  <span>{convertedGoalMsg}</span>
                </div>
              )}

              {/* Progress Bar */}
              {planTasks.length > 0 && (
                <div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.round((planTasks.filter(t => t.completed).length / planTasks.length) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #22A05B, #26C26D)',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upgraded 2-Row Layout To-Do List with Convert to Goal Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '235px', overflowY: 'auto' }}>
                {planTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      background: task.completed ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.07)',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    onClick={() => handleToggleTask(task.id)}
                  >
                    {/* Row 1: Checkbox + Full Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%' }}>
                      <div style={{ color: task.completed ? 'var(--mint-vibrant)' : '#7A8E83', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: task.completed ? '#8A9E93' : '#FFFFFF',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          fontWeight: task.completed ? 400 : 600,
                          lineHeight: '1.3',
                          wordBreak: 'break-word',
                        }}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Row 2: Tag + Convert Button + Delete Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1.45rem', marginTop: '0.1rem' }}>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#C8D8CE',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        {task.tag}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {!task.completed && (
                          <button
                            type="button"
                            style={{
                              background: 'rgba(34, 160, 91, 0.25)',
                              color: '#4ADE80',
                              border: '1px solid rgba(34, 160, 91, 0.4)',
                              borderRadius: '6px',
                              padding: '0.18rem 0.5rem',
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleConvertTaskToGoal(task);
                            }}
                            title="Convert item to an active Family Savings Goal"
                          >
                            <Target size={11} /> Convert to Plan
                          </button>
                        )}

                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#7A8E83',
                            cursor: 'pointer',
                            padding: '0.15rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          title="Delete task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Plan/Task Input */}
              <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                <input
                  type="text"
                  placeholder="+ Add new plan or task..."
                  value={newTaskInput}
                  onChange={e => setNewTaskInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '0.45rem 0.75rem',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--mint-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </form>
            </div>

            {/* 3. Accounts List (+ Add) */}
            <div className="neo-card">
              <div className="neo-card-header">
                <div className="neo-card-title">Accounts</div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: '9999px', padding: '0.2rem 0.65rem' }}
                  onClick={() => setActiveTab('accounts')}
                >
                  + Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {scopedAccounts.slice(0, 4).map((acc, i) => {
                  const bgColors = ['#D5F2E2', '#E1EDFE', '#F3E8FC', '#FEF6E6'];
                  const iconColors = ['var(--mint-primary)', 'var(--sky-accent)', 'var(--purple-accent)', 'var(--amber-accent)'];
                  const IconComp = i === 0 ? Landmark : i === 1 ? PiggyBank : i === 2 ? ShieldCheck : Wallet;

                  return (
                    <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="pastel-icon-box" style={{ background: bgColors[i % 4], color: iconColors[i % 4] }}>
                          <IconComp size={19} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {acc.account_number_mask || 'Physical Vault'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem' }}>
                        {formatPaise(acc.balance)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('accounts')}
              >
                <span>View all accounts</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2 (CENTER) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* 4. Financial Overview (Spline Area Chart) */}
            <div className="neo-card">
              <div className="neo-card-header">
                <div>
                  <div className="neo-card-title">Overview</div>
                  <div className="neo-card-subtitle">
                    {overviewTimeframe === 'this_month' && 'September 2026 Inflow vs Outflow'}
                    {overviewTimeframe === 'last_month' && 'August 2026 Inflow vs Outflow'}
                    {overviewTimeframe === 'q3' && 'Q3 2026 Quarterly Financial Inflow vs Outflow'}
                    {overviewTimeframe === 'yearly' && 'FY 2026 YTD Annual Inflow vs Outflow'}
                  </div>
                </div>

                {/* Interactive Timeframe Dropdown Selector */}
                <select
                  value={overviewTimeframe}
                  onChange={e => setOverviewTimeframe(e.target.value as any)}
                  style={{
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '9999px',
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <option value="this_month">This Month (Sep 2026)</option>
                  <option value="last_month">Last Month (Aug 2026)</option>
                  <option value="q3">Quarterly (Q3 2026)</option>
                  <option value="yearly">Yearly (FY 2026)</option>
                </select>
              </div>

              {/* Metric stats row */}
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mint-primary)' }}></span>
                    <span>Income</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {formatPaise(totalIncomePaise)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--mint-primary)', fontWeight: 700 }}>
                      ↑ +8.4%
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--sky-accent)' }}></span>
                    <span>Expense</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {formatPaise(totalExpensePaise)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--coral-accent)', fontWeight: 700 }}>
                      ↓ +3.2%
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Smooth Dual-Spline Area Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', height: '145px' }}>
                  <svg viewBox="0 0 500 160" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22A05B" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#22A05B" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3E8BF5" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3E8BF5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid guide lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(17, 26, 21, 0.05)" strokeDasharray="4 4" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(17, 26, 21, 0.05)" strokeDasharray="4 4" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(17, 26, 21, 0.05)" strokeDasharray="4 4" />

                    {/* Income Area & Spline Line */}
                    <path
                      d="M 0,110 C 80,70 140,120 220,50 C 300,-10 380,80 500,40 L 500,160 L 0,160 Z"
                      fill="url(#incomeGrad)"
                    />
                    <path
                      d="M 0,110 C 80,70 140,120 220,50 C 300,-10 380,80 500,40"
                      fill="none"
                      stroke="#22A05B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Expense Area & Spline Line */}
                    <path
                      d="M 0,140 C 90,125 150,150 230,105 C 310,60 390,125 500,85 L 500,160 L 0,160 Z"
                      fill="url(#expenseGrad)"
                    />
                    <path
                      d="M 0,140 C 90,125 150,150 230,105 C 310,60 390,125 500,85"
                      fill="none"
                      stroke="#3E8BF5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                    />

                    {/* Peak Point Tooltip Marker */}
                    <circle cx="220" cy="50" r="5" fill="#22A05B" stroke="#FFFFFF" strokeWidth="2" />
                    <g transform="translate(180, 16)">
                      <rect width="80" height="24" rx="12" fill="#1B241E" />
                      <text x="40" y="16" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        +₹85,000
                      </text>
                    </g>
                  </svg>
                </div>

                {/* X-axis date labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 1rem 0.25rem' }}>
                  <span>1 Sep</span>
                  <span>7 Sep</span>
                  <span>14 Sep</span>
                  <span>21 Sep</span>
                  <span>28 Sep</span>
                  <span>30 Sep</span>
                </div>
              </div>
            </div>

            {/* 5. Recent Transactions List */}
            <div className="neo-card">
              <div className="neo-card-header">
                <div className="neo-card-title">Recent Transactions</div>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--sky-accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setActiveTab('transactions')}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {scopedTransactions.slice(0, 5).map(tx => {
                  const isExp = tx.type === 'expense';
                  return (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          className="pastel-icon-box"
                          style={{
                            background: isExp ? '#FEF2F2' : '#D5F2E2',
                            color: isExp ? 'var(--coral-accent)' : 'var(--mint-primary)',
                          }}
                        >
                          {isExp ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                            {tx.description}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {formatDate(tx.transaction_date)} • {tx.payment_method || 'UPI'}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: isExp ? 'var(--coral-accent)' : 'var(--mint-primary)',
                        }}
                      >
                        {isExp ? '-' : '+'}
                        {formatPaise(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3 (RIGHT) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* 6. Quick Actions Dark Card */}
            <div className="quick-actions-dark-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>Quick Actions</div>
                <button
                  onClick={() => onOpenNewTx('expense')}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--mint-primary)',
                    color: '#FFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Record new transaction"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* 4 Square Action Tiles */}
              <div className="quick-actions-grid">
                <button className="action-tile-btn" onClick={() => onOpenNewTx('expense')}>
                  <div className="action-tile-icon-wrap" style={{ background: 'rgba(34, 160, 91, 0.2)', color: 'var(--mint-vibrant)' }}>
                    <Plus size={18} />
                  </div>
                  <span>Add Expense</span>
                </button>

                <button className="action-tile-btn" onClick={() => onOpenNewTx('income')}>
                  <div className="action-tile-icon-wrap" style={{ background: 'rgba(62, 139, 245, 0.2)', color: 'var(--sky-accent)' }}>
                    <ArrowUpRight size={17} />
                  </div>
                  <span>Add Income</span>
                </button>

                <button className="action-tile-btn" onClick={onOpenNewRequest}>
                  <div className="action-tile-icon-wrap" style={{ background: 'rgba(229, 161, 30, 0.2)', color: 'var(--amber-accent)' }}>
                    <Send size={16} />
                  </div>
                  <span>Request</span>
                </button>

                <button
                  className="action-tile-btn"
                  onClick={() => {
                    if (onOpenAffordability) onOpenAffordability();
                    else setActiveTab('affordability');
                  }}
                >
                  <div className="action-tile-icon-wrap" style={{ background: 'rgba(155, 81, 224, 0.2)', color: 'var(--purple-accent)' }}>
                    <Calculator size={16} />
                  </div>
                  <span>Afford This?</span>
                </button>
              </div>
            </div>

            {/* 7. Spending Breakdown (Donut Chart) */}
            <div className="neo-card">
              <div className="neo-card-header">
                <div className="neo-card-title">Spending Breakdown</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>This Month ▾</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', margin: '0.4rem 0 0.8rem' }}>
                {/* SVG Donut Chart */}
                <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                  <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#E5F2E6" strokeWidth="6" />
                    {/* Slices */}
                    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#22A05B" strokeWidth="6" strokeDasharray="35 65" strokeDashoffset="0" />
                    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#3E8BF5" strokeWidth="6" strokeDasharray="27 73" strokeDashoffset="-35" />
                    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#E5A11E" strokeWidth="6" strokeDasharray="15 85" strokeDashoffset="-62" />
                    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#9B51E0" strokeWidth="6" strokeDasharray="12 88" strokeDashoffset="-77" />
                    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#00B4B6" strokeWidth="6" strokeDasharray="11 89" strokeDashoffset="-89" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {totalSpendingPaise > 0 ? formatPaise(totalSpendingPaise) : '₹56.9k'}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Total</span>
                  </div>
                </div>

                {/* Category Percentages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, fontSize: '0.76rem' }}>
                  {categorySpending.length > 0 ? (
                    categorySpending.slice(0, 4).map(item => {
                      const pct = totalSpendingPaise > 0 ? Math.round((item.amount / totalSpendingPaise) * 100) : 0;
                      return (
                        <div key={item.categoryId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></span>
                            <span>{item.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22A05B' }}></span>
                          <span>Housing</span>
                        </div>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>35%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3E8BF5' }}></span>
                          <span>Food</span>
                        </div>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>27%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E5A11E' }}></span>
                          <span>Transport</span>
                        </div>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>15%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9B51E0' }}></span>
                          <span>Education</span>
                        </div>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>12%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 8. Recent Activity / Audit Log */}
            <div className="neo-card">
              <div className="neo-card-header">
                <div className="neo-card-title">Recent Activity</div>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--sky-accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setActiveTab('control_center')}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {auditLogs.slice(0, 3).map(log => {
                  const isPending = log.action.includes('REQUEST_SUBMITTED');
                  return (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          className="pastel-icon-box"
                          style={{
                            width: 32,
                            height: 32,
                            background: isPending ? '#FEF6E6' : '#E1EDFE',
                            color: isPending ? 'var(--amber-accent)' : 'var(--sky-accent)',
                          }}
                        >
                          {isPending ? <Clock size={15} /> : <ShieldCheck size={15} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {formatActionText(log.action)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {log.user_name}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`badge ${isPending ? 'badge-brass' : 'badge-sage'}`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {isPending ? 'PENDING' : 'SUCCESS'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM FLOATING TRUST PILLS ================= */}
      <div className="bottom-floating-pills">
        <button className="trust-pill-btn" onClick={() => setActiveTab('members')}>
          <Users size={16} />
          <span>{activeMembersCount} Active Family Members</span>
          <ChevronRight size={14} />
        </button>

        <button className="trust-pill-btn trust-pill-center" onClick={() => setActiveTab('transactions')}>
          <Landmark size={17} />
          <span>{formatPaise(totalIncomePaise)} Total Inflow • Live Sync</span>
          <ChevronRight size={16} />
        </button>

        <button className="trust-pill-btn" onClick={() => setActiveTab('control_center')}>
          <ShieldCheck size={16} />
          <span>99.9% Secure & Isolated</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
