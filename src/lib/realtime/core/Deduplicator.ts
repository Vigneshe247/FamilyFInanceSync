/* =========================================================
   GENERIC REALTIME CORE — DEDUPLICATOR
   Guarantees idempotency and prevents duplicate event application.
   ========================================================= */

export class EventDeduplicator {
  private seenEvents = new Map<string, number>();
  private windowMs: number;

  constructor(windowMs = 60000) {
    this.windowMs = windowMs;
  }

  isDuplicate(eventId: string): boolean {
    if (!eventId) return false;
    this.cleanup();

    if (this.seenEvents.has(eventId)) {
      return true;
    }

    this.seenEvents.set(eventId, Date.now());
    return false;
  }

  private cleanup(): void {
    const threshold = Date.now() - this.windowMs;
    this.seenEvents.forEach((timestamp, id) => {
      if (timestamp < threshold) {
        this.seenEvents.delete(id);
      }
    });
  }

  clear(): void {
    this.seenEvents.clear();
  }
}
