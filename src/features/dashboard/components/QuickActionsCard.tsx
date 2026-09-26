/* =========================================================
   QUICK ACTIONS CARD — ULTRA-LUXURY GLASSMORPHIC ACTIONS PANEL
   - 4 Interactive Action Tiles (Add Expense, Add Income, Request, Afford This?)
   - Colored glowing backdrops with hover elevation and spring motion
   - Keyboard hotkey listeners ('E', 'I', 'R', 'A') for instant family ledger access
   - Dynamic status pulse and top-right master add button
   ========================================================= */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  ArrowUpRight,
  Send,
  Calculator,
  Sparkles,
  Zap,
} from 'lucide-react';

interface QuickActionsCardProps {
  onOpenNewTx: (initialType?: 'expense' | 'income') => void;
  onOpenNewRequest: () => void;
  onOpenAffordability?: () => void;
  setActiveTab: (tab: string) => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onOpenNewTx,
  onOpenNewRequest,
  onOpenAffordability,
  setActiveTab,
}) => {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  // Global hotkey listeners for fast power-user workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'e') {
        e.preventDefault();
        onOpenNewTx('expense');
      } else if (key === 'i') {
        e.preventDefault();
        onOpenNewTx('income');
      } else if (key === 'r') {
        e.preventDefault();
        onOpenNewRequest();
      } else if (key === 'a') {
        e.preventDefault();
        if (onOpenAffordability) onOpenAffordability();
        else setActiveTab('affordability');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenNewTx, onOpenNewRequest, onOpenAffordability, setActiveTab]);

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #15221B 0%, #0E1712 100%)',
        border: '1px solid rgba(52, 199, 121, 0.22)',
        borderRadius: 'var(--radius-card, 22px)',
        padding: '1.25rem',
        color: '#FFFFFF',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      {/* Top Emerald Ambient Glow Rim */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(52, 199, 121, 0.8), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Quick Actions
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: '#34C779',
              background: 'rgba(52, 199, 121, 0.12)',
              border: '1px solid rgba(52, 199, 121, 0.25)',
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Zap size={10} /> Fast Ledger
          </span>
        </div>

        {/* Master Add Button */}
        <button
          onClick={() => onOpenNewTx('expense')}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22A05B 0%, #156B3D 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 12px rgba(34, 160, 91, 0.4)',
          }}
          title="Record transaction [E]"
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'rotate(90deg) scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(52, 199, 121, 0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 160, 91, 0.4)';
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 4 Interactive Action Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.55rem',
        }}
      >
        {/* 1. Add Expense Tile */}
        <button
          className="action-tile-btn"
          onClick={() => onOpenNewTx('expense')}
          onMouseEnter={() => setHoveredTile('expense')}
          onMouseLeave={() => setHoveredTile(null)}
          style={{
            background: hoveredTile === 'expense' ? 'rgba(34, 160, 91, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            borderColor: hoveredTile === 'expense' ? 'rgba(34, 160, 91, 0.45)' : 'rgba(255, 255, 255, 0.08)',
            transform: hoveredTile === 'expense' ? 'translateY(-3px)' : 'none',
            boxShadow: hoveredTile === 'expense' ? '0 8px 20px -4px rgba(34, 160, 91, 0.3)' : 'none',
          }}
        >
          <div
            className="action-tile-icon-wrap"
            style={{
              background: 'rgba(34, 160, 91, 0.22)',
              color: '#34C779',
              boxShadow: hoveredTile === 'expense' ? '0 0 14px rgba(52, 199, 121, 0.5)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={18} strokeWidth={2.4} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.68rem', color: '#FFFFFF', marginTop: '0.1rem' }}>
            Add Expense
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.05rem 0.3rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            [E]
          </span>
        </button>

        {/* 2. Add Income Tile */}
        <button
          className="action-tile-btn"
          onClick={() => onOpenNewTx('income')}
          onMouseEnter={() => setHoveredTile('income')}
          onMouseLeave={() => setHoveredTile(null)}
          style={{
            background: hoveredTile === 'income' ? 'rgba(62, 139, 245, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            borderColor: hoveredTile === 'income' ? 'rgba(62, 139, 245, 0.45)' : 'rgba(255, 255, 255, 0.08)',
            transform: hoveredTile === 'income' ? 'translateY(-3px)' : 'none',
            boxShadow: hoveredTile === 'income' ? '0 8px 20px -4px rgba(62, 139, 245, 0.3)' : 'none',
          }}
        >
          <div
            className="action-tile-icon-wrap"
            style={{
              background: 'rgba(62, 139, 245, 0.22)',
              color: '#60A5FA',
              boxShadow: hoveredTile === 'income' ? '0 0 14px rgba(96, 165, 250, 0.5)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowUpRight size={18} strokeWidth={2.4} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.68rem', color: '#FFFFFF', marginTop: '0.1rem' }}>
            Add Income
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.05rem 0.3rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            [I]
          </span>
        </button>

        {/* 3. Request Tile */}
        <button
          className="action-tile-btn"
          onClick={onOpenNewRequest}
          onMouseEnter={() => setHoveredTile('request')}
          onMouseLeave={() => setHoveredTile(null)}
          style={{
            background: hoveredTile === 'request' ? 'rgba(229, 161, 30, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            borderColor: hoveredTile === 'request' ? 'rgba(229, 161, 30, 0.45)' : 'rgba(255, 255, 255, 0.08)',
            transform: hoveredTile === 'request' ? 'translateY(-3px)' : 'none',
            boxShadow: hoveredTile === 'request' ? '0 8px 20px -4px rgba(229, 161, 30, 0.3)' : 'none',
          }}
        >
          <div
            className="action-tile-icon-wrap"
            style={{
              background: 'rgba(229, 161, 30, 0.22)',
              color: '#FBBF24',
              boxShadow: hoveredTile === 'request' ? '0 0 14px rgba(251, 191, 36, 0.5)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={16} strokeWidth={2.4} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.68rem', color: '#FFFFFF', marginTop: '0.1rem' }}>
            Request
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.05rem 0.3rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            [R]
          </span>
        </button>

        {/* 4. Afford This? Tile */}
        <button
          className="action-tile-btn"
          onClick={() => {
            if (onOpenAffordability) onOpenAffordability();
            else setActiveTab('affordability');
          }}
          onMouseEnter={() => setHoveredTile('afford')}
          onMouseLeave={() => setHoveredTile(null)}
          style={{
            background: hoveredTile === 'afford' ? 'rgba(155, 81, 224, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            borderColor: hoveredTile === 'afford' ? 'rgba(155, 81, 224, 0.45)' : 'rgba(255, 255, 255, 0.08)',
            transform: hoveredTile === 'afford' ? 'translateY(-3px)' : 'none',
            boxShadow: hoveredTile === 'afford' ? '0 8px 20px -4px rgba(155, 81, 224, 0.3)' : 'none',
          }}
        >
          <div
            className="action-tile-icon-wrap"
            style={{
              background: 'rgba(155, 81, 224, 0.22)',
              color: '#C084FC',
              boxShadow: hoveredTile === 'afford' ? '0 0 14px rgba(192, 132, 252, 0.5)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Calculator size={16} strokeWidth={2.4} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.68rem', color: '#FFFFFF', marginTop: '0.1rem' }}>
            Afford This?
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.05rem 0.3rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            [A]
          </span>
        </button>
      </div>
    </div>
  );
};
