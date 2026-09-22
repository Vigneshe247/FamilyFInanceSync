/* =========================================================
   NEW TRANSACTION MODAL (Manual Expense & Income Recording)
   Sections 9, 10, 11, 12, 13
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { rupeesToPaise } from '../../utils/currency';
import { X, ArrowDownLeft, ArrowUpRight, CheckCircle2, Calendar, Tag, FileText } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'expense' | 'income';
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
}) => {
  const { categories, accounts, currentMember, addTransaction } = useFamilyFinance();

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc-hdfc');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Sync category if empty or type changes
  const filteredCategories = categories.filter(c => c.type === type);
  const activeCategoryId = categoryId && filteredCategories.some(c => c.id === categoryId)
    ? categoryId
    : (filteredCategories[0]?.id || '');

  const selectedCategoryObj = categories.find(c => c.id === activeCategoryId);
  const isOtherCategory = selectedCategoryObj?.name.toLowerCase() === 'other' || activeCategoryId.includes('other');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0 || !description.trim()) return;

    if (isOtherCategory && !customCategory.trim()) {
      alert('Please enter a custom category name for "Other".');
      return;
    }

    addTransaction({
      user_id: currentMember.user_id,
      account_id: accountId,
      category_id: activeCategoryId,
      custom_category: isOtherCategory ? customCategory.trim() : undefined,
      type,
      amount: paise,
      description: description.trim(),
      transaction_date: new Date(transactionDate).toISOString(),
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
      is_shared: true,
      status: 'cleared',
    });

    onClose();
    setAmountRupees('');
    setDescription('');
    setCustomCategory('');
    setNotes('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {type === 'expense' ? 'Record Expense' : 'Record Income'}
            </h3>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Type selector (Expense vs Income) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                className={`btn ${type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', padding: '0.65rem' }}
                onClick={() => {
                  setType('expense');
                  setCategoryId(categories.find(c => c.type === 'expense')?.id || '');
                }}
              >
                <ArrowDownLeft size={16} />
                <span>Expense (-)</span>
              </button>

              <button
                type="button"
                className={`btn ${type === 'income' ? 'btn-sage' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', padding: '0.65rem' }}
                onClick={() => {
                  setType('income');
                  setCategoryId(categories.find(c => c.type === 'income')?.id || '');
                }}
              >
                <ArrowUpRight size={16} />
                <span>Income (+)</span>
              </button>
            </div>

            {/* Amount input in ₹ */}
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Amount (₹)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  className="input"
                  style={{
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    paddingLeft: '2.5rem',
                  }}
                  value={amountRupees}
                  onChange={e => setAmountRupees(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                <Tag size={13} color="var(--primary)" />
                {type === 'income' ? 'Income Source' : 'Category'}
              </label>
              <select
                className="select"
                value={activeCategoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
              >
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section 13: "Other" dynamic category input */}
            {isOtherCategory && (
              <div
                style={{
                  background: 'var(--bg-card-secondary, rgba(99, 102, 241, 0.05))',
                  border: '1px dashed var(--primary)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.85rem',
                }}
              >
                <label className="label" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  Enter Custom Category
                </label>
                <input
                  type="text"
                  className="input"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="e.g. Pet Care, Tuition, Freelance Project"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  This will be recorded as Other → {customCategory || 'Custom'}
                </span>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Description</label>
              <input
                type="text"
                className="input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'e.g. Lunch at Cafe' : 'e.g. Monthly Salary / Allowance'}
                required
              />
            </div>

            {/* Date & Payment Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  <Calendar size={13} color="#059669" /> Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label className="label" style={{ fontWeight: 600 }}>
                  {type === 'expense' ? 'Payment Method' : 'Deposit Account'}
                </label>
                {type === 'expense' ? (
                  <select
                    className="select"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <select
                    className="select"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Notes field (Section 9 & 10) */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                <FileText size={13} color="var(--text-muted)" /> Notes (Optional)
              </label>
              <textarea
                className="input"
                style={{ minHeight: '65px', resize: 'vertical' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional details or reference notes..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${type === 'expense' ? 'btn-danger' : 'btn-sage'}`}
              style={{ fontWeight: 600 }}
            >
              <CheckCircle2 size={16} />
              {type === 'expense' ? 'Add Expense' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
