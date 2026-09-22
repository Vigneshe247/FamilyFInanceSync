/* =========================================================
   GENERIC REALTIME ADAPTER — SUPABASE WEBSOCKET
   Adapts Supabase Broadcast / Postgres Changes to generic RealtimeTransportAdapter.
   ========================================================= */

import { RealtimeTransportAdapter, RealtimeEvent, ConnectionState } from '../core/types';
import { supabase } from '../../../services/supabase';

export class SupabaseRealtimeAdapter implements RealtimeTransportAdapter {
  name = 'SupabaseRealtimeAdapter';
  private channels = new Map<string, any>();
  private stateListeners = new Set<(state: ConnectionState, error?: Error) => void>();

  async connect(): Promise<void> {
    // Supabase handles underlying socket connection automatically
    this.notifyState('CONNECTED');
  }

  async disconnect(): Promise<void> {
    this.channels.forEach(ch => {
      supabase.removeChannel(ch);
    });
    this.channels.clear();
    this.notifyState('DISCONNECTED');
  }

  async publish<T>(topic: string, event: RealtimeEvent<T>): Promise<void> {
    let ch = this.channels.get(topic);
    if (!ch) {
      ch = supabase.channel(topic);
      ch.subscribe();
      this.channels.set(topic, ch);
    }

    await ch.send({
      type: 'broadcast',
      event: event.type,
      payload: event,
    });
  }

  subscribeTopic(topic: string, onEvent: (event: RealtimeEvent) => void): () => void {
    let ch = this.channels.get(topic);
    if (!ch) {
      ch = supabase.channel(topic);
      this.channels.set(topic, ch);
    }

    ch.on('broadcast', { event: '*' }, (payload: any) => {
      if (payload.payload) {
        onEvent(payload.payload as RealtimeEvent);
      }
    });

    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        this.notifyState('CONNECTED');
      } else if (status === 'CHANNEL_ERROR') {
        this.notifyState('ERROR', new Error(`Subscription failed on ${topic}`));
      } else if (status === 'TIMED_OUT') {
        this.notifyState('RECONNECTING');
      }
    });

    return () => {
      supabase.removeChannel(ch);
      this.channels.delete(topic);
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
