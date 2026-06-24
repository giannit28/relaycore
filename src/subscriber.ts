import { EventMessage } from "./event.js";

export interface Subscriber {
  name: string;

  topics: string[];

  handleMessage(message: EventMessage): Promise<void>;
}
