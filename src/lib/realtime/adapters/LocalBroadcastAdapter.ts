/* =========================================================
   GENERIC REALTIME ADAPTER — LOCAL BROADCAST (Cross-Tab / Demo)
   Enables multi-tab synchronization and simulated server events.
   ========================================================= */

import { RealtimeTransportAdapter, RealtimeEvent, ConnectionState } from '../core/types';

export class LocalBroadcastAdapter implements RealtimeTransportAdapter {
  name = 'LocalBroadcastAdapter';
  private channelName: string;
  private channel: BroadcastChannel | null = null;
  private stateListeners = new Set<(state: ConnectionState, error?: Error) => void>();
  private topicHandlers = new Map<string, Set<(event: RealtimeEvent) => void>>();

  constructor(channelName = 'family_finance_realtime') {
    this.channelName = channelName;
  }

  async connect(): Promise<void> {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (msg: MessageEvent) => {
        const event = msg.data as RealtimeEvent;
        if (event && event.topic) {
          const handlers = this.topicHandlers.get(event.topic);
          if (handlers) {
            handlers.forEach(h => h(event));
          }
        }
      };
    }
    this.notifyState('CONNECTED');
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.notifyState('DISCONNECTED');
  }

  async publish<T>(topic: string, event: RealtimeEvent<T>): Promise<void> {
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  subscribeTopic(topic: string, onEvent: (event: RealtimeEvent) => void): () => void {
    if (!this.topicHandlers.has(topic)) {
      this.topicHandlers.set(topic, new Set());
    }
    const set = this.topicHandlers.get(topic)!;
    set.add(onEvent);

    return () => {
      set.delete(onEvent);
      if (set.size === 0) {
        this.topicHandlers.delete(topic);
      }
    };
  }

  onConnectionChange(callback: (state: ConnectionState, error?: Error) => void): () => void {
    this.stateListeners.add(callback);
    callback('CONNECTED');
    return () => this.stateListeners.delete(callback);
  }

  private notifyState(state: ConnectionState, error?: Error): void {
    this.stateListeners.forEach(fn => fn(state, error));
  }
}
