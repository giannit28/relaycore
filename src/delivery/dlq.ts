import { EventMessage } from "../core/event.js";
import { DeliveryRecord } from "./delivery.js";

export type DeadLetterEntry = {
  message: EventMessage;
  delivery: DeliveryRecord;
  failedAt: Date;
};
