import { randomUUID } from "crypto";
import { EventMessage } from "./event.js";
import { Subscriber } from "./subscriber.js";
import {
  createDeliveryKey,
  createDeliveryRecord,
  createPublishResult,
  PublishResult,
  type DeliveryRecord,
} from "./delivery.js";
import { DeadLetterEntry } from "./dlq.js";
import { sleep } from "./utils/utils.js";

type RetryStrategy = "fixed" | "linear" | "exponential";
type BrokerConfig = {
  maxAttempts: number;
  retryDelayMs: number;
  retryStrategy: RetryStrategy;
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

  constructor(config: Partial<BrokerConfig> = {}) {
    const mergedConfig: BrokerConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.maxAttempts = mergedConfig.maxAttempts;
    this.retryDelayMs = mergedConfig.retryDelayMs;
    this.retryStrategy = mergedConfig.retryStrategy;
  }

  subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }

  async publish<TPayload>(
    topic: string,
    payload: TPayload,
  ): Promise<PublishResult> {
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
        promise: this.deliverToSubscriber(subscriber, evtMsg, record),
      };
    });

    await Promise.allSettled(deliveries.map((delivery) => delivery.promise));

    const relatedDeliveries = this.getDeliveryRecords().filter(
      (record) => record.messageId === evtMsg.id,
    );

    return createPublishResult(evtMsg.id, topic, relatedDeliveries);
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
      record.error = error;

      if (record.attempts < this.maxAttempts) {
        record.attempts++;
        record.status = "pending";

        await sleep(this.getRetryDelay(record.attempts));

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

  private getRetryDelay(attempt: number): number {
    const strategy = {
      fixed: () => this.retryDelayMs,
      linear: () => this.retryDelayMs * attempt,
      exponential: () => this.retryDelayMs * 2 ** (attempt - 1),
    };

    return strategy[this.retryStrategy]();
  }
}
