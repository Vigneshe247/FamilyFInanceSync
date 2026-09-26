/* =========================================================
   FAMILYFINANCESYNC DOMAIN REALTIME BRIDGE
   Consumes generic @familyfinance/realtime-core to route
   family transactions, requests, members, and notifications.
   Uses private per-user topics (user:{userId}) for secure delivery.
   ========================================================= */

import { RealtimeClient } from '../core/RealtimeClient';
import { LocalBroadcastAdapter } from '../adapters/LocalBroadcastAdapter';
import { SupabaseRealtimeAdapter } from '../adapters/SupabaseRealtimeAdapter';

export const FamilyEventTypes = {
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_UPDATED: 'transaction.updated',
  TRANSACTION_DELETED: 'transaction.deleted',
  REQUEST_CREATED: 'request.created',
  REQUEST_APPROVED: 'request.approved',
  REQUEST_REJECTED: 'request.rejected',
  REQUEST_CANCELLED: 'request.cancelled',
  MEMBER_JOINED: 'member.joined',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_UPDATED: 'member.updated',
  PERMISSION_CHANGED: 'permission.changed',
  VISIBILITY_CHANGED: 'visibility.changed',
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

/**
 * Secure, private per-user realtime channel.
 * Target audience is calculated in PostgreSQL at write time (003 migration).
 */
export function getUserChannel(userId: string) {
  return familyRealtimeClient.channel(`user:${userId}`);
}

/**
 * Family channel for workspace-level broadcast events (e.g., family settings update).
 */
export function getFamilyChannel(familyId: string) {
  return familyRealtimeClient.channel(`family:${familyId}`);
}
