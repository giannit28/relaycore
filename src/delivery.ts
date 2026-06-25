export type DeliveryStatus = "pending" | "acked" | "nacked";

export type DeliveryRecord = {
  messageId: string;
  subscriberName: string;
  topic: string;
  status: DeliveryStatus;
  attempts: number;
  error?: unknown;
};

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
    attempts: 1,
  };
}

export function createDeliveryKey(
  messageId: string,
  subscriberName: string,
): string {
  return `${messageId}:${subscriberName}`;
}
