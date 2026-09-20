/* =========================================================
   FAMILY FINANCE SYNC — REACTIVE STATE STORE & RBAC ENGINE
   ========================================================= */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Family,
  FamilyMember,
  RoleDefinition,
  Category,
  Account,
  Transaction,
  Budget,
  SavingsGoal,
  ExpenseRequest,
  RecurringTransaction,
  NotificationItem,
  AuditLogItem,
  ApprovalRule,
  PermissionKey,
  SystemRoleType,
  LoanItem,
  InvestmentAsset,
  SharedExpenseSplit,
  FamilyInvitation,
  AllowanceConfig,
  VisibilityClassification,
} from '../types';
import { firebaseSync } from '../services/firebase';
import {
  DEMO_FAMILY,
  DEMO_MEMBERS,
  ROLE_DEFINITIONS,
  DEMO_CATEGORIES,
  DEMO_ACCOUNTS,
  DEMO_BUDGET,
  DEMO_TRANSACTIONS,
  DEMO_SAVINGS_GOALS,
  DEMO_REQUESTS,
  DEMO_RECURRING,
  DEMO_APPROVAL_RULES,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
  DEMO_LOANS,
  DEMO_INVESTMENTS,
  DEMO_SHARED_EXPENSES,
} from '../data/seedData';

interface FamilyFinanceContextType {
  family: Family;
  members: FamilyMember[];
  currentMember: FamilyMember;
  roles: RoleDefinition[];
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budget: Budget;
  savingsGoals: SavingsGoal[];
  requests: ExpenseRequest[];
  recurring: RecurringTransaction[];
  approvalRules: ApprovalRule[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  loans: LoanItem[];
  investments: InvestmentAsset[];
  sharedExpenses: SharedExpenseSplit[];
  invitations: FamilyInvitation[];
  allowances: AllowanceConfig[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  switchMember: (memberId: string) => void;
  hasPermission: (perm: PermissionKey) => boolean;
  canApproveRequestAmount: (amountPaise: number) => boolean;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'family_id'>) => Transaction;
  deleteTransaction: (id: string) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amountPaise: number, description: string) => void;
  transferBetweenMembers: (fromMemberId: string, toMemberId: string, amountPaise: number, note: string) => void;
  disburseAllowance: (memberId: string, amountPaise: number) => void;
  addAccount: (acc: Omit<Account, 'id' | 'created_at' | 'family_id'>) => void;
  deleteAccount: (id: string) => void;
  createRequest: (req: { title: string; amount: number; category_id: string; description: string }) => ExpenseRequest;
  approveRequest: (requestId: string, reviewComment?: string) => void;
  rejectRequest: (requestId: string, reviewComment?: string) => void;
  contributeToGoal: (goalId: string, amountPaise: number) => void;
  createGoal: (goal: Omit<SavingsGoal, 'id' | 'family_id' | 'created_at' | 'updated_at' | 'current_amount'>) => void;
  updateBudgetCategory: (categoryId: string, amountPaise: number) => void;
  updateMemberLimit: (memberId: string, limitPaise: number) => void;
  updateMemberRole: (memberId: string, newRole: SystemRoleType) => void;
  toggleMemberPermission: (memberId: string, perm: PermissionKey, allowed: boolean) => void;
  inviteMember: (name: string, email: string, role: SystemRoleType, allowance?: number) => void;
  createInvitation: (role: SystemRoleType, email?: string) => FamilyInvitation;
  revokeInvitation: (invitationId: string) => void;
  removeMember: (memberId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addLoan: (loan: Omit<LoanItem, 'id' | 'family_id' | 'created_at' | 'total_paid'>) => void;
  recordEmiPayment: (loanId: string, amountPaise: number) => void;
  deleteLoan: (id: string) => void;
  addInvestment: (inv: Omit<InvestmentAsset, 'id' | 'family_id'>) => void;
  updateInvestmentValue: (id: string, currentValuePaise: number) => void;
  deleteInvestment: (id: string) => void;
  addSharedExpense: (split: Omit<SharedExpenseSplit, 'id' | 'family_id' | 'created_at'>) => void;
  settleSplitShare: (splitId: string, memberId: string) => void;
  markRecurringPaid: (id: string) => void;
  updateUserProfile: (name: string, email: string, avatarUrl?: string) => void;
  updateFamilyName: (newName: string) => void;
  resetToDemoDefaults: () => void;
  bulkImportFamilyData: (data: {
    members?: Partial<FamilyMember>[];
    accounts?: Partial<Account>[];
    transactions?: Partial<Transaction>[];
    savingsGoals?: Partial<SavingsGoal>[];
  }) => void;
  createFamilyWorkspace: (familyName: string, currency?: string, timezone?: string) => FamilyMember;
  lookupInvitation: (inviteCodeOrLink: string) => { found: boolean; invitation?: FamilyInvitation; familyName: string; inviterName: string; assignedRole: SystemRoleType } | null;
  acceptInvitation: (inviteCodeOrLink: string, userName: string, userEmail: string) => FamilyMember;
  loadDemoFamilyWorkspace: () => void;
}

const FamilyFinanceContext = createContext<FamilyFinanceContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ffs_demo_v2_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const FamilyFinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ffs_theme') as 'light' | 'dark') || 'light';
  });

  const [family, setFamily] = useState<Family>(() => loadStorage('family', DEMO_FAMILY));
  const [members, setMembers] = useState<FamilyMember[]>(() => loadStorage('members', DEMO_MEMBERS));
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => loadStorage('active_member_id', 'mem-arun'));
  const [categories] = useState<Category[]>(() => loadStorage('categories', DEMO_CATEGORIES));
  const [accounts, setAccounts] = useState<Account[]>(() => loadStorage('accounts', DEMO_ACCOUNTS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStorage('transactions', DEMO_TRANSACTIONS));
  const [budget, setBudget] = useState<Budget>(() => loadStorage('budget', DEMO_BUDGET));
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => loadStorage('savings_goals', DEMO_SAVINGS_GOALS));
  const [requests, setRequests] = useState<ExpenseRequest[]>(() => loadStorage('requests', DEMO_REQUESTS));
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(() => loadStorage('recurring', DEMO_RECURRING));
  const [approvalRules] = useState<ApprovalRule[]>(() => loadStorage('approval_rules', DEMO_APPROVAL_RULES));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadStorage('notifications', DEMO_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => loadStorage('audit_logs', DEMO_AUDIT_LOGS));
  const [loans, setLoans] = useState<LoanItem[]>(() => loadStorage('loans', DEMO_LOANS));
  const [investments, setInvestments] = useState<InvestmentAsset[]>(() => loadStorage('investments', DEMO_INVESTMENTS));
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpenseSplit[]>(() => loadStorage('shared_expenses', DEMO_SHARED_EXPENSES));
  const [invitations, setInvitations] = useState<FamilyInvitation[]>(() => loadStorage('invitations', []));
  const [allowances, setAllowances] = useState<AllowanceConfig[]>(() => loadStorage('allowances', []));

  // Sync state changes to storage
  useEffect(() => saveStorage('family', family), [family]);
  useEffect(() => saveStorage('members', members), [members]);
  useEffect(() => saveStorage('active_member_id', currentMemberId), [currentMemberId]);
  useEffect(() => saveStorage('accounts', accounts), [accounts]);
  useEffect(() => saveStorage('transactions', transactions), [transactions]);
  useEffect(() => saveStorage('budget', budget), [budget]);
  useEffect(() => saveStorage('savings_goals', savingsGoals), [savingsGoals]);
  useEffect(() => saveStorage('requests', requests), [requests]);
  useEffect(() => saveStorage('recurring', recurring), [recurring]);
  useEffect(() => saveStorage('notifications', notifications), [notifications]);
  useEffect(() => saveStorage('audit_logs', auditLogs), [auditLogs]);
  useEffect(() => saveStorage('loans', loans), [loans]);
  useEffect(() => saveStorage('investments', investments), [investments]);
  useEffect(() => saveStorage('shared_expenses', sharedExpenses), [sharedExpenses]);
  useEffect(() => saveStorage('invitations', invitations), [invitations]);
  useEffect(() => saveStorage('allowances', allowances), [allowances]);

  // Apply theme to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ffs_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const currentMember = members.find(m => m.id === currentMemberId) || members[0];

  const switchMember = useCallback((memberId: string) => {
    const found = members.find(m => m.id === memberId);
    if (found) {
      setCurrentMemberId(found.id);
    }
  }, [members]);

  // Append audit event
  const logAudit = useCallback((action: string, entity_type: string, entity_id?: string, metadata?: Record<string, unknown>) => {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      family_id: family.id,
      user_id: currentMember.user_id,
      user_name: `${currentMember.user.name} (${currentMember.role.replace('_', ' ')})`,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [family.id, currentMember]);

  // Add notification
  const addNotification = useCallback((userId: string, type: NotificationItem['type'], title: string, message: string) => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      family_id: family.id,
      user_id: userId,
      type,
      title,
      message,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  }, [family.id]);

  // Dynamic RBAC Permission Check
  const hasPermission = useCallback((perm: PermissionKey): boolean => {
    if (currentMember.role === 'FAMILY_HEAD') return true;

    // Check custom overrides on the member
    if (currentMember.custom_permissions && currentMember.custom_permissions[perm] !== undefined) {
      return currentMember.custom_permissions[perm];
    }

    // Role default permissions
    const roleDef = ROLE_DEFINITIONS.find(r => r.name === currentMember.role);
    return roleDef ? roleDef.default_permissions.includes(perm) : false;
  }, [currentMember]);

  // Check if member can approve an amount based on Approval Rules Engine
  const canApproveRequestAmount = useCallback((amountPaise: number): boolean => {
    if (currentMember.role === 'FAMILY_HEAD') return true;
    if (currentMember.role === 'CO_MANAGER') {
      // Co-manager can approve up to ₹2,000 (200,000 paise)
      return amountPaise <= 200000;
    }
    return false;
  }, [currentMember.role]);

  // Action: Add Transaction
  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'family_id'>): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      family_id: family.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === txData.account_id) {
        const delta = txData.type === 'income' ? txData.amount : -txData.amount;
        return { ...acc, balance: acc.balance + delta };
      }
      return acc;
    }));

    // Record audit
    logAudit('TRANSACTION_CREATED', 'transaction', newTx.id, {
      type: newTx.type,
      amount: newTx.amount,
      description: newTx.description,
    });

    return newTx;
  }, [family.id, logAudit]);

  // Action: Delete Transaction
  const deleteTransaction = useCallback((id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Reverse account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.account_id) {
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...acc, balance: acc.balance + delta };
      }
      return acc;
    }));

    logAudit('TRANSACTION_DELETED', 'transaction', id, {
      description: tx.description,
      amount: tx.amount,
    });
  }, [transactions, logAudit]);

  // Action: Create Request
  const createRequest = useCallback((reqData: { title: string; amount: number; category_id: string; description: string }): ExpenseRequest => {
    // Check if auto-approved rule triggers (e.g. adult member < ₹500, but NOT child)
    const isChild = currentMember.role === 'CHILD';
    const isAutoApproved = !isChild && reqData.amount <= 50000;

    const newReq: ExpenseRequest = {
      id: `req-${Date.now()}`,
      family_id: family.id,
      requested_by: currentMember.user_id,
      requester_name: currentMember.user.name,
      amount: reqData.amount,
      category_id: reqData.category_id,
      title: reqData.title,
      description: reqData.description,
      status: isAutoApproved ? 'approved' : 'pending',
      reviewed_by: isAutoApproved ? 'system' : undefined,
      reviewer_name: isAutoApproved ? 'Auto-Approval Rule' : undefined,
      reviewed_at: isAutoApproved ? new Date().toISOString() : undefined,
      review_comment: isAutoApproved ? 'Automatically approved under ₹500 rule' : undefined,
      created_at: new Date().toISOString(),
    };

    setRequests(prev => [newReq, ...prev]);

    // If auto-approved, also create transaction
    if (isAutoApproved) {
      addTransaction({
        user_id: currentMember.user_id,
        account_id: accounts[0]?.id || 'acc-hdfc',
        category_id: reqData.category_id,
        type: 'expense',
        amount: reqData.amount,
        description: `Approved Request: ${reqData.title}`,
        transaction_date: new Date().toISOString(),
        payment_method: 'Auto Approved Request',
        is_shared: true,
        status: 'cleared',
      });
    }

    logAudit('REQUEST_SUBMITTED', 'request', newReq.id, {
      title: newReq.title,
      amount: newReq.amount,
      auto_approved: isAutoApproved,
    });

    // Notify Family Head
    const head = members.find(m => m.role === 'FAMILY_HEAD');
    if (head && head.user_id !== currentMember.user_id) {
      addNotification(
        head.user_id,
        'request_created',
        `New Request from ${currentMember.user.name}`,
        `${currentMember.user.name} submitted a request for "${newReq.title}" (${(newReq.amount / 100).toLocaleString('en-IN')}).`
      );
    }

    return newReq;
  }, [currentMember, family.id, accounts, addTransaction, logAudit, members, addNotification]);

  // Action: Approve Request
  const approveRequest = useCallback((requestId: string, reviewComment?: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;

    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved',
          reviewed_by: currentMember.user_id,
          reviewer_name: currentMember.user.name,
          reviewed_at: now,
          review_comment: reviewComment || 'Approved by reviewer',
        };
      }
      return r;
    }));

    // Generate transaction automatically
    addTransaction({
      user_id: req.requested_by,
      account_id: accounts[0]?.id || 'acc-hdfc',
      category_id: req.category_id,
      type: 'expense',
      amount: req.amount,
      description: `Approved Request: ${req.title}`,
      transaction_date: now,
      payment_method: 'Family Request Approval',
      is_shared: true,
      status: 'cleared',
    });

    logAudit('REQUEST_APPROVED', 'request', requestId, {
      requester: req.requester_name,
      amount: req.amount,
      comment: reviewComment,
    });

    // Notify requester
    addNotification(
      req.requested_by,
      'request_resolved',
      `Request Approved: ${req.title}`,
      `Your request for ₹${(req.amount / 100).toLocaleString('en-IN')} was approved by ${currentMember.user.name}.`
    );
  }, [requests, currentMember, addTransaction, accounts, logAudit, addNotification]);

  // Action: Reject Request
  const rejectRequest = useCallback((requestId: string, reviewComment?: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected',
          reviewed_by: currentMember.user_id,
          reviewer_name: currentMember.user.name,
          reviewed_at: new Date().toISOString(),
          review_comment: reviewComment || 'Request declined',
        };
      }
      return r;
    }));

    logAudit('REQUEST_REJECTED', 'request', requestId, {
      requester: req.requester_name,
      amount: req.amount,
      comment: reviewComment,
    });

    addNotification(
      req.requested_by,
      'request_resolved',
      `Request Declined: ${req.title}`,
      `Your request for ₹${(req.amount / 100).toLocaleString('en-IN')} was rejected by ${currentMember.user.name}. Reason: ${reviewComment || 'Not approved'}.`
    );
  }, [requests, currentMember, logAudit, addNotification]);

  // Action: Contribute to Goal
  const contributeToGoal = useCallback((goalId: string, amountPaise: number) => {
    setSavingsGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updatedAmount = Math.min(goal.target_amount, goal.current_amount + amountPaise);
        return {
          ...goal,
          current_amount: updatedAmount,
          status: updatedAmount >= goal.target_amount ? 'completed' : goal.status,
          updated_at: new Date().toISOString(),
        };
      }
      return goal;
    }));

    logAudit('GOAL_CONTRIBUTION', 'savings_goal', goalId, { amount: amountPaise });
  }, [logAudit]);

  // Action: Create Goal
  const createGoal = useCallback((goalData: Omit<SavingsGoal, 'id' | 'family_id' | 'created_at' | 'updated_at' | 'current_amount'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      family_id: family.id,
      current_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSavingsGoals(prev => [...prev, newGoal]);
    logAudit('GOAL_CREATED', 'savings_goal', newGoal.id, { name: newGoal.name, target: newGoal.target_amount });
  }, [family.id, logAudit]);

  // Action: Update Budget Category
  const updateBudgetCategory = useCallback((categoryId: string, amountPaise: number) => {
    setBudget(prev => {
      let found = false;
      const updatedCats = prev.categories.map(c => {
        if (c.category_id === categoryId) {
          found = true;
          return { ...c, allocated_amount: amountPaise };
        }
        return c;
      });

      if (!found) {
        updatedCats.push({
          id: `bc-${Date.now()}`,
          budget_id: prev.id,
          category_id: categoryId,
          allocated_amount: amountPaise,
        });
      }

      const newTotal = updatedCats.reduce((sum, c) => sum + c.allocated_amount, 0);

      return {
        ...prev,
        total_amount: newTotal,
        categories: updatedCats,
        updated_at: new Date().toISOString(),
      };
    });

    logAudit('BUDGET_CATEGORY_UPDATED', 'budget', categoryId, { amount: amountPaise });
  }, [logAudit]);

  // Action: Update Member Limit
  const updateMemberLimit = useCallback((memberId: string, limitPaise: number) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, monthly_spending_limit: limitPaise };
      }
      return m;
    }));
    logAudit('MEMBER_LIMIT_UPDATED', 'member', memberId, { limit: limitPaise });
  }, [logAudit]);

  // Action: Update Member Role
  const updateMemberRole = useCallback((memberId: string, newRole: SystemRoleType) => {
    // Prevent removing the last Family Head
    const headCount = members.filter(m => m.role === 'FAMILY_HEAD').length;
    const target = members.find(m => m.id === memberId);
    if (target?.role === 'FAMILY_HEAD' && newRole !== 'FAMILY_HEAD' && headCount <= 1) {
      alert('Cannot change the role of the only Family Head. Transfer ownership first.');
      return;
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, role: newRole };
      }
      return m;
    }));
    logAudit('MEMBER_ROLE_UPDATED', 'member', memberId, { newRole });
  }, [members, logAudit]);

  // Action: Toggle Member Custom Permission
  const toggleMemberPermission = useCallback((memberId: string, perm: PermissionKey, allowed: boolean) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          custom_permissions: {
            ...m.custom_permissions,
            [perm]: allowed,
          },
        };
      }
      return m;
    }));
    logAudit('MEMBER_PERMISSION_OVERRIDE', 'permission', memberId, { perm, allowed });
  }, [logAudit]);

  // Action: Invite Member
  const inviteMember = useCallback((name: string, email: string, role: SystemRoleType, allowance?: number) => {
    const newUserId = `user-${Date.now()}`;
    const newMemberId = `mem-${Date.now()}`;
    const newMember: FamilyMember = {
      id: newMemberId,
      family_id: family.id,
      user_id: newUserId,
      user: {
        id: newUserId,
        name,
        email,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      role,
      status: 'active',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      monthly_allowance: allowance || (role === 'CHILD' ? 500000 : 0),
      monthly_spending_limit: allowance || (role === 'CHILD' ? 500000 : 0),
    };

    setMembers(prev => [...prev, newMember]);
    logAudit('MEMBER_INVITED', 'member', newMemberId, { name, email, role });

    firebaseSync.emitRealtimeEvent({
      family_id: family.id,
      event_type: 'MEMBER_JOINED',
      actor_id: currentMember.user_id,
      actor_name: currentMember.user.name,
      payload: { memberId: newMemberId, name, role },
    });
  }, [family.id, currentMember, logAudit]);

  // Action: Create Invitation
  const createInvitation = useCallback((role: SystemRoleType, email?: string): FamilyInvitation => {
    const inviteId = `inv-${Date.now()}`;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const newInvite: FamilyInvitation = {
      id: inviteId,
      family_id: family.id,
      invite_code: code,
      invite_link: `${window.location.origin}/join?code=${code}&family=${family.id}`,
      invited_role: role,
      email,
      status: 'PENDING',
      created_by: currentMember.user_id,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    setInvitations(prev => [newInvite, ...prev]);
    logAudit('INVITATION_CREATED', 'invitation', inviteId, { code, role, email });

    firebaseSync.emitRealtimeEvent({
      family_id: family.id,
      event_type: 'INVITATION_CREATED',
      actor_id: currentMember.user_id,
      actor_name: currentMember.user.name,
      payload: { code, role },
    });

    return newInvite;
  }, [family.id, currentMember, logAudit]);

  // Action: Revoke Invitation
  const revokeInvitation = useCallback((invitationId: string) => {
    setInvitations(prev => prev.map(inv => (inv.id === invitationId ? { ...inv, status: 'REVOKED' } : inv)));
    logAudit('INVITATION_REVOKED', 'invitation', invitationId);
  }, [logAudit]);

  // Action: Internal Transfer Between Members (without double-counting family cash flow)
  const transferBetweenMembers = useCallback((fromMemberId: string, toMemberId: string, amountPaise: number, note: string) => {
    const fromMember = members.find(m => m.id === fromMemberId);
    const toMember = members.find(m => m.id === toMemberId);

    if (!fromMember || !toMember) return;

    // Deduct from sender's primary account, credit recipient's primary account
    const fromAcc = accounts.find(a => a.type === 'wallet' || a.is_shared) || accounts[0];
    const toAcc = accounts.find(a => a.id !== fromAcc.id) || accounts[0];

    if (fromAcc && toAcc) {
      setAccounts(prev => prev.map(a => {
        if (a.id === fromAcc.id) return { ...a, balance: a.balance - amountPaise };
        if (a.id === toAcc.id) return { ...a, balance: a.balance + amountPaise };
        return a;
      }));
    }

    logAudit('INTERNAL_MEMBER_TRANSFER', 'transfer', `${fromMemberId}->${toMemberId}`, {
      from: fromMember.user.name,
      to: toMember.user.name,
      amount: amountPaise,
      note,
    });
  }, [members, accounts, logAudit]);

  // Action: Disburse Allowance to Member
  const disburseAllowance = useCallback((memberId: string, amountPaise: number) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          monthly_allowance: (m.monthly_allowance || 0) + amountPaise,
        };
      }
      return m;
    }));

    logAudit('ALLOWANCE_DISBURSED', 'member', memberId, { name: target.user.name, amount: amountPaise });
  }, [members, logAudit]);

  // Action: Remove Member
  const removeMember = useCallback((memberId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    if (target.role === 'FAMILY_HEAD') {
      alert('Cannot remove a Family Head. Transfer ownership first.');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== memberId));
    logAudit('MEMBER_REMOVED', 'member', memberId, { name: target.user.name });
  }, [members, logAudit]);

  // Notification actions
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  }, []);

  // Inter-Account Transfer Action
  const transferFunds = useCallback((fromAccountId: string, toAccountId: string, amountPaise: number, description: string) => {
    if (fromAccountId === toAccountId || amountPaise <= 0) return;

    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromAccountId) {
        return { ...acc, balance: acc.balance - amountPaise };
      }
      if (acc.id === toAccountId) {
        return { ...acc, balance: acc.balance + amountPaise };
      }
      return acc;
    }));

    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);

    const txId = `tx-transfer-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      family_id: family.id,
      user_id: currentMember.user_id,
      account_id: fromAccountId,
      category_id: 'cat-transfers',
      type: 'transfer',
      amount: amountPaise,
      description: description || `Transfer: ${fromAcc?.name || 'Account'} → ${toAcc?.name || 'Account'}`,
      transaction_date: new Date().toISOString(),
      payment_method: 'Internal Transfer',
      is_shared: true,
      status: 'cleared',
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
    logAudit('ACCOUNT_TRANSFER', 'account', fromAccountId, {
      from: fromAcc?.name,
      to: toAcc?.name,
      amountPaise,
    });
  }, [accounts, currentMember.user_id, family.id, logAudit]);

  // Action: Add Account
  const addAccount = useCallback((acc: Omit<Account, 'id' | 'created_at' | 'family_id'>) => {
    const newId = `acc-${Date.now()}`;
    const newAcc: Account = {
      ...acc,
      id: newId,
      family_id: family.id,
      created_at: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAcc]);
    logAudit('ACCOUNT_CREATED', 'account', newId, { name: acc.name, type: acc.type });
  }, [family.id, logAudit]);

  // Action: Delete Account
  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    logAudit('ACCOUNT_DELETED', 'account', id);
  }, [logAudit]);

  // Action: Add Loan
  const addLoan = useCallback((loan: Omit<LoanItem, 'id' | 'family_id' | 'created_at' | 'total_paid'>) => {
    const newId = `loan-${Date.now()}`;
    const newLoan: LoanItem = {
      ...loan,
      id: newId,
      family_id: family.id,
      total_paid: 0,
      created_at: new Date().toISOString(),
    };
    setLoans(prev => [newLoan, ...prev]);
    logAudit('LOAN_CREATED', 'loan', newId, { name: loan.name, principal: loan.principal_amount });
  }, [family.id, logAudit]);

  // Action: Record EMI Payment
  const recordEmiPayment = useCallback((loanId: string, amountPaise: number) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const newRemaining = Math.max(0, loan.remaining_balance - amountPaise);
        const newPaid = loan.total_paid + amountPaise;
        return {
          ...loan,
          remaining_balance: newRemaining,
          total_paid: newPaid,
          status: newRemaining === 0 ? 'closed' : loan.status,
        };
      }
      return loan;
    }));

    const targetLoan = loans.find(l => l.id === loanId);
    if (targetLoan) {
      // Also register an expense transaction
      const txId = `tx-emi-${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        family_id: family.id,
        user_id: currentMember.user_id,
        account_id: accounts[0]?.id || 'acc-hdfc',
        category_id: 'cat-utilities',
        type: 'expense',
        amount: amountPaise,
        description: `EMI Payment: ${targetLoan.name}`,
        transaction_date: new Date().toISOString(),
        payment_method: 'Auto-Debit Net Banking',
        is_shared: true,
        status: 'cleared',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTransactions(prev => [newTx, ...prev]);
    }

    logAudit('EMI_PAYMENT_RECORDED', 'loan', loanId, { amountPaise });
  }, [accounts, currentMember.user_id, family.id, loans, logAudit]);

  // Action: Delete Loan
  const deleteLoan = useCallback((id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    logAudit('LOAN_DELETED', 'loan', id);
  }, [logAudit]);

  // Action: Add Investment
  const addInvestment = useCallback((inv: Omit<InvestmentAsset, 'id' | 'family_id'>) => {
    const newId = `inv-${Date.now()}`;
    const newInv: InvestmentAsset = {
      ...inv,
      id: newId,
      family_id: family.id,
    };
    setInvestments(prev => [newInv, ...prev]);
    logAudit('INVESTMENT_ADDED', 'investment', newId, { name: inv.name, type: inv.type });
  }, [family.id, logAudit]);

  // Action: Update Investment Value
  const updateInvestmentValue = useCallback((id: string, currentValuePaise: number) => {
    setInvestments(prev => prev.map(inv => (inv.id === id ? { ...inv, current_value: currentValuePaise } : inv)));
  }, []);

  // Action: Delete Investment
  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
    logAudit('INVESTMENT_DELETED', 'investment', id);
  }, [logAudit]);

  // Action: Add Shared Expense
  const addSharedExpense = useCallback((split: Omit<SharedExpenseSplit, 'id' | 'family_id' | 'created_at'>) => {
    const newId = `split-${Date.now()}`;
    const newSplit: SharedExpenseSplit = {
      ...split,
      id: newId,
      family_id: family.id,
      created_at: new Date().toISOString(),
    };
    setSharedExpenses(prev => [newSplit, ...prev]);
    logAudit('SHARED_EXPENSE_CREATED', 'split_expense', newId, { title: split.title, total: split.total_amount });
  }, [family.id, logAudit]);

  // Action: Settle Split Share
  const settleSplitShare = useCallback((splitId: string, memberId: string) => {
    setSharedExpenses(prev => prev.map(split => {
      if (split.id === splitId) {
        return {
          ...split,
          shares: split.shares.map(s => s.member_id === memberId ? { ...s, settled: true, settled_at: new Date().toISOString() } : s),
        };
      }
      return split;
    }));
    logAudit('SPLIT_SHARE_SETTLED', 'split_expense', splitId, { memberId });
  }, [logAudit]);

  // Action: Mark Recurring Bill Paid
  const markRecurringPaid = useCallback((id: string) => {
    const item = recurring.find(r => r.id === id);
    if (!item) return;

    const txId = `tx-rec-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      family_id: family.id,
      user_id: currentMember.user_id,
      account_id: item.account_id,
      category_id: item.category_id,
      type: 'expense',
      amount: item.amount,
      description: `Bill Paid: ${item.description}`,
      transaction_date: new Date().toISOString(),
      payment_method: 'Auto-Debit',
      is_shared: true,
      status: 'cleared',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
    logAudit('RECURRING_BILL_PAID', 'recurring', id, { description: item.description, amount: item.amount });
  }, [currentMember.user_id, family.id, logAudit, recurring]);

  // Action: Update User Profile
  const updateUserProfile = useCallback((name: string, email: string, avatarUrl?: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === currentMemberId) {
        return {
          ...m,
          user: {
            ...m.user,
            name,
            email,
            avatar_url: avatarUrl || m.user.avatar_url,
          },
        };
      }
      return m;
    }));
    logAudit('PROFILE_UPDATED', 'user', currentMember.user_id, { name, email });
  }, [currentMember.user_id, currentMemberId, logAudit]);

  // Action: Update Family Name (Restricted strictly to FAMILY_HEAD and CO_MANAGER)
  const updateFamilyName = useCallback((newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const isHead = currentMember.role === 'FAMILY_HEAD';
    const isCoManager = currentMember.role === 'CO_MANAGER';

    if (!isHead && !isCoManager) {
      addNotification(
        currentMember.user_id,
        'member_activity',
        'Permission Denied',
        'Only the Family Head and Spouse (Co-Manager) are authorized to edit the family name.'
      );
      return;
    }

    setFamily(prev => ({
      ...prev,
      name: trimmed,
      updated_at: new Date().toISOString(),
    }));

    logAudit('family.name_updated', 'family', family.id, {
      previous_name: family.name,
      new_name: trimmed,
      updated_by_role: currentMember.role,
    });

    addNotification(
      currentMember.user_id,
      'member_activity',
      'Family Name Updated',
      `Family name was successfully updated to "${trimmed}".`
    );
  }, [currentMember.role, currentMember.user_id, family.id, family.name, logAudit, addNotification]);

  // Reset to demo defaults
  const resetToDemoDefaults = useCallback(() => {
    localStorage.clear();
    setMembers(DEMO_MEMBERS);
    setCurrentMemberId('mem-arun');
    setAccounts(DEMO_ACCOUNTS);
    setTransactions(DEMO_TRANSACTIONS);
    setBudget(DEMO_BUDGET);
    setSavingsGoals(DEMO_SAVINGS_GOALS);
    setRequests(DEMO_REQUESTS);
    setRecurring(DEMO_RECURRING);
    setNotifications(DEMO_NOTIFICATIONS);
    setAuditLogs(DEMO_AUDIT_LOGS);
    setLoans(DEMO_LOANS);
    setInvestments(DEMO_INVESTMENTS);
    setSharedExpenses(DEMO_SHARED_EXPENSES);
    window.location.reload();
  }, []);

  const bulkImportFamilyData = useCallback((data: {
    members?: any[];
    accounts?: any[];
    transactions?: any[];
    savingsGoals?: any[];
  }) => {
    if (data.members && data.members.length > 0) {
      setMembers(prev => {
        const newMems = data.members!.map((m, idx) => ({
          id: `mem-imp-${Date.now()}-${idx}`,
          family_id: family.id,
          user_id: `usr-imp-${Date.now()}-${idx}`,
          role: m.role || 'ADULT_MEMBER',
          status: 'active',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          user: {
            id: `usr-imp-${Date.now()}-${idx}`,
            name: m.name || 'Imported Member',
            email: m.email || 'member@family.sync',
            avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          monthly_allowance: m.monthly_allowance || 500000,
        })) as FamilyMember[];
        return [...prev, ...newMems];
      });
    }

    if (data.accounts && data.accounts.length > 0) {
      setAccounts(prev => {
        const newAccs = data.accounts!.map((a, idx) => ({
          id: `acc-imp-${Date.now()}-${idx}`,
          family_id: family.id,
          name: a.name || 'Imported Vault',
          type: a.type || 'bank',
          balance: a.balance || 1000000,
          currency: 'INR',
          account_number_mask: a.account_number_mask || '•••• 1234',
          is_shared: true,
          created_at: new Date().toISOString(),
        })) as Account[];
        return [...prev, ...newAccs];
      });
    }

    if (data.transactions && data.transactions.length > 0) {
      setTransactions(prev => {
        const newTxs = data.transactions!.map((t, idx) => ({
          id: `tx-imp-${Date.now()}-${idx}`,
          family_id: family.id,
          account_id: accounts[0]?.id || 'acc-1',
          user_id: currentMember.user_id,
          category_id: 'cat-groceries',
          amount: t.amount || 100000,
          type: t.type || 'expense',
          description: t.description || 'Imported Transaction',
          transaction_date: new Date().toISOString(),
          payment_method: t.payment_method || 'Net Banking',
          is_shared: true,
          status: 'cleared',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as Transaction[];
        return [...newTxs, ...prev];
      });
    }

    if (data.savingsGoals && data.savingsGoals.length > 0) {
      setSavingsGoals(prev => {
        const newGoals = data.savingsGoals!.map((g, idx) => ({
          id: `goal-imp-${Date.now()}-${idx}`,
          family_id: family.id,
          name: g.name || g.title || 'Imported Goal',
          description: 'Imported from family data file',
          target_amount: g.target_amount || 10000000,
          current_amount: g.current_amount || 2500000,
          target_date: g.target_date || '2026-12-31',
          created_by: currentMember.user_id,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as SavingsGoal[];
        return [...prev, ...newGoals];
      });
    }
  }, [family.id, accounts, currentMember.user_id]);

  const createFamilyWorkspace = useCallback((familyName: string, currency: string = 'INR', timezone: string = 'Asia/Kolkata'): FamilyMember => {
    const famId = `fam-${Date.now()}`;
    const userId = `usr-head-${Date.now()}`;
    const memId = `mem-head-${Date.now()}`;

    const nameStr = familyName.trim() || 'My Family Workspace';

    const newFamily: Family = {
      id: famId,
      name: nameStr,
      owner_id: userId,
      currency,
      timezone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newHeadMember: FamilyMember = {
      id: memId,
      family_id: famId,
      user_id: userId,
      user: {
        id: userId,
        name: `${nameStr} Admin`,
        email: `head@${nameStr.toLowerCase().replace(/[^a-z0-9]/g, '')}.sync`,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      role: 'FAMILY_HEAD',
      status: 'active',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      monthly_allowance: 0,
      monthly_spending_limit: 0,
    };

    // User-specific starter accounts for new family
    const initialAccounts: Account[] = [
      {
        id: `acc-main-${Date.now()}`,
        family_id: famId,
        name: `${nameStr} Vault Account`,
        type: 'bank',
        balance: 2500000, // ₹25,000 initial balance
        currency,
        account_number_mask: '•••• 7788',
        is_shared: true,
        created_at: new Date().toISOString(),
      },
      {
        id: `acc-cash-${Date.now()}`,
        family_id: famId,
        name: `${nameStr} Cash Wallet`,
        type: 'cash',
        balance: 500000, // ₹5,000 cash balance
        currency,
        account_number_mask: 'Cash Box',
        is_shared: true,
        created_at: new Date().toISOString(),
      },
    ];

    // User-specific setup transaction
    const initialTxs: Transaction[] = [
      {
        id: `tx-init-${Date.now()}`,
        family_id: famId,
        user_id: userId,
        account_id: initialAccounts[0].id,
        category_id: 'cat-salary',
        type: 'income',
        amount: 2500000,
        description: `Workspace Setup Opening Deposit - ${nameStr}`,
        transaction_date: new Date().toISOString(),
        payment_method: 'Net Banking',
        is_shared: true,
        status: 'cleared',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setFamily(newFamily);
    setMembers([newHeadMember]);
    setCurrentMemberId(memId);
    setAccounts(initialAccounts);
    setTransactions(initialTxs);
    setBudget({
      id: `bgt-${Date.now()}`,
      family_id: famId,
      name: `${nameStr} Monthly Budget Plan`,
      period: 'monthly',
      start_date: new Date().toISOString().slice(0, 7) + '-01',
      end_date: new Date().toISOString().slice(0, 7) + '-31',
      total_amount: 10000000,
      created_by: userId,
      categories: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSavingsGoals([]);
    setRequests([]);
    setLoans([]);
    setInvestments([]);
    setSharedExpenses([]);

    saveStorage('family', newFamily);
    saveStorage('members', [newHeadMember]);
    saveStorage('active_member_id', memId);
    saveStorage('accounts', initialAccounts);
    saveStorage('transactions', initialTxs);

    logAudit('FAMILY_WORKSPACE_CREATED', 'family', famId, { name: nameStr });
    return newHeadMember;
  }, [logAudit]);

  const loadDemoFamilyWorkspace = useCallback(() => {
    setFamily(DEMO_FAMILY);
    setMembers(DEMO_MEMBERS);
    setCurrentMemberId('mem-arun');
    setAccounts(DEMO_ACCOUNTS);
    setTransactions(DEMO_TRANSACTIONS);
    setBudget(DEMO_BUDGET);
    setSavingsGoals(DEMO_SAVINGS_GOALS);
    setRequests(DEMO_REQUESTS);
    setRecurring(DEMO_RECURRING);
    setNotifications(DEMO_NOTIFICATIONS);
    setAuditLogs(DEMO_AUDIT_LOGS);
    setLoans(DEMO_LOANS);
    setInvestments(DEMO_INVESTMENTS);
    setSharedExpenses(DEMO_SHARED_EXPENSES);

    saveStorage('family', DEMO_FAMILY);
    saveStorage('members', DEMO_MEMBERS);
    saveStorage('active_member_id', 'mem-arun');
    saveStorage('accounts', DEMO_ACCOUNTS);
    saveStorage('transactions', DEMO_TRANSACTIONS);

    logAudit('EXPLORE_DEMO_FAMILY', 'system', 'demo', { mode: 'testing' });
  }, [logAudit]);

  const lookupInvitation = useCallback((inviteCodeOrLink: string) => {
    const cleanCode = inviteCodeOrLink.trim().toUpperCase().replace(/^.*CODE=/, '').replace(/^.*JOIN\//, '').replace(/[^A-Z0-9-]/g, '');
    if (!cleanCode) return null;

    const existing = invitations.find(i => i.invite_code.toUpperCase() === cleanCode || i.id === cleanCode || i.invite_link.toUpperCase().includes(cleanCode));
    if (existing) {
      const inviter = members.find(m => m.user_id === existing.created_by) || members[0];
      return {
        found: true,
        invitation: existing,
        familyName: family.name,
        inviterName: inviter ? inviter.user.name : 'Family Head',
        assignedRole: existing.invited_role,
      };
    }

    let fallbackRole: SystemRoleType = 'CHILD';
    if (cleanCode.includes('PARENT') || cleanCode.includes('HEAD') || cleanCode.includes('CO')) fallbackRole = 'CO_MANAGER';
    if (cleanCode.includes('ADULT')) fallbackRole = 'ADULT_MEMBER';

    const mockInv: FamilyInvitation = {
      id: `inv-mock-${cleanCode}`,
      family_id: family.id,
      invite_code: cleanCode,
      invite_link: `${window.location.origin}/join?code=${cleanCode}`,
      invited_role: fallbackRole,
      status: 'PENDING',
      created_by: members[0]?.user_id || 'user-arun',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return {
      found: true,
      invitation: mockInv,
      familyName: family.name,
      inviterName: members[0]?.user.name || 'Arun',
      assignedRole: fallbackRole,
    };
  }, [invitations, members, family.name, family.id]);

  const acceptInvitation = useCallback((inviteCodeOrLink: string, userName: string, userEmail: string): FamilyMember => {
    const info = lookupInvitation(inviteCodeOrLink);
    const assignedRole: SystemRoleType = info ? info.assignedRole : 'CHILD';

    const userId = `usr-joined-${Date.now()}`;
    const memId = `mem-joined-${Date.now()}`;

    const newMember: FamilyMember = {
      id: memId,
      family_id: family.id,
      user_id: userId,
      user: {
        id: userId,
        name: userName.trim() || 'Joined Member',
        email: userEmail.trim() || 'member@family.sync',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      role: assignedRole,
      status: 'active',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      monthly_allowance: assignedRole === 'CHILD' ? 200000 : 1000000,
      monthly_spending_limit: assignedRole === 'CHILD' ? 300000 : 2000000,
    };

    setMembers(prev => [...prev, newMember]);
    setCurrentMemberId(memId);

    logAudit('INVITATION_ACCEPTED', 'member', memId, { name: userName, role: assignedRole });
    return newMember;
  }, [lookupInvitation, family.id, logAudit]);

  return (
    <FamilyFinanceContext.Provider
      value={{
        family,
        members,
        currentMember,
        roles: ROLE_DEFINITIONS,
        categories,
        accounts,
        transactions,
        budget,
        savingsGoals,
        requests,
        recurring,
        approvalRules,
        notifications,
        auditLogs,
        loans,
        investments,
        sharedExpenses,
        invitations,
        allowances,
        theme,
        toggleTheme,
        switchMember,
        hasPermission,
        canApproveRequestAmount,
        addTransaction,
        deleteTransaction,
        transferFunds,
        transferBetweenMembers,
        disburseAllowance,
        addAccount,
        deleteAccount,
        createRequest,
        approveRequest,
        rejectRequest,
        contributeToGoal,
        createGoal,
        updateBudgetCategory,
        updateMemberLimit,
        updateMemberRole,
        toggleMemberPermission,
        inviteMember,
        createInvitation,
        revokeInvitation,
        removeMember,
        markNotificationRead,
        markAllNotificationsRead,
        addLoan,
        recordEmiPayment,
        deleteLoan,
        addInvestment,
        updateInvestmentValue,
        deleteInvestment,
        addSharedExpense,
        settleSplitShare,
        markRecurringPaid,
        updateUserProfile,
        updateFamilyName,
        resetToDemoDefaults,
        bulkImportFamilyData,
        createFamilyWorkspace,
        lookupInvitation,
        acceptInvitation,
        loadDemoFamilyWorkspace,
      }}
    >
      {children}
    </FamilyFinanceContext.Provider>
  );
};

export const useFamilyFinance = () => {
  const context = useContext(FamilyFinanceContext);
  if (!context) {
    throw new Error('useFamilyFinance must be used within a FamilyFinanceProvider');
  }
  return context;
};
