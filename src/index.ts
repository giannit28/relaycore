import { Broker } from "./broker.js";
import { EmailSubscriber } from "./subscribers/emailSubscriber.js";
import { OrderSubscriber } from "./subscribers/orderSubscriber.js";

const b = new Broker();

b.subscribe(new OrderSubscriber());
b.subscribe(new EmailSubscriber());

b.publish("order.created", { order: 123 });
