/* =========================================================
   NEW FAMILY MEMBER REQUEST MODAL
   Section 20 & 21
   Support: Permission request, Expense correction, Income correction,
   Add member, Remove member, Expense approval, Custom request
   ========================================================= */

import React, { useState, useEffect } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { rupeesToPaise } from '../../utils/currency';
import { X, Send, AlertCircle, FileText, Tag, HelpCircle } from 'lucide-react';
import { ExpenseRequest } from '../../types';

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

  const [requestType, setRequestType] = useState<NonNullable<ExpenseRequest['request_type']>>('permission_request');
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
      setRequestType('expense_approval');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const isFinancialType = requestType === 'expense_approval' || requestType === 'expense_correction' || requestType === 'income_correction';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = isFinancialType ? rupeesToPaise(amountRupees || '0') : 0;
    if (!title.trim() && !description.trim()) return;

    createRequest({
      title: title.trim() || `${requestType.replace('_', ' ').toUpperCase()} from ${currentMember.user.name}`,
      amount: paise,
      category_id: categoryId || categories[0]?.id || 'cat-general',
      description: description.trim() || 'No additional note provided.',
      request_type: requestType,
    });

    onClose();
    setTitle('');
    setAmountRupees('');
    setDescription('');
    setRequestType('permission_request');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Request to Family Head
            </h3>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Request Type Selector (Section 20) */}
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Request Type</label>
              <select
                className="select"
                value={requestType}
                onChange={e => setRequestType(e.target.value as NonNullable<ExpenseRequest['request_type']>)}
              >
                <option value="permission_request">Permission Request</option>
                <option value="expense_approval">Expense Approval</option>
                <option value="expense_correction">Expense Correction</option>
                <option value="income_correction">Income Correction</option>
                <option value="add_family_member">Add Family Member</option>
                <option value="remove_family_member">Remove Family Member</option>
                <option value="custom_request">Custom Request</option>
              </select>
            </div>

            {/* Title / Summary */}
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Request Title / Topic</label>
              <input
                type="text"
                className="input"
                placeholder={
                  requestType === 'permission_request'
                    ? 'e.g. Permission to view family monthly summary'
                    : requestType === 'expense_approval'
                    ? 'e.g. Science Project Textbook'
                    : 'e.g. Correct duplicate transaction from yesterday'
                }
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Amount (only for financial requests) */}
            {isFinancialType && (
              <div>
                <label className="label" style={{ fontWeight: 600 }}>Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  placeholder="0.00"
                  value={amountRupees}
                  onChange={e => setAmountRupees(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  required
                />
              </div>
            )}

            {/* Category (for expense requests) */}
            {requestType === 'expense_approval' && (
              <div>
                <label className="label" style={{ fontWeight: 600 }}>Category</label>
                <select
                  className="select"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message / Details */}
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Message to Family Head</label>
              <textarea
                className="input"
                style={{ minHeight: '85px', resize: 'vertical' }}
                placeholder={
                  requestType === 'permission_request'
                    ? 'e.g. I need permission to view the family monthly summary to plan my education goals.'
                    : 'Provide any context or reason for this request...'
                }
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div
              style={{
                background: 'var(--bg-canvas, rgba(0,0,0,0.02))',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              This request will be sent directly to the Family Head's notification center and request review queue.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <Send size={15} />
              <span>Send Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
