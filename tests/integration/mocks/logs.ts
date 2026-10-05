//The real sendLog publishes to Kafka; integration tests must not.
export const sendLog = async (_entry?: unknown) => undefined;
