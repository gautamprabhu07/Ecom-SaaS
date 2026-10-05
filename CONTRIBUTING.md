# Contributing

## Setup

```bash
npm ci
npx prisma generate     # the Prisma client is generated code
# create a .env in the repo root with DATABASE_URL, REDIS_DATABASE_URL and the other keys the README lists (never commit it)
```

## Running the tests

There are two suites. They are deliberately separate because they need different things.

| | Unit tests | Integration tests |
|---|---|---|
| Command | `npm run test:unit` | `npm run test:integration` |
| With coverage | `npm run test:coverage` | not collected |
| Needs a database | No | Yes, a MongoDB test database |
| Needs network | No | Yes (reaches your MongoDB cluster) |
| Speed | ~10 s | ~1 min |
| Runs in CI | Yes, on every push and pull request | No (see below) |
| Lives in | `tests/unit/` (and `tools/tests/`) | `tests/integration/` |

### Unit tests

Pure logic, with Prisma, Redis, Kafka and e-mail replaced by mocks: the recommender's scoring and decay, the OTP throttling, role and token middleware, order and coupon maths, product ownership rules, the Kafka analytics roll-up, reviews and notifications, and the dashboard aggregation helpers.

```bash
npm run test:unit                       # everything
npx jest --config jest.unit.config.js tests/unit/otp          # one file
npm run test:coverage                   # also writes coverage/ (open coverage/lcov-report/index.html)
npm run coverage:badge                  # refresh the README coverage badge from the last coverage run
```

The coverage figure covers the business-logic files listed under `collectCoverageFrom` in `jest.unit.config.js`. UI code, route wiring and infrastructure glue are deliberately not in it. Add a file to that list when you add logic worth measuring.

### Integration tests

Real Express routers and controllers, over real HTTP, against a **real MongoDB database**: sign-up, OTP, login and refresh for users, sellers and admins; product create, update and delete with ownership checks; checkout producing orders with correct totals and stock; review eligibility; notifications.

They use a **separate database called `eshop_test`**, created on the same cluster as your `DATABASE_URL` (the database name in the connection string is swapped). The global setup runs `prisma db push` against it, every test starts from empty collections, and the suite refuses to start if the database is not named `eshop_test`, so your development data is never touched. Set `TEST_DATABASE_URL` to use a different cluster.

Redis, e-mail, Kafka logging and Stripe are replaced with in-memory fakes (`tests/integration/mocks/`), so nothing is sent and no external service is billed.

```bash
npm run test:integration
npx jest --config jest.integration.config.js tests/integration/checkout   # one file
```

Integration tests are not run in CI: Prisma needs a MongoDB replica set for the nested writes these tests make, which a plain service container does not provide. Run them locally before opening a pull request that touches auth, products, orders, reviews or notifications.

### Writing tests

- Put new specs in `tests/unit/` or `tests/integration/`, not next to the source: every service `tsconfig` type-checks `packages/**`, so a spec placed there would be compiled into the build.
- Mock Prisma with `jest.mock('@packages/libs/prisma', ...)`. A factory may only reference variables whose names start with `mock`.
- Every bug fix should come with a test that fails without the fix.

## Before you push

```bash
npm run lint
npm run typecheck       # all services, then the three Next.js apps
npm run test:coverage
npm run build
```

CI runs exactly these, in this order, on every push to `main` and every pull request against it, and uploads the coverage report as a build artifact.

## Other scripts

| Command | What it does |
|---|---|
| `npm run seed` | Fills the development database with demo shops, products, orders and reviews |
| `npm run eval:ml` | Offline evaluation of the recommender (writes `docs/ml-evaluation.md`) |
| `npm run bench:db` | Query benchmark against a throwaway `bench` database (see `docs/performance.md`) |
| `npm run db:check` | Data-integrity report for the development database |
