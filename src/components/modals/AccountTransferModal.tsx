/* =========================================================
   INTER-ACCOUNT TRANSFER MODAL (Module 5 & 6)
   Transfer funds between bank, savings, cash, and digital wallets
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise, rupeesToPaise } from '../../utils/currency';
import {
  ArrowRightLeft,
  X,
  Wallet,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

interface AccountTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountTransferModal: React.FC<AccountTransferModalProps> = ({ isOpen, onClose }) => {
  const { accounts, transferFunds } = useFamilyFinance();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  const toAcc = accounts.find(a => a.id === toAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0 || fromAccountId === toAccountId) return;

    transferFunds(
      fromAccountId,
      toAccountId,
      paise,
      description.trim() || `Fund Transfer: ${fromAcc?.name} → ${toAcc?.name}`
    );

    onClose();
    setAmountRupees('');
    setDescription('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRightLeft size={18} color="var(--mint-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Transfer Funds Between Accounts</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Transfer From (Source)</label>
                <select
                  className="select"
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatPaise(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Transfer To (Destination)</label>
                <select
                  className="select"
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                      {acc.name} ({formatPaise(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Transfer Amount (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 10000"
                value={amountRupees}
                onChange={e => setAmountRupees(e.target.value)}
                required
              />
              {fromAcc && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Available in {fromAcc.name}: <strong>{formatPaise(fromAcc.balance)}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="label">Transfer Purpose / Notes</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Monthly Savings Sweep, Cash Withdrawal"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={fromAccountId === toAccountId}>
              Execute Fund Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
