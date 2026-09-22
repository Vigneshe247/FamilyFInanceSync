/* =========================================================
   ACCESS RESTRICTED GUARD SCREEN (Section 31)
   Shown when a user attempts to access an unauthorized section.
   ========================================================= */

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AccessRestrictedProps {
  onBackToDashboard?: () => void;
  message?: string;
  requiredPermission?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  onBackToDashboard,
  message = "You don't have permission to access this section.",
}) => {
  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '4rem auto',
        padding: '2.5rem 2rem',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-card)',
        borderRadius: '24px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(235, 87, 87, 0.12)',
          color: '#EB5757',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}
      >
        <ShieldAlert size={32} />
      </div>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '0 0 0.5rem',
        }}
      >
        Access Restricted
      </h2>

      <p
        style={{
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          margin: '0 0 0.75rem',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-canvas-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          marginBottom: '1.75rem',
        }}
      >
        Contact your <strong>Family Head</strong> if you need access to this resource.
      </div>

      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="btn btn-primary"
          style={{
            margin: '0 auto',
            padding: '0.7rem 1.5rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      )}
    </div>
  );
};
