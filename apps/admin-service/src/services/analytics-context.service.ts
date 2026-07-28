//Path: apps/admin-service/src/services/analytics-context.service.ts
import prisma from "@packages/libs/prisma";

//caps how many rows go into each list so the prompt stays a reasonable size as data grows
const MAX_LIST_ITEMS = 15;

interface ActionEntry {
   productId?: string;
   shopId?: string;
   action: string;
   timestamp: string | number;
}

//pulls shopAnalytics/userAnalytics/productAnalytics (plus the product/shop names they reference,
//since raw ObjectIds are useless to the model) and renders them into a plain-text knowledge block
export const buildAnalyticsKnowledge = async (): Promise<string> => {
   const [productAnalytics, shopAnalytics, userAnalyticsRows, totalProducts, totalShops, totalUsers] =
      await Promise.all([
         prisma.productAnalytics.findMany({ orderBy: { purchases: "desc" } }),
         prisma.shopAnalytics.findMany({ orderBy: { totalVisitors: "desc" } }),
         prisma.userAnalytics.findMany({
            select: { userId: true, actions: true, country: true, city: true, lastVisited: true },
         }),
         prisma.products.count(),
         prisma.shops.count(),
         prisma.users.count(),
      ]);

   const productIds = productAnalytics.map((p) => p.productId);
   const shopIds = shopAnalytics.map((s) => s.shopId);

   const [products, shops] = await Promise.all([
      productIds.length
         ? prisma.products.findMany({
              where: { id: { in: productIds } },
              select: { id: true, title: true, category: true, sale_price: true, totalSales: true, rating: true },
           })
         : [],
      shopIds.length
         ? prisma.shops.findMany({
              where: { id: { in: shopIds } },
              select: { id: true, name: true, category: true },
           })
         : [],
   ]);

   const productById = new Map(products.map((p) => [p.id, p]));
   const shopById = new Map(shops.map((s) => [s.id, s]));

   const topByPurchases = [...productAnalytics]
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, MAX_LIST_ITEMS)
      .map((pa) => {
         const p = productById.get(pa.productId);
         return `- ${p?.title ?? pa.productId} | category: ${p?.category ?? "unknown"} | price: $${p?.sale_price ?? "?"} | purchases: ${pa.purchases} | views: ${pa.views} | cartAdds: ${pa.cartAdds} | wishlistAdds: ${pa.wishlistAdds}`;
      });

   const topByViews = [...productAnalytics]
      .sort((a, b) => b.views - a.views)
      .slice(0, MAX_LIST_ITEMS)
      .map((pa) => {
         const p = productById.get(pa.productId);
         return `- ${p?.title ?? pa.productId} | views: ${pa.views} | purchases: ${pa.purchases}`;
      });

   const topShops = shopAnalytics.slice(0, MAX_LIST_ITEMS).map((sa) => {
      const s = shopById.get(sa.shopId);
      return `- ${s?.name ?? sa.shopId} | category: ${s?.category ?? "unknown"} | totalVisitors: ${sa.totalVisitors}`;
   });

   const actionCounts: Record<string, number> = {};
   const countryCounts: Record<string, number> = {};
   let trackedUsers = 0;

   for (const row of userAnalyticsRows) {
      trackedUsers++;
      if (row.country) {
         countryCounts[row.country] = (countryCounts[row.country] || 0) + 1;
      }
      for (const action of (row.actions as unknown as ActionEntry[]) || []) {
         if (!action?.action) continue;
         actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
      }
   }

   const actionSummary = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([action, count]) => `${action}: ${count}`)
      .join(", ");

   const countrySummary = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_LIST_ITEMS)
      .map(([country, count]) => `${country}: ${count} users`)
      .join(", ");

   return `
STORE OVERVIEW
- Total products: ${totalProducts}
- Total shops: ${totalShops}
- Total users: ${totalUsers}
- Users with tracked activity: ${trackedUsers}

TOP PRODUCTS BY PURCHASES
${topByPurchases.join("\n") || "No purchase data yet."}

TOP PRODUCTS BY VIEWS
${topByViews.join("\n") || "No view data yet."}

TOP SHOPS BY VISITORS
${topShops.join("\n") || "No shop visit data yet."}

USER ACTION BREAKDOWN (across all tracked users)
${actionSummary || "No user actions recorded yet."}

USERS BY COUNTRY
${countrySummary || "No location data yet."}
`.trim();
};
