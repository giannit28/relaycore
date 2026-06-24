import { Subscriber } from "./subscriber.js";

export class Broker {
  private subscribers: Subscriber[] = [];

  subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }
}
