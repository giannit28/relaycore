import { PublishResult } from "../delivery/publish-result.js";
import { EventMessage } from "../core/event.js";

export type MiddlewareContext<TPayload = unknown> = {
  message: EventMessage<TPayload>;
  result?: PublishResult;
};

// export type Middleware<TPayload = unknown> = (
//   context: MiddlewareContext<TPayload>,
//   next: () => Promise<void>,
// ) => Promise<void>;

export interface Middleware<TPayload = unknown> {
  execute(
    context: MiddlewareContext<TPayload>,
    next: () => Promise<void>,
  ): Promise<void>;
}
