import { ExponentialRetryStrategy } from "./exponential-retry-strategy.js";
import { FixedRetryStrategy } from "./fixed-retry-strategy.js";
import { LinearRetryStrategy } from "./linear-retry-strategy.js";
import type { RetryStrategy } from "./retry-strategy.js";

export type RetryStrategyType = "fixed" | "linear" | "exponential";

export function createRetryStrategy(type: RetryStrategyType): RetryStrategy {
  const strategies: Record<RetryStrategyType, () => RetryStrategy> = {
    fixed: () => new FixedRetryStrategy(),
    linear: () => new LinearRetryStrategy(),
    exponential: () => new ExponentialRetryStrategy(),
  };

  return strategies[type]();
}
