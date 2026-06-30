import { PubSubError } from "./pubsub-error.js";

export class SubscriberError extends PubSubError {
  constructor(
    message: string,
    public readonly subscriberName: string,
    public readonly topic: string,
    public readonly messageId: string,
    public readonly attempt: number,
    cause?: unknown,
  ) {
    super(message, "subscriber", cause);

    this.name = "SubscriberError";
  }
}
