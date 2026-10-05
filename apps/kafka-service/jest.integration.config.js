//integration tests for the users-events pipeline: they talk to the REAL Confluent Cloud cluster, MongoDB and Redis
//from the root .env, and skip themselves cleanly when those credentials are missing.
//Named jest.integration.config.js (not jest.config.*) so Nx's default test target doesn't pick it up automatically.
//run with: npm run test:integration:kafka
module.exports = {
  displayName: 'kafka-service-integration',
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/integration/**/*.spec.ts'],
  setupFiles: ['dotenv/config'],
  moduleNameMapper: { '^@packages/(.*)$': '<rootDir>/../../packages/$1' },
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 120000,
  transform: {
    '^.+\.ts$': [
      '@swc/jest',
      { swcrc: false, jsc: { parser: { syntax: 'typescript' }, target: 'es2022' }, module: { type: 'commonjs' } },
    ],
  },
};
