//In-memory stand-in for the ioredis client, so integration tests never touch the real (shared, billed) Redis.
//Supports the calls the services make: get, set (with EX), setex, del, keys. Expiry is recorded but not enforced.
export const store = new Map<string, string>();
export const ttls = new Map<string, number>();

export const resetRedis = () => {
  store.clear();
  ttls.clear();
};

const redis = {
  async get(key: string) {
    return store.get(key) ?? null;
  },
  async set(key: string, value: unknown, _mode?: string, seconds?: number) {
    store.set(key, String(value));
    if (seconds) ttls.set(key, seconds);
    return 'OK';
  },
  async setex(key: string, seconds: number, value: unknown) {
    store.set(key, String(value));
    ttls.set(key, seconds);
    return 'OK';
  },
  async del(...keys: string[]) {
    let removed = 0;
    for (const key of keys) if (store.delete(key)) removed++;
    return removed;
  },
  async keys(pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return [...store.keys()].filter((key) => regex.test(key));
  },
};

export default redis;
