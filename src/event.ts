// export type EventMessage<
//   TEvents extends Record<string, unknown>,
//   TTopic extends keyof TEvents,
// > = {
//   id: string;
//   topic: TTopic;
//   payload: TEvents[TTopic];
//   createdAt: Date;
// };

export type EventMessage<TPayload = unknown> = {
  id: string;
  topic: string;
  payload: TPayload;
  createdAt: Date;
};
