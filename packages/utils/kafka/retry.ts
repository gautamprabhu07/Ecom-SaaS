//Path: packages/utils/kafka/retry.ts
//bounded retry with exponential backoff. Kept free of Kafka imports so it can be unit tested on its own.

export interface RetryOptions {
  //how many times to retry after the first attempt fails (3 retries = at most 4 attempts)
  retries?: number;
  //delay before the first retry; every further retry doubles it (200ms, 400ms, 800ms)
  baseDelayMs?: number;
  //called before each retry, e.g. to log it
  onRetry?: (error: unknown, retryNumber: number, delayMs: number) => void;
  //injectable so tests don't have to wait
  sleep?: (ms: number) => Promise<void>;
}

export class RetriesExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: unknown,
  ) {
    super(`gave up after ${attempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    this.name = "RetriesExhaustedError";
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

//runs `task`; if it throws, waits and tries again, up to `retries` times. Throws RetriesExhaustedError at the end.
export async function withRetry<T>(task: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseDelayMs = 200, onRetry, sleep = defaultSleep } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = baseDelayMs * 2 ** attempt;
      onRetry?.(error, attempt + 1, delay);
      await sleep(delay);
    }
  }
  throw new RetriesExhaustedError(retries + 1, lastError);
}
