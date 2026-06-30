import type { Middleware, MiddlewareContext } from "./middleware.js";
import { MiddlewareError } from "../errors/middleware-error.js";

export class MiddlewarePipeline<TPayload = unknown> {
  private middlewares: Middleware<TPayload>[] = [];

  use(middleware: Middleware<TPayload>): void {
    this.middlewares.push(middleware);
  }

  async execute(
    context: MiddlewareContext<TPayload>,
    finalHandler: () => Promise<void>,
  ): Promise<void> {
    let index = -1;

    const dispatch = async (currentIndex: number): Promise<void> => {
      if (currentIndex <= index) {
        throw new Error("next() called multiple times");
      }

      index = currentIndex;

      const middleware = this.middlewares[currentIndex];

      if (!middleware) {
        await finalHandler();
        return;
      }

      try {
        await middleware.execute(context, () => dispatch(currentIndex + 1));
      } catch (error) {
        if (error instanceof MiddlewareError) {
          throw error;
        }

        throw new MiddlewareError(
          "Middleware execution failed",
          middleware.constructor.name,
          context.message.topic,
          context.message.id,
          error,
        );
      }
    };

    await dispatch(0);
  }
}
