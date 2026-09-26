/* =========================================================
   FAMILY CONTEXT & AUTHORIZATION HOOKS
   Provides:
   1. useFamily() - Access family workspace, members, and state
   2. usePermissions() - Granular permission checker: can("transactions.create_expense") or can("addExpense")
   ========================================================= */

import { useFamilyFinance } from './FamilyFinanceContext';
import { RolePermissions } from '../types';
import {
  evaluatePermission,
  resolvePermissionKey,
  normalizeRoleId,
  PermissionContext,
  PermissionKey,
} from '../domain/permissions';

export function useFamily() {
  return useFamilyFinance();
}

export function usePermissions() {
  const { currentMember, family, roles } = useFamilyFinance();

  const can = (permission: PermissionKey | keyof RolePermissions | string): boolean => {
    if (!currentMember) return false;

    const resolved = resolvePermissionKey(permission as string);
    const roleId = currentMember.role;

    const roleDefinitionsMap = roles
      ? Object.fromEntries(roles.map(r => [r.id, r.default_permissions]))
      : {};

    const ctx: PermissionContext = {
      roleId,
      isOwner: family ? family.owner_id === currentMember.user_id : false,
      memberOverrides: currentMember.custom_permissions as any,
      customRolePermissions: roleDefinitionsMap,
    };

    return evaluatePermission(ctx, resolved);
  };

  const canonical = normalizeRoleId(currentMember?.role);

  return {
    can,
    role: canonical.toLowerCase(),
    canonicalRole: canonical,
    rawRole: currentMember?.role || 'VIEWER',
    isFamilyHead: canonical === 'FAMILY_HEAD',
    isSpouse: canonical === 'SPOUSE',
    isSon: canonical === 'SON',
    isDaughter: canonical === 'DAUGHTER',
    isChild: canonical === 'SON' || canonical === 'DAUGHTER',
    isGrandparent: canonical === 'GRANDPARENT',
    isViewer: canonical === 'VIEWER',
  };
}
