//Path: tools/bench/bench-db.ts
//Shared by the benchmark scripts. They NEVER touch the real database: they run against a throwaway database called
//"bench" on the same Atlas cluster (the connection string with its database name swapped), and refuse to run otherwise.
import "dotenv/config";

export const BENCH_DB = "bench";

export const benchUrl = (): string => {
  const base = process.env.BENCH_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set.");
  //mongodb+srv://user:pass@host/<db>?options  ->  swap <db>
  const url = base.replace(/(mongodb(?:\+srv)?:\/\/[^/]+\/)([^?]*)/, `$1${BENCH_DB}`);
  if (!new RegExp(`/${BENCH_DB}(\\?|$)`).test(url)) throw new Error("Could not derive the bench database URL.");
  return url;
};

//must run before the prisma client is imported
export const useBenchDatabase = () => {
  process.env.DATABASE_URL = benchUrl();
};
