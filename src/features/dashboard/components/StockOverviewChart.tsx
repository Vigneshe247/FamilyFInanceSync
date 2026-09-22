/* =========================================================
   STOCK MARKET STYLE OVERVIEW CHART — UPGRADED WITH FAMILY OPERATIONS
   Dynamic real-data financial chart with:
   - 100% Real-time synchronization with Family Operations & Selected Date Range
   - Filter by Family Member Operations: All Family, Shared Household, or Specific Members
   - Dynamic timeframe pills: 1W, 1M, 3M, 1Y, ALL, and Custom Calendar Date Range
   - Highlighted Calendar Date Range Picker
   - Full-height scaled spline area + volume bars + equity curve
   - Interactive crosshair with rich date tooltip showing family operations breakdown
   - Period-synced financial pulse: Net Surplus, Burn Rate, Peak Spend Day
   ========================================================= */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Transaction } from '../../../types';
import { formatPaise } from '../../../utils/currency';
import { useFamilyFinance } from '../../../context/FamilyFinanceContext';
import {
  TrendingUp,
  BarChart2,
  Activity,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
  X,
  Users,
  User,
  Home,
} from 'lucide-react';

interface DailyPoint {
  date: string;         // 'YYYY-MM-DD'
  label: string;        // display label e.g. '1 Sep'
  fullDateStr: string;  // e.g. '1 Sep 2026'
  income: number;       // paise
  expense: number;      // paise
  net: number;          // paise (income - expense)
  cumulative: number;   // paise running total
  txCount: number;
  dayTransactions: Transaction[];
}

type ChartMode = 'area' | 'volume' | 'equity';
type Timeframe = '1W' | '1M' | '3M' | '1Y' | 'ALL' | 'CUSTOM';

interface StockOverviewChartProps {
  transactions?: Transaction[];
  totalIncomePaise?: number;
  totalExpensePaise?: number;
}

function buildDailyPoints(transactions: Transaction[], startDate: Date, endDate: Date): DailyPoint[] {
  const points: DailyPoint[] = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  let cumulative = 0;

  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);
    const dayTx = transactions.filter(t => t.transaction_date.slice(0, 10) === dateStr);
    const income = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    cumulative += net;

    const month = cur.toLocaleString('en-IN', { month: 'short' });
    const day = cur.getDate();
    const year = cur.getFullYear();

    points.push({
      date: dateStr,
      label: `${day} ${month}`,
      fullDateStr: `${day} ${month} ${year}`,
      income,
      expense,
      net,
      cumulative,
      txCount: dayTx.length,
      dayTransactions: dayTx,
    });

    cur.setDate(cur.getDate() + 1);
  }

  return points;
}

function smooth(points: number[], window = 2): number[] {
  return points.map((val, i) => {
    const slice = points.slice(Math.max(0, i - window), Math.min(points.length, i + window + 1));
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function buildSvgPath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return '';
  let d = `M ${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  return d;
}

function getMemberRoleEmoji(role: string): string {
  const r = (role || '').toLowerCase();
  if (r.includes('head')) return '👑';
  if (r.includes('co_manager') || r.includes('manager') || r.includes('spouse')) return '💼';
  if (r.includes('child')) return '🎒';
  if (r.includes('grand') || r.includes('elder')) return '👵';
  return '👤';
}

function getMemberRoleLabel(role: string): string {
  return (role || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export const StockOverviewChart: React.FC<StockOverviewChartProps> = ({
  transactions: propTransactions,
}) => {
  const { transactions: contextTransactions, members, currentMember } = useFamilyFinance();

  // Family Operation Scope state: 'all' | 'shared' | member user_id
  const [operationScope, setOperationScope] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SVG_W = 500;
  const SVG_H = 170;
  const PAD_L = 10;
  const PAD_R = 10;
  const PAD_T = 16;
  const PAD_B = 22;

  // Real-time transactions source (from context or props)
  const baseTransactions = useMemo(() => {
    return propTransactions && propTransactions.length > 0 ? propTransactions : contextTransactions;
  }, [propTransactions, contextTransactions]);

  // Filter transactions strictly by the selected Family Operation
  const operationFilteredTransactions = useMemo(() => {
    const isChildUser = currentMember?.role === 'child' || currentMember?.role === 'CHILD';
    if (isChildUser) {
      return baseTransactions.filter(t => t.user_id === currentMember.user_id);
    }

    if (operationScope === 'all') {
      return baseTransactions;
    }
    if (operationScope === 'shared') {
      return baseTransactions.filter(t => t.is_shared);
    }
    return baseTransactions.filter(t => t.user_id === operationScope);
  }, [baseTransactions, operationScope, currentMember]);

  // Anchor date logic: newest transaction in the family or current date
  const anchorDate = useMemo(() => {
    const timestamps = operationFilteredTransactions
      .map(t => new Date(t.transaction_date).getTime())
      .filter(t => !isNaN(t));

    if (timestamps.length > 0) {
      return new Date(Math.max(...timestamps));
    }
    return new Date();
  }, [operationFilteredTransactions]);

  // Initial custom date bounds
  const defaultStartStr = useMemo(() => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, [anchorDate]);

  const defaultEndStr = useMemo(() => {
    return anchorDate.toISOString().slice(0, 10);
  }, [anchorDate]);

  const [customStart, setCustomStart] = useState<string>(defaultStartStr);
  const [customEnd, setCustomEnd] = useState<string>(defaultEndStr);

  // Compute active Start & End Dates synced to selected Timeframe
  const { startDate, endDate } = useMemo(() => {
    if (timeframe === 'CUSTOM') {
      const s = new Date(customStart + 'T00:00:00');
      const e = new Date(customEnd + 'T23:59:59');
      return {
        startDate: isNaN(s.getTime()) ? new Date(anchorDate.getTime() - 30 * 86400000) : s,
        endDate: isNaN(e.getTime()) ? anchorDate : e,
      };
    }

    const end = new Date(anchorDate);
    const start = new Date(anchorDate);

    if (timeframe === '1W') {
      start.setDate(end.getDate() - 7);
    } else if (timeframe === '1M') {
      start.setMonth(end.getMonth() - 1);
    } else if (timeframe === '3M') {
      start.setMonth(end.getMonth() - 3);
    } else if (timeframe === '1Y') {
      start.setFullYear(end.getFullYear() - 1);
    } else {
      // ALL: use earliest transaction date for this operation scope
      const dates = operationFilteredTransactions
        .map(t => new Date(t.transaction_date).getTime())
        .filter(t => !isNaN(t));

      if (dates.length > 0) {
        start.setTime(Math.min(...dates));
      } else {
        start.setFullYear(end.getFullYear() - 1);
      }
    }

    return { startDate: start, endDate: end };
  }, [timeframe, customStart, customEnd, anchorDate, operationFilteredTransactions]);

  // Daily points strictly within the synced date range and family operation scope
  const points = useMemo(
    () => buildDailyPoints(operationFilteredTransactions, startDate, endDate),
    [operationFilteredTransactions, startDate, endDate]
  );

  // Synchronized Financial Metrics for the chosen date range & family operation
  const periodIncome = useMemo(() => points.reduce((s, p) => s + p.income, 0), [points]);
  const periodExpense = useMemo(() => points.reduce((s, p) => s + p.expense, 0), [points]);
  const periodNet = periodIncome - periodExpense;
  const periodSavingsRate = periodIncome > 0 ? ((periodNet / periodIncome) * 100).toFixed(1) : '0.0';
  const isPositiveNet = periodNet >= 0;

  const daysInPeriod = Math.max(1, points.length);
  const avgDailySpend = Math.round(periodExpense / daysInPeriod);

  // Peak Days & High values in this date range & operation scope
  const highIncomeDay = useMemo(() => {
    let max = { amount: 0, label: '—' };
    points.forEach(p => {
      if (p.income > max.amount) max = { amount: p.income, label: p.label };
    });
    return max;
  }, [points]);

  const peakExpenseDay = useMemo(() => {
    let max = { amount: 0, label: '—' };
    points.forEach(p => {
      if (p.expense > max.amount) max = { amount: p.expense, label: p.label };
    });
    return max;
  }, [points]);

  const totalPeriodTxns = useMemo(() => points.reduce((s, p) => s + p.txCount, 0), [points]);

  // Subsample for smooth rendering if there are many days
  const displayPoints = useMemo(() => {
    if (points.length <= 60) return points;
    const step = Math.ceil(points.length / 60);
    return points.filter((_, i) => i % step === 0 || i === points.length - 1);
  }, [points]);

  const n = displayPoints.length;

  // X coordinate distribution
  const xs = useMemo(
    () => displayPoints.map((_, i) => PAD_L + (i / Math.max(n - 1, 1)) * (SVG_W - PAD_L - PAD_R)),
    [displayPoints, n, PAD_L, PAD_R, SVG_W]
  );

  // Smoothed arrays for curves
  const incomeVals = smooth(displayPoints.map(p => p.income));
  const expenseVals = smooth(displayPoints.map(p => p.expense));
  const cumulativeVals = displayPoints.map(p => p.cumulative);

  // PROPER DYNAMIC SCALING: Separate Area/Volume from Cumulative Equity
  const maxAreaDaily = Math.max(...incomeVals, ...expenseVals, 100);
  const areaScaleMax = maxAreaDaily * 1.18;

  const maxEquityVal = Math.max(...cumulativeVals.map(Math.abs), 100) * 1.15;
  const minCumulative = Math.min(...cumulativeVals, 0);

  // Map value to Y coordinate
  const toY = useCallback((v: number, min = 0, max = areaScaleMax): number => {
    const range = max - min || 1;
    return PAD_T + (1 - (v - min) / range) * (SVG_H - PAD_T - PAD_B);
  }, [areaScaleMax, PAD_T, SVG_H, PAD_B]);

  const incomeYs = incomeVals.map(v => toY(v, 0, areaScaleMax));
  const expenseYs = expenseVals.map(v => toY(v, 0, areaScaleMax));
  const cumulativeYs = cumulativeVals.map(v => toY(v, minCumulative, maxEquityVal));

  const incomePath = buildSvgPath(xs, incomeYs);
  const expensePath = buildSvgPath(xs, expenseYs);
  const equityPath = buildSvgPath(xs, cumulativeYs);

  const incomeAreaPath = incomePath + ` L ${xs[n - 1]},${SVG_H - PAD_B} L ${xs[0]},${SVG_H - PAD_B} Z`;
  const expenseAreaPath = expensePath + ` L ${xs[n - 1]},${SVG_H - PAD_B} L ${xs[0]},${SVG_H - PAD_B} Z`;
  const equityAreaPath = equityPath + ` L ${xs[n - 1]},${SVG_H - PAD_B} L ${xs[0]},${SVG_H - PAD_B} Z`;

  // Interactive mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    let closest = 0;
    let minDist = Infinity;
    xs.forEach((x, i) => {
      const dist = Math.abs(x - mouseX);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setHoverIndex(closest);
  }, [xs, n]);

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  const hoveredPoint = hoverIndex !== null ? displayPoints[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xs[hoverIndex] : null;
  const hoverIncomeY = hoverIndex !== null ? incomeYs[hoverIndex] : null;
  const hoverExpenseY = hoverIndex !== null ? expenseYs[hoverIndex] : null;
  const hoverEquityY = hoverIndex !== null ? cumulativeYs[hoverIndex] : null;

  // 5 evenly spaced X-axis date labels
  const axisLabels = useMemo(() => {
    if (n === 0) return [];
    const indices = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(3 * n / 4), n - 1].filter((v, i, a) => a.indexOf(v) === i);
    return indices.map(i => ({ label: displayPoints[i].label, x: xs[i] }));
  }, [displayPoints, xs, n]);

  const timeframes: Timeframe[] = ['1W', '1M', '3M', '1Y', 'ALL'];
  const chartModes: { mode: ChartMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'area', icon: <Activity size={13} />, label: 'Area' },
    { mode: 'volume', icon: <BarChart2 size={13} />, label: 'Volume' },
    { mode: 'equity', icon: <TrendingUp size={13} />, label: 'Equity' },
  ];

  const noData = n === 0 || (periodIncome === 0 && periodExpense === 0);

  // Active Family Operation Label
  const operationLabel = useMemo(() => {
    if (operationScope === 'all') return '👥 All Family Operations';
    if (operationScope === 'shared') return '🏠 Shared Household Operations';
    const found = members.find(m => m.user_id === operationScope);
    if (!found) return 'Member Operations';
    const roleIcon = getMemberRoleEmoji(found.role);
    return `${roleIcon} ${found.user.name}'s Operations`;
  }, [operationScope, members]);

  // Formatted date range label for subtitle
  const dateRangeSubtitle = useMemo(() => {
    const startStr = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} — ${endStr} • ${daysInPeriod} days`;
  }, [startDate, endDate, daysInPeriod]);

  const isChild = currentMember?.role === 'child' || currentMember?.role === 'CHILD';

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      
      {/* 1. CARD HEADER & FAMILY OPERATION SELECTOR */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.65rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Overview
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--mint-primary)',
                  background: 'rgba(34, 160, 91, 0.1)',
                  border: '1px solid rgba(34, 160, 91, 0.25)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                ● Live Synced
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
              <span>Inflow vs Outflow</span>
              <span>•</span>
              <span style={{ fontWeight: 600, color: 'var(--mint-primary)' }}>{dateRangeSubtitle}</span>
              <span>•</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{operationLabel}</span>
            </div>
          </div>

          {/* FAMILY OPERATION SELECTOR DROPDOWN */}
          {!isChild && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '9999px',
                  padding: '0.15rem 0.65rem 0.15rem 0.5rem',
                }}
              >
                <Users size={13} color="var(--mint-primary)" />
                <select
                  value={operationScope}
                  onChange={e => setOperationScope(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all">👥 All Family Operations</option>
                  <option value="shared">🏠 Shared Household Operations</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {getMemberRoleEmoji(m.role)} {m.user.name} ({getMemberRoleLabel(m.role)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* QUICK OPERATION SCOPE PILLS (All / Shared / Head / Spouse / Child) */}
        {!isChild && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.2rem' }}>
              Scope:
            </span>
            <button
              type="button"
              onClick={() => setOperationScope('all')}
              style={{
                padding: '0.18rem 0.6rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: operationScope === 'all' ? 'var(--mint-primary)' : 'var(--border-subtle)',
                background: operationScope === 'all' ? 'rgba(34, 160, 91, 0.12)' : 'transparent',
                color: operationScope === 'all' ? 'var(--mint-primary)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: operationScope === 'all' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              👥 All Family
            </button>
            <button
              type="button"
              onClick={() => setOperationScope('shared')}
              style={{
                padding: '0.18rem 0.6rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: operationScope === 'shared' ? 'var(--sky-accent)' : 'var(--border-subtle)',
                background: operationScope === 'shared' ? 'rgba(62, 139, 245, 0.12)' : 'transparent',
                color: operationScope === 'shared' ? 'var(--sky-accent)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: operationScope === 'shared' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              🏠 Shared Household
            </button>
            {members.slice(0, 6).map(m => (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setOperationScope(m.user_id)}
                style={{
                  padding: '0.18rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: operationScope === m.user_id ? 'var(--amber-accent)' : 'var(--border-subtle)',
                  background: operationScope === m.user_id ? 'rgba(229, 161, 30, 0.12)' : 'transparent',
                  color: operationScope === m.user_id ? 'var(--amber-accent)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: operationScope === m.user_id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {getMemberRoleEmoji(m.role)} {m.user.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* 2. BIG PRIMARY METRICS (STRICTLY SYNCED TO DATE RANGE & FAMILY OPERATION) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            {/* Period Income */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22A05B' }}></span>
                <span>Income</span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {formatPaise(periodIncome)}
              </div>
            </div>

            {/* Period Expense */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                <span>Expense</span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {formatPaise(periodExpense)}
              </div>
            </div>
          </div>

          {/* Net Surplus Banner for the Period */}
          <div
            style={{
              background: isPositiveNet ? 'rgba(34, 160, 91, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${isPositiveNet ? 'rgba(34, 160, 91, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              borderRadius: '12px',
              padding: '0.45rem 0.85rem',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Period Net Surplus
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: isPositiveNet ? '#22A05B' : '#EF4444',
              }}
            >
              {isPositiveNet ? '+' : ''}{formatPaise(periodNet)}
              <span style={{ fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                ({isPositiveNet ? '+' : ''}{periodSavingsRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS: TIMEFRAMES & CHART MODES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
        {/* Timeframe Presets + Calendar Option */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setShowCustomPicker(false);
              }}
              style={{
                padding: '0.22rem 0.65rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: timeframe === tf && !showCustomPicker ? 'var(--mint-primary)' : 'var(--border-subtle)',
                background: timeframe === tf && !showCustomPicker ? 'var(--mint-pill)' : 'transparent',
                color: timeframe === tf && !showCustomPicker ? 'var(--mint-primary)' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tf}
            </button>
          ))}

          {/* Custom Date Range Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowCustomPicker(!showCustomPicker);
              setTimeframe('CUSTOM');
            }}
            style={{
              padding: '0.22rem 0.75rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: showCustomPicker || timeframe === 'CUSTOM' ? 'var(--mint-primary)' : 'var(--border-subtle)',
              background: showCustomPicker || timeframe === 'CUSTOM' ? '#ECFDF5' : 'transparent',
              color: showCustomPicker || timeframe === 'CUSTOM' ? '#059669' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={13} color={showCustomPicker || timeframe === 'CUSTOM' ? '#059669' : 'currentColor'} />
            <span>Calendar</span>
          </button>
        </div>

        {/* Chart View Modes */}
        <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-canvas)', borderRadius: '8px', padding: '0.2rem' }}>
          {chartModes.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setChartMode(mode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.22rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                background: chartMode === mode ? 'var(--mint-pill)' : 'transparent',
                color: chartMode === mode ? 'var(--mint-primary)' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: chartMode === mode ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. HIGHLIGHTED CALENDAR DATE RANGE PICKER (WHEN CUSTOM IS OPEN) */}
      {(showCustomPicker || timeframe === 'CUSTOM') && (
        <div
          className="calendar-highlight-area"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CalendarDays size={15} color="#059669" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46' }}>
                Analyze Date Range:
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="date"
                value={customStart}
                onChange={e => {
                  setCustomStart(e.target.value);
                  setTimeframe('CUSTOM');
                }}
                max={customEnd}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => {
                  setCustomEnd(e.target.value);
                  setTimeframe('CUSTOM');
                }}
                min={customStart}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Quick date helpers */}
            <button
              type="button"
              onClick={() => {
                const s = new Date(anchorDate);
                s.setDate(s.getDate() - 7);
                setCustomStart(s.toISOString().slice(0, 10));
                setCustomEnd(anchorDate.toISOString().slice(0, 10));
                setTimeframe('CUSTOM');
              }}
              style={{
                background: 'white',
                border: '1px solid #A7F3D0',
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#065F46',
                cursor: 'pointer',
              }}
            >
              Past 7D
            </button>
            <button
              type="button"
              onClick={() => {
                const s = new Date(anchorDate);
                s.setDate(s.getDate() - 30);
                setCustomStart(s.toISOString().slice(0, 10));
                setCustomEnd(anchorDate.toISOString().slice(0, 10));
                setTimeframe('CUSTOM');
              }}
              style={{
                background: 'white',
                border: '1px solid #A7F3D0',
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#065F46',
                cursor: 'pointer',
              }}
            >
              Past 30D
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem',
              }}
              title="Close calendar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 5. PERIOD-SYNCED FINANCIAL ANALYSIS BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.75rem',
          background: 'var(--bg-canvas-subtle)',
          borderRadius: '12px',
          padding: '0.65rem 0.85rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Peak Inflow Day
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#22A05B', marginTop: '0.1rem' }}>
            {formatPaise(highIncomeDay.amount)}
          </div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            {highIncomeDay.label}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Peak Expense Day
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#EF4444', marginTop: '0.1rem' }}>
            {formatPaise(peakExpenseDay.amount)}
          </div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            {peakExpenseDay.label}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Daily Burn Rate
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
            {formatPaise(avgDailySpend)}
          </div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            avg / day
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Activity Count
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--sky-accent)', marginTop: '0.1rem' }}>
            {totalPeriodTxns}
          </div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            operations
          </div>
        </div>
      </div>

      {/* 6. DYNAMIC FULL-HEIGHT PROPORTIONAL CHART */}
      <div style={{ position: 'relative', width: '100%', height: '175px', marginTop: '0.2rem' }}>
        {noData ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <TrendingUp size={28} style={{ opacity: 0.3 }} />
            <span>No transaction activity found for this operation scope & date</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="sg-incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22A05B" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#22A05B" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#22A05B" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="sg-expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.38" />
                <stop offset="50%" stopColor="#EF4444" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="sg-equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3E8BF5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3E8BF5" stopOpacity="0.02" />
              </linearGradient>
              <filter id="sg-glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Subtle Gridlines */}
            {[0.2, 0.5, 0.8].map(f => (
              <line
                key={f}
                x1={PAD_L}
                y1={PAD_T + f * (SVG_H - PAD_T - PAD_B)}
                x2={SVG_W - PAD_R}
                y2={PAD_T + f * (SVG_H - PAD_T - PAD_B)}
                stroke="rgba(127,127,127,0.09)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Baseline */}
            <line
              x1={PAD_L}
              y1={SVG_H - PAD_B}
              x2={SVG_W - PAD_R}
              y2={SVG_H - PAD_B}
              stroke="rgba(127,127,127,0.18)"
              strokeWidth="1"
            />

            {/* AREA CHART MODE */}
            {chartMode === 'area' && (
              <>
                {/* Income Area & Spline */}
                <path d={incomeAreaPath} fill="url(#sg-incomeGrad)" />
                <path
                  d={incomePath}
                  fill="none"
                  stroke="#22A05B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  filter="url(#sg-glow)"
                />

                {/* Expense Area & Spline */}
                <path d={expenseAreaPath} fill="url(#sg-expenseGrad)" />
                <path
                  d={expensePath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* VOLUME / BAR CHART MODE */}
            {chartMode === 'volume' && displayPoints.map((p, i) => {
              const barW = Math.max(2, (SVG_W - PAD_L - PAD_R) / n - 2);
              const baseY = SVG_H - PAD_B;
              const incH = (p.income / areaScaleMax) * (SVG_H - PAD_T - PAD_B);
              const expH = (p.expense / areaScaleMax) * (SVG_H - PAD_T - PAD_B);
              return (
                <g key={i}>
                  <rect
                    x={xs[i] - barW / 2}
                    y={baseY - incH}
                    width={barW / 2}
                    height={Math.max(incH, p.income > 0 ? 3 : 0)}
                    fill="#22A05B"
                    opacity={hoverIndex === i ? 1 : 0.75}
                    rx={2}
                  />
                  <rect
                    x={xs[i]}
                    y={baseY - expH}
                    width={barW / 2}
                    height={Math.max(expH, p.expense > 0 ? 3 : 0)}
                    fill="#EF4444"
                    opacity={hoverIndex === i ? 1 : 0.75}
                    rx={2}
                  />
                </g>
              );
            })}

            {/* EQUITY ACCUMULATION CURVE */}
            {chartMode === 'equity' && (
              <>
                <path d={equityAreaPath} fill="url(#sg-equityGrad)" />
                <path
                  d={equityPath}
                  fill="none"
                  stroke="#3E8BF5"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  filter="url(#sg-glow)"
                />
                {/* Zero equilibrium mark */}
                <line
                  x1={PAD_L}
                  y1={toY(0, minCumulative, maxEquityVal)}
                  x2={SVG_W - PAD_R}
                  y2={toY(0, minCumulative, maxEquityVal)}
                  stroke="rgba(127,127,127,0.35)"
                  strokeDasharray="3 3"
                />
              </>
            )}

            {/* Crosshair on Mouse Hover */}
            {hoverIndex !== null && hoverX !== null && (
              <>
                <line
                  x1={hoverX}
                  y1={PAD_T}
                  x2={hoverX}
                  y2={SVG_H - PAD_B}
                  stroke="rgba(127,127,127,0.45)"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                {chartMode === 'area' && hoverIncomeY !== null && hoverExpenseY !== null && (
                  <>
                    <circle cx={hoverX} cy={hoverIncomeY} r="5" fill="#22A05B" stroke="#FFF" strokeWidth="2.2" />
                    <circle cx={hoverX} cy={hoverExpenseY} r="5" fill="#EF4444" stroke="#FFF" strokeWidth="2.2" />
                  </>
                )}
                {chartMode === 'equity' && hoverEquityY !== null && (
                  <circle cx={hoverX} cy={hoverEquityY} r="5.5" fill="#3E8BF5" stroke="#FFF" strokeWidth="2.2" />
                )}
              </>
            )}
          </svg>
        )}

        {/* 7. RICH FLOATING DATE & OPERATION TOOLTIP */}
        {hoveredPoint && hoverX !== null && !noData && (
          <div
            style={{
              position: 'absolute',
              top: '0px',
              left: `${Math.min(Math.max((hoverX / SVG_W) * 100, 12), 72)}%`,
              transform: 'translateX(-50%)',
              background: 'var(--card-bg, #ffffff)',
              backdropFilter: 'blur(16px)',
              borderRadius: '14px',
              padding: '0.65rem 0.95rem',
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              border: '1.5px solid var(--border-card, rgba(0,0,0,0.1))',
              fontSize: '0.74rem',
              pointerEvents: 'none',
              zIndex: 20,
              minWidth: '175px',
            }}
          >
            <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📅 {hoveredPoint.fullDateStr}</span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                {hoveredPoint.txCount} op{hoveredPoint.txCount !== 1 ? 's' : ''}
              </span>
            </div>

            {chartMode !== 'equity' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#22A05B', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowDownLeft size={13} /> Inflow
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {formatPaise(hoveredPoint.income)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowUpRight size={13} /> Outflow
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {formatPaise(hoveredPoint.expense)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    color: hoveredPoint.net >= 0 ? '#22A05B' : '#EF4444',
                    fontWeight: 800,
                    borderTop: '1px dashed var(--border-subtle)',
                    marginTop: '0.25rem',
                    paddingTop: '0.25rem',
                  }}
                >
                  <span>Day Net</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {hoveredPoint.net >= 0 ? '+' : ''}{formatPaise(hoveredPoint.net)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#3E8BF5', fontWeight: 700 }}>
                <span>Running Equity</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {hoveredPoint.cumulative >= 0 ? '+' : ''}{formatPaise(hoveredPoint.cumulative)}
                </span>
              </div>
            )}

            {/* List of Specific Family Operations on this day */}
            {hoveredPoint.dayTransactions && hoveredPoint.dayTransactions.length > 0 && (
              <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Operations on this date:
                </div>
                {hoveredPoint.dayTransactions.slice(0, 3).map(tx => {
                  const member = members.find(m => m.user_id === tx.user_id);
                  const isExp = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.67rem',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden' }}>
                        <span style={{ opacity: 0.85 }}>
                          {member?.role === 'family_head' ? '👑' : member?.role === 'spouse' ? '💼' : member?.role === 'child' ? '🎒' : '👵'}
                        </span>
                        <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
                          {tx.description}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isExp ? '#EF4444' : '#22A05B',
                          fontFamily: 'var(--font-mono)',
                          flexShrink: 0,
                        }}
                      >
                        {isExp ? '-' : '+'}{formatPaise(tx.amount)}
                      </span>
                    </div>
                  );
                })}
                {hoveredPoint.dayTransactions.length > 3 && (
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.15rem' }}>
                    +{hoveredPoint.dayTransactions.length - 3} more operation{hoveredPoint.dayTransactions.length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. X-AXIS DATE LABELS */}
      <div style={{ position: 'relative', height: '18px' }}>
        {axisLabels.map(({ label, x }) => (
          <span
            key={label}
            style={{
              position: 'absolute',
              left: `${(x / SVG_W) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};
