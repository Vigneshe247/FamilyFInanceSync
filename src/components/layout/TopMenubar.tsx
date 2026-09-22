/* =========================================================
   FLOATING CAPSULE TOP NAVIGATION
   Sections 2, 3, 4, 22, 37
   Clean navigation with obsolete features removed, pure personal profile
   modal trigger, notification dropdown, and testing role perspective switcher
   ========================================================= */

import React, { useState, useRef, useEffect } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { usePermissions } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/Router';
import { ROLE_DISPLAY_NAMES, normalizeRole } from '../../utils/permissions';
import {
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown,
  Check,
  LayoutDashboard,
  Receipt,
  PiggyBank,
  GitPullRequest,
  Settings,
  MoreVertical,
  CreditCard,
  TrendingUp,
  Split,
  Target,
  Repeat,
  UploadCloud,
  LogOut,
  User,
  Users,
  Shield,
} from 'lucide-react';

interface TopMenubarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTx: (initialType?: 'expense' | 'income') => void;
  onOpenNewRequest: () => void;
  onOpenProfileModal: () => void;
  onOpenImportModal?: () => void;
}

export const TopMenubar: React.FC<TopMenubarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfileModal,
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
    isDemoMode,
  } = useFamilyFinance();

  const { user, logout } = useAuth();
  const { navigate } = useRouter();

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

  const { can, isFamilyHead, isChild: isPermChild, isViewer } = usePermissions();

  const isHead = isFamilyHead;
  const isChild = isPermChild;

  // Section 37 Navigation Structure
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'My Finances', icon: Receipt },
    { id: 'members', label: 'Family Members', icon: Users, hidden: !can('viewMembers') },
    { id: 'permissions', label: 'Roles & Permissions', icon: Shield, hidden: !isHead },
    { id: 'requests', label: 'Requests', icon: GitPullRequest, badge: pendingRequestsCount, hidden: isViewer },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank, hidden: !can('viewBudget') || isChild },
  ];

  // More modules with all obsolete features removed (Section 2)
  const allMoreModules = [
    { id: 'loans', label: 'Loans & Debt', icon: CreditCard, desc: 'Home, vehicle, education & EMI tracker', hidden: isChild },
    { id: 'investments', label: 'Investments', icon: TrendingUp, desc: 'Mutual funds, stocks, FDs & gold', hidden: isChild },
    { id: 'split_expenses', label: 'Split Bills', icon: Split, desc: 'Shared family utility & dinner splits', hidden: isChild },
    { id: 'goals', label: 'Savings Goals', icon: Target, desc: 'Family wealth targets & milestones' },
    { id: 'recurring', label: 'Bills & Recurring', icon: Repeat, desc: 'Subscriptions & automated ledger', hidden: isChild },
  ];

  const moreModules = allMoreModules.filter(m => !m.hidden);
  const isMoreModuleActive = moreModules.some(m => m.id === activeTab);
  const activeMoreModule = moreModules.find(m => m.id === activeTab);

  return (
    <header className="neo-capsule-navbar">
      {/* 1. Left Brand Pill */}
      <div className="brand-pill" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-pill-logo">
          <span>F</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="brand-pill-text">{family.name}</span>
            {isDemoMode && (
              <span
                style={{
                  background: 'rgba(217, 119, 6, 0.15)',
                  color: '#D97706',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                DEMO MODE
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.65rem', color: isDemoMode ? '#D97706' : 'var(--mint-primary)', fontWeight: 600 }}>
            {isDemoMode ? 'Family Finance Sync' : '● Realtime Synced'}
          </div>
        </div>
      </div>

      {/* 2. Center Pill Capsule Navigation Bar */}
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

        {/* More Modules Dropdown */}
        {moreModules.length > 0 && (
          <div style={{ position: 'relative' }} ref={moreMenuRef}>
            <button
              className={`nav-capsule-tab ${isMoreModuleActive ? 'active' : ''}`}
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              title="More Modules"
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
                  width: '300px',
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
                  Financial Modules
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
        )}
      </nav>

      {/* 3. Right Controls: Search, Notification Bell, Theme, Profile */}
      <div className="header-actions-pill-group">
        {/* Search button */}
        <button
          className="action-circle-btn"
          onClick={() => setActiveTab('transactions')}
          title="Search transactions"
        >
          <Search size={16} />
        </button>

        {/* Notification Bell with Badge (Section 22) */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            className="action-circle-btn"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            title="Notification Center"
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
              />
            )}
          </button>

          {notifDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
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
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 6).map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '12px',
                        background: n.read_at ? 'transparent' : 'var(--bg-canvas)',
                        cursor: 'pointer',
                        marginBottom: '0.25rem',
                        borderLeft: n.read_at ? 'none' : '3px solid var(--primary)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
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

        {/* Profile Circle Button (Section 3) */}
        <button
          className="action-circle-btn"
          onClick={onOpenProfileModal}
          title="My Profile"
          style={{
            borderColor: 'var(--mint-primary)',
            background: 'rgba(5, 150, 105, 0.08)',
            color: 'var(--mint-primary)',
          }}
        >
          <User size={16} />
        </button>

        {/* Role Switcher & Member Menu (Far Right) */}
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
                  color: isHead ? 'var(--mint-primary)' : 'var(--amber-accent)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {ROLE_DISPLAY_NAMES[normalizeRole(currentMember.role)] || currentMember.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Profile & Role Switcher Dropdown */}
          {roleDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '290px',
                background: 'var(--card-bg)',
                borderRadius: '20px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
                padding: '0.85rem',
                zIndex: 1000,
                border: '1px solid var(--border-card)',
              }}
            >
              {/* Profile Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '0.65rem',
                }}
              >
                <img
                  src={currentMember.user.avatar_url}
                  alt={currentMember.user.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentMember.user.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentMember.user.email}
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        background: isHead ? 'rgba(5, 150, 105, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: isHead ? '#059669' : '#6366F1',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {ROLE_DISPLAY_NAMES[normalizeRole(currentMember.role)] || currentMember.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Menu Actions (Section 3 & 4: Zero auth/security controls) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.65rem' }}>
                <button
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    onOpenProfileModal();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <User size={15} color="var(--mint-primary)" />
                  <span>View Personal Profile</span>
                </button>

                <button
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    setActiveTab('control_center');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Settings size={15} color="var(--mint-primary)" />
                  <span>Family Settings</span>
                </button>

                <button
                  onClick={async () => {
                    setRoleDropdownOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(235, 87, 87, 0.08)',
                    color: '#EB5757',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '0.2rem',
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Role Perspective Switcher for Testing (Section 26 & 38) */}
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '0.4rem 0.5rem 0.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                Switch Role Perspective
              </div>

              <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
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
                        padding: '0.4rem 0.5rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg-canvas)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.name}
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{member.user.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {ROLE_DISPLAY_NAMES[normalizeRole(member.role)] || member.role.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} color="var(--mint-primary)" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
