//Runs once before the integration suite: points every service at a SEPARATE test database and makes sure its collections
//and indexes exist (prisma db push). Refuses to continue unless the database is literally called "eshop_test", so these
//tests can never wipe the development data.
import 'dotenv/config';
import { execSync } from 'child_process';

export const TEST_DB = 'eshop_test';

export const testDatabaseUrl = (): string => {
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) throw new Error('Set DATABASE_URL (or TEST_DATABASE_URL) to a MongoDB connection string.');
  //mongodb+srv://user:pass@host/<db>?options  ->  swap <db>
  const url = base.replace(/(mongodb(?:\+srv)?:\/\/[^/]+\/)([^?]*)/, `$1${TEST_DB}`);
  if (!new RegExp(`/${TEST_DB}(\\?|$)`).test(url)) throw new Error('Could not derive the test database URL.');
  return url;
};

export default async function globalSetup() {
  //set here so every jest worker inherits it before any Prisma client is created
  process.env.DATABASE_URL = testDatabaseUrl();
  if (!process.env.DATABASE_URL.includes(`/${TEST_DB}`)) throw new Error('Refusing to run integration tests against a non-test database.');
  execSync('npx prisma db push --skip-generate', { stdio: 'pipe', env: process.env });
}
