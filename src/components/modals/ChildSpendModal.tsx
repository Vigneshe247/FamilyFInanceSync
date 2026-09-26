/* =========================================================
   CHILD SPEND MODAL — Son/Daughter Manual Spending Entry
   Quick spending entry with denomination chips, child-relevant
   categories, real-time pocket balance preview, audit trail
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise, rupeesToPaise } from '../../utils/currency';
import { X, ShoppingBag, BookOpen, Bus, Gamepad2, Shirt, Coffee, Wallet, CheckCircle2, Calendar } from 'lucide-react';

interface ChildSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHILD_CATEGORIES = [
  { id: 'snacks', label: 'Canteen & Snacks', icon: Coffee, color: '#F59E0B', emoji: '🍕' },
  { id: 'school', label: 'School & Books', icon: BookOpen, color: '#3B82F6', emoji: '📚' },
  { id: 'transport', label: 'Bus & Metro', icon: Bus, color: '#8B5CF6', emoji: '🚌' },
  { id: 'gaming', label: 'Fun & Gaming', icon: Gamepad2, color: '#EF4444', emoji: '🎮' },
  { id: 'clothes', label: 'Clothes & Accessories', icon: Shirt, color: '#EC4899', emoji: '👕' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#10B981', emoji: '🛍️' },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export const ChildSpendModal: React.FC<ChildSpendModalProps> = ({ isOpen, onClose }) => {
  const { currentMember, transactions, addTransaction, categories, accounts } = useFamilyFinance();

  const [amountRupees, setAmountRupees] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CHILD_CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Pocket Wallet' | 'Cash'>('Pocket Wallet');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // Calculate pocket balance
  const allowancePaise = currentMember.monthly_allowance || 500000;
  const childSpentPaise = transactions
    .filter(t => t.user_id === currentMember.user_id && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const remainingPaise = Math.max(0, allowancePaise - childSpentPaise);
  const amountPaise = rupeesToPaise(amountRupees);
  const projectedRemaining = Math.max(0, remainingPaise - amountPaise);
  const spentPercent = allowancePaise > 0 ? Math.min(100, (childSpentPaise / allowancePaise) * 100) : 0;
  const projectedPercent = allowancePaise > 0 ? Math.min(100, ((childSpentPaise + amountPaise) / allowancePaise) * 100) : 0;

  const isOverBudget = amountPaise > remainingPaise;

  // Find matching system category or fallback
  const getSystemCategoryId = () => {
    const matchMap: Record<string, string[]> = {
      snacks: ['food', 'groceries', 'entertainment'],
      school: ['education'],
      transport: ['transport', 'transportation'],
      gaming: ['entertainment'],
      clothes: ['personal care', 'clothing'],
      shopping: ['shopping', 'misc'],
    };
    const keys = matchMap[selectedCategory] || [];
    for (const key of keys) {
      const cat = categories.find(c => c.name.toLowerCase().includes(key) && c.type === 'expense');
      if (cat) return cat.id;
    }
    return categories.find(c => c.type === 'expense')?.id || '';
  };

  // Find child's wallet account or fallback
  const getAccountId = () => {
    const wallet = accounts.find(a =>
      a.name.toLowerCase().includes('wallet') ||
      a.name.toLowerCase().includes('pocket') ||
      a.name.toLowerCase().includes(currentMember.user.name.split(' ')[0].toLowerCase())
    );
    return wallet?.id || accounts[0]?.id || '';
  };

  const handleQuickAmount = (amt: number) => {
    setAmountRupees(String(amt));
  };

  const handleAddAmount = (amt: number) => {
    const current = parseFloat(amountRupees) || 0;
    setAmountRupees(String(current + amt));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountPaise <= 0 || !description.trim()) return;

    const catLabel = CHILD_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Personal';

    addTransaction({
      user_id: currentMember.user_id,
      account_id: getAccountId(),
      category_id: getSystemCategoryId(),
      type: 'expense',
      amount: amountPaise,
      description: description.trim() || catLabel,
      transaction_date: new Date(transactionDate).toISOString(),
      payment_method: paymentMethod,
      is_shared: false,
      status: 'cleared',
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAmountRupees('');
      setDescription('');
      onClose();
    }, 1600);
  };

  const catObj = CHILD_CATEGORIES.find(c => c.id === selectedCategory)!;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 440 }}
      >
        {submitted ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={54} color="var(--mint-primary)" style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Spending Recorded!
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {formatPaise(amountPaise)} has been deducted from your pocket balance.
            </div>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    background: `rgba(${catObj.color === '#F59E0B' ? '245,158,11' : '34,160,91'},0.12)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  {catObj.emoji}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Enter Spending Amount</h3>
              </div>
              <button className="btn btn-icon btn-sm" onClick={onClose}><X size={19} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Pocket Balance Preview */}
                <div
                  style={{
                    background: 'var(--bg-canvas)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pocket Balance</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                        {formatPaise(remainingPaise)}
                      </div>
                    </div>
                    {amountPaise > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>After This</div>
                        <div
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: isOverBudget ? 'var(--coral-accent)' : 'var(--mint-primary)',
                          }}
                        >
                          {isOverBudget ? '−' : ''}{formatPaise(projectedRemaining)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: 'var(--border-subtle)', borderRadius: '9999px', height: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${amountPaise > 0 ? projectedPercent : spentPercent}%`,
                        background: isOverBudget
                          ? 'linear-gradient(90deg, #EF4444, #F87171)'
                          : projectedPercent > 80
                          ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                          : 'linear-gradient(90deg, #22A05B, #34D399)',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>Spent: {formatPaise(childSpentPaise + (amountPaise > 0 ? amountPaise : 0))}</span>
                    <span>Allowance: {formatPaise(allowancePaise)}</span>
                  </div>
                  {isOverBudget && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--coral-accent)', fontWeight: 600 }}>
                      ⚠️ This exceeds your remaining pocket balance by {formatPaise(amountPaise - remainingPaise)}
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="label">Amount (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                      }}
                    >₹</span>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={amountRupees}
                      onChange={e => setAmountRupees(e.target.value)}
                      min={1}
                      style={{ paddingLeft: '2rem', fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                      autoFocus
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAmount(amt)}
                        style={{
                          background: parseFloat(amountRupees) === amt ? 'var(--mint-primary)' : 'var(--bg-canvas)',
                          color: parseFloat(amountRupees) === amt ? '#FFF' : 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '9999px',
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddAmount(10)}
                      style={{
                        background: 'var(--bg-canvas)',
                        color: 'var(--mint-primary)',
                        border: '1px solid var(--mint-primary)',
                        borderRadius: '9999px',
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      +₹10
                    </button>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="label">What did you spend on?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {CHILD_CATEGORIES.map(cat => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          style={{
                            background: isSelected ? `${cat.color}18` : 'var(--bg-canvas)',
                            border: `1.5px solid ${isSelected ? cat.color : 'var(--border-subtle)'}`,
                            borderRadius: '12px',
                            padding: '0.6rem 0.4rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span style={{ fontSize: '1.4rem' }}>{cat.emoji}</span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? cat.color : 'var(--text-muted)',
                              lineHeight: 1.2,
                            }}
                          >
                            {cat.label.split(' & ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label">Note (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder={`e.g. "Lunch at canteen", "Bus pass", "New notebook"...`}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {/* Payment Method & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label className="label">Paid from</label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {(['Pocket Wallet', 'Cash'] as const).map(pm => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          style={{
                            flex: 1,
                            background: paymentMethod === pm ? 'var(--mint-pill)' : 'var(--bg-canvas)',
                            color: paymentMethod === pm ? 'var(--mint-primary)' : 'var(--text-muted)',
                            border: `1.5px solid ${paymentMethod === pm ? 'var(--mint-primary)' : 'var(--border-subtle)'}`,
                            borderRadius: '9px',
                            padding: '0.4rem',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          {pm === 'Pocket Wallet' ? '👛 Wallet' : '💵 Cash'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} color="#059669" /> Date
                    </label>
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={e => setTransactionDate(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={amountPaise <= 0}
                  style={{ gap: '0.4rem' }}
                >
                  <Wallet size={15} />
                  Record Spending {amountPaise > 0 && `— ${formatPaise(amountPaise)}`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
