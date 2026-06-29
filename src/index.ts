import { Broker } from "./broker.js";
import { EmailSubscriber } from "./subscribers/emailSubscriber.js";
import { FlakySubscriber } from "./subscribers/flakySubscriber.js";
import { OrderSubscriber } from "./subscribers/orderSubscriber.js";

const broker = new Broker({
  maxAttempts: 2,
  retryDelayMS: 1000,
});

broker.subscribe(new OrderSubscriber());
broker.subscribe(new EmailSubscriber());
broker.subscribe(new FlakySubscriber());

const results = await broker.publish("order.created", {
  order: 123,
});

console.dir(results, { depth: null });
