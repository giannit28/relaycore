import { randomUUID } from "crypto";
import { EventMessage } from "./event.js";
import { Subscriber } from "./subscriber.js";
import {
  createDeliveryKey,
  createDeliveryRecord,
  type DeliveryRecord,
} from "./delivery.js";

export class Broker {
  private subscribers: Subscriber[] = [];
  private deliveries = new Map<string, DeliveryRecord>();

  subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }

  async publish<TPayload>(topic: string, payload: TPayload): Promise<void> {
    const evtMsg: EventMessage<TPayload> = {
      id: randomUUID(),
      topic,
      payload,
      createdAt: new Date(),
    };

    const matchingSubscribers = this.subscribers.filter((subscriber) =>
      subscriber.topics.includes(topic),
    );

    const deliveries = matchingSubscribers.map((subscriber) => {
      const record = createDeliveryRecord(evtMsg.id, subscriber.name, topic);

      this.deliveries.set(
        createDeliveryKey(evtMsg.id, subscriber.name),
        record,
      );

      return {
        subscriber,
        promise: subscriber.handleMessage(evtMsg),
      };
    });

    const results = await Promise.allSettled(
      deliveries.map((delivery) => delivery.promise),
    );

    results.forEach((result, index) => {
      const delivery = deliveries[index];

      if (!delivery) return; // Guarding against undefined

      const key = createDeliveryKey(evtMsg.id, delivery.subscriber.name);

      const record = this.deliveries.get(key);
      if (record) {
        if (result.status === "fulfilled") {
          record.status = "acked";
        } else {
          record.status = "nacked";
          record.error = result.reason;
        }
      }
    });

    console.log(Array.from(this.deliveries));
  }

  getDeliveryRecords(): DeliveryRecord[] {
    return Array.from(this.deliveries.values());
  }

  getFailedDeliveries(): DeliveryRecord[] {
    return this.getDeliveryRecords().filter(
      (record) => record.status === "nacked",
    );
  }
}
