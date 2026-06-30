import { DeliveryRecord } from "./delivery.js";

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
