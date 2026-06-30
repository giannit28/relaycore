import { randomUUID } from "crypto";
import { EventMessage } from "./event.js";
import { Subscriber } from "./subscriber.js";
import {
  createDeliveryKey,
  createDeliveryRecord,
  type DeliveryRecord,
} from "../delivery/delivery.js";
import { DeadLetterEntry } from "../delivery/dlq.js";
import { sleep } from "../utils/utils.js";
import { RetryStrategy } from "../retry/retry-strategy.js";
import {
  createRetryStrategy,
  RetryStrategyType,
} from "../retry/retry-strategy-factory.js";
import { MiddlewarePipeline } from "../middleware/middleware-pipeline.js";
import { Middleware, MiddlewareContext } from "../middleware/middleware.js";
import {
  createPublishResult,
  PublishResult,
} from "../delivery/publish-result.js";
import { SubscriberError } from "../errors/subscriber-error.js";

type BrokerConfig = {
  maxAttempts: number;
  retryDelayMs: number;
  retryStrategy: RetryStrategyType;
};

const DEFAULT_CONFIG: BrokerConfig = {
  maxAttempts: 3,
  retryDelayMs: 1000,
  retryStrategy: "fixed",
};

export class Broker {
  private subscribers: Subscriber[] = [];
  private deliveries = new Map<string, DeliveryRecord>();
  private deadLetters: DeadLetterEntry[] = [];
  private readonly maxAttempts: number;
  private readonly retryDelayMs: number;
  private readonly retryStrategy: RetryStrategy;
  private readonly pipeline = new MiddlewarePipeline();

  constructor(config: Partial<BrokerConfig> = {}) {
    const mergedConfig: BrokerConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.maxAttempts = mergedConfig.maxAttempts;
    this.retryDelayMs = mergedConfig.retryDelayMs;
    this.retryStrategy = createRetryStrategy(mergedConfig.retryStrategy);
  }

  subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }

  async publish<TPayload>(
    topic: string,
    payload: TPayload,
  ): Promise<PublishResult> {
    const evtMsg = this.createEventMessage<TPayload>(topic, payload);

    const middlewareCtx: MiddlewareContext<TPayload> = {
      message: evtMsg,
    };

    await this.pipeline.execute(middlewareCtx, async () => {
      const matchingSubscribers = this.getMatchingSubscribers(topic);

      const deliveries = this.createDeliveries(matchingSubscribers, evtMsg);

      await Promise.allSettled(deliveries.map((delivery) => delivery.promise));

      const relatedDeliveryRecords = this.getRelatedDeliveriesRecords(
        evtMsg.id,
      );

      middlewareCtx.result = createPublishResult(
        evtMsg.id,
        topic,
        relatedDeliveryRecords,
      );
    });

    if (!middlewareCtx.result) {
      throw new Error("Publish failed: result was not created");
    }

    return middlewareCtx.result;
  }

  getDeliveryRecords(): DeliveryRecord[] {
    return Array.from(this.deliveries.values());
  }

  getFailedDeliveries(): DeliveryRecord[] {
    return this.getDeliveryRecords().filter(
      (record) => record.status === "nacked",
    );
  }

  getDeadLetters(): DeadLetterEntry[] {
    return [...this.deadLetters];
  }

  use(middleware: Middleware): void {
    this.pipeline.use(middleware);
  }

  private createEventMessage<TPayload>(
    topic: string,
    payload: TPayload,
  ): EventMessage<TPayload> {
    return {
      id: randomUUID(),
      topic,
      payload,
      createdAt: new Date(),
    };
  }

  private getMatchingSubscribers(topic: string): Subscriber[] {
    return this.subscribers.filter((subscriber) =>
      subscriber.topics.includes(topic),
    );
  }

  private getRelatedDeliveriesRecords(id: string): DeliveryRecord[] {
    return this.getDeliveryRecords().filter(
      (record) => record.messageId === id,
    );
  }

  private createDeliveries<TPayload>(
    matchingSubscribers: Subscriber[],
    evtMsg: EventMessage<TPayload>,
  ) {
    const { id, topic } = evtMsg;
    const deliveries = matchingSubscribers.map((subscriber) => {
      const record = createDeliveryRecord(id, subscriber.name, topic);

      this.deliveries.set(createDeliveryKey(id, subscriber.name), record);

      return {
        subscriber,
        promise: this.deliverToSubscriber(subscriber, evtMsg, record),
      };
    });

    return deliveries;
  }

  private async deliverToSubscriber(
    subscriber: Subscriber,
    message: EventMessage,
    record: DeliveryRecord,
  ): Promise<void> {
    try {
      await subscriber.handleMessage(message);

      record.status = "acked";
      record.error = undefined;
    } catch (error) {
      const subscriberError =
        error instanceof SubscriberError
          ? error
          : new SubscriberError(
              "Subscriber execution failed",
              subscriber.name,
              message.topic,
              message.id,
              record.attempts,
              error,
            );

      record.error = subscriberError;

      if (record.attempts < this.maxAttempts) {
        record.attempts++;
        record.status = "pending";

        await sleep(
          this.retryStrategy.getDelay(record.attempts, this.retryDelayMs),
        );

        return this.deliverToSubscriber(subscriber, message, record);
      }

      record.status = "nacked";
      record.deadLettered = true;

      this.deadLetters.push({
        message,
        delivery: record,
        failedAt: new Date(),
      });
    }
  }
}
