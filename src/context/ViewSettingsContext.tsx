import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ViewSettingsState {
  dashboard: {
    defaultTimeframe: 'this_month' | 'last_month' | 'q3' | 'yearly';
    maskBalancesDefault: boolean;
    showFinancialPlan: boolean;
    showAccountsCard: boolean;
    showRecentActivity: boolean;
    showSpendingBreakdown: boolean;
    lowBalanceThreshold: number; // in paise
  };
  transactions: {
    defaultSort: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
    defaultDatePreset: 'all' | 'month' | 'year' | 'week';
    rowDensity: 'comfortable' | 'compact';
    maskSensitiveAmounts: boolean;
    autoCategorizeUPI: boolean;
    showAccountBadges: boolean;
  };
  members: {
    maskContactDetails: boolean;
    displayLayout: 'grid' | 'table';
    showJoinDates: boolean;
    notifyMemberActivity: boolean;
  };
  permissions: {
    requireHighRiskConfirmation: boolean;
    groupMatrixByModule: boolean;
    lockOverridesToHeadOnly: boolean;
    enableAuditLogExport: boolean;
  };
  budgets: {
    alertThresholdPercent: 70 | 80 | 90 | 100;
    rolloverUnspentBudget: boolean;
    fiscalStartDay: number;
    autoApproveChildMicroSpend: boolean;
    childMicroSpendCapPaise: number;
  };
  requests: {
    autoApprovalLimitPaise: number;
    requireReceiptOverPaise: number;
    autoExpireDays: 7 | 14 | 30;
    instantPushNotification: boolean;
  };
  goals: {
    roundUpSpareChange: boolean;
    roundUpNearest: 10 | 50 | 100;
    celebrateMilestones: boolean;
    defaultSort: 'target_date' | 'progress' | 'target_amount';
  };
  recurring: {
    reminderAdvanceDays: 1 | 3 | 7;
    autoRecordPaidTransaction: boolean;
    groupByFrequency: boolean;
  };
  loans: {
    prepaymentMode: 'reduce_tenure' | 'reduce_emi';
    reminderDaysBeforeDue: 3 | 5 | 7;
    includeInterestInMonthlyExpense: boolean;
  };
  investments: {
    displayMetric: 'current_value' | 'invested_value' | 'returns_percent';
    benchmarkIndex: 'NIFTY50' | 'SENSEX' | 'NONE';
    autoRefreshValuation: boolean;
  };
  split_expenses: {
    defaultSplitMethod: 'equal' | 'income_ratio';
    settleUpAlertThresholdPaise: number;
    notifyMembersOnAdd: boolean;
  };
  reports: {
    defaultChartType: 'spline_area' | 'bar' | 'donut';
    excludeTransfersFromCashflow: boolean;
    defaultExportFormat: 'csv' | 'pdf';
  };
}

export const DEFAULT_VIEW_SETTINGS: ViewSettingsState = {
  dashboard: {
    defaultTimeframe: 'this_month',
    maskBalancesDefault: false,
    showFinancialPlan: true,
    showAccountsCard: true,
    showRecentActivity: true,
    showSpendingBreakdown: true,
    lowBalanceThreshold: 500000, // ₹5,000
  },
  transactions: {
    defaultSort: 'date_desc',
    defaultDatePreset: 'month',
    rowDensity: 'comfortable',
    maskSensitiveAmounts: false,
    autoCategorizeUPI: true,
    showAccountBadges: true,
  },
  members: {
    maskContactDetails: true,
    displayLayout: 'grid',
    showJoinDates: true,
    notifyMemberActivity: true,
  },
  permissions: {
    requireHighRiskConfirmation: true,
    groupMatrixByModule: true,
    lockOverridesToHeadOnly: true,
    enableAuditLogExport: true,
  },
  budgets: {
    alertThresholdPercent: 80,
    rolloverUnspentBudget: false,
    fiscalStartDay: 1,
    autoApproveChildMicroSpend: true,
    childMicroSpendCapPaise: 50000, // ₹500
  },
  requests: {
    autoApprovalLimitPaise: 20000, // ₹200
    requireReceiptOverPaise: 100000, // ₹1,000
    autoExpireDays: 14,
    instantPushNotification: true,
  },
  goals: {
    roundUpSpareChange: false,
    roundUpNearest: 10,
    celebrateMilestones: true,
    defaultSort: 'target_date',
  },
  recurring: {
    reminderAdvanceDays: 3,
    autoRecordPaidTransaction: true,
    groupByFrequency: true,
  },
  loans: {
    prepaymentMode: 'reduce_tenure',
    reminderDaysBeforeDue: 3,
    includeInterestInMonthlyExpense: true,
  },
  investments: {
    displayMetric: 'current_value',
    benchmarkIndex: 'NIFTY50',
    autoRefreshValuation: true,
  },
  split_expenses: {
    defaultSplitMethod: 'equal',
    settleUpAlertThresholdPaise: 100000, // ₹1,000
    notifyMembersOnAdd: true,
  },
  reports: {
    defaultChartType: 'spline_area',
    excludeTransfersFromCashflow: true,
    defaultExportFormat: 'csv',
  },
};

const STORAGE_KEY = 'family_finance_view_settings';

interface ViewSettingsContextType {
  settings: ViewSettingsState;
  updateViewSettings: <K extends keyof ViewSettingsState>(
    view: K,
    updates: Partial<ViewSettingsState[K]>
  ) => void;
  resetViewSettings: (view: keyof ViewSettingsState) => void;
  resetAllSettings: () => void;
  isSettingsModalOpen: boolean;
  activeSettingsView: keyof ViewSettingsState;
  openViewSettingsModal: (view?: keyof ViewSettingsState) => void;
  closeViewSettingsModal: () => void;
}

const ViewSettingsContext = createContext<ViewSettingsContextType | undefined>(undefined);

export const ViewSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ViewSettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_VIEW_SETTINGS,
          ...parsed,
          dashboard: { ...DEFAULT_VIEW_SETTINGS.dashboard, ...(parsed.dashboard || {}) },
          transactions: { ...DEFAULT_VIEW_SETTINGS.transactions, ...(parsed.transactions || {}) },
          members: { ...DEFAULT_VIEW_SETTINGS.members, ...(parsed.members || {}) },
          permissions: { ...DEFAULT_VIEW_SETTINGS.permissions, ...(parsed.permissions || {}) },
          budgets: { ...DEFAULT_VIEW_SETTINGS.budgets, ...(parsed.budgets || {}) },
          requests: { ...DEFAULT_VIEW_SETTINGS.requests, ...(parsed.requests || {}) },
          goals: { ...DEFAULT_VIEW_SETTINGS.goals, ...(parsed.goals || {}) },
          recurring: { ...DEFAULT_VIEW_SETTINGS.recurring, ...(parsed.recurring || {}) },
          loans: { ...DEFAULT_VIEW_SETTINGS.loans, ...(parsed.loans || {}) },
          investments: { ...DEFAULT_VIEW_SETTINGS.investments, ...(parsed.investments || {}) },
          split_expenses: { ...DEFAULT_VIEW_SETTINGS.split_expenses, ...(parsed.split_expenses || {}) },
          reports: { ...DEFAULT_VIEW_SETTINGS.reports, ...(parsed.reports || {}) },
        };
      }
    } catch (e) {
      console.warn('Could not parse view settings from localStorage', e);
    }
    return DEFAULT_VIEW_SETTINGS;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsView, setActiveSettingsView] = useState<keyof ViewSettingsState>('transactions');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save view settings to localStorage', e);
    }
  }, [settings]);

  const updateViewSettings = <K extends keyof ViewSettingsState>(
    view: K,
    updates: Partial<ViewSettingsState[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [view]: {
        ...prev[view],
        ...updates,
      },
    }));
  };

  const resetViewSettings = (view: keyof ViewSettingsState) => {
    setSettings(prev => ({
      ...prev,
      [view]: { ...DEFAULT_VIEW_SETTINGS[view] },
    }));
  };

  const resetAllSettings = () => {
    setSettings(DEFAULT_VIEW_SETTINGS);
  };

  const openViewSettingsModal = (view?: keyof ViewSettingsState) => {
    if (view) {
      setActiveSettingsView(view);
    }
    setIsSettingsModalOpen(true);
  };

  const closeViewSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  return (
    <ViewSettingsContext.Provider
      value={{
        settings,
        updateViewSettings,
        resetViewSettings,
        resetAllSettings,
        isSettingsModalOpen,
        activeSettingsView,
        openViewSettingsModal,
        closeViewSettingsModal,
      }}
    >
      {children}
    </ViewSettingsContext.Provider>
  );
};

export const useViewSettings = () => {
  const context = useContext(ViewSettingsContext);
  if (!context) {
    throw new Error('useViewSettings must be used within a ViewSettingsProvider');
  }
  return context;
};
