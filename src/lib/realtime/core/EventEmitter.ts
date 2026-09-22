/* =========================================================
   GENERIC REALTIME CORE — TYPED EVENT EMITTER
   ========================================================= */

import { RealtimeEvent, EventHandler } from './types';

export class TypedEventEmitter {
  private handlers = new Map<string, Set<EventHandler<any>>>();

  on<T>(eventPattern: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventPattern)) {
      this.handlers.set(eventPattern, new Set());
    }
    const set = this.handlers.get(eventPattern)!;
    set.add(handler as EventHandler<any>);

    return () => {
      set.delete(handler as EventHandler<any>);
      if (set.size === 0) {
        this.handlers.delete(eventPattern);
      }
    };
  }

  emit<T>(event: RealtimeEvent<T>): void {
    // Exact match
    const exact = this.handlers.get(event.type);
    if (exact) {
      exact.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventEmitter] Handler error on ${event.type}:`, err);
        }
      });
    }

    // Wildcard match e.g. "transaction.*" or "*"
    this.handlers.forEach((set, pattern) => {
      if (pattern !== event.type) {
        if (pattern === '*' || (pattern.endsWith('.*') && event.type.startsWith(pattern.slice(0, -2)))) {
          set.forEach(handler => {
            try {
              handler(event);
            } catch (err) {
              console.error(`[EventEmitter] Wildcard handler error on ${pattern}:`, err);
            }
          });
        }
      }
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}
