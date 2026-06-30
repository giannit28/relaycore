import { RetryStrategy } from "./retry-strategy.js";

export class LinearRetryStrategy implements RetryStrategy {
  getDelay(attempt: number, baseDelayMs: number): number {
    return baseDelayMs * attempt;
  }
}
