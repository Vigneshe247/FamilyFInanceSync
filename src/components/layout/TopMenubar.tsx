/* =========================================================
   FLOATING CAPSULE TOP NAVIGATION (Finova & Crextio style)
   ========================================================= */

import React, { useState, useRef, useEffect } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import {
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown,
  Check,
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  GitPullRequest,
  BarChart3,
  Settings,
  MoreVertical,
  CreditCard,
  TrendingUp,
  Split,
  Target,
  Repeat,
  Sparkles,
  Camera,
  Landmark,
  UserCheck,
  ShieldCheck,
  FileText,
  UploadCloud,
} from 'lucide-react';

interface TopMenubarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTx: () => void;
  onOpenNewRequest: () => void;
  onOpenAffordability: () => void;
  onOpenReceiptOcr: () => void;
  onOpenAuthModal?: () => void;
  onOpenImportModal?: () => void;
}

export const TopMenubar: React.FC<TopMenubarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenImportModal,
}) => {
  const {
    family,
    members,
    currentMember,
    switchMember,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    theme,
    toggleTheme,
    requests,
  } = useFamilyFinance();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read_at);
  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  const isHead = currentMember.role === 'FAMILY_HEAD';
  const isChild = currentMember.role === 'CHILD';

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank, hidden: isChild },
    { id: 'requests', label: 'Requests', icon: GitPullRequest, badge: pendingRequestsCount },
    { id: 'reports', label: 'Analytics', icon: BarChart3, hidden: isChild },
  ];

  const allMoreModules = [
    { id: 'loans', label: 'Loans & Debt', icon: CreditCard, desc: 'Home, vehicle, education & EMI tracker', hidden: isChild },
    { id: 'investments', label: 'Investments', icon: TrendingUp, desc: 'Mutual funds, stocks, FDs & gold', hidden: isChild },
    { id: 'split_expenses', label: 'Split Bills', icon: Split, desc: 'Shared family utility & dinner splits', hidden: isChild },
    { id: 'goals', label: 'Savings Goals', icon: Target, desc: 'Family wealth targets & milestones' },
    { id: 'recurring', label: 'Bills & Recurring', icon: Repeat, desc: 'Subscriptions & automated ledger', hidden: isChild },
    { id: 'ai_insights', label: 'AI Advisor', icon: Sparkles, desc: 'Interactive financial insights & chat' },
    { id: 'receipt_ocr', label: 'Receipt Scanner', icon: Camera, desc: 'AI OCR receipt capture' },
    { id: 'bank_sync', label: 'Bank Sync', icon: Landmark, desc: 'Account Aggregator & live feeds', hidden: isChild },
    { id: 'audit', label: 'Audit Trail', icon: FileText, desc: 'Immutable transaction timeline', hidden: !isHead },
    { id: 'approval_center', label: 'Approval Center', icon: UserCheck, desc: 'Review money requests & child spending', hidden: !isHead },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck, desc: 'Sessions, 2FA & data isolation', hidden: isChild },
  ];

  const moreModules = allMoreModules.filter(m => !m.hidden);

  const isMoreModuleActive = moreModules.some(m => m.id === activeTab);
  const activeMoreModule = moreModules.find(m => m.id === activeTab);

  return (
    <header className="neo-capsule-navbar">
      {/* 1. Left Brand Pill (Finova style) */}
      <div className="brand-pill" onClick={() => setActiveTab('dashboard')}>
        <div className="brand-pill-logo">
          <span>F</span>
        </div>
        <div>
          <div className="brand-pill-text">{family.name}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--mint-primary)', fontWeight: 600 }}>
            ● Realtime Synced
          </div>
        </div>
      </div>

      {/* 2. Center Pill Capsule Navigation Bar (Finova style) */}
      <nav className="nav-capsule-bar">
        {navTabs.filter(t => !t.hidden).map(tab => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              className={`nav-capsule-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComp size={15} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  style={{
                    background: '#EB5757',
                    color: '#FFFFFF',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '9999px',
                    marginLeft: '0.15rem',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* More Modules Capsule Dropdown */}
        <div style={{ position: 'relative' }} ref={moreMenuRef}>
          <button
            className={`nav-capsule-tab ${isMoreModuleActive ? 'active' : ''}`}
            onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
            title="More Financial Modules"
          >
            {activeMoreModule ? (
              <activeMoreModule.icon size={15} />
            ) : (
              <MoreVertical size={15} />
            )}
            <span>{activeMoreModule ? activeMoreModule.label : 'More'}</span>
            <ChevronDown size={12} style={{ opacity: 0.7 }} />
          </button>

          {moreDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '320px',
                background: 'var(--card-bg)',
                borderRadius: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
                padding: '0.65rem',
                zIndex: 1000,
                border: '1px solid var(--border-card)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '0.35rem 0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '0.35rem',
                }}
              >
                Financial Extensions & Wealth
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {moreModules.map(module => {
                  const isSelected = activeTab === module.id;
                  const IconComp = module.icon;
                  return (
                    <div
                      key={module.id}
                      onClick={() => {
                        setActiveTab(module.id);
                        setMoreDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.55rem 0.65rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg-canvas)' : 'transparent',
                        transition: 'background 0.15s ease',
                        marginBottom: '0.15rem',
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '8px',
                          background: isSelected ? 'var(--mint-pill)' : 'var(--bg-canvas)',
                          color: isSelected ? 'var(--mint-primary)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComp size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? 700 : 600,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {module.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {module.desc}
                        </div>
                      </div>
                      {isSelected && <Check size={15} color="var(--mint-primary)" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </nav>

      {/* 3. Right Controls: Search, Notification, Theme, Role Switcher on Far Right */}
      <div className="header-actions-pill-group">
        {/* Search button */}
        <button
          className="action-circle-btn"
          onClick={() => setActiveTab('transactions')}
          title="Search transactions"
        >
          <Search size={16} />
        </button>

        {/* Notification Bell with Badge */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            className="action-circle-btn"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotifs.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  right: '7px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#EB5757',
                  border: '2px solid #FFFFFF',
                }}
              ></span>
            )}
          </button>

          {notifDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '310px',
                background: 'var(--card-bg)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.75rem',
                zIndex: 1000,
                border: '1px solid var(--border-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Notifications ({unreadNotifs.length})
                </span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.slice(0, 4).map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '12px',
                      background: n.read_at ? 'transparent' : 'var(--bg-canvas)',
                      cursor: 'pointer',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {n.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className="action-circle-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Dark theme' : 'Light theme'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Settings Quick Action Button for easy selection */}
        <button
          className="action-circle-btn"
          onClick={() => setActiveTab('control_center')}
          title={isHead ? 'Family Control Center & Settings' : 'Member Settings & Preferences'}
          style={{
            borderColor: activeTab === 'control_center' ? 'var(--mint-primary)' : undefined,
            background: activeTab === 'control_center' ? 'var(--mint-pill)' : undefined,
            color: activeTab === 'control_center' ? 'var(--mint-primary)' : undefined,
          }}
        >
          <Settings size={16} />
        </button>

        {/* Data Import Trigger (Excel, DOCX, PDF) */}
        {onOpenImportModal && (
          <button
            className="action-circle-btn"
            onClick={onOpenImportModal}
            title="Import Family Data (Excel / DOCX / PDF)"
            style={{
              borderColor: 'var(--sky-accent)',
              background: 'rgba(62, 139, 245, 0.08)',
              color: 'var(--sky-accent)',
            }}
          >
            <UploadCloud size={16} />
          </button>
        )}

        {/* User Profile & Auth Trigger */}
        {onOpenAuthModal && (
          <button
            className="action-circle-btn"
            onClick={onOpenAuthModal}
            title="User Profile & Auth Management"
            style={{
              borderColor: 'var(--mint-primary)',
              background: 'rgba(56, 161, 105, 0.08)',
              color: 'var(--mint-primary)',
            }}
          >
            <UserCheck size={16} />
          </button>
        )}

        {/* Dynamic Role Switcher (Far Right, opening inward to the left) */}
        <div style={{ position: 'relative' }} ref={roleMenuRef}>
          <div
            className="header-role-pill"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            title="Switch Family Member Role"
          >
            <img
              src={currentMember.user.avatar_url}
              alt={currentMember.user.name}
              style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                {currentMember.user.name}
              </div>
              <div
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color: currentMember.role === 'FAMILY_HEAD' ? 'var(--mint-primary)' : 'var(--amber-accent)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentMember.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Role Switcher Dropdown (Opens inward with z-index 1000) */}
          {roleDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '270px',
                background: 'var(--card-bg)',
                borderRadius: '20px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
                padding: '0.6rem',
                zIndex: 1000,
                border: '1px solid var(--border-card)',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '0.35rem 0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '0.35rem',
                }}
              >
                Switch Role & Perspective
              </div>

              {members.map(member => {
                const isSelected = member.id === currentMember.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      switchMember(member.id);
                      setRoleDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-canvas)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <img
                        src={member.user.avatar_url}
                        alt={member.user.name}
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{member.user.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {member.role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--mint-primary)" />}
                  </div>
                );
              })}

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: '0.45rem',
                  paddingTop: '0.45rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <button
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    setActiveTab('control_center');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--bg-canvas-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Settings size={15} color="var(--mint-primary)" />
                  <span>{isHead ? 'Family Control Center' : 'Settings & Preferences'}</span>
                </button>

                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'var(--mint-pill)',
                      color: 'var(--mint-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <UserCheck size={15} />
                    <span>Manage Profile & Auth</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
