export interface RetryStrategy {
  getDelay(attempt: number, baseDelayMs: number): number;
}
