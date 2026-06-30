export type PubSubErrorSource =
  | "pubsub"
  | "middleware"
  | "subscriber"
  | "broker"
  | "retry";

export class PubSubError extends Error {
  constructor(
    message: string,
    public readonly source: PubSubErrorSource = "pubsub",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PubSubError";
  }
}
