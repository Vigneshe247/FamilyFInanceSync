/* =========================================================
   FAMILY CONTEXT & AUTHORIZATION HOOKS (Section 29)
   Provides:
   1. useFamily() - Access family workspace, members, and state
   2. usePermissions() - Granular permission checker: can("addExpense")
   ========================================================= */

import { useFamilyFinance } from './FamilyFinanceContext';
import { RolePermissions } from '../types';
import { checkPermission, normalizeRole } from '../utils/permissions';

export function useFamily() {
  return useFamilyFinance();
}

export function usePermissions() {
  const { currentMember } = useFamilyFinance();

  const can = (permission: keyof RolePermissions): boolean => {
    if (!currentMember) return false;
    return checkPermission(
      currentMember.role,
      permission,
      currentMember.custom_permissions as any
    );
  };

  return {
    can,
    role: normalizeRole(currentMember.role),
    rawRole: currentMember.role,
    isFamilyHead: normalizeRole(currentMember.role) === 'family_head',
    isSpouse: normalizeRole(currentMember.role) === 'spouse',
    isSon: normalizeRole(currentMember.role) === 'son',
    isDaughter: normalizeRole(currentMember.role) === 'daughter',
    isChild: ['child', 'son', 'daughter'].includes(normalizeRole(currentMember.role)),
    isGrandparent: normalizeRole(currentMember.role) === 'grandparent',
    isViewer: normalizeRole(currentMember.role) === 'viewer',
  };
}
