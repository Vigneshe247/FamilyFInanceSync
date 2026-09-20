/* =========================================================
   FAMILY FINANCE SYNC — NEO-MINT CHASSIS & ROUTING
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance, FamilyFinanceProvider } from './context/FamilyFinanceContext';
import { TopMenubar } from './components/layout/TopMenubar';

// Feature Views
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { BudgetsPage } from './features/budgets/BudgetsPage';
import { RequestsPage } from './features/requests/RequestsPage';
import { GoalsPage } from './features/goals/GoalsPage';
import { AffordabilityPage } from './features/affordability/AffordabilityPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { RecurringPage } from './features/recurring/RecurringPage';
import { ControlCenterPage } from './features/family/ControlCenterPage';
import { ApprovalCenterPage } from './features/family/ApprovalCenterPage';
import { MembersPage } from './features/family/MembersPage';
import { PermissionsMatrixPage } from './features/family/PermissionsMatrixPage';
import { SpendingLimitsPage } from './features/family/SpendingLimitsPage';
import { AccountsVaultPage } from './features/family/AccountsVaultPage';
import { AuditLogsPage } from './features/audit/AuditLogsPage';
import { SecurityPage } from './features/security/SecurityPage';
import { ReceiptOcrPage } from './features/futures/ReceiptOcrPage';
import { BankSyncPage } from './features/futures/BankSyncPage';
import { AiAdvisorPage } from './features/futures/AiAdvisorPage';

import { LoansPage } from './features/loans/LoansPage';
import { InvestmentsPage } from './features/investments/InvestmentsPage';
import { SharedExpensesPage } from './features/split/SharedExpensesPage';

// Modals
import { NewTransactionModal } from './components/modals/NewTransactionModal';
import { NewRequestModal } from './components/modals/NewRequestModal';
import { AuthUserModal } from './components/modals/AuthUserModal';
import { DataImportModal } from './components/modals/DataImportModal';

import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  GitPullRequest,
  MoreHorizontal,
  Wallet,
} from 'lucide-react';

const AppInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [newTxModalOpen, setNewTxModalOpen] = useState(false);
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [requestInitialData, setRequestInitialData] = useState<{
    title: string;
    amountRupees: string;
    categoryId: string;
    description: string;
  } | null>(null);

  const { requests, currentMember } = useFamilyFinance();
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const isChild = currentMember.role === 'CHILD';

  const handleOpenAffordabilityWithData = (data: {
    title: string;
    amountRupees: string;
    categoryId: string;
    description: string;
  }) => {
    setRequestInitialData(data);
    setNewRequestModalOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onOpenNewTx={() => setNewTxModalOpen(true)}
            onOpenNewRequest={() => {
              setRequestInitialData(null);
              setNewRequestModalOpen(true);
            }}
            onOpenAffordability={() => setActiveTab('affordability')}
            setActiveTab={setActiveTab}
            onOpenImportModal={() => setImportModalOpen(true)}
          />
        );
      case 'accounts':
        return <AccountsVaultPage />;
      case 'transactions':
        return (
          <TransactionsPage
            onOpenNewTx={() => setNewTxModalOpen(true)}
            onOpenReceiptOcr={() => setActiveTab('receipt_ocr')}
          />
        );
      case 'budgets':
        return <BudgetsPage />;
      case 'requests':
        return (
          <RequestsPage
            onOpenNewRequest={() => {
              setRequestInitialData(null);
              setNewRequestModalOpen(true);
            }}
          />
        );
      case 'goals':
        return <GoalsPage />;
      case 'affordability':
        return (
          <AffordabilityPage
            onOpenNewRequestWithData={handleOpenAffordabilityWithData}
          />
        );
      case 'reports':
        return <ReportsPage />;
      case 'recurring':
        return <RecurringPage />;
      case 'control_center':
        return (
          <ControlCenterPage
            setActiveTab={setActiveTab}
            onOpenImportModal={() => setImportModalOpen(true)}
          />
        );
      case 'approval_center':
        return <ApprovalCenterPage />;
      case 'members':
        return <MembersPage />;
      case 'permissions':
        return <PermissionsMatrixPage />;
      case 'spending_limits':
        return <SpendingLimitsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'security':
        return <SecurityPage />;
      case 'receipt_ocr':
        return (
          <ReceiptOcrPage
            onTransactionCreated={() => setActiveTab('transactions')}
          />
        );
      case 'bank_sync':
        return <BankSyncPage />;
      case 'ai_insights':
        return <AiAdvisorPage />;
      case 'loans':
        return <LoansPage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'split_expenses':
        return <SharedExpensesPage />;
      default:
        return (
          <DashboardPage
            onOpenNewTx={() => setNewTxModalOpen(true)}
            onOpenNewRequest={() => {
              setRequestInitialData(null);
              setNewRequestModalOpen(true);
            }}
            onOpenAffordability={() => setActiveTab('affordability')}
            setActiveTab={setActiveTab}
            onOpenImportModal={() => setImportModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="app-viewport-shell">
      {/* Outer Curved Neo-Mint Chassis Envelope (Finova & Crextio style) */}
      <div className="neo-chassis-container">
        {/* Floating Capsule Navbar */}
        <TopMenubar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewTx={() => setNewTxModalOpen(true)}
          onOpenNewRequest={() => {
            setRequestInitialData(null);
            setNewRequestModalOpen(true);
          }}
          onOpenAffordability={() => setActiveTab('affordability')}
          onOpenReceiptOcr={() => setActiveTab('receipt_ocr')}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onOpenImportModal={() => setImportModalOpen(true)}
        />

        {/* Dynamic Page Body */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderActiveView()}
        </main>

        {/* Mobile Floating Capsule Navigation Bar (When screen < 900px) */}
        <nav className="mobile-bottom-capsule-nav">
          <button
            className={`mobile-capsule-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Home</span>
          </button>

          <button
            className={`mobile-capsule-item ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <Wallet size={18} />
            <span>Accounts</span>
          </button>

          <button
            className={`mobile-capsule-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <Receipt size={18} />
            <span>Ledger</span>
          </button>

          {!isChild && (
            <button
              className={`mobile-capsule-item ${activeTab === 'budgets' ? 'active' : ''}`}
              onClick={() => setActiveTab('budgets')}
            >
              <PiggyBank size={18} />
              <span>Budget</span>
            </button>
          )}

          <button
            className={`mobile-capsule-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{ position: 'relative' }}
          >
            <GitPullRequest size={18} />
            <span>Requests</span>
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '12px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#EB5757',
                }}
              ></span>
            )}
          </button>

          <button
            className={`mobile-capsule-item ${activeTab === 'control_center' ? 'active' : ''}`}
            onClick={() => setActiveTab(isChild ? 'affordability' : 'control_center')}
          >
            <MoreHorizontal size={18} />
            <span>{isChild ? 'Afford' : 'More'}</span>
          </button>
        </nav>
      </div>

      {/* Modals */}
      <NewTransactionModal
        isOpen={newTxModalOpen}
        onClose={() => setNewTxModalOpen(false)}
      />

      <NewRequestModal
        isOpen={newRequestModalOpen}
        onClose={() => {
          setNewRequestModalOpen(false);
          setRequestInitialData(null);
        }}
        initialData={requestInitialData}
      />

      <AuthUserModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <DataImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <FamilyFinanceProvider>
      <AppInner />
    </FamilyFinanceProvider>
  );
};

export default App;
