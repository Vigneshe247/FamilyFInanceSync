import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { Transaction } from '../../types';
import { formatPaise, formatDate } from '../../utils/currency';
import {
  X,
  Lock,
  Users,
  CreditCard,
  Calendar,
  Tag,
  User,
  Shield,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const {
    activeFamily,
    allFamilies,
    currentMember,
    activeUserId,
    members,
    categories,
    updateTransactionVisibility,
  } = useFamilyFinance();

  const [confirmingPrivacyChange, setConfirmingPrivacyChange] = useState<'to_private' | 'to_family' | null>(null);
  const [selectedTargetFamilyId, setSelectedTargetFamilyId] = useState<string>(activeFamily.id);
  const [successToast, setSuccessToast] = useState('');

  if (!isOpen || !transaction) return null;

  const isOwner = transaction.user_id === activeUserId || transaction.user_id === currentMember.user_id;
  const isPrivate = transaction.visibility === 'private' || !transaction.family_id;
  const member = members.find(m => m.user_id === transaction.user_id);
  const category = categories.find(c => c.id === transaction.category_id);
  const txFamily = allFamilies.find(f => f.id === transaction.family_id) || activeFamily;

  const handleConfirmVisibilityChange = () => {
    if (confirmingPrivacyChange === 'to_private') {
      updateTransactionVisibility(transaction.id, 'private');
      setSuccessToast('Transaction marked as Private. Excluded from family dashboard.');
    } else if (confirmingPrivacyChange === 'to_family') {
      updateTransactionVisibility(transaction.id, 'family', selectedTargetFamilyId);
      setSuccessToast(`Transaction shared with ${txFamily.name}.`);
    }
    setConfirmingPrivacyChange(null);
    setTimeout(() => {
      setSuccessToast('');
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: '24px', padding: '1.75rem' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: isPrivate ? 'rgba(217, 119, 6, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                color: isPrivate ? '#D97706' : 'var(--mint-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPrivate ? <Lock size={20} /> : <Users size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Transaction Details
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Audited financial ledger entry
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {successToast && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(34, 160, 91, 0.12)',
              border: '1px solid rgba(34, 160, 91, 0.25)',
              color: 'var(--mint-primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2 size={16} /> {successToast}
          </div>
        )}

        {/* Primary Amount Card */}
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '18px',
            background: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            {transaction.type}
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: transaction.type === 'expense' ? 'var(--coral-accent)' : 'var(--mint-primary)',
              marginTop: '0.25rem',
            }}
          >
            {transaction.type === 'expense' ? '-' : '+'}{formatPaise(transaction.amount)}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            {transaction.description}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Category
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {category?.name || 'General'}
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Payment Method
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {transaction.payment_method}
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Recorded Date
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {formatDate(transaction.transaction_date)}
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Status
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginTop: '0.2rem', textTransform: 'capitalize' }}>
              {transaction.status}
            </div>
          </div>
        </div>

        {/* 3 Privacy Questions Cards (Section 35) */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '16px',
            background: isPrivate ? 'rgba(217, 119, 6, 0.06)' : 'rgba(5, 150, 105, 0.06)',
            border: isPrivate ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(5, 150, 105, 0.2)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: isPrivate ? '#D97706' : 'var(--mint-primary)', marginBottom: '0.65rem' }}>
            Data Privacy & Authorization
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>1. Who owns this data?</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {isOwner ? `${member?.user.name || 'You'} (You)` : member?.user.name}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>2. Which family does it belong to?</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {isPrivate ? 'None — Private Record' : txFamily.name}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>3. Who can see it?</span>
              <strong style={{ color: isPrivate ? '#D97706' : '#059669' }}>
                {isPrivate ? '🔒 Only You' : `👨‍👩‍👧 Authorized Members of ${txFamily.name}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Edit Visibility Section (Section 21) */}
        {isOwner && !confirmingPrivacyChange && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Visibility: <strong>{isPrivate ? 'Private' : 'Family Shared'}</strong>
            </div>

            {isPrivate ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmingPrivacyChange('to_family')}
                style={{ gap: '0.4rem', color: 'var(--mint-primary)', borderColor: 'var(--mint-primary)' }}
              >
                <Users size={14} /> Share with Family
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmingPrivacyChange('to_private')}
                style={{ gap: '0.4rem', color: '#D97706', borderColor: '#D97706' }}
              >
                <Lock size={14} /> Make Private
              </button>
            )}
          </div>
        )}

        {/* Confirmation Prompt (Section 21 & Test Cases 5 & 6) */}
        {confirmingPrivacyChange && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '16px',
              background: 'var(--bg-canvas)',
              border: '2px solid var(--border-card)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {confirmingPrivacyChange === 'to_private'
                    ? 'Make this transaction private?'
                    : `Share this transaction with ${activeFamily.name}?`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {confirmingPrivacyChange === 'to_private'
                    ? 'This transaction will no longer appear in the selected family’s financial dashboards and reports.'
                    : `This transaction will become visible to all authorized members of ${activeFamily.name} and contribute to family dashboard calculations.`}
                </div>
              </div>
            </div>

            {confirmingPrivacyChange === 'to_family' && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="label" style={{ fontSize: '0.72rem' }}>
                  Select Family
                </label>
                <select
                  className="select"
                  value={selectedTargetFamilyId}
                  onChange={e => setSelectedTargetFamilyId(e.target.value)}
                >
                  {allFamilies.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmingPrivacyChange(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-sm ${confirmingPrivacyChange === 'to_private' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirmVisibilityChange}
                style={{ fontWeight: 700 }}
              >
                {confirmingPrivacyChange === 'to_private' ? 'Make Private' : 'Share with Family'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
