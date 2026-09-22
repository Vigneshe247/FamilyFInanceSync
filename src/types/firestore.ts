/* =========================================================
   FAMILY FINANCE SYNC — CLOUD FIRESTORE MULTI-TENANT SCHEMA
   Sections 6–9, 41, 42 Schema Specification
   ========================================================= */

import { FamilyRole, RolePermissions } from './index';

// 1. User Document (/users/{uid}) — Section 7
export interface FirestoreUserDocument {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  mobile: string;
  photoURL?: string;
  emailVerified: boolean;
  familyId: string;
  status: 'active' | 'suspended';
  createdAt: any;
  updatedAt: any;
}

// 2. Family Document (/families/{familyId}) — Section 8
export interface FirestoreFamilyDocument {
  familyId: string;
  familyName: string;
  createdBy: string;
  currency: string; // 'INR'
  timezone: string; // 'Asia/Kolkata'
  status: 'active' | 'archived';
  createdAt: any;
  updatedAt: any;
}

// 3. Family Member Document (/families/{familyId}/members/{uid}) — Section 9
export interface FirestoreMemberDocument {
  uid: string;
  role: FamilyRole;
  status: 'active' | 'suspended';
  permissions: RolePermissions;
  joinedAt: any;
  monthlyAllowancePaise?: number;
  monthlySpendingLimitPaise?: number;
}

// 4. Transaction Document (/families/{familyId}/transactions/{transactionId})
export interface FirestoreTransactionDocument {
  id?: string;
  familyId: string;
  userId: string;
  userName?: string;
  type: 'income' | 'expense' | 'transfer';
  amountPaise: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  isShared: boolean;
  accountId?: string;
  status: 'cleared' | 'pending';
  receiptUrl?: string;
  createdAt: any;
}

// 5. Account Document (/families/{familyId}/accounts/{accountId})
export interface FirestoreAccountDocument {
  id?: string;
  familyId: string;
  name: string;
  type: string;
  balancePaise: number;
  currency: string;
  isShared: boolean;
  ownerUid?: string;
  createdAt: any;
}

// 6. Budget Document (/families/{familyId}/budgets/{budgetId})
export interface FirestoreBudgetDocument {
  id?: string;
  familyId: string;
  name: string;
  period: 'monthly' | 'weekly';
  totalLimitPaise: number;
  categories: Array<{ category: string; allocatedPaise: number }>;
  createdAt: any;
  updatedAt: any;
}

// 7. Debts & Liabilities Document (/families/{familyId}/debts/{debtId})
export interface FirestoreDebtDocument {
  id?: string;
  familyId: string;
  userId: string;
  type: 'loan' | 'borrowing' | 'split';
  counterparty: string;
  principalPaise: number;
  remainingPaise: number;
  interestRate: number;
  dueDate: string;
  status: 'active' | 'cleared';
  createdAt: any;
}

// 8. Allowances Document (/families/{familyId}/allowances/{allowanceId})
export interface FirestoreAllowanceDocument {
  id?: string;
  familyId: string;
  memberUid: string;
  baseAllowancePaise: number;
  period: 'weekly' | 'monthly';
  bonusPaise?: number;
  status: 'active' | 'paused';
  createdAt: any;
}

// 9. Savings Goals Document (/families/{familyId}/goals/{goalId})
export interface FirestoreGoalDocument {
  id?: string;
  familyId: string;
  name: string;
  targetPaise: number;
  currentPaise: number;
  targetDate: string;
  createdBy: string;
  status: 'in_progress' | 'completed';
  createdAt: any;
}

// 10. Invitations Document (/families/{familyId}/invitations/{invitationId}) — Section 25
export interface FirestoreInvitationDocument {
  id?: string;
  familyId: string;
  familyName: string;
  invitedEmail: string;
  invitedRole: Exclude<FamilyRole, 'family_head'>; // Family Head CANNOT be invited
  permissions: Partial<RolePermissions>;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  inviterName: string;
  expiresAt: any;
  createdAt: any;
}

// 11. Audit Log Document (/families/{familyId}/auditLogs/{logId}) — Section 41
export interface FirestoreAuditLogDocument {
  id?: string;
  familyId: string;
  actorUid: string;
  actorName: string;
  action:
    | 'MEMBER_INVITED'
    | 'ROLE_CHANGED'
    | 'PERMISSION_CHANGED'
    | 'MEMBER_REMOVED'
    | 'MEMBER_SUSPENDED'
    | 'TRANSACTION_CREATED'
    | 'TRANSACTION_DELETED'
    | 'BUDGET_CHANGED'
    | 'ALLOWANCE_DISBURSED';
  targetUid?: string;
  targetResource?: string;
  metadata?: Record<string, any>;
  timestamp: any;
}

// 12. Notifications Document (/families/{familyId}/notifications/{notificationId}) — Section 42
export interface FirestoreNotificationDocument {
  id?: string;
  familyId: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'member_joined' | 'expense_added' | 'budget_alert' | 'allowance_request' | 'role_changed' | 'permission_updated';
  read: boolean;
  createdAt: any;
}

// Legacy / Alternative interfaces for service compatibility
export interface FirestoreUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  activeFamilyId?: string;
  familyId?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  emailVerified?: boolean;
  status?: 'active' | 'suspended';
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreFamily {
  id: string;
  name: string;
  ownerUid?: string;
  createdBy?: string;
  familyName?: string;
  familyId?: string;
  currency: string;
  timezone: string;
  status?: 'active' | 'archived';
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreMember {
  uid: string;
  familyId?: string;
  name?: string;
  email?: string;
  role: any;
  permissions?: any;
  monthlyAllowancePaise?: number;
  monthlySpendingLimitPaise?: number;
  joinedAt: any;
  status: 'active' | 'suspended';
}

export interface FirestoreSettings {
  familyId: string;
  currency: string;
  budgetThresholdAlerts: number[];
  autoApproveAllowanceThresholdPaise: number;
  auditLoggingEnabled: boolean;
  spendingAlertsEnabled: boolean;
  updatedAt: any;
}

export interface FirestoreInvite {
  id?: string;
  familyId: string;
  familyName?: string;
  invitedEmail: string;
  role: any;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy?: string;
  invitedByUid?: string;
  inviterName?: string;
  permissions?: any;
  createdAt?: any;
  expiresAt: any;
}

export interface FirestoreIncome {
  id?: string;
  userId: string;
  userName: string;
  amountPaise: number;
  source: string;
  category: string;
  date: string;
  isShared: boolean;
  notes?: string;
  createdAt?: any;
}

export interface FirestoreExpense {
  id?: string;
  userId: string;
  userName: string;
  amountPaise: number;
  category: string;
  date: string;
  isShared: boolean;
  paymentMethod: string;
  receiptUrl?: string;
  notes?: string;
  createdAt?: any;
}

export interface FirestoreDebt {
  id?: string;
  userId: string;
  familyId?: string;
  type: 'loan' | 'borrowing' | 'split';
  counterparty: string;
  principalPaise: number;
  remainingPaise: number;
  interestRate: number;
  dueDate: string;
  status: 'active' | 'cleared';
  notes?: string;
  createdAt?: any;
}

