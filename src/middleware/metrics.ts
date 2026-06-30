import { Middleware, MiddlewareContext } from "./middleware.js";

export class MetricsMiddleware implements Middleware {
  async execute(
    context: MiddlewareContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const start = performance.now();

    await next();

    const durationMs = performance.now() - start;

    console.log({
      topic: context.result?.topic,
      messageId: context.result?.messageId,
      durationMs: Number(durationMs.toFixed(2)),
    });
  }
}
