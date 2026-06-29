import { Subscriber } from "../subscriber.js";

export class FlakySubscriber implements Subscriber {
  name = "FlakySubscriber";
  topics = ["order.created"];

  private failures = 0;

  async handleMessage(): Promise<void> {
    this.failures++;

    if (this.failures < 3) {
      throw new Error("Temporary failure");
    }

    console.log("Processed successfully");
  }
}
