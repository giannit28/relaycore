import { Middleware, MiddlewareContext } from "./middleware.js";

export class RequiredPayloadMiddleware implements Middleware {
  async execute(
    context: MiddlewareContext,
    next: () => Promise<void>,
  ): Promise<void> {
    if (!context.message.payload) {
      throw new Error("Payload is required");
    }

    await next();
  }
}
