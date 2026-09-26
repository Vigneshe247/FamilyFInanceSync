import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { X, Users, Globe, Shield, Sparkles } from 'lucide-react';

interface CreateFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFamilyModal: React.FC<CreateFamilyModalProps> = ({ isOpen, onClose }) => {
  const { createFamily } = useFamilyFinance();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('India');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createFamily(name.trim(), description.trim() || undefined, currency, country);
    setSuccessMsg(`Created "${name.trim()}" successfully!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
      setName('');
      setDescription('');
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '480px', borderRadius: '24px', padding: '1.75rem' }}
      >
        <div className="modal-header" style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: 'rgba(5, 150, 105, 0.12)',
                color: 'var(--mint-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Create New Family
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                You will become the Owner of this family workspace
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {successMsg && (
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
            <Sparkles size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Family Name *
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vignesh Family or Anand Household"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Description
            </label>
            <textarea
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Primary household wealth, shared utility bills & daily groceries"
              rows={2}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                Currency
              </label>
              <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="AED">AED (د.إ) — UAE Dirham</option>
                <option value="SGD">SGD (S$) — Singapore Dollar</option>
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                Country / Region
              </label>
              <input
                type="text"
                className="input"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="India"
              />
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: '14px',
              background: 'var(--bg-canvas-subtle)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}
          >
            <Shield size={16} color="var(--mint-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Family Owner Role:</strong> You will have administrative authority to invite members, manage shared accounts, and configure family settings.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}>
              Create Family
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
