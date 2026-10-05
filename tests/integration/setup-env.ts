//Per-worker environment for the integration tests (runs before each test file).
process.env.ACCESS_TOKEN_SECRET = 'integration-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'integration-refresh-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_integration';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_integration';

if (!/\/eshop_test(\?|$)/.test(process.env.DATABASE_URL ?? '')) {
  throw new Error('Integration tests must run against the eshop_test database (see tests/integration/global-setup.ts).');
}
