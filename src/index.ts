import { Broker } from "./core/broker.js";
import { Logger } from "./middleware/logger.js";
import { MetricsMiddleware } from "./middleware/metrics.js";
import { RequiredPayloadMiddleware } from "./middleware/required-payload.js";
import { EmailSubscriber } from "./subscribers/emailSubscriber.js";
import { FlakySubscriber } from "./subscribers/flakySubscriber.js";
import { OrderSubscriber } from "./subscribers/orderSubscriber.js";

const broker = new Broker({
  maxAttempts: 2,
  retryDelayMs: 0,
  retryStrategy: "exponential",
});

broker.use(new Logger());
broker.use(new MetricsMiddleware());
broker.use(new RequiredPayloadMiddleware());

broker.subscribe(new OrderSubscriber());
broker.subscribe(new EmailSubscriber());
broker.subscribe(new FlakySubscriber());

// await broker.publish("order.created", {
//   order: 123,
// });

await broker.publish("order.created", null);
