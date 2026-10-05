//Unit tests: no network, no database. Run with `npm run test:unit` (add `-- --coverage` or use `npm run test:coverage`).
//Specs live in tests/unit (and tools/tests) rather than next to the code because every service tsconfig type-checks packages/**.
const swc = [
  '@swc/jest',
  {
    swcrc: false,
    jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
    module: { type: 'commonjs' },
  },
];

module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit', '<rootDir>/tools/tests'],
  testMatch: ['**/*.spec.ts'],
  transform: { '^.+\\.ts$': swc },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    '^packages/(.*)$': '<rootDir>/packages/$1',
  },
  //the business logic that is worth measuring; UI code, route wiring and infrastructure glue are deliberately left out
  collectCoverageFrom: [
    'apps/reccomendation-service/src/services/reccomendationService.ts',
    'apps/auth-service/src/utils/auth.helper.ts',
    'apps/order-service/src/utils/pricing.ts',
    'apps/order-service/src/controllers/notification.controller.ts',
    'apps/product-service/src/controllers/review.controller.ts',
    'apps/kafka-service/src/services/analytics.services.ts',
    'packages/middleware/*.ts',
    'packages/error-handler/*.ts',
    'packages/libs/analytics/{transform,handlers}.ts',
    'packages/utils/kafka/{retry,dlq,shutdown}.ts',
    'packages/types/categories.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
};
