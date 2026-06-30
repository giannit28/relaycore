import { EventMessage } from "../core/event.js";
import { Subscriber } from "../core/subscriber.js";

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
