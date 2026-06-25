import { describe, expect, it, vi } from "vitest";
import { Broker } from "../src/broker.js";
import { Subscriber } from "../src/subscriber.js";

describe("Broker", () => {
  it("delivers messages only to matching subscribers", async () => {
    const broker = new Broker();

    const orderHandler = vi.fn();
    const userHandler = vi.fn();

    const orderSubscriber: Subscriber = {
      name: "OrderSubscriber",
      topics: ["order.created"],
      handleMessage: orderHandler,
    };

    const userSubscriber: Subscriber = {
      name: "UserSubscriber",
      topics: ["user.created"],
      handleMessage: userHandler,
    };

    broker.subscribe(orderSubscriber);
    broker.subscribe(userSubscriber);

    await broker.publish("order.created", { order: 123 });

    expect(orderHandler).toHaveBeenCalledTimes(1);
    expect(userHandler).not.toHaveBeenCalled();
  });
});
