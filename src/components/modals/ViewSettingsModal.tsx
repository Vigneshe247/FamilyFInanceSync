import React, { useState } from 'react';
import { useViewSettings, ViewSettingsState } from '../../context/ViewSettingsContext';
import {
  X,
  Settings,
  RotateCcw,
  Check,
  LayoutDashboard,
  Receipt,
  Users,
  Shield,
  PiggyBank,
  GitPullRequest,
  Target,
  Repeat,
  CreditCard,
  TrendingUp,
  Split,
  BarChart3,
  Sliders,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';

interface ViewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateControlCenter?: () => void;
}

const VIEW_METADATA: Record<
  keyof ViewSettingsState,
  { label: string; icon: React.FC<{ size?: number; color?: string }>; desc: string }
> = {
  transactions: {
    label: 'Finances & Ledger',
    icon: Receipt,
    desc: 'Sorting preferences, row density, column masks, and automatic categorization rules.',
  },
  dashboard: {
    label: 'Dashboard',
    icon: LayoutDashboard,
    desc: 'Default timeframe, balance confidentiality masking, and widget visibility.',
  },
  members: {
    label: 'Family Members',
    icon: Users,
    desc: 'Member card layout, privacy masking for phone/email, and activity notifications.',
  },
  permissions: {
    label: 'Roles & Permissions',
    icon: Shield,
    desc: 'Capability matrix grouping, destructive action confirmations, and audit logging.',
  },
  budgets: {
    label: 'Budgets & Limits',
    icon: PiggyBank,
    desc: 'Alert consumption thresholds, unspent balance rollover, and child micro-spend caps.',
  },
  requests: {
    label: 'Expense Requests',
    icon: GitPullRequest,
    desc: 'Micro-approval thresholds, receipt attachment policies, and request expiry timers.',
  },
  goals: {
    label: 'Savings Goals',
    icon: Target,
    desc: 'Spare change round-ups, milestone celebration animations, and prioritization.',
  },
  recurring: {
    label: 'Bills & Subscriptions',
    icon: Repeat,
    desc: 'Advance due date notifications, ledger automation, and frequency grouping.',
  },
  loans: {
    label: 'Loans & Debt',
    icon: CreditCard,
    desc: 'EMI payment alert reminders, interest accounting, and prepayment calculation.',
  },
  investments: {
    label: 'Investments & Wealth',
    icon: TrendingUp,
    desc: 'Valuation display metrics, benchmark indices, and automated return tracking.',
  },
  split_expenses: {
    label: 'Shared & Split Bills',
    icon: Split,
    desc: 'Default splitting algorithm, settle-up alert thresholds, and participant alerts.',
  },
  reports: {
    label: 'Reports & Analytics',
    icon: BarChart3,
    desc: 'Default chart visualizations, inter-account transfer exclusions, and export format.',
  },
};

export const ViewSettingsModal: React.FC<ViewSettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateControlCenter,
}) => {
  const {
    settings,
    updateViewSettings,
    resetViewSettings,
    activeSettingsView,
  } = useViewSettings();

  const [selectedTab, setSelectedTab] = useState<keyof ViewSettingsState>(activeSettingsView);
  const [justSaved, setJustSaved] = useState(false);

  // Sync tab if activeSettingsView changed from outside
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTab(activeSettingsView);
    }
  }, [isOpen, activeSettingsView]);

  if (!isOpen) return null;

  const currentMeta = VIEW_METADATA[selectedTab];
  const IconComp = currentMeta.icon;

  const handleToggle = (view: keyof ViewSettingsState, field: string, currentVal: boolean) => {
    updateViewSettings(view, { [field]: !currentVal } as any);
    triggerSavedFeedback();
  };

  const handleSelectChange = (view: keyof ViewSettingsState, field: string, val: any) => {
    updateViewSettings(view, { [field]: val } as any);
    triggerSavedFeedback();
  };

  const triggerSavedFeedback = () => {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'var(--mint-pill)',
                color: 'var(--mint-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  View Settings & Preferences
                </h2>
                {justSaved && (
                  <span
                    style={{
                      background: 'rgba(5, 150, 105, 0.12)',
                      color: 'var(--mint-primary)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    <Check size={11} /> Saved
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Tailor how each financial view operates and presents information
              </p>
            </div>
          </div>

          <button
            className="btn btn-icon btn-sm"
            onClick={onClose}
            aria-label="Close"
            style={{ borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip - Quick Switching between all views */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.65rem 1.25rem',
            background: 'var(--bg-canvas)',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {(Object.keys(VIEW_METADATA) as Array<keyof ViewSettingsState>).map(key => {
            const isSelected = selectedTab === key;
            const TabIcon = VIEW_METADATA[key].icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedTab(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid var(--mint-primary)' : '1px solid transparent',
                  background: isSelected ? 'var(--card-bg)' : 'transparent',
                  color: isSelected ? 'var(--mint-primary)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <TabIcon size={14} />
                <span>{VIEW_METADATA[key].label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Active View Settings */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 170px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Active View Intro Banner */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--card-bg), var(--bg-canvas))',
              border: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'var(--mint-pill)',
                color: 'var(--mint-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconComp size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                {currentMeta.label} Configuration
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {currentMeta.desc}
              </div>
            </div>
          </div>

          {/* ================= 1. TRANSACTIONS SETTINGS ================= */}
          {selectedTab === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Default Sorting & Ordering
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Default Sort Order
                    </label>
                    <select
                      className="select"
                      value={settings.transactions.defaultSort}
                      onChange={e => handleSelectChange('transactions', 'defaultSort', e.target.value)}
                    >
                      <option value="date_desc">Newest First (Recent to Old)</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="amount_desc">Amount: High to Low</option>
                      <option value="amount_asc">Amount: Low to High</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Default Date Range Preset
                    </label>
                    <select
                      className="select"
                      value={settings.transactions.defaultDatePreset}
                      onChange={e => handleSelectChange('transactions', 'defaultDatePreset', e.target.value)}
                    >
                      <option value="month">Current Month</option>
                      <option value="week">Last 7 Days</option>
                      <option value="year">Current Year</option>
                      <option value="all">All Time (Full Ledger)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Display & Privacy Preferences
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Compact Row Density"
                    desc="Display tighter rows with condensed padding to view more transactions at once"
                    checked={settings.transactions.rowDensity === 'compact'}
                    onChange={() =>
                      handleSelectChange(
                        'transactions',
                        'rowDensity',
                        settings.transactions.rowDensity === 'compact' ? 'comfortable' : 'compact'
                      )
                    }
                  />

                  <SettingToggleItem
                    title="Mask Amounts in Ledger (Privacy Mode)"
                    desc="Replace monetary amounts with •••••• dots until hovered or clicked"
                    checked={settings.transactions.maskSensitiveAmounts}
                    onChange={() =>
                      handleToggle('transactions', 'maskSensitiveAmounts', settings.transactions.maskSensitiveAmounts)
                    }
                  />

                  <SettingToggleItem
                    title="Smart Auto-Categorization"
                    desc="Automatically detect categories for UPI, merchant IDs, and recurring notes"
                    checked={settings.transactions.autoCategorizeUPI}
                    onChange={() =>
                      handleToggle('transactions', 'autoCategorizeUPI', settings.transactions.autoCategorizeUPI)
                    }
                  />

                  <SettingToggleItem
                    title="Show Source Account Badges"
                    desc="Display account / card pills directly next to transaction merchant names"
                    checked={settings.transactions.showAccountBadges}
                    onChange={() =>
                      handleToggle('transactions', 'showAccountBadges', settings.transactions.showAccountBadges)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. DASHBOARD SETTINGS ================= */}
          {selectedTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Overview Chart & Balance Preferences
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Default Overview Timeframe
                    </label>
                    <select
                      className="select"
                      value={settings.dashboard.defaultTimeframe}
                      onChange={e => handleSelectChange('dashboard', 'defaultTimeframe', e.target.value)}
                    >
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="q3">Current Quarter (Q3)</option>
                      <option value="yearly">Full Year</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Low Balance Warning Alert
                    </label>
                    <select
                      className="select"
                      value={settings.dashboard.lowBalanceThreshold}
                      onChange={e => handleSelectChange('dashboard', 'lowBalanceThreshold', Number(e.target.value))}
                    >
                      <option value="200000">₹2,000 threshold</option>
                      <option value="500000">₹5,000 threshold (Default)</option>
                      <option value="1000000">₹10,000 threshold</option>
                      <option value="2500000">₹25,000 threshold</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Widget Visibility & Confidentiality
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Mask Total Family Balance by Default"
                    desc="Start dashboard with balance masked as •••••••• to protect privacy in shared spaces"
                    checked={settings.dashboard.maskBalancesDefault}
                    onChange={() =>
                      handleToggle('dashboard', 'maskBalancesDefault', settings.dashboard.maskBalancesDefault)
                    }
                  />

                  <SettingToggleItem
                    title="Financial Action Plan Widget"
                    desc="Display the interactive checklist and task-to-goal converter in column 1"
                    checked={settings.dashboard.showFinancialPlan}
                    onChange={() =>
                      handleToggle('dashboard', 'showFinancialPlan', settings.dashboard.showFinancialPlan)
                    }
                  />

                  <SettingToggleItem
                    title="Family Accounts Vault Card"
                    desc="Show quick balances of bank accounts, cash, and digital wallets"
                    checked={settings.dashboard.showAccountsCard}
                    onChange={() =>
                      handleToggle('dashboard', 'showAccountsCard', settings.dashboard.showAccountsCard)
                    }
                  />

                  <SettingToggleItem
                    title="Category Spending Breakdown Card"
                    desc="Display the dynamic spending donut chart with quick filter tabs"
                    checked={settings.dashboard.showSpendingBreakdown}
                    onChange={() =>
                      handleToggle('dashboard', 'showSpendingBreakdown', settings.dashboard.showSpendingBreakdown)
                    }
                  />

                  <SettingToggleItem
                    title="Recent Audit Activity Feed"
                    desc="Show live security and operational updates from family members"
                    checked={settings.dashboard.showRecentActivity}
                    onChange={() =>
                      handleToggle('dashboard', 'showRecentActivity', settings.dashboard.showRecentActivity)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. MEMBERS SETTINGS ================= */}
          {selectedTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Member Privacy & Layout
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Mask Personal Contact Info (Phone & Email)"
                    desc="Ensure non-admin family members see 🔒 Private instead of personal phone numbers and emails"
                    checked={settings.members.maskContactDetails}
                    onChange={() =>
                      handleToggle('members', 'maskContactDetails', settings.members.maskContactDetails)
                    }
                  />

                  <SettingToggleItem
                    title="Display Join & Membership Dates"
                    desc="Show when each family member joined the workspace in their profile card"
                    checked={settings.members.showJoinDates}
                    onChange={() =>
                      handleToggle('members', 'showJoinDates', settings.members.showJoinDates)
                    }
                  />

                  <SettingToggleItem
                    title="Member Activity Notifications"
                    desc="Notify Family Head when members update their display profiles or avatar"
                    checked={settings.members.notifyMemberActivity}
                    onChange={() =>
                      handleToggle('members', 'notifyMemberActivity', settings.members.notifyMemberActivity)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. PERMISSIONS SETTINGS ================= */}
          {selectedTab === 'permissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Governance & Protection Controls
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Require Confirmation for High-Risk Overrides"
                    desc="Prompt for confirmation before granting permissions like account deletion or budget modifications"
                    checked={settings.permissions.requireHighRiskConfirmation}
                    onChange={() =>
                      handleToggle('permissions', 'requireHighRiskConfirmation', settings.permissions.requireHighRiskConfirmation)
                    }
                  />

                  <SettingToggleItem
                    title="Group Matrix by Capability Module"
                    desc="Organize the permissions table into Banking, Budgeting, Family Admin, and Analytics sections"
                    checked={settings.permissions.groupMatrixByModule}
                    onChange={() =>
                      handleToggle('permissions', 'groupMatrixByModule', settings.permissions.groupMatrixByModule)
                    }
                  />

                  <SettingToggleItem
                    title="Lock Custom Overrides to Family Head"
                    desc="Ensure only the primary workspace owner can flip toggles in the permissions matrix"
                    checked={settings.permissions.lockOverridesToHeadOnly}
                    onChange={() =>
                      handleToggle('permissions', 'lockOverridesToHeadOnly', settings.permissions.lockOverridesToHeadOnly)
                    }
                  />

                  <SettingToggleItem
                    title="Enable Audit Log Sync for Permission Toggles"
                    desc="Automatically append every granted or revoked capability into the immutable audit trail"
                    checked={settings.permissions.enableAuditLogExport}
                    onChange={() =>
                      handleToggle('permissions', 'enableAuditLogExport', settings.permissions.enableAuditLogExport)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. BUDGETS SETTINGS ================= */}
          {selectedTab === 'budgets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Budget Thresholds & Rolling Rules
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Alert Warning Threshold
                    </label>
                    <select
                      className="select"
                      value={settings.budgets.alertThresholdPercent}
                      onChange={e => handleSelectChange('budgets', 'alertThresholdPercent', Number(e.target.value))}
                    >
                      <option value="70">70% consumption (Early caution)</option>
                      <option value="80">80% consumption (Default standard)</option>
                      <option value="90">90% consumption (Critical limit)</option>
                      <option value="100">100% (Only alert when breached)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Fiscal Cycle Start Day
                    </label>
                    <select
                      className="select"
                      value={settings.budgets.fiscalStartDay}
                      onChange={e => handleSelectChange('budgets', 'fiscalStartDay', Number(e.target.value))}
                    >
                      <option value="1">1st of Month (Standard)</option>
                      <option value="5">5th of Month (Salary day)</option>
                      <option value="10">10th of Month</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Rollover Unspent Monthly Balances"
                    desc="Automatically carry forward unused budget headroom into the following month"
                    checked={settings.budgets.rolloverUnspentBudget}
                    onChange={() =>
                      handleToggle('budgets', 'rolloverUnspentBudget', settings.budgets.rolloverUnspentBudget)
                    }
                  />

                  <SettingToggleItem
                    title="Auto-Approve Child Micro-Spends (< ₹500)"
                    desc="Automatically pass micro-expenses like snacks or stationery without requiring parental review"
                    checked={settings.budgets.autoApproveChildMicroSpend}
                    onChange={() =>
                      handleToggle('budgets', 'autoApproveChildMicroSpend', settings.budgets.autoApproveChildMicroSpend)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. REQUESTS SETTINGS ================= */}
          {selectedTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Approval Automation & Policy
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Auto-Approval Limit
                    </label>
                    <select
                      className="select"
                      value={settings.requests.autoApprovalLimitPaise}
                      onChange={e => handleSelectChange('requests', 'autoApprovalLimitPaise', Number(e.target.value))}
                    >
                      <option value="0">Disabled (Review all requests)</option>
                      <option value="20000">₹200 micro-requests</option>
                      <option value="50000">₹500 micro-requests</option>
                      <option value="100000">₹1,000 allowance items</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Auto-Expire Pending Requests
                    </label>
                    <select
                      className="select"
                      value={settings.requests.autoExpireDays}
                      onChange={e => handleSelectChange('requests', 'autoExpireDays', Number(e.target.value))}
                    >
                      <option value="7">After 7 days</option>
                      <option value="14">After 14 days (Default)</option>
                      <option value="30">After 30 days</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Instant Notification for Family Head"
                    desc="Trigger push and in-app sound alert the instant a child submits an expense request"
                    checked={settings.requests.instantPushNotification}
                    onChange={() =>
                      handleToggle('requests', 'instantPushNotification', settings.requests.instantPushNotification)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 7. GOALS SETTINGS ================= */}
          {selectedTab === 'goals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Savings Automation & Celebrations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Simulate Spare Change Round-Ups"
                    desc="Round everyday transactions to the nearest ₹10 and allocate remainder to active goals"
                    checked={settings.goals.roundUpSpareChange}
                    onChange={() =>
                      handleToggle('goals', 'roundUpSpareChange', settings.goals.roundUpSpareChange)
                    }
                  />

                  <SettingToggleItem
                    title="Milestone Celebration Animations"
                    desc="Show confetti bursts and congratulatory badges when reaching 50%, 75%, and 100% of targets"
                    checked={settings.goals.celebrateMilestones}
                    onChange={() =>
                      handleToggle('goals', 'celebrateMilestones', settings.goals.celebrateMilestones)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 8. RECURRING SETTINGS ================= */}
          {selectedTab === 'recurring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Bill Reminders & Automation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Advance Due Reminder
                    </label>
                    <select
                      className="select"
                      value={settings.recurring.reminderAdvanceDays}
                      onChange={e => handleSelectChange('recurring', 'reminderAdvanceDays', Number(e.target.value))}
                    >
                      <option value="1">1 day prior</option>
                      <option value="3">3 days prior (Recommended)</option>
                      <option value="7">7 days prior</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Auto-Record in Master Ledger when Paid"
                    desc="Automatically create an expense transaction entry when a recurring bill is marked paid"
                    checked={settings.recurring.autoRecordPaidTransaction}
                    onChange={() =>
                      handleToggle('recurring', 'autoRecordPaidTransaction', settings.recurring.autoRecordPaidTransaction)
                    }
                  />

                  <SettingToggleItem
                    title="Group Bills by Frequency"
                    desc="Group recurring bills into Monthly, Quarterly, and Annual categories"
                    checked={settings.recurring.groupByFrequency}
                    onChange={() =>
                      handleToggle('recurring', 'groupByFrequency', settings.recurring.groupByFrequency)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 9. LOANS SETTINGS ================= */}
          {selectedTab === 'loans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Loan Calculations & EMI Alerts
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Prepayment Mode Preference
                    </label>
                    <select
                      className="select"
                      value={settings.loans.prepaymentMode}
                      onChange={e => handleSelectChange('loans', 'prepaymentMode', e.target.value)}
                    >
                      <option value="reduce_tenure">Reduce Loan Tenure (Save maximum interest)</option>
                      <option value="reduce_emi">Reduce Monthly EMI (Improve monthly cashflow)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Include Interest in Monthly Expense"
                    desc="Treat the interest component of EMIs as regular family expense in analytics"
                    checked={settings.loans.includeInterestInMonthlyExpense}
                    onChange={() =>
                      handleToggle('loans', 'includeInterestInMonthlyExpense', settings.loans.includeInterestInMonthlyExpense)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 10. INVESTMENTS SETTINGS ================= */}
          {selectedTab === 'investments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Portfolio Valuation & Benchmarks
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Primary Display Metric
                    </label>
                    <select
                      className="select"
                      value={settings.investments.displayMetric}
                      onChange={e => handleSelectChange('investments', 'displayMetric', e.target.value)}
                    >
                      <option value="current_value">Current Valuation (Market Value)</option>
                      <option value="invested_value">Total Capital Invested</option>
                      <option value="returns_percent">Total Returns % (XIRR / Absolute)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Comparison Benchmark
                    </label>
                    <select
                      className="select"
                      value={settings.investments.benchmarkIndex}
                      onChange={e => handleSelectChange('investments', 'benchmarkIndex', e.target.value)}
                    >
                      <option value="NIFTY50">Nifty 50 Index</option>
                      <option value="SENSEX">BSE Sensex</option>
                      <option value="NONE">No Benchmark Comparison</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 11. SPLIT BILLS SETTINGS ================= */}
          {selectedTab === 'split_expenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Bill Splitting Defaults
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Default Calculation Strategy
                    </label>
                    <select
                      className="select"
                      value={settings.split_expenses.defaultSplitMethod}
                      onChange={e => handleSelectChange('split_expenses', 'defaultSplitMethod', e.target.value)}
                    >
                      <option value="equal">Equal Split (1/N per member)</option>
                      <option value="income_ratio">Proportional to monthly income</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Notify Participants Instantly"
                    desc="Send notification alert to members when a shared dinner or utility bill is logged"
                    checked={settings.split_expenses.notifyMembersOnAdd}
                    onChange={() =>
                      handleToggle('split_expenses', 'notifyMembersOnAdd', settings.split_expenses.notifyMembersOnAdd)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= 12. REPORTS SETTINGS ================= */}
          {selectedTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="neo-card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Analytics & Cashflow Calculation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Primary Chart Visual
                    </label>
                    <select
                      className="select"
                      value={settings.reports.defaultChartType}
                      onChange={e => handleSelectChange('reports', 'defaultChartType', e.target.value)}
                    >
                      <option value="spline_area">Smooth Curved Area (Neo-Mint)</option>
                      <option value="bar">Monthly Clustered Bar</option>
                      <option value="donut">Donut Proportion</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <SettingToggleItem
                    title="Exclude Transfers from Income/Expense Totals"
                    desc="Prevent internal wallet-to-bank transfers from distorting actual household cashflow"
                    checked={settings.reports.excludeTransfersFromCashflow}
                    onChange={() =>
                      handleToggle('reports', 'excludeTransfersFromCashflow', settings.reports.excludeTransfersFromCashflow)
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--paper-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              resetViewSettings(selectedTab);
              triggerSavedFeedback();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={13} />
            <span>Reset {VIEW_METADATA[selectedTab].label} Defaults</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {onNavigateControlCenter && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateControlCenter();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Full Control Center</span>
                <ExternalLink size={13} />
              </button>
            )}

            <button className="btn btn-primary btn-sm" onClick={onClose} style={{ minWidth: '100px' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingToggleItemProps {
  title: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}

const SettingToggleItem: React.FC<SettingToggleItemProps> = ({ title, desc, checked, onChange }) => {
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '12px',
        background: checked ? 'rgba(5, 150, 105, 0.04)' : 'transparent',
        border: checked ? '1px solid rgba(5, 150, 105, 0.18)' : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</div>
      </div>

      <div
        style={{
          width: 40,
          height: 22,
          borderRadius: '9999px',
          background: checked ? 'var(--mint-primary)' : 'var(--border-card)',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#FFFFFF',
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            transition: 'left 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  );
};
