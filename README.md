# RelayCore

A configurable TypeScript Pub-Sub engine built for modern event-driven applications.

## Features

- Topic-based publish/subscribe
- Multiple subscribers per topic
- ACK/NACK support
- Retry policies
- Dead Letter Queue (DLQ)
- In-memory adapter
- Extensible adapter architecture
- Type-safe events

## Roadmap

- [ ] In-memory broker
- [ ] Topic routing
- [ ] ACK/NACK tracking
- [ ] Retry engine
- [ ] Dead Letter Queue
- [ ] Redis adapter
- [ ] Kafka adapter
- [ ] Event replay
- [ ] Metrics & observability

## Example

```ts
await broker.publish("order.created", {
  orderId: "ORD-123",
});
```

## License

MIT
