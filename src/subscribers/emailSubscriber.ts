import { EventMessage } from "../event.js";
import { Subscriber } from "../subscriber.js";

export class EmailSubscriber implements Subscriber {
  name = "Email-Subscriber";

  topics = ["order.created"];

  async handleMessage(message: EventMessage<unknown>): Promise<void> {
    console.log({
      name: this.name,
      Topics: message.topic,
      Payload: message.payload,
    });
  }
}
