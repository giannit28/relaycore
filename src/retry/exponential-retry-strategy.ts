import { RetryStrategy } from "./retry-strategy.js";

export class ExponentialRetryStrategy implements RetryStrategy {
  getDelay(attempt: number, baseDelayMs: number): number {
    return baseDelayMs * 2 ** (attempt - 1);
  }
}
