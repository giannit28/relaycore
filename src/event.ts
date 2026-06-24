export interface EventMessage<TPayload = unknown> {
  id: string;
  topic: string;
  payload: TPayload;
  createdAt: Date;
}
