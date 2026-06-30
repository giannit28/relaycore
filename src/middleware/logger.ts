import { MiddlewareContext, Middleware } from "./middleware.js";

export class Logger implements Middleware {
  async execute(
    ctx: MiddlewareContext,
    next: () => Promise<void>,
  ): Promise<void> {
    console.log("Before publish:", ctx.message.topic);

    try {
      await next();
    } finally {
      console.log("After publish:", ctx.result);
    }
  }
}
