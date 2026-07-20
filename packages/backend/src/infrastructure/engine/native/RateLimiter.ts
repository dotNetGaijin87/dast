/** Spaces sequential calls so they do not exceed `rps` requests per second. */
export class RateLimiter {
  private nextAt = 0;

  constructor(private readonly rps: number) {}

  async wait(): Promise<void> {
    if (this.rps <= 0) return;
    const interval = 1000 / this.rps;
    const now = Date.now();
    const at = Math.max(now, this.nextAt);
    this.nextAt = at + interval;
    const delay = at - now;
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
