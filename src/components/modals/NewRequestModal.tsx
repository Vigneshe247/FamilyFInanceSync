/* =========================================================
   NEW EXPENSE REQUEST MODAL (Section 16)
   ========================================================= */

import React, { useState, useEffect } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { rupeesToPaise } from '../../utils/currency';
import { X, Send, AlertCircle, Sparkles } from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title: string;
    amountRupees: string;
    categoryId: string;
    description: string;
  } | null;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { categories, currentMember, createRequest } = useFamilyFinance();

  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAmountRupees(initialData.amountRupees);
      if (initialData.categoryId) setCategoryId(initialData.categoryId);
      setDescription(initialData.description);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const isChild = currentMember.role === 'CHILD';
  const numericAmount = parseFloat(amountRupees) || 0;
  const isAutoApproved = !isChild && numericAmount > 0 && numericAmount <= 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0 || !title.trim()) return;

    createRequest({
      title: title.trim(),
      amount: paise,
      category_id: categoryId,
      description: description.trim() || 'No additional note provided.',
    });

    onClose();
    setTitle('');
    setAmountRupees('');
    setDescription('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {isChild ? 'Ask Family Head for an Expense' : 'Submit Expense Request for Approval'}
          </h3>
          <button className="btn btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Rule Note */}
            <div
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: isAutoApproved ? 'var(--sage-light)' : 'var(--paper-dim)',
                border: '1px solid var(--line)',
                fontSize: '0.8rem',
                color: isAutoApproved ? 'var(--sage)' : 'var(--ink-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>
                {isChild
                  ? 'All child requests require review by the Family Head or Co-Manager.'
                  : isAutoApproved
                  ? '✓ Under ₹500 rule: This request will be instantly auto-approved!'
                  : numericAmount > 2000
                  ? 'Requires Family Head authorization (> ₹2,000 threshold).'
                  : 'Can be reviewed and approved by Family Head or Co-Manager.'}
              </span>
            </div>

            <div>
              <label className="label">Item Name / Expense Title</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New School Bag, Certification Exam, Sports Shoes"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Amount (₹ INR)</label>
              <input
                type="number"
                step="any"
                className="input"
                style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                value={amountRupees}
                onChange={e => setAmountRupees(e.target.value)}
                placeholder="e.g. 2500"
                required
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Reason / Justification for Purchase</label>
              <textarea
                className="textarea"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Why is this purchase needed? e.g. Current bag is damaged and the zipper is broken."
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={15} /> Send to Family Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
