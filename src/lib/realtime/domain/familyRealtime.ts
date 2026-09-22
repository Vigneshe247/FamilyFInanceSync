/* =========================================================
   FAMILYFINANCESYNC DOMAIN REALTIME BRIDGE
   Consumes generic @familyfinance/realtime-core to route
   family transactions, requests, members, and notifications.
   ========================================================= */

import { RealtimeClient } from '../core/RealtimeClient';
import { LocalBroadcastAdapter } from '../adapters/LocalBroadcastAdapter';
import { SupabaseRealtimeAdapter } from '../adapters/SupabaseRealtimeAdapter';
import { Transaction, ExpenseRequest, NotificationItem, FamilyMember } from '../../../types';

export const FamilyEventTypes = {
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_UPDATED: 'transaction.updated',
  TRANSACTION_DELETED: 'transaction.deleted',
  REQUEST_CREATED: 'request.created',
  REQUEST_APPROVED: 'request.approved',
  REQUEST_REJECTED: 'request.rejected',
  MEMBER_JOINED: 'member.joined',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_UPDATED: 'member.updated',
  PERMISSION_CHANGED: 'permission.changed',
  NOTIFICATION_CREATED: 'notification.created',
} as const;

export type FamilyEventType = typeof FamilyEventTypes[keyof typeof FamilyEventTypes];

// Singleton client instance initialized with local broadcast (fallback) or Supabase
const adapter = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? new SupabaseRealtimeAdapter()
  : new LocalBroadcastAdapter();

export const familyRealtimeClient = new RealtimeClient({
  adapter,
  enableDeduplication: true,
  dedupWindowMs: 60000,
  debug: false,
});

// Auto-connect
familyRealtimeClient.connect().catch(err => {
  console.warn('[FamilyRealtime] Auto-connect deferred:', err);
});

export function getFamilyChannel(familyId: string) {
  return familyRealtimeClient.channel(`family:${familyId}`);
}
