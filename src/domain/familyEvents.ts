/* =========================================================================
   FamilyFinanceSync — Domain Events & Version-Aware Reducers
   Pure domain event contracts for live financial state reconciliation.
   ========================================================================= */

import type { Transaction, ExpenseRequest, NotificationItem } from '../types';

export type FamilyDomainEventType =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.deleted'
  | 'request.created'
  | 'request.approved'
  | 'request.rejected'
  | 'request.cancelled'
  | 'member.joined'
  | 'member.removed'
  | 'member.updated'
  | 'permission.changed'
  | 'visibility.changed'
  | 'notification.created';

export interface BaseDomainEvent<T = unknown> {
  id: string;
  type: FamilyDomainEventType;
  timestamp: string;
  aggregateId?: string;
  version?: number;
  payload: T;
}

export type TransactionEvent = BaseDomainEvent<Transaction>;
export type RequestEvent = BaseDomainEvent<ExpenseRequest>;
export type NotificationEvent = BaseDomainEvent<NotificationItem>;
export type StructuralEvent = BaseDomainEvent<{ familyId: string; affectedUserId?: string }>;

export type FamilyDomainEvent =
  | TransactionEvent
  | RequestEvent
  | NotificationEvent
  | StructuralEvent;

/**
 * Idempotent, version-aware reducer for transaction upserts.
 * Rejects stale updates if an existing row has a higher version.
 */
export function applyTransactionUpsert(
  transactions: Transaction[],
  incoming: Transaction,
  incomingVersion?: number
): Transaction[] {
  const existingIdx = transactions.findIndex(t => t.id === incoming.id);
  if (existingIdx === -1) {
    return [incoming, ...transactions];
  }

  const existing = transactions[existingIdx];
  const existingVersion = (existing as any).version ?? 1;
  const newVersion = incomingVersion ?? (incoming as any).version ?? 1;

  // Stale event protection: ignore out-of-order event
  if (newVersion < existingVersion) {
    return transactions;
  }

  const copy = [...transactions];
  copy[existingIdx] = incoming;
  return copy;
}

/**
 * Idempotent removal/void of a transaction.
 */
export function applyTransactionRemoval(transactions: Transaction[], id: string): Transaction[] {
  return transactions.filter(t => t.id !== id);
}
