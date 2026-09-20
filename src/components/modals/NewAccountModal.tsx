/* =========================================================
   ADD ACCOUNT MODAL (Module 5)
   Support all 9 Account Types with opening balances
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { rupeesToPaise } from '../../utils/currency';
import { AccountType } from '../../types';
import {
  Wallet,
  X,
  Landmark,
  CreditCard,
  Building2,
  Coins,
} from 'lucide-react';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount } = useFamilyFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balanceRupees, setBalanceRupees] = useState('');
  const [accountMask, setAccountMask] = useState('');
  const [isShared, setIsShared] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(balanceRupees || '0');
    if (!name.trim()) return;

    addAccount({
      name: name.trim(),
      type,
      balance: paise,
      currency: 'INR',
      account_number_mask: accountMask.trim() ? `•••• ${accountMask.trim().slice(-4)}` : undefined,
      is_shared: isShared,
    });

    onClose();
    setName('');
    setBalanceRupees('');
    setAccountMask('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={18} color="var(--mint-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Financial Repository</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label className="label">Account Name / Label</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. ICICI Joint Family Wealth, Cash Safe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Account Type</label>
                <select
                  className="select"
                  value={type}
                  onChange={e => setType(e.target.value as AccountType)}
                >
                  <option value="bank">Bank Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="cash">Physical Cash Vault</option>
                  <option value="credit_card">Credit Card Account</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi_wallet">UPI Wallet</option>
                  <option value="digital_wallet">Digital Wallet</option>
                  <option value="investment">Investment Account</option>
                  <option value="loan">Loan / Credit Line</option>
                </select>
              </div>

              <div>
                <label className="label">Last 4 Digits (Mask)</label>
                <input
                  type="text"
                  maxLength={4}
                  className="input"
                  placeholder="e.g. 4821"
                  value={accountMask}
                  onChange={e => setAccountMask(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Opening / Current Balance (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 50000"
                value={balanceRupees}
                onChange={e => setBalanceRupees(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Ownership & Access Control</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="radio"
                    name="sharing"
                    checked={isShared}
                    onChange={() => setIsShared(true)}
                  />
                  Shared Family Pool
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="radio"
                    name="sharing"
                    checked={!isShared}
                    onChange={() => setIsShared(false)}
                  />
                  Personal / Individual Only
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
