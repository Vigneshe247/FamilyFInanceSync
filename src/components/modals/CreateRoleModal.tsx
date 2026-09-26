/* =========================================================
   CREATE CUSTOM ROLE MODAL (Section 17)
   Allow Family Head to create and customize family roles
   (e.g., "Elder Brother", "Guardian", "Teenager")
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { X, ShieldPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleCreated?: (roleId: string) => void;
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, onRoleCreated }) => {
  const { createRole } = useFamilyFinance();

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = roleName.trim();
    if (!trimmedName) {
      setError('Please provide a valid role name.');
      return;
    }

    try {
      const created = createRole(trimmedName, description.trim());
      setRoleName('');
      setDescription('');
      setError('');
      if (onRoleCreated) onRoleCreated(created.id);
      onClose();
    } catch (err) {
      setError('Failed to create role. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldPlus size={20} color="var(--primary, #059669)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create Custom Role</h3>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Define a new specialized role for your family members. You can configure granular financial and view permissions after creation.
            </p>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label" style={{ fontWeight: 600 }}>Role Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Elder Brother, Guardian, Teenager"
                value={roleName}
                onChange={e => {
                  setRoleName(e.target.value);
                  if (error) setError('');
                }}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label" style={{ fontWeight: 600 }}>Description</label>
              <textarea
                className="input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="e.g. Family member with limited financial access and personal expense logging"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-canvas, rgba(0,0,0,0.03))',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              Default permissions will allow manual income/expense entry and personal transaction review.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>Create Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
