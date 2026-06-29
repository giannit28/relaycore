import { describe, expect, it, vi } from "vitest";
import { Broker } from "../src/broker.js";
import type { Subscriber } from "../src/subscriber.js";

describe("Broker", () => {
  it("delivers messages only to matching subscribers", async () => {
    const broker = new Broker();

    const orderHandler = vi.fn().mockResolvedValue(undefined);
    const userHandler = vi.fn().mockResolvedValue(undefined);

    broker.subscribe({
      name: "OrderSubscriber",
      topics: ["order.created"],
      handleMessage: orderHandler,
    });

    broker.subscribe({
      name: "UserSubscriber",
      topics: ["user.created"],
      handleMessage: userHandler,
    });

    const result = await broker.publish("order.created", { order: 123 });

    expect(orderHandler).toHaveBeenCalledTimes(1);
    expect(userHandler).not.toHaveBeenCalled();

    expect(result.acknowledged).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.deadLettered).toBe(0);
  });

  it("delivers to multiple subscribers for the same topic", async () => {
    const broker = new Broker();

    const firstHandler = vi.fn().mockResolvedValue(undefined);
    const secondHandler = vi.fn().mockResolvedValue(undefined);

    broker.subscribe({
      name: "FirstSubscriber",
      topics: ["order.created"],
      handleMessage: firstHandler,
    });

    broker.subscribe({
      name: "SecondSubscriber",
      topics: ["order.created"],
      handleMessage: secondHandler,
    });

    const result = await broker.publish("order.created", { order: 123 });

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);

    expect(result.acknowledged).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("retries a failing subscriber until it succeeds", async () => {
    const broker = new Broker({ maxAttempts: 3, retryDelayMs: 0 });

    const handler = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce(undefined);

    broker.subscribe({
      name: "FlakySubscriber",
      topics: ["order.created"],
      handleMessage: handler,
    });

    const result = await broker.publish("order.created", { order: 123 });

    expect(handler).toHaveBeenCalledTimes(3);

    expect(result.acknowledged).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.deadLettered).toBe(0);

    expect(result.deliveries[0]?.status).toBe("acked");
    expect(result.deliveries[0]?.attempts).toBe(3);
    expect(result.deliveries[0]?.deadLettered).toBe(false);
  });

  it("dead-letters a subscriber after max attempts are exhausted", async () => {
    const broker = new Broker({ maxAttempts: 2, retryDelayMs: 0 });

    const handler = vi.fn().mockRejectedValue(new Error("Permanent failure"));

    broker.subscribe({
      name: "FailingSubscriber",
      topics: ["order.created"],
      handleMessage: handler,
    });

    const result = await broker.publish("order.created", { order: 123 });

    expect(handler).toHaveBeenCalledTimes(2);

    expect(result.acknowledged).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.deadLettered).toBe(1);

    expect(result.deliveries[0]?.status).toBe("nacked");
    expect(result.deliveries[0]?.attempts).toBe(2);
    expect(result.deliveries[0]?.deadLettered).toBe(true);

    expect(broker.getDeadLetters()).toHaveLength(1);
    expect(broker.getDeadLetters()[0]?.delivery.subscriberName).toBe(
      "FailingSubscriber",
    );
  });

  it("keeps successful and failed subscribers independent", async () => {
    const broker = new Broker({ maxAttempts: 2, retryDelayMs: 0 });

    const successHandler = vi.fn().mockResolvedValue(undefined);
    const failingHandler = vi.fn().mockRejectedValue(new Error("Failure"));

    broker.subscribe({
      name: "SuccessSubscriber",
      topics: ["order.created"],
      handleMessage: successHandler,
    });

    broker.subscribe({
      name: "FailingSubscriber",
      topics: ["order.created"],
      handleMessage: failingHandler,
    });

    const result = await broker.publish("order.created", { order: 123 });

    expect(successHandler).toHaveBeenCalledTimes(1);
    expect(failingHandler).toHaveBeenCalledTimes(2);

    expect(result.acknowledged).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.deadLettered).toBe(1);
  });
});
