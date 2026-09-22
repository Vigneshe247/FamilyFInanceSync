/* =========================================================
   DASHBOARD PAGE — PERSONAL & FAMILY FINANCE MONITORING
   Sections 5, 6, 7, 8, 11, 14, 15, 23, 24, 25, 26, 38
   ========================================================= */

import React, { useState, useMemo } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { usePermissions } from '../../context/FamilyContext';
import { ROLE_DISPLAY_NAMES, normalizeRole } from '../../utils/permissions';
import { formatPaise, formatDate } from '../../utils/currency';
import { StockOverviewChart } from './components/StockOverviewChart';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Plus,
  Users,
  Wallet,
  CheckCircle2,
  Calendar,
  Tag,
  CreditCard,
  PieChart as PieIcon,
  Shield,
  Layers,
  ArrowRight,
  Activity,
  Filter,
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
  setActiveTab,
}) => {
  const {
    currentMember,
    members,
    categories,
    transactions,
    accounts,
    requests,
  } = useFamilyFinance();

  const {
    isFamilyHead,
    isSpouse,
    isSon,
    isDaughter,
    isChild,
    isGrandparent,
    isViewer,
  } = usePermissions();

  const isHead = isFamilyHead;
  const isSonOrDaughter = isSon || isDaughter || isChild;

  // Transaction filter state for recent transactions list
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Current month string e.g. "September 2026"
  const currentMonthDisplay = useMemo(() => {
    // If demo transactions exist in 2026, show September 2026
    const has2026 = transactions.some(t => t.transaction_date.startsWith('2026'));
    if (has2026) return 'September 2026';
    return new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [transactions]);

  // ================= 1. PERSONAL FINANCIAL DATA (All Members) =================
  const personalTransactions = useMemo(() => {
    return transactions.filter(t => t.user_id === currentMember.user_id);
  }, [transactions, currentMember.user_id]);

  const personalIncomePaise = useMemo(() => {
    return personalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [personalTransactions]);

  const personalExpensePaise = useMemo(() => {
    return personalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [personalTransactions]);

  const personalBalancePaise = personalIncomePaise - personalExpensePaise;
  const personalTxCount = personalTransactions.length;

  // Son / Daughter Allowance Tracking (Section 11)
  const childAllowancePaise = currentMember.monthly_allowance || 500000; // ₹5,000 default
  const childSpentPaise = personalExpensePaise;
  const childRemainingPaise = Math.max(0, childAllowancePaise - childSpentPaise);
  const childSpendPercent = childAllowancePaise > 0
    ? Math.min(100, Math.round((childSpentPaise / childAllowancePaise) * 100))
    : 0;

  // Personal Spending by Category
  const personalCategorySpending = useMemo(() => {
    const map = new Map<string, { categoryId: string; name: string; color: string; amount: number }>();

    personalTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catName = t.custom_category ? `Other (${t.custom_category})` : (cat?.name || 'Other');
        const color = cat?.color || '#00B4B6';

        const existing = map.get(t.category_id) || { categoryId: t.category_id, name: catName, color, amount: 0 };
        existing.amount += t.amount;
        map.set(t.category_id, existing);
      });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [personalTransactions, categories]);

  const highestPersonalCategory = personalCategorySpending[0] || null;

  // ================= 2. FAMILY FINANCIAL MONITORING (Family Head Only, Sections 6, 7, 24, 25) =================
  const sharedIncomeMembers = useMemo(() => {
    return members.filter(m => m.income_sharing_enabled !== false);
  }, [members]);

  const sharedExpenseMembers = useMemo(() => {
    return members.filter(m => m.expense_sharing_enabled !== false);
  }, [members]);

  const sharedIncomeMemberIds = useMemo(() => {
    return new Set(sharedIncomeMembers.map(m => m.user_id));
  }, [sharedIncomeMembers]);

  const sharedExpenseMemberIds = useMemo(() => {
    return new Set(sharedExpenseMembers.map(m => m.user_id));
  }, [sharedExpenseMembers]);

  const familyIncomePaise = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && sharedIncomeMemberIds.has(t.user_id))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, sharedIncomeMemberIds]);

  const familyExpensePaise = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && sharedExpenseMemberIds.has(t.user_id))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, sharedExpenseMemberIds]);

  const familyBalancePaise = familyIncomePaise - familyExpensePaise;
  const activeMembers = members.filter(m => m.status === 'active');

  // Permitted Family Transactions (Section 15)
  const familyPermittedTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.type === 'income') return sharedIncomeMemberIds.has(t.user_id);
      if (t.type === 'expense') return sharedExpenseMemberIds.has(t.user_id);
      return false;
    });
  }, [transactions, sharedIncomeMemberIds, sharedExpenseMemberIds]);

  // Family Category Spending Breakdown
  const familyCategorySpending = useMemo(() => {
    const map = new Map<string, { categoryId: string; name: string; color: string; amount: number }>();
    familyPermittedTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catName = t.custom_category ? `Other (${t.custom_category})` : (cat?.name || 'Other');
        const color = cat?.color || '#00B4B6';

        const existing = map.get(t.category_id) || { categoryId: t.category_id, name: catName, color, amount: 0 };
        existing.amount += t.amount;
        map.set(t.category_id, existing);
      });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [familyPermittedTransactions, categories]);

  // Filtered recent transactions list
  const recentDisplayTransactions = useMemo(() => {
    const list = isHead ? transactions : personalTransactions;
    return list
      .filter(t => {
        if (txFilter === 'income') return t.type === 'income';
        if (txFilter === 'expense') return t.type === 'expense';
        return true;
      })
      .slice(0, 7);
  }, [isHead, transactions, personalTransactions, txFilter]);

  // Category donut calculation
  const donutSource = isHead ? familyCategorySpending : personalCategorySpending;
  const donutTotal = donutSource.reduce((s, c) => s + c.amount, 0);
  const donutSlices = useMemo(() => {
    if (donutTotal === 0) return [];
    let cumulative = 0;
    return donutSource.map(item => {
      const pct = (item.amount / donutTotal) * 100;
      const slice = {
        ...item,
        percentage: pct,
        offset: cumulative,
      };
      cumulative += pct;
      return slice;
    });
  }, [donutSource, donutTotal]);

  return (
    <div className="neo-page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              {isHead ? 'Family Financial Overview' : 'Personal Financial Overview'}
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: isHead ? 'rgba(5, 150, 105, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                color: isHead ? '#059669' : '#6366F1',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {ROLE_DISPLAY_NAMES[normalizeRole(currentMember.role)] || currentMember.role}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {currentMonthDisplay} • Tracking for {currentMember.user.name}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {!isViewer && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenNewTx('income')}
                style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowUpRight size={16} color="#059669" />
                <span>+ Add Income</span>
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onOpenNewTx('expense')}
                style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowDownLeft size={16} />
                <span>+ Add Expense</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Son / Daughter Special Allowance Dashboard (Section 11) */}
      {isSonOrDaughter && (
        <div
          className="neo-card"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366F1', fontWeight: 700 }}>
                {ROLE_DISPLAY_NAMES[normalizeRole(currentMember.role)]} Dashboard
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                Monthly Allowance Tracker
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {currentMonthDisplay} allowance budget
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Allowance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                  {formatPaise(childAllowancePaise)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spent</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#EF4444' }}>
                  {formatPaise(childSpentPaise)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#059669' }}>
                  {formatPaise(childRemainingPaise)}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onOpenNewTx('expense')}
                style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'center' }}
              >
                <Plus size={15} /> Add Expense
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <span>Spent {childSpendPercent}% of allowance</span>
              <span>{formatPaise(childRemainingPaise)} available</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${childSpendPercent}%`,
                  background: childSpendPercent > 90 ? '#EF4444' : childSpendPercent > 70 ? '#F59E0B' : '#6366F1',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Personal Financial Overview KPI Cards (Section 5) */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
          Personal Financial Overview
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Total Income */}
          <div className="neo-card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Income
              </span>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="#059669" />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
              {formatPaise(personalIncomePaise)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Personal receipts ({currentMonthDisplay})
            </div>
          </div>

          {/* Total Expenses */}
          <div className="neo-card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Expenses
              </span>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={16} color="#EF4444" />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
              {formatPaise(personalExpensePaise)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Personal spending ({currentMonthDisplay})
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="neo-card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Remaining Balance
              </span>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={16} color="#6366F1" />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: personalBalancePaise >= 0 ? '#059669' : '#EF4444', marginTop: '0.5rem' }}>
              {formatPaise(personalBalancePaise)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Personal net savings
            </div>
          </div>

          {/* Transactions Count */}
          <div className="neo-card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Transactions
              </span>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={16} color="#F59E0B" />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
              {personalTxCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Recorded this month
            </div>
          </div>
        </div>
      </div>

      {/* 4. FAMILY FINANCIAL MONITORING (Section 6 & 7 - Dedicated Section for Family Head) */}
      {isHead && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
                Family Head — Financial Monitoring
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Combined Family Cash Flow & Shared Accounts
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('members')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Users size={14} /> Manage Family Members ({activeMembers.length})
            </button>
          </div>

          {/* Family Monitoring KPI Cards (Section 7, 24, 25) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* Family Total Income */}
            <div className="neo-card" style={{ padding: '1.15rem', borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Family Total Income
                </span>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, background: 'rgba(5, 150, 105, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  +8.2% vs last mo
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                {formatPaise(familyIncomePaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                From {sharedIncomeMembers.length} income-sharing members
              </div>
            </div>

            {/* Family Total Expenses */}
            <div className="neo-card" style={{ padding: '1.15rem', borderLeft: '4px solid #EF4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Family Total Expenses
                </span>
                <span style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  Shared bills
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                {formatPaise(familyExpensePaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                From {sharedExpenseMembers.length} expense-sharing members
              </div>
            </div>

            {/* Family Balance */}
            <div className="neo-card" style={{ padding: '1.15rem', borderLeft: '4px solid #6366F1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Family Balance
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 700, background: 'rgba(99, 102, 241, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  Net Surplus
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: familyBalancePaise >= 0 ? '#059669' : '#EF4444', marginTop: '0.5rem' }}>
                {formatPaise(familyBalancePaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Family pool remaining
              </div>
            </div>

            {/* Active Family Members (Section 23) */}
            <div
              className="neo-card"
              onClick={() => setActiveTab('members')}
              style={{
                padding: '1.15rem',
                borderLeft: '4px solid #F59E0B',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              title="Click to view Family Members"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Active Family Members
                </span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                {activeMembers.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeMembers.map(m => m.user.name.split(' ')[0]).join(', ')}
              </div>
            </div>
          </div>

          {/* Monthly Family Spending Interactive Chart */}
          <div className="neo-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Monthly Family Spending & Cash Flow</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Interactive trendline across family income and expenses
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {currentMonthDisplay}
              </div>
            </div>
            <StockOverviewChart
              transactions={familyPermittedTransactions}
              totalIncomePaise={familyIncomePaise}
              totalExpensePaise={familyExpensePaise}
            />
          </div>

          {/* Family Linked Members Summary (Section 6) */}
          <div className="neo-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Linked Family Members</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Members linked to family and their sharing permissions
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('members')}
              >
                View All
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {members.map(member => (
                <div
                  key={member.id}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-canvas, rgba(0,0,0,0.02))',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <img
                    src={member.user.avatar_url}
                    alt={member.user.name}
                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.user.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {ROLE_DISPLAY_NAMES[normalizeRole(member.role)] || member.role}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.35rem',
                          borderRadius: '4px',
                          background: member.income_sharing_enabled ? 'rgba(5, 150, 105, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: member.income_sharing_enabled ? '#059669' : '#EF4444',
                        }}
                      >
                        Income: {member.income_sharing_enabled ? '✓' : '✕'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.35rem',
                          borderRadius: '4px',
                          background: member.expense_sharing_enabled ? 'rgba(5, 150, 105, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: member.expense_sharing_enabled ? '#059669' : '#EF4444',
                        }}
                      >
                        Expense: {member.expense_sharing_enabled ? '✓' : '✕'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Spending Summary & Category Breakdown (Section 5 & 12) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Spending Summary Card */}
        <div className="neo-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {isHead ? 'Family Spending Summary' : 'Personal Spending Summary'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentMonthDisplay} expenses by category
              </span>
            </div>
            {highestPersonalCategory && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Highest Category</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {highestPersonalCategory.name}
                </div>
              </div>
            )}
          </div>

          {donutSource.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No expenses recorded yet for this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {donutSource.slice(0, 6).map(item => {
                const pct = donutTotal > 0 ? ((item.amount / donutTotal) * 100).toFixed(1) : '0';
                return (
                  <div key={item.categoryId} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {formatPaise(item.amount)}{' '}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: item.color,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions (Section 14 & 15) */}
        <div className="neo-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Recent Transactions</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isHead ? 'Permitted family transactions' : 'Your personal transactions'}
              </span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('transactions')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem' }}>
            <button
              className={`btn btn-sm ${txFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setTxFilter('all')}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${txFilter === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setTxFilter('expense')}
            >
              Expense (-)
            </button>
            <button
              className={`btn btn-sm ${txFilter === 'income' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setTxFilter('income')}
            >
              Income (+)
            </button>
          </div>

          {recentDisplayTransactions.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentDisplayTransactions.map(tx => {
                const cat = categories.find(c => c.id === tx.category_id);
                const isExpense = tx.type === 'expense';
                const member = members.find(m => m.user_id === tx.user_id);
                const displayCategory = tx.custom_category ? `Other (${tx.custom_category})` : (cat?.name || 'General');

                return (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '10px',
                      background: 'var(--bg-canvas, rgba(0,0,0,0.02))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          background: isExpense ? 'rgba(239, 68, 68, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                          color: isExpense ? '#EF4444' : '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isExpense ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.description}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                          <span>{displayCategory}</span>
                          <span>•</span>
                          <span>{formatDate(tx.transaction_date)}</span>
                          {isHead && member && member.user_id !== currentMember.user_id && (
                            <>
                              <span>•</span>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{member.user.name.split(' ')[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: isExpense ? '#EF4444' : '#059669',
                        }}
                      >
                        {isExpense ? '-' : '+'} {formatPaise(tx.amount)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {tx.payment_method || 'Cash'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
