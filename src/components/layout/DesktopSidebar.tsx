/* =========================================================
   DESKTOP SIDEBAR NAVIGATION COMPONENT
   ========================================================= */

import React from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  GitPullRequest,
  Calculator,
  BarChart3,
  CalendarClock,
  ShieldCheck,
  Users,
  KeyRound,
  Sliders,
  Wallet,
  ScrollText,
  Lock,
  ScanLine,
  Landmark,
  Bot,
} from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentMember, requests, hasPermission } = useFamilyFinance();

  const isHead = currentMember.role === 'FAMILY_HEAD';
  const isCoManager = currentMember.role === 'CO_MANAGER';
  const isChild = currentMember.role === 'CHILD';

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-brand-header">
        <div className="brand-icon-wrap" style={{ width: 34, height: 34 }}>
          <ShieldCheck size={18} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
            Family Finance
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--brass)', textTransform: 'uppercase' }}>
            Sync Pro • v2.0
          </div>
        </div>
      </div>

      <div className="sidebar-scroll-content">
        {/* Core Financial Operations */}
        <div>
          <div className="sidebar-group-title">Financial Workspace</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button
              className={`nav-link-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
            </button>

            {hasPermission('transactions.view') && (
              <button
                className={`nav-link-item ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Receipt size={18} />
                  <span>Transactions</span>
                </div>
              </button>
            )}

            {!isChild && hasPermission('budgets.view') && (
              <button
                className={`nav-link-item ${activeTab === 'budgets' ? 'active' : ''}`}
                onClick={() => setActiveTab('budgets')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <PiggyBank size={18} />
                  <span>Budgets</span>
                </div>
              </button>
            )}

            {hasPermission('requests.view') && (
              <button
                className={`nav-link-item ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <GitPullRequest size={18} />
                  <span>Requests</span>
                </div>
                {pendingRequestsCount > 0 && (
                  <span className="badge-count">{pendingRequestsCount}</span>
                )}
              </button>
            )}

            {hasPermission('goals.view') && (
              <button
                className={`nav-link-item ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => setActiveTab('goals')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <PiggyBank size={18} />
                  <span>Savings Goals</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Planning & Analytics */}
        <div>
          <div className="sidebar-group-title">Planning & Tools</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button
              className={`nav-link-item ${activeTab === 'affordability' ? 'active' : ''}`}
              onClick={() => setActiveTab('affordability')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Calculator size={18} />
                <span>Can I Afford This?</span>
              </div>
            </button>

            {!isChild && hasPermission('reports.view') && (
              <button
                className={`nav-link-item ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <BarChart3 size={18} />
                  <span>Reports & Trends</span>
                </div>
              </button>
            )}

            {!isChild && (
              <button
                className={`nav-link-item ${activeTab === 'recurring' ? 'active' : ''}`}
                onClick={() => setActiveTab('recurring')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CalendarClock size={18} />
                  <span>Recurring & Bills</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Family Administration (Family Head & Co-Manager) */}
        {(isHead || isCoManager) && (
          <div>
            <div className="sidebar-group-title">Family Control Center</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                className={`nav-link-item ${activeTab === 'control_center' ? 'active' : ''}`}
                onClick={() => setActiveTab('control_center')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <ShieldCheck size={18} />
                  <span>Control Center & Settings</span>
                </div>
              </button>

              <button
                className={`nav-link-item ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Users size={18} />
                  <span>Members & Roles</span>
                </div>
              </button>

              {isHead && (
                <button
                  className={`nav-link-item ${activeTab === 'permissions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('permissions')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <KeyRound size={18} />
                    <span>Permissions Matrix</span>
                  </div>
                </button>
              )}

              <button
                className={`nav-link-item ${activeTab === 'spending_limits' ? 'active' : ''}`}
                onClick={() => setActiveTab('spending_limits')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sliders size={18} />
                  <span>Spending Limits</span>
                </div>
              </button>

              <button
                className={`nav-link-item ${activeTab === 'accounts' ? 'active' : ''}`}
                onClick={() => setActiveTab('accounts')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Wallet size={18} />
                  <span>Accounts & Vaults</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Member Settings (For Adult & Child Members) */}
        {!(isHead || isCoManager) && (
          <div>
            <div className="sidebar-group-title">Account & Settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                className={`nav-link-item ${activeTab === 'control_center' ? 'active' : ''}`}
                onClick={() => setActiveTab('control_center')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sliders size={18} />
                  <span>{isChild ? 'My Settings & Allowance' : 'Settings & Preferences'}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Governance & Audit */}
        {hasPermission('audit.view') && (
          <div>
            <div className="sidebar-group-title">Security & Audit</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                className={`nav-link-item ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <ScrollText size={18} />
                  <span>Audit Trail</span>
                </div>
              </button>

              <button
                className={`nav-link-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Lock size={18} />
                  <span>Security & Sessions</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Future Innovations */}
        <div>
          <div className="sidebar-group-title">Future Innovations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button
              className={`nav-link-item ${activeTab === 'receipt_ocr' ? 'active' : ''}`}
              onClick={() => setActiveTab('receipt_ocr')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ScanLine size={18} />
                <span>Smart Receipt OCR</span>
              </div>
            </button>

            <button
              className={`nav-link-item ${activeTab === 'bank_sync' ? 'active' : ''}`}
              onClick={() => setActiveTab('bank_sync')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Landmark size={18} />
                <span>Bank Sync Hub</span>
              </div>
            </button>

            <button
              className={`nav-link-item ${activeTab === 'ai_insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai_insights')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Bot size={18} />
                <span>AI Insights Advisor</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
