# Query performance: before and after indexing

`prisma/schema.prisma` had no `@@index` declarations, only unique keys, so most filtered queries scanned a whole collection. This page measures what adding indexes changed.

## Method

- Run with `npm run bench:db`. The scripts never touch the real database: they use a throwaway `bench` database on the same Atlas cluster (the connection string with its database name swapped) and refuse to run otherwise.
- Synthetic data (seeded RNG, `tools/bench/seed-bench.ts`): 30,000 products, 60,000 orders, 120,000 order items, 60,000 images, 30,000 followers, 100,000 messages, 5,000 user and 30,000 product analytics rows. The dev database holds only ~200 products, where a scan takes microseconds and an index changes nothing visible.
- Each query runs 30 times after one warm-up; the table shows p50 and p95 in milliseconds. Query shapes are copied from the controllers (product, order, chatting, analytics).
- BEFORE = current schema without the new indexes. AFTER = same data, same machine, indexes built with `prisma db push`. Raw numbers: `tools/bench/results-before.json` and `results-after.json`.

**Read the numbers with this in mind:** the app talks to Atlas over the internet, so every query has a ~33 ms floor from network round-trip. A query that reaches ~33 ms is now as fast as it can be from here; the database time is gone. Differences of about +/-10% are jitter, not signal.

## Results

| Query | Before p50 | After p50 | Before p95 | After p95 | p50 change | Index responsible |
|---|---:|---:|---:|---:|---:|---|
| Product listing: category + price range, paginated | 184.8 | 75.4 | 222.1 | 98.1 | -59% | products(category, sale_price) |
| Home listing: latest products, paginated | 234.8 | 74.6 | 240.5 | 95.3 | -68% | products(createdAt) |
| Product by slug | 31.7 | 35.9 | 37.1 | 40.4 | +13% | none (slug was already @unique) |
| Products by shopId | 507.8 | 165.1 | 524.8 | 250.2 | -67% | products(shopId) |
| Keyword search (title / short_description contains) | 321.0 | 35.4 | 360.4 | 40.1 | -89% | products(createdAt), indirectly (see note 2) |
| Top shops: Paid orders grouped by shop, sum of total | 87.9 | 86.6 | 105.6 | 105.8 | -2% | none (see note 3) |
| Orders by shopId, newest first | 123.6 | 82.4 | 242.5 | 144.5 | -33% | orders(shopId, createdAt) |
| Orders by userId, newest first (with items) | 219.9 | 71.2 | 228.1 | 76.6 | -68% | orders(userId, createdAt) + orderItems(orderId) |
| Seller revenue: Paid orders in last 30 days | 62.0 | 34.7 | 63.7 | 37.0 | -44% | orders(shopId, createdAt) |
| Order items by orderId | 109.3 | 34.9 | 118.7 | 38.5 | -68% | orderItems(orderId) |
| Product images by productsId | 77.5 | 34.4 | 81.3 | 36.4 | -56% | images(productsId) |
| Followers of a shop (count) | 48.2 | 35.1 | 53.6 | 38.1 | -27% | followers(shopsId) |
| userAnalytics by userId | 31.7 | 35.2 | 36.6 | 38.5 | +11% | none (userId was already @unique) |
| productAnalytics by productId | 32.0 | 35.2 | 33.0 | 39.6 | +10% | none (productId was already @unique) |
| Messages by conversationId, newest 20 | 34.3 | 35.5 | 35.7 | 49.3 | +3% | message(conversationId, createdAt) |

## Notes

1. **Slug and analytics lookups did not change, by design.** `products.slug`, `userAnalytics.userId`, `productAnalytics.productId` and `shopAnalytics.shopId` were already `@unique`, which MongoDB indexes. Adding a second index on them would only cost write time. Likewise a `message(conversationId)` lookup was already served by the prefix of the existing unique key; the new `(conversationId, createdAt)` index matters once a conversation has many messages (here ~200 each, so the in-memory sort is cheap).
2. **Keyword search (-89%) is not really a text-search win.** `contains` with `mode: insensitive` is a regex and no ordinary index can serve it. It got faster only because the query sorts by `createdAt desc` and takes 10: with the `createdAt` index MongoDB walks newest-first and stops after 10 matches. For a rare keyword it would still scan everything. Real fix: a MongoDB Atlas Search / text index.
3. **Top shops did not improve, and a first attempt made it worse.** An index on `(status, shopId)` made the query 66% slower (88 to 146 ms) because MongoDB used the index but then had to fetch every matching document to read `total`. A covering index `(status, shopId, total)` was no better, so I dropped it. Leaving it unindexed was the fastest option measured; pre-aggregating shop revenue would be the next step.
4. **Spec suggestions not followed, and why.** `products(category, status, isDeleted)`: the storefront queries filter on `category` and `sale_price`, never on `status` or `isDeleted`, so that index would match no query (and see the bug below). `products(isDeleted, deletedAt)`: nothing queries `deletedAt`. `orderItems(productId)`: nothing filters on it; the real access is by `orderId`, which is what I indexed.
5. **Bug found and fixed while reading the queries:** the storefront listing, event, filter, search and product-page endpoints did not exclude `isDeleted: true` products, so soft-deleted products still appeared. They now filter `isDeleted: { not: true }` (which also matches older rows where the field is unset); sellers still see their deleted products in their own dashboard so they can restore them.

## Indexes added and why

| Model | Index | Serves |
|---|---|---|
| products | `shopId` | seller catalogue, shop page |
| products | `category, sale_price` | storefront filter: equality field first, range second |
| products | `createdAt` | "latest" listing and search ordering |
| products | `totalSales` | "top sellers" ordering |
| orders | `shopId, createdAt` | seller order list and revenue range queries |
| orders | `userId, createdAt` | buyer order history, newest first |
| orderItems | `orderId` | loading an order's items |
| images | `productsId` | every product include |
| followers | `shopsId` | followers of a shop |
| shopReviews | `shopsId, createdAt` | paginated review list |
| notifications | `recieverId, createdAt` | notification bell |
| message | `conversationId, createdAt` | chat history |
| productAnalytics | `shopId` | dashboard funnel and top products |
| uniqueShopVisitors | `shopId, visitedAt` | dashboard visitor counts |

`products.totalSales`, `productAnalytics.shopId` and `uniqueShopVisitors(shopId, visitedAt)` were added from reading the access patterns but are not in the benchmark, so no number backs them.

## The cost of indexes (write amplification)

Every index is a second structure MongoDB must update on each insert, delete, and each update that touches an indexed field. `products` now has 6 indexes (including `_id` and the unique slug), so creating a product writes the document plus 5 index entries, and a sale that increments `totalSales` rewrites an index entry too. Indexes also consume RAM and disk. For this app, reads (browsing, dashboards) far outnumber writes, so the trade is clearly worth it; it would deserve a second look for a write-heavy collection like `message`, which is why only one index was added there.
