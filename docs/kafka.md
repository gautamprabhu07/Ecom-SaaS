# Kafka event pipeline

How events move through the platform, what delivery guarantee each stream gives, and what happens when something goes wrong. Everything here was verified against the real Confluent Cloud cluster, MongoDB and Redis (see [How it was verified](#how-it-was-verified)).

## Topology

| Topic | Partitions | Producer | Consumer service | Consumer group | Offsets committed | Dead-letter topic |
|---|---:|---|---|---|---|---|
| `users-events` | 6 | `user-ui` server action `sendKafkaEvent` | `kafka-service` | `user-events-group` | manually, after processing | `users-events.dlq` |
| `chat_new_message` | 6 | `chatting-service` WebSocket handler | `chatting-service` | `chatting-message-db-writer` | manually, after the database write | `chat_new_message.dlq` |
| `logs` | 6 | any service via `sendLog` | `logger-service` | `logger-events-group` | automatically | none (see below) |

Cluster: Confluent Cloud (`asia-south1`), SASL/SSL. The shared client lives in `packages/utils/kafka`.

**Message keys.** `users-events` is keyed by buyer id and `chat_new_message` by conversation id. Kafka only orders messages within a partition, so keying keeps one buyer's events (and one conversation's messages) in order. Before this was added, an `add_to_cart` followed by `remove_from_cart` could be processed in the wrong order.

## Delivery semantics: at-least-once

Every message is delivered **one or more times**, never silently zero times. A consumer only acknowledges (commits the offset of) a message after its effect has been safely stored, or after the message has been parked in a dead-letter queue. If the service dies before that, Kafka hands the message out again.

### Why at-least-once is the right trade-off here

- **At-most-once** (acknowledge first, process later) loses data whenever a service crashes with work in memory. That was the behavior before this hardening: both consumers buffered messages and returned immediately, so Kafka's auto-commit acknowledged them before they were written. A crash with a full buffer lost them for good.
- **Exactly-once** needs Kafka transactions plus a transactional write to the destination. That is a lot of machinery for per-user analytics counters and chat rows.
- **At-least-once plus idempotent processing** gives an effectively-once result for the price of one Redis lookup per event (analytics) or one unique index (chat). It is the standard choice for this kind of pipeline.

### The three problems the original code had

1. Offsets were committed before the work was done, so crashes lost events (see above).
2. The analytics functions caught and logged their own errors, so a failed database write silently dropped the event and nothing could retry or dead-letter it.
3. A redelivered chat message would make `createMany` fail on the table's unique index, and the buffer re-queued the whole batch and failed again forever, blocking every message behind it.

## Batching windows

| Stream | Window | Why |
|---|---|---|
| `users-events` | 3 s | Analytics counters tolerate a few seconds of delay, and one pass per window means fewer, larger database operations instead of one write per click. Worst-case extra latency before an event shows up is about 3 s plus processing time. |
| `chat_new_message` | 3 s | Chat messages are delivered to users live over WebSocket and echoed immediately. The database write is only for history, so it is batched into one `createMany`. |
| `logs` | 3 s | Log lines are pushed to dashboards in bursts so a chatty service does not flood the WebSocket with tiny frames. |

The three-second figure is a latency/efficiency trade-off, not a limit: lower it for fresher analytics, raise it for fewer writes.

## Analytics consumer (`kafka-service`)

For each message, in order:

1. Parse the JSON. Invalid JSON goes to the dead-letter queue (`invalid-json`).
2. If the event has an `eventId` that Redis already remembers, skip it as a duplicate.
3. Validate the action. An unknown action goes to the dead-letter queue (`invalid-action`).
4. Run the steps. A `shop_visit` has one step (shop analytics). Every other action has two (user analytics, then product analytics).
5. Each step is retried on its own: **up to 3 retries with exponential backoff, 200 ms, 400 ms, 800 ms** (4 attempts). Retrying steps separately means a failure in step 2 never re-runs step 1, which would write twice.
6. A step that still fails goes to the dead-letter queue with the failing step recorded.
7. Only after all steps succeed is the `eventId` remembered in Redis.

After the whole batch is handled, the highest offset per partition (plus one) is committed. Dead-lettered messages count as handled, so one bad event never blocks the ones behind it.

The shop-analytics write is a single database transaction (visitor row plus counters), so retrying it can never half-apply.

## Dead-letter queue

An event that cannot be processed is **parked, never dropped**.

**What goes there:** malformed JSON, an unknown action, a step that still fails after its retries, and (chat) a message the database refuses permanently, such as a malformed conversation id.

**Where it goes:**

1. **The Kafka topic `<topic>.dlq`** (`users-events.dlq`, `chat_new_message.dlq`). The record is a JSON envelope: `originalTopic`, `groupId`, the original `payload` exactly as received, the `error`, `failedStep`, `attempts`, `partition`, `offset` and `failedAt`.
2. **A MongoDB collection, `deadLetters`**, if the Kafka topic is missing, unreachable or slow. Same envelope plus `status: "unprocessed"`.
3. **A structured error log line** carrying the full payload, as a last resort if both of the above fail.

The Kafka attempt has a **5 second time limit**, and after a failure Kafka is skipped for a while (60 s if the topic does not exist, 10 s otherwise). Publishing to a missing topic makes the client retry for tens of seconds, and the consumer waits for the dead letter to be recorded, so without this a single bad message could stall every healthy message queued behind it.

> **One-time setup you must do by hand.** The Confluent cluster has topic auto-creation **off** and the API key is **not allowed to create topics**. Create two topics in the Confluent Cloud console: `users-events.dlq` and `chat_new_message.dlq` (1 partition each is plenty). Until they exist, dead letters are kept safely in MongoDB, so nothing is lost either way. `logs` has no dead-letter topic: its consumer only forwards lines to dashboards and has no processing that can fail.

**Looking at dead letters and replaying them:**

```js
// MongoDB shell
db.deadLetters.find({ status: "unprocessed" }).sort({ failedAt: -1 })
```

To replay one, fix the cause, then publish its `payload` string back to the original topic and mark the document processed. Because analytics events carry an `eventId`, replaying one that was in fact applied is harmless.

## Idempotency

The producer (`sendKafkaEvent`) stamps every event with a UUID `eventId` **once, before sending**. A producer retry or a redelivery therefore carries the same id. After an event is applied, the consumer stores `kafka:processed:<eventId>` in Redis with a **24 hour TTL**. A later copy finds the key and is skipped.

**Limits, deliberately:**

- **The memory lasts 24 hours.** A copy that arrives later than that is applied again. Kafka redelivery happens within seconds to minutes, so the window is generous, but it is a window.
- **The id is recorded after the work succeeds.** A crash in the instant between "analytics written" and "id recorded" can still apply that one event twice. Closing that gap needs the write and the record in one transaction.
- **Redis down means fail open.** The event is processed anyway. A rare double count in an analytics counter is better than a stalled pipeline.
- **Events without an `eventId`** (from older producers) are processed without this protection.
- **A step that failed permanently after an earlier step succeeded** leaves the event partly applied (the user's history was written, the product counter was not). The dead letter records which step failed.

For **chat**, idempotency comes from the database instead: `message` has a unique index on `(conversationId, senderId, content, createdAt)`. A redelivered copy is rejected by the index and treated as "already stored", and its unread-badge counter is not bumped a second time.

## Offsets, restarts and the first start

- **Manual commits.** Auto-commit is off for the two business-data consumers. Offsets are committed only after a batch is fully handled.
- **`fromBeginning: true`.** kafkajs applies this **only to a partition that has no committed offset yet**; partitions with commits always resume where they stopped. With manual commits it is the safe choice: otherwise events received before the first-ever commit on a partition are lost if the service crashes, because a restart would skip to "latest". (This was found by the crash test below, not by reading the code.) The consequence is that the **first start on a partition with no commit replays whatever is still retained there.** That is correct, since those messages were never acknowledged, and the duplicate checks above make an already-applied one harmless. The logger consumer keeps `fromBeginning: false`, because replaying old log lines onto a dashboard would be noise.
- **Crash recovery time.** After a hard crash, the dead consumer's session has to expire before its partitions are reassigned (the kafkajs default session timeout is 30 s), so recovery takes up to roughly a minute.

## Graceful shutdown

On `SIGTERM` or `SIGINT`, each service runs these steps in order, then exits 0 (or 1 if cleanup takes longer than 15 s):

- **`kafka-service`:** pause fetching, process and commit everything buffered, leave the consumer group, disconnect the shared producer, stop the health server.
- **`chatting-service`:** pause fetching, write the buffered messages and commit, leave the group, close the WebSocket server (clients reconnect on their own), disconnect the producer, stop the HTTP server.
- **`logger-service`:** deliver the queued log lines to connected dashboards, leave the group, close the sockets.

A failing step does not stop the others from running. On Windows only `SIGINT` (Ctrl+C) is delivered; `SIGTERM`, which Docker and Kubernetes send, works on Linux. Committing has to happen **before** leaving the group, because a consumer that has left can no longer commit.

## Health endpoints

| Service | Port | `GET /health` (liveness) | `GET /ready` (readiness) |
|---|---:|---|---|
| `kafka-service` | 6003 | 200 unless its consumer crashed (503); includes consumer counters | Kafka consumer group alive, MongoDB (`ping`), Redis (`PING`) |
| `chatting-service` | 6006 | same | Kafka consumer group alive, MongoDB, Redis |
| `logger-service` | 6008 | same | Kafka consumer group alive |

`/ready` returns 200 only if **every** check passes, otherwise 503 with the detail of each. A group with no active members counts as failed, which is how a consumer that is not running shows up. Each check has a 4 s timeout so a hung dependency cannot hang the endpoint.

## Client settings

The shared client sets `connectionTimeout` and `authenticationTimeout` to 10 s, `requestTimeout` to 30 s and 8 retries with backoff from 300 ms. kafkajs's default of **1 second** to complete a TCP + TLS + SASL handshake is often not enough to Confluent Cloud over an ordinary internet link, which produced `Connection timeout` and `socket disconnected before secure TLS connection was established` errors in every service sharing the client.

Producers are created once per process and reused (`getProducer`). `sendLog` previously connected and disconnected on every single log line.

## How it was verified

| Check | What it proves | How to run |
|---|---|---|
| 64 unit tests | Retry timing (200/400/800 ms), dead-letter envelope, fallback and circuit breaker, a hung publish falling back after 5 s, idempotency including the Redis-down fail-open, shutdown ordering and timeout, readiness reporting | `npm run test:tools` |
| 4 integration tests against the live cluster, MongoDB and Redis | The consumer keeps working after sitting idle through batch ticks (regression test); an event is applied once and a redelivered copy is ignored; a malformed message is dead-lettered, not dropped; stopping flushes the buffer and commits offsets | `npm run test:integration:kafka` |
| Hard-kill drill | 20 events produced to a partition that had never had a commit, service killed before its first flush, restarted: **all 20 applied, each exactly once**, and the group lag drained to 0 | manual (below) |
| Chat drill | Three messages stored; a byte-identical redelivery skipped and not counted twice in the unread badge; a message the database refuses and an unparseable one dead-lettered without blocking the valid ones | manual |

The integration test uses its own throwaway consumer group, so it never disturbs a running `kafka-service`, removes every row and Redis key it creates, and **skips itself cleanly** if `KAFKA_API_KEY`, `KAFKA_API_SECRET`, `DATABASE_URL` or `REDIS_DATABASE_URL` is not set.

**Reproducing the hard-kill drill by hand:** start `kafka-service`, wait until `GET http://localhost:6003/health` shows `running: true`, publish a few events (each with a unique `eventId`) and kill the process immediately with `kill -9` (or Task Manager on Windows) before 3 seconds pass. Restart it. After the old session expires, every event is applied once. Check `consumer.processed` on `/health`.

## Known limitations

- **Client-side loss.** `sendKafkaEvent` logs and swallows send errors, so if Kafka is unreachable when a buyer clicks, that one telemetry event is lost at the source. Recommendations and analytics tolerate this.
- **Logs are at-most-once.** The log stream is live telemetry, so its consumer keeps auto-commit and a restart may skip a few seconds of lines.
- **No schema registry.** Event shapes are validated only by the consumer's own checks.
- **Ordering is per buyer / per conversation**, not global.
- **The 24 hour dedupe window and the write-then-record gap** described under [Idempotency](#idempotency).
