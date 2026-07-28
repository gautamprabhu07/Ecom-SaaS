//Path: apps/recommendation-service/src/jobs/retrain.job.ts
import cron from "node-cron";
import prisma from "@packages/libs/prisma";
import { generateRecommendations } from "../services/reccomendationService";

//only retrain users who have shown some activity recently, to avoid wasting compute on
//accounts with stale/empty action history
const ACTIVE_WINDOW_DAYS = 7;

const runRetrainCycle = async () => {
   const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
   console.log(`[retrain-job] Starting retraining cycle (active window: last ${ACTIVE_WINDOW_DAYS} days)...`);

   const candidates = await prisma.userAnalytics.findMany({
      where: { actions: { isEmpty: false } },
      select: { userId: true, actions: true },
   });

   const activeUserIds = candidates
      .filter((c) =>
         (c.actions as any[]).some(
            (a) => a?.timestamp && new Date(a.timestamp).getTime() >= since.getTime(),
         ),
      )
      .map((c) => c.userId);

   let processed = 0;
   let failed = 0;

   for (const userId of activeUserIds) {
      try {
         await generateRecommendations(userId);
         processed++;
      } catch (error) {
         failed++;
         console.error(`[retrain-job] Failed to retrain recommendations for user ${userId}:`, error);
      }
   }

   console.log(
      `[retrain-job] Retraining cycle finished. Processed ${processed}/${activeUserIds.length} active users` +
         (failed ? ` (${failed} failed).` : "."),
   );
};

export const startRetrainJob = () => {
   const schedule = process.env.RECOMMENDATION_REFRESH_CRON || "*/30 * * * *";

   cron.schedule(schedule, () => {
      runRetrainCycle().catch((error) => {
         console.error("[retrain-job] Unhandled error during retraining cycle:", error);
      });
   });

   console.log(`[retrain-job] Scheduled recommendation retraining with cron "${schedule}"`);
};
