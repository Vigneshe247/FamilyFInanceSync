/* =========================================================
   NEW TRANSACTION MODAL (Income & Expense)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { rupeesToPaise } from '../../utils/currency';
import { X, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose }) => {
  const { categories, accounts, currentMember, addTransaction } = useFamilyFinance();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('HDFC Debit Card');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0 || !description.trim()) return;

    addTransaction({
      user_id: currentMember.user_id,
      account_id: accountId,
      category_id: categoryId,
      type,
      amount: paise,
      description: description.trim(),
      transaction_date: new Date(transactionDate).toISOString(),
      payment_method: paymentMethod,
      is_shared: true,
      status: 'cleared',
    });

    onClose();
    setAmountRupees('');
    setDescription('');
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Record Financial Transaction</h3>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Type selector (Expense vs Income) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ justifyContent: 'center' }}
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
                style={{ justifyContent: 'center' }}
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
              <label className="label">Amount (₹ INR)</label>
              <input
                type="number"
                step="any"
                className="input"
                style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                value={amountRupees}
                onChange={e => setAmountRupees(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description / Merchant</label>
              <input
                type="text"
                className="input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Monthly Supermarket Groceries"
                required
              />
            </div>

            {/* Category & Account */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Category</label>
                <select
                  className="select"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Account / Vault</label>
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
              </div>
            </div>

            {/* Payment Method & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Payment Instrument</label>
                <select
                  className="select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="HDFC Debit Card">HDFC Debit Card</option>
                  <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash Vault">Cash Vault</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>

              <div>
                <label className="label">Transaction Date</label>
                <input
                  type="date"
                  className="input"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} /> Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
