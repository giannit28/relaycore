import { PubSubError } from "./pubsub-error.js";

export class MiddlewareError extends PubSubError {
  constructor(
    message: string,
    public readonly middlewareName: string,
    public readonly topic: string,
    public readonly messageId: string,
    cause?: unknown,
  ) {
    super(message, "middleware", cause);
    this.name = "MiddlewareError";
  }
}
