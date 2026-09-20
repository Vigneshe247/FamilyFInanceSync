-- =========================================================
-- FAMILY FINANCE SYNC — INITIAL SEED DATA (Section 40)
-- =========================================================

-- 1. SEED DEFAULT ROLES
INSERT INTO roles (id, name, description, is_system_role) VALUES
('FAMILY_HEAD', 'Family Head', 'Full administrative control over members, budgets, approval rules and vaults.', TRUE),
('CO_MANAGER', 'Co-Manager', 'Co-manages family budget, adds expenses, oversees savings goals and approves mid-tier requests.', TRUE),
('ADULT_MEMBER', 'Adult Member', 'Records personal expenses, submits spending requests, views permitted shared dashboards.', TRUE),
('CHILD', 'Child', 'Personal pocket allowance tracking, savings goals, and spending requests to parents.', TRUE),
('VIEWER', 'Viewer', 'Read-only access to basic shared reports and summaries.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED SYSTEM PERMISSIONS
INSERT INTO permissions (id, description) VALUES
('family.view', 'View family workspace details'),
('family.update', 'Update family settings & currency'),
('members.view', 'View members of the family'),
('members.invite', 'Invite new family members'),
('members.remove', 'Remove members from family'),
('members.update_role', 'Change member roles'),
('members.update_permissions', 'Override individual permissions'),
('transactions.view', 'View permitted family transactions'),
('transactions.create', 'Record income or expense'),
('transactions.update', 'Edit existing transactions'),
('transactions.delete', 'Remove transactions'),
('budgets.view', 'View family and category budgets'),
('budgets.create', 'Create new budgets'),
('budgets.update', 'Modify allocated budget amounts'),
('budgets.delete', 'Delete family budgets'),
('accounts.view', 'View family bank accounts and balances'),
('accounts.create', 'Add new payment accounts'),
('requests.view', 'View expense requests'),
('requests.create', 'Submit expense requests for approval'),
('requests.approve', 'Approve pending expense requests'),
('requests.reject', 'Reject pending expense requests'),
('goals.view', 'View savings goals'),
('goals.create', 'Create savings goals'),
('goals.update', 'Contribute or modify savings goals'),
('reports.view', 'View family financial reports & analytics'),
('reports.export', 'Export financial reports to CSV/PDF'),
('audit.view', 'Inspect audit trail and security logs')
ON CONFLICT (id) DO NOTHING;
