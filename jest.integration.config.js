//Integration tests: real Express routers and controllers against a REAL MongoDB test database (eshop_test, created on the
//same cluster as DATABASE_URL and wiped between tests). Redis, e-mail, Kafka logging and Stripe are replaced with fakes.
//Run with `npm run test:integration` (needs DATABASE_URL in .env).
const swc = [
  '@swc/jest',
  {
    swcrc: false,
    jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
    module: { type: 'commonjs' },
  },
];

module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.spec.ts'],
  transform: { '^.+\\.ts$': swc },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@packages/libs/redis$': '<rootDir>/tests/integration/mocks/redis.ts',
    '^@packages/utils/logs(/index)?$': '<rootDir>/tests/integration/mocks/logs.ts',
    '(^|/)sendMail$': '<rootDir>/tests/integration/mocks/mail.ts',
    '(^|/)send-email$': '<rootDir>/tests/integration/mocks/mail.ts',
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    '^packages/(.*)$': '<rootDir>/packages/$1',
  },
  globalSetup: '<rootDir>/tests/integration/global-setup.ts',
  setupFiles: ['<rootDir>/tests/integration/setup-env.ts'],
  //one worker: every test file shares the one test database
  maxWorkers: 1,
  testTimeout: 60000,
  forceExit: true,
};
