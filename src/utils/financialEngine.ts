/* =========================================================
   FAMILY FINANCE SYNC — CENTRALIZED FINANCIAL AGGREGATION ENGINE
   Specification: Sections 2, 11, 12, 21, 23, 26, 46
   "The transaction database is the primary source of truth.
   Every dashboard value is derived strictly from real transactions."
   ========================================================= */

import { Transaction, Account, Budget, FamilyMember, Category } from '../types';

export interface FamilyFinancialSummary {
  totalIncomePaise: number;
  totalExpensePaise: number;
  currentBalancePaise: number;
  totalSavingsPaise: number;
  savingsRatePercentage: number;
  monthlyExpensePaise: number;
  monthlyIncomePaise: number;
  activeTransactionCount: number;
}

export interface MemberFinancialMetrics {
  memberId: string;
  userId: string;
  name: string;
  role: string;
  totalIncomePaise: number;
  totalExpensePaise: number;
  monthExpensePaise: number;
  monthIncomePaise: number;
  transactionCount: number;
  topCategoryId: string | null;
  topCategoryName: string;
  allowancePaise: number;
  remainingAllowancePaise: number;
  spendingLimitPaise: number;
  limitUtilizationPercentage: number;
  lastActivityDate: string | null;
}

export interface CategorySpendingMetric {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalSpentPaise: number;
  allocatedBudgetPaise: number;
  utilizationPercentage: number;
  thresholdStatus: 'safe' | 'warning' | 'critical' | 'exceeded';
}

/**
 * Filter transactions for current calendar month
 */
export function filterCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter(tx => {
    if (tx.status === 'voided') return false;
    const d = new Date(tx.transaction_date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
}

/**
 * Filter transactions for specific member
 */
export function filterMemberTransactions(transactions: Transaction[], userId: string): Transaction[] {
  return transactions.filter(tx => tx.user_id === userId && tx.status !== 'voided');
}

/**
 * Centralized calculation of family-wide financial metrics (Sections 2, 21, 23)
 * Transfers between accounts are neutral and NOT counted as income or expense!
 */
export function calculateFamilySummary(
  transactions: Transaction[],
  accounts: Account[]
): FamilyFinancialSummary {
  // Only cleared or active transactions
  const validTransactions = transactions.filter(tx => tx.status !== 'voided');

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;

  validTransactions.forEach(tx => {
    // Section 23: Transfers are neutral to income/expenses
    if (tx.type === 'transfer') {
      return;
    }
    if (tx.type === 'income' || tx.type === 'refund') {
      totalIncomePaise += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpensePaise += tx.amount;
    }
  });

  // Calculate current liquid balance from accounts or net inflow
  const accountBalancePaise = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const currentBalancePaise = accountBalancePaise > 0 
    ? accountBalancePaise 
    : Math.max(0, totalIncomePaise - totalExpensePaise);

  const totalSavingsPaise = Math.max(0, totalIncomePaise - totalExpensePaise);
  const savingsRatePercentage = totalIncomePaise > 0 
    ? Math.round((totalSavingsPaise / totalIncomePaise) * 1000) / 10 
    : 0;

  // Current month metrics
  const monthTx = filterCurrentMonthTransactions(transactions);
  let monthlyIncomePaise = 0;
  let monthlyExpensePaise = 0;

  monthTx.forEach(tx => {
    if (tx.type === 'transfer') return;
    if (tx.type === 'income') monthlyIncomePaise += tx.amount;
    if (tx.type === 'expense') monthlyExpensePaise += tx.amount;
  });

  return {
    totalIncomePaise,
    totalExpensePaise,
    currentBalancePaise,
    totalSavingsPaise,
    savingsRatePercentage,
    monthlyExpensePaise,
    monthlyIncomePaise,
    activeTransactionCount: validTransactions.length,
  };
}

/**
 * Calculate per-member monitoring analytics (Section 12)
 */
export function calculateMemberMetrics(
  member: FamilyMember,
  transactions: Transaction[],
  categories: Category[]
): MemberFinancialMetrics {
  const memberTx = filterMemberTransactions(transactions, member.user_id);
  const monthTx = filterCurrentMonthTransactions(memberTx);

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;
  let monthIncomePaise = 0;
  let monthExpensePaise = 0;
  const categoryCountMap = new Map<string, number>();

  memberTx.forEach(tx => {
    if (tx.type === 'transfer') return;
    if (tx.type === 'income') totalIncomePaise += tx.amount;
    if (tx.type === 'expense') {
      totalExpensePaise += tx.amount;
      categoryCountMap.set(tx.category_id, (categoryCountMap.get(tx.category_id) || 0) + tx.amount);
    }
  });

  monthTx.forEach(tx => {
    if (tx.type === 'transfer') return;
    if (tx.type === 'income') monthIncomePaise += tx.amount;
    if (tx.type === 'expense') monthExpensePaise += tx.amount;
  });

  // Identify top spending category
  let topCategoryId: string | null = null;
  let maxSpent = 0;
  categoryCountMap.forEach((spent, catId) => {
    if (spent > maxSpent) {
      maxSpent = spent;
      topCategoryId = catId;
    }
  });

  const topCategoryObj = categories.find(c => c.id === topCategoryId);
  const topCategoryName = topCategoryObj ? topCategoryObj.name : 'General';

  const allowancePaise = member.monthly_allowance || 0;
  const remainingAllowancePaise = Math.max(0, allowancePaise - monthExpensePaise);

  const spendingLimitPaise = member.monthly_spending_limit || allowancePaise || 0;
  const limitUtilizationPercentage = spendingLimitPaise > 0 
    ? Math.min(100, Math.round((monthExpensePaise / spendingLimitPaise) * 100)) 
    : 0;

  // Last activity
  const sortedTx = [...memberTx].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  const lastActivityDate = sortedTx.length > 0 ? sortedTx[0].transaction_date : null;

  return {
    memberId: member.id,
    userId: member.user_id,
    name: member.user?.name || 'Member',
    role: member.role,
    totalIncomePaise,
    totalExpensePaise,
    monthIncomePaise,
    monthExpensePaise,
    transactionCount: memberTx.length,
    topCategoryId,
    topCategoryName,
    allowancePaise,
    remainingAllowancePaise,
    spendingLimitPaise,
    limitUtilizationPercentage,
    lastActivityDate,
  };
}

/**
 * Calculate category budget utilization & alert thresholds (Section 15 & 19)
 */
export function calculateBudgetMetrics(
  transactions: Transaction[],
  budget: Budget | null,
  categories: Category[]
): CategorySpendingMetric[] {
  const monthTx = filterCurrentMonthTransactions(transactions).filter(tx => tx.type === 'expense');

  const categorySpentMap = new Map<string, number>();
  monthTx.forEach(tx => {
    categorySpentMap.set(tx.category_id, (categorySpentMap.get(tx.category_id) || 0) + tx.amount);
  });

  const categoryBudgetMap = new Map<string, number>();
  if (budget && budget.categories) {
    budget.categories.forEach(bc => {
      categoryBudgetMap.set(bc.category_id, bc.allocated_amount);
    });
  }

  return categories.filter(c => c.type === 'expense').map(cat => {
    const totalSpentPaise = categorySpentMap.get(cat.id) || 0;
    const allocatedBudgetPaise = categoryBudgetMap.get(cat.id) || 0;

    let utilizationPercentage = 0;
    let thresholdStatus: CategorySpendingMetric['thresholdStatus'] = 'safe';

    if (allocatedBudgetPaise > 0) {
      utilizationPercentage = Math.round((totalSpentPaise / allocatedBudgetPaise) * 100);
      if (utilizationPercentage >= 100) {
        thresholdStatus = 'exceeded';
      } else if (utilizationPercentage >= 90) {
        thresholdStatus = 'critical';
      } else if (utilizationPercentage >= 75) {
        thresholdStatus = 'warning';
      }
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color || '#16A34A',
      totalSpentPaise,
      allocatedBudgetPaise,
      utilizationPercentage,
      thresholdStatus,
    };
  });
}
