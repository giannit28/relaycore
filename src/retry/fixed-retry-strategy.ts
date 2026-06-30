import { RetryStrategy } from "./retry-strategy.js";

export class FixedRetryStrategy implements RetryStrategy {
  getDelay(attempt: number, baseDelayMs: number): number {
    return baseDelayMs;
  }
}
