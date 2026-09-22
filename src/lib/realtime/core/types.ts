/* =========================================================
   GENERIC REALTIME CORE — TYPES & DATA CONTRACTS
   Standalone, public-ready realtime library specifications.
   Decoupled from FamilyFinanceSync domain logic.
   ========================================================= */

export type ConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR'
  | 'CLOSED';

export interface RealtimeEvent<T = unknown> {
  id: string;
  type: string;
  timestamp: string;
  topic: string;
  aggregateId?: string;
  version?: number;
  payload: T;
  sourceClient?: string;
}

export type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void;

export interface RealtimeSubscription {
  id: string;
  topic: string;
  unsubscribe: () => void;
}

export interface RealtimeChannelInterface {
  topic: string;
  publish: <T>(eventType: string, payload: T, metadata?: Partial<RealtimeEvent<T>>) => Promise<void>;
  subscribe: <T>(handler: EventHandler<T>) => RealtimeSubscription;
  unsubscribeAll: () => void;
}

export interface RealtimeTransportAdapter {
  name: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  publish: <T>(topic: string, event: RealtimeEvent<T>) => Promise<void>;
  subscribeTopic: (topic: string, onEvent: (event: RealtimeEvent) => void) => () => void;
  onConnectionChange: (callback: (state: ConnectionState, error?: Error) => void) => () => void;
}

export interface RealtimeClientConfig {
  clientId?: string;
  adapter: RealtimeTransportAdapter;
  reconnectAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  enableDeduplication?: boolean;
  dedupWindowMs?: number;
  debug?: boolean;
}
