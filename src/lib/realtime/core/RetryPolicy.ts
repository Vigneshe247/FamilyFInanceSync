/* =========================================================
   GENERIC REALTIME CORE — EXPONENTIAL BACKOFF RETRY POLICY
   Prevents reconnect thundering herds and infinite rapid loops.
   ========================================================= */

export class RetryPolicy {
  private attempt = 0;
  private maxAttempts: number;
  private initialBackoffMs: number;
  private maxBackoffMs: number;

  constructor(maxAttempts = 10, initialBackoffMs = 1000, maxBackoffMs = 30000) {
    this.maxAttempts = maxAttempts;
    this.initialBackoffMs = initialBackoffMs;
    this.maxBackoffMs = maxBackoffMs;
  }

  getNextDelay(): number | null {
    if (this.attempt >= this.maxAttempts) {
      return null;
    }

    // Exponential backoff: initial * 2^attempt with ±20% jitter
    const base = Math.min(this.maxBackoffMs, this.initialBackoffMs * Math.pow(2, this.attempt));
    const jitter = base * 0.2 * (Math.random() * 2 - 1);
    const delay = Math.max(100, Math.round(base + jitter));

    this.attempt++;
    return delay;
  }

  reset(): void {
    this.attempt = 0;
  }

  get currentAttempt(): number {
    return this.attempt;
  }
}
