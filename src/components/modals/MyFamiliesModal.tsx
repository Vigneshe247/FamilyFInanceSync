import React from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { X, Users, Plus, Key, Check, Shield, ArrowRight, UserCheck } from 'lucide-react';

interface MyFamiliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateFamily: () => void;
  onOpenJoinFamily: () => void;
}

export const MyFamiliesModal: React.FC<MyFamiliesModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateFamily,
  onOpenJoinFamily,
}) => {
  const { activeFamily, linkedFamilies, switchActiveFamily, allFamilies } = useFamilyFinance();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '580px', borderRadius: '24px', padding: '1.75rem' }}
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                My Families
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Your linked family finance workspaces & permissions
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              onOpenCreateFamily();
            }}
            style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Plus size={15} /> Create New Family
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onOpenJoinFamily();
            }}
            style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Key size={15} /> Join with Code
          </button>
        </div>

        {/* Linked Families Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {linkedFamilies.map(fam => {
            const isActive = activeFamily.id === fam.family_id;
            const fullFam = allFamilies.find(f => f.id === fam.family_id);
            const roleColor = fam.role === 'owner' ? '#059669' : fam.role === 'admin' ? '#2563EB' : '#D97706';

            return (
              <div
                key={fam.family_id}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '16px',
                  background: isActive ? 'rgba(5, 150, 105, 0.05)' : 'var(--bg-canvas-subtle)',
                  border: isActive ? '2px solid var(--mint-primary)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {fam.family_name}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          background: 'var(--mint-primary)',
                          color: '#FFFFFF',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Check size={11} strokeWidth={3} /> ACTIVE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>
                      Role: <strong style={{ color: roleColor, textTransform: 'capitalize' }}>{fam.role}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Status: <strong style={{ color: '#059669', textTransform: 'capitalize' }}>{fam.status}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Members: <strong>{fam.member_count}</strong>
                    </span>
                  </div>

                  {fullFam?.description && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fullFam.description}
                    </div>
                  )}
                </div>

                <div>
                  {isActive ? (
                    <div
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        background: 'rgba(5, 150, 105, 0.12)',
                        color: 'var(--mint-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <UserCheck size={14} /> Current
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        switchActiveFamily(fam.family_id);
                        onClose();
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
                    >
                      Switch <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
