//Path: apps/kafka-service/src/services/analytics.services.ts
import prisma  from '@packages/libs/prisma';

export const updateUserAnalytics = async (event: any) => {
   try {
      const existingData = await prisma.userAnalytics.findUnique({
         where: { userId: event.userId },
         select: { actions: true },
      });

      let updatedActions:any = existingData?.actions || [];

      const actionExists = updatedActions.some((entry: any) => entry.productId === event.productId && entry.action === event.action);

      //Always store product_view for reccommendation purposes
      if(event.action==="product_view"){
      updatedActions.push({
         productId: event?.productId,
         shopId: event?.shopId,
         action: "product_view",
         timestamp: new Date(),
      });
      }

      else if (["add_to_wishlist", "add_to_cart"].includes(event.action) && !actionExists) {
         updatedActions.push({
            productId: event?.productId,
            shopId: event?.shopId,
            action: event?.action,
            timestamp: new Date(),
         });
      }

      else if(event.action==="remove_from_cart"){
         updatedActions=updatedActions.filter((entry: any) => !(entry.productId === event.productId && entry.action === "add_to_cart"));
      }

      else if(event.action==="remove_from_wishlist"){
         updatedActions=updatedActions.filter((entry: any) => !(entry.productId === event.productId && entry.action === "add_to_wishlist"));
      }

      //keep only last 100 actions
      if(updatedActions.length>100){
         updatedActions.shift();
      }

      const extraFields:Record<string,any> = {};

      if(event.country){
         extraFields.country=event.country;
      }

      if(event.city){
         extraFields.city=event.city;
      }

      if(event.device){
         extraFields.device=event.device;
      }

      // Update or create the user analytics record
      await prisma.userAnalytics.upsert({
         where: { userId: event.userId }, 
         update: {
            lastVisited: new Date(),
            actions: updatedActions,
            ...extraFields,
         },
         create: {
            userId: event?.userId,
            lastVisited: new Date(),
            actions: updatedActions,
            ...extraFields,
         },
      });

      //also update the product analytics
      await updateProductAnalytics(event);
   }catch (error) {
      console.error(`Error updating user analytics: ${error}`);
   }
};

export const updateProductAnalytics = async (event: any) => {
   try {
      if(!event.productId) return;

      const updateFields: any={};

      if(event.action==="product_view")updateFields.views={increment:1};

      if(event.action==="add_to_cart")
         {
         updateFields.cartAdds={increment:1};
      }

      if(event.action==="remove_from_cart")
      {
         updateFields.cartAdds={decrement:1};
      }
      if(event.action==="add_to_wishlist")
      {
         updateFields.wishlistAdds={increment:1};
      }
      if(event.action==="remove_from_wishlist")
      {
         updateFields.wishlistAdds={decrement:1};
      }
      if(event.action==="purchase")
      {
         updateFields.purchases={increment:1};
      }
//update or create the product analytics record
      await prisma.productAnalytics.upsert({
         where: { productId: event.productId },
         update: {
            lastViewedAt: new Date(),
            ...updateFields,
         },
         create: {
            productId: event.productId,
            shopId: event.shopId || null,
            views: event.action==="product_view"?1:0,
            cartAdds: event.action==="add_to_cart"?1:0,
            wishlistAdds: event.action==="add_to_wishlist"?1:0,
            purchases: event.action==="purchase"?1:0,
            lastViewedAt: new Date(),
         },
      });
   }catch (error) {
      console.error(`Error updating product analytics: ${error}`);
   }
};

//update shop analytics
export const updateShopAnalytics = async (event: any) => {
   try {
      if (!event.shopId) return;

      const { shopId, userId, country, city, device } = event;

      //check if this is a new unique visitor for this shop
      let isNewVisitor = false;
      if (userId) {
         const existingVisit = await prisma.uniqueShopVisitors.findUnique({
            where: {
               shopId_userId: { shopId, userId },
            },
         });

         if (!existingVisit) {
            await prisma.uniqueShopVisitors.create({
               data: { shopId, userId },
            });
            isNewVisitor = true;
         }
      }

      const existingAnalytics = await prisma.shopAnalytics.findUnique({
         where: { shopId },
      });

      const currentCountryStats = (existingAnalytics?.countryStats as Record<string, number>) || {};
      const currentCityStats = (existingAnalytics?.cityStats as Record<string, number>) || {};
      const currentDeviceStats = (existingAnalytics?.deviceStats as Record<string, number>) || {};

      const countryKey = country || "Unknown";
      const cityKey = city || "Unknown";
      const deviceKey = device || "Unknown Device";

      currentCountryStats[countryKey] = (currentCountryStats[countryKey] || 0) + 1;
      currentCityStats[cityKey] = (currentCityStats[cityKey] || 0) + 1;
      currentDeviceStats[deviceKey] = (currentDeviceStats[deviceKey] || 0) + 1;

      await prisma.shopAnalytics.upsert({
   where: { shopId },
   update: {
      ...(isNewVisitor && { totalVisitors: { increment: 1 } }),
      countryStats: currentCountryStats,
      cityStats: currentCityStats,
      deviceStats: currentDeviceStats,
      lastViewedAt: new Date(),
   },
   create: {
      shopId,
      totalVisitors: 1,
      countryStats: currentCountryStats,
      cityStats: currentCityStats,
      deviceStats: currentDeviceStats,
      lastViewedAt: new Date(),
   },
});
   } catch (error) {
      console.error(`Error updating shop analytics: ${error}`);
   }
};
