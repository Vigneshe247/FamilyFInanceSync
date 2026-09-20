/* =========================================================
   TRANSACTIONS MANAGEMENT & LEDGER VIEW (Module 6 & 18)
   Income, Expense, Transfers, Date Presets, Sort, Filter
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise, formatDate } from '../../utils/currency';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CreditCard,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { AccountTransferModal } from '../../components/modals/AccountTransferModal';

interface TransactionsPageProps {
  onOpenNewTx: () => void;
  onOpenReceiptOcr: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ onOpenNewTx, onOpenReceiptOcr }) => {
  const {
    transactions,
    categories,
    members,
    accounts,
    currentMember,
    hasPermission,
    deleteTransaction,
  } = useFamilyFinance();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | 'week' | 'this_month' | 'last_month' | 'this_year'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const isChild = currentMember.role === 'CHILD';

  // If child, only show their own transactions as required in Section 6 & 28
  const accessibleTransactions = isChild
    ? transactions.filter(t => t.user_id === currentMember.user_id)
    : transactions;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filtered = accessibleTransactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false;
    if (filterMember !== 'all' && tx.user_id !== filterMember) return false;
    if (filterAccount !== 'all' && tx.account_id !== filterAccount) return false;

    // Date range filter presets
    if (dateRangePreset !== 'all') {
      const txDate = new Date(tx.transaction_date);
      if (dateRangePreset === 'today') {
        if (tx.transaction_date.slice(0, 10) !== todayStr) return false;
      } else if (dateRangePreset === 'this_month') {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRangePreset === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (txDate.getMonth() !== lastMonth || txDate.getFullYear() !== lastMonthYear) return false;
      } else if (dateRangePreset === 'this_year') {
        if (txDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRangePreset === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < oneWeekAgo) return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchMethod = tx.payment_method.toLowerCase().includes(q);
      return matchDesc || matchMethod;
    }
    return true;
  });

  // Sorting
  const sortedTransactions = [...filtered].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
    if (sortBy === 'date_asc') return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
    if (sortBy === 'amount_desc') return b.amount - a.amount;
    if (sortBy === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  const handleExportCSV = () => {
    const headers = ['ID,Date,User,Type,Category,Description,PaymentMethod,Amount(INR)'];
    const rows = sortedTransactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id)?.name || '';
      return `${t.id},${t.transaction_date},${t.user_id},${t.type},"${cat}","${t.description}","${t.payment_method}",${(t.amount / 100).toFixed(2)}`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `family_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1>Financial Transactions</h1>
          <p style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
            {isChild ? 'Your personal wallet transactions' : 'Master double-entry shared family ledger & inter-account transfers'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setTransferModalOpen(true)}>
            <ArrowRightLeft size={14} /> Transfer Funds
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onOpenReceiptOcr}>
            <Sparkles size={14} color="var(--amber-accent)" /> Scan Receipt (OCR)
          </button>
          {hasPermission('transactions.create') && (
            <button className="btn btn-primary btn-sm" onClick={onOpenNewTx}>
              <Plus size={15} /> Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Search description, merchant, UPI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Date Range Preset */}
          <select
            className="select"
            style={{ width: 'auto' }}
            value={dateRangePreset}
            onChange={e => setDateRangePreset(e.target.value as any)}
          >
            <option value="all">Date: All Time</option>
            <option value="today">Date: Today</option>
            <option value="week">Date: Last 7 Days</option>
            <option value="this_month">Date: This Month (Sep)</option>
            <option value="last_month">Date: Last Month (Aug)</option>
            <option value="this_year">Date: This Year (2026)</option>
          </select>

          {/* Type selector */}
          <select
            className="select"
            style={{ width: 'auto' }}
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses (-)</option>
            <option value="income">Income (+)</option>
            <option value="transfer">Transfers (⇄)</option>
          </select>

          {/* Category selector */}
          <select
            className="select"
            style={{ width: 'auto' }}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account selector */}
          <select
            className="select"
            style={{ width: 'auto' }}
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Member selector (Hidden for child) */}
          {!isChild && (
            <select
              className="select"
              style={{ width: 'auto' }}
              value={filterMember}
              onChange={e => setFilterMember(e.target.value)}
            >
              <option value="all">All Members</option>
              {members.map(m => (
                <option key={m.id} value={m.user_id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            className="select"
            style={{ width: 'auto' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="date_desc">Sort: Newest First</option>
            <option value="date_asc">Sort: Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment / Account</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                {hasPermission('transactions.delete') && <th style={{ width: '50px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No transactions match your current search filters.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.category_id);
                  const member = members.find(m => m.user_id === tx.user_id);
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isTransfer ? 'var(--purple-accent)' : isExpense ? 'var(--coral-accent)' : 'var(--mint-primary)',
                            }}
                          ></span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {member?.user.name || tx.user_id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--bg-canvas-subtle)',
                            border: `1px solid ${cat?.color || 'var(--border-subtle)'}`,
                            color: 'var(--text-main)',
                            fontSize: '0.72rem',
                          }}
                        >
                          {isTransfer ? 'Transfer' : (cat?.name || 'General')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <div>{tx.description}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CreditCard size={14} />
                          <span>{tx.payment_method}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-sage" style={{ fontSize: '0.68rem' }}>
                          {tx.status}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: isTransfer ? 'var(--purple-accent)' : isExpense ? 'var(--coral-accent)' : 'var(--mint-primary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          {isTransfer ? (
                            <ArrowRightLeft size={14} />
                          ) : isExpense ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}
                          <span>{isTransfer ? formatPaise(tx.amount) : isExpense ? `-${formatPaise(tx.amount)}` : `+${formatPaise(tx.amount)}`}</span>
                        </div>
                      </td>
                      {hasPermission('transactions.delete') && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                            }}
                            title="Delete transaction"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      <AccountTransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
      />
    </div>
  );
};
