/* =========================================================
   GENERIC REALTIME CORE — REALTIME CLIENT
   Connection lifecycle manager, topic multiplexer, and router.
   ========================================================= */

import {
  ConnectionState,
  RealtimeClientConfig,
  RealtimeEvent,
  RealtimeSubscription,
  RealtimeChannelInterface,
  EventHandler,
} from './types';
import { TypedEventEmitter } from './EventEmitter';
import { EventDeduplicator } from './Deduplicator';
import { RetryPolicy } from './RetryPolicy';

export class RealtimeClient {
  private config: RealtimeClientConfig;
  private state: ConnectionState = 'DISCONNECTED';
  private emitter = new TypedEventEmitter();
  private deduplicator: EventDeduplicator;
  private retryPolicy: RetryPolicy;
  private activeSubscriptions = new Map<string, () => void>();
  private stateListeners = new Set<(state: ConnectionState, error?: Error) => void>();
  private reconnectTimer: any = null;

  constructor(config: RealtimeClientConfig) {
    this.config = {
      clientId: `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      enableDeduplication: true,
      dedupWindowMs: 60000,
      debug: false,
      ...config,
    };

    this.deduplicator = new EventDeduplicator(this.config.dedupWindowMs);
    this.retryPolicy = new RetryPolicy(
      config.reconnectAttempts || 10,
      config.initialBackoffMs || 1000,
      config.maxBackoffMs || 30000
    );

    // Bind transport adapter connection state
    this.config.adapter.onConnectionChange((state, error) => {
      this.setState(state, error);
      if (state === 'CONNECTED') {
        this.retryPolicy.reset();
      } else if (state === 'DISCONNECTED' || state === 'ERROR') {
        this.scheduleReconnect();
      }
    });
  }

  async connect(): Promise<void> {
    if (this.state === 'CONNECTED' || this.state === 'CONNECTING') return;

    this.setState('CONNECTING');
    try {
      await this.config.adapter.connect();
      this.setState('CONNECTED');
      this.retryPolicy.reset();
    } catch (err: any) {
      this.setState('ERROR', err);
      this.scheduleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.activeSubscriptions.forEach(unsub => unsub());
    this.activeSubscriptions.clear();
    await this.config.adapter.disconnect();
    this.setState('DISCONNECTED');
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  onConnectionChange(callback: (state: ConnectionState, error?: Error) => void): () => void {
    this.stateListeners.add(callback);
    callback(this.state);
    return () => this.stateListeners.delete(callback);
  }

  channel(topic: string): RealtimeChannelInterface {
    return {
      topic,
      publish: async <T>(eventType: string, payload: T, metadata?: Partial<RealtimeEvent<T>>) => {
        const event: RealtimeEvent<T> = {
          id: metadata?.id || `evt-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          type: eventType,
          timestamp: metadata?.timestamp || new Date().toISOString(),
          topic,
          aggregateId: metadata?.aggregateId,
          version: metadata?.version,
          payload,
          sourceClient: this.config.clientId,
        };

        if (this.config.enableDeduplication) {
          this.deduplicator.isDuplicate(event.id);
        }

        // Local dispatch
        this.emitter.emit(event);

        // Remote transport publish
        await this.config.adapter.publish(topic, event);
      },
      subscribe: <T>(handler: EventHandler<T>): RealtimeSubscription => {
        const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Ensure topic is subscribed at transport level
        if (!this.activeSubscriptions.has(topic)) {
          const unsubTransport = this.config.adapter.subscribeTopic(topic, incomingEvent => {
            // Deduplicate incoming events
            if (this.config.enableDeduplication && this.deduplicator.isDuplicate(incomingEvent.id)) {
              return;
            }
            // Ignore events sent by self if already handled
            if (incomingEvent.sourceClient === this.config.clientId) {
              return;
            }
            this.emitter.emit(incomingEvent);
          });
          this.activeSubscriptions.set(topic, unsubTransport);
        }

        // Subscribe to emitter
        const unsubEmitter = this.emitter.on(topic, handler);

        return {
          id: subId,
          topic,
          unsubscribe: () => {
            unsubEmitter();
          },
        };
      },
      unsubscribeAll: () => {
        const unsub = this.activeSubscriptions.get(topic);
        if (unsub) {
          unsub();
          this.activeSubscriptions.delete(topic);
        }
      },
    };
  }

  private setState(newState: ConnectionState, error?: Error): void {
    if (this.state === newState) return;
    this.state = newState;
    if (this.config.debug) {
      console.log(`[RealtimeClient] State changed: ${newState}`, error || '');
    }
    this.stateListeners.forEach(fn => fn(newState, error));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.state === 'CLOSED') return;

    const delay = this.retryPolicy.getNextDelay();
    if (delay === null) {
      this.setState('ERROR', new Error('Max reconnect attempts exceeded'));
      return;
    }

    this.setState('RECONNECTING');
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.config.adapter.connect();
        this.setState('CONNECTED');
        this.retryPolicy.reset();
      } catch (err: any) {
        this.setState('ERROR', err);
        this.scheduleReconnect();
      }
    }, delay);
  }
}
