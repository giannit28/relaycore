import { EventMessage } from "./event.js";

// export interface Subscriber<
//   TEvents extends Record<string, unknown>,
//   TTopic extends keyof TEvents = keyof TEvents,
// > {
//   name: string;
//   topics: TTopic[];

//   handleMessage(message: EventMessage<TEvents, TTopic>): Promise<void>;
// }

export interface Subscriber<TPayload = unknown> {
  name: string;
  topics: string[];

  handleMessage(message: EventMessage<TPayload>): Promise<void>;
}
