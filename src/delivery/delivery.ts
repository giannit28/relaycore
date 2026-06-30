export type DeliveryStatus = "pending" | "acked" | "nacked";

export type DeliveryRecord = {
  messageId: string;
  subscriberName: string;
  topic: string;
  status: DeliveryStatus;
  deadLettered: boolean;
  attempts: number;
  error?: unknown;
};

export type PublishResult = {
  messageId: string;
  topic: string;
  deliveries: DeliveryRecord[];
  acknowledged: number;
  failed: number;
  deadLettered: number;
};

export function createPublishResult(
  id: string,
  topic: string,
  relatedDeliveries: DeliveryRecord[],
): PublishResult {
  return {
    messageId: id,
    topic,
    deliveries: relatedDeliveries,
    acknowledged: relatedDeliveries.filter(
      (record) => record.status === "acked",
    ).length,
    failed: relatedDeliveries.filter((record) => record.status === "nacked")
      .length,
    deadLettered: relatedDeliveries.filter((record) => record.deadLettered)
      .length,
  };
}

export function createDeliveryRecord(
  messageId: string,
  subscriberName: string,
  topic: string,
): DeliveryRecord {
  return {
    messageId,
    subscriberName,
    topic,
    status: "pending",
    deadLettered: false,
    attempts: 1,
  };
}

export function createDeliveryKey(
  messageId: string,
  subscriberName: string,
): string {
  return `${messageId}:${subscriberName}`;
}
