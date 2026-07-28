//Path: apps/recommendation-service/src/services/fetch-user-activity.ts
import prisma from "@packages/libs/prisma";

export interface UserAction {
   productId?: string;
   shopId?: string;
   action: string;
   timestamp: string | number;
}

export const fetchUserActivity = async (userId: string): Promise<UserAction[]> => {
   const analytics = await prisma.userAnalytics.findUnique({
      where: { userId },
      select: { actions: true },
   });

   if (!analytics?.actions) return [];

   return (analytics.actions as any[]).filter(
      (a) => a && typeof a === "object" && a.action,
   ) as UserAction[];
};