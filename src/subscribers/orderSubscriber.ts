import { EventMessage } from "../event.js";
import { Subscriber } from "../subscriber.js";

export class OrderSubscriber implements Subscriber<{ order: number }> {
  name = "Order-subscriber";

  topics = ["order.created"];

  async handleMessage(message: EventMessage<{ order: number }>): Promise<void> {
    console.log({
      name: this.name,
      Topics: message.topic,
      Payload: message.payload,
    });
  }
}
