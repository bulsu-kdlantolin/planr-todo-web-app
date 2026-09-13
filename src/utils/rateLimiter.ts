/**
 * Client-Side Rate Limiter (Token Bucket Algorithm)
 * Protects PostgREST endpoints from burst request loops or client script floods.
 */

interface BucketOptions {
  maxTokens: number;
  refillRatePerSec: number;
}

class TokenBucketRateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRatePerSec: number;
  private lastRefillTimestamp: number;

  constructor(options: BucketOptions = { maxTokens: 30, refillRatePerSec: 5 }) {
    this.tokens = options.maxTokens;
    this.maxTokens = options.maxTokens;
    this.refillRatePerSec = options.refillRatePerSec;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSec > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSec * this.refillRatePerSec);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Tries to consume a token. Returns true if allowed, false if rate limited.
   */
  public tryAcquire(cost = 1): boolean {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  /**
   * Returns current token count.
   */
  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Resets tokens to full capacity.
   */
  public reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTimestamp = Date.now();
  }
}

// Global default limiter for client database writes (max 30 mutations, refills 5 per second)
export const databaseWriteLimiter = new TokenBucketRateLimiter({
  maxTokens: 30,
  refillRatePerSec: 5
});

// Stricter limiter for authentication operations (max 5 attempts, refills 0.5 per second)
export const authActionLimiter = new TokenBucketRateLimiter({
  maxTokens: 5,
  refillRatePerSec: 0.5
});
