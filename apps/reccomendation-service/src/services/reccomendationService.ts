//Path: apps/recommendation-service/src/services/reccomendationService.ts
import * as tf from "@tensorflow/tfjs";
import prisma from "@packages/libs/prisma";
import { fetchUserActivity, UserAction } from "./fetch-user-activity";

//how much each action type contributes to the user's interest profile
const ACTION_WEIGHTS: Record<string, number> = {
   product_view: 1,
   add_to_wishlist: 3,
   add_to_cart: 4,
   purchase: 6,
   remove_from_wishlist: -2,
   remove_from_cart: -2,
};

//time constant of the exponential recency decay: an action's weight falls to ~37% (1/e) after this many days.
//(the actual half-life is DECAY_TIME_CONSTANT_DAYS * ln 2, roughly 9.7 days)
const DECAY_TIME_CONSTANT_DAYS = 14;

const recencyWeight = (timestamp: string | number, now: number): number => {
   const ageMs = now - new Date(timestamp).getTime();
   const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 0);
   return Math.exp(-ageDays / DECAY_TIME_CONSTANT_DAYS);
};

export interface FeatureVocab {
   categories: string[];
   tags: string[];
}

export const buildVocab = (products: any[]): FeatureVocab => {
   const categorySet = new Set<string>();
   const tagSet = new Set<string>();

   for (const p of products) {
      if (p.category) categorySet.add(p.category.toLowerCase());
      for (const tag of p.tags || []) {
         tagSet.add(String(tag).toLowerCase());
      }
   }

   return {
      categories: Array.from(categorySet),
      tags: Array.from(tagSet),
   };
};

//turn a single product into a numeric feature vector against the shared vocabulary
export const vectorizeProduct = (product: any, vocab: FeatureVocab): number[] => {
   const vector: number[] = [];

   for (const category of vocab.categories) {
      vector.push(product.category?.toLowerCase() === category ? 1 : 0);
   }

   const productTags = new Set((product.tags || []).map((t: any) => String(t).toLowerCase()));
   for (const tag of vocab.tags) {
      vector.push(productTags.has(tag) ? 1 : 0);
   }

   return vector;
};

//aggregate weighted user actions into a single interest vector over the same vocabulary
const buildUserInterestVector = (
   actions: UserAction[],
   productMap: Map<string, any>,
   vocab: FeatureVocab,
   useRecencyDecay: boolean,
   now: number,
): number[] => {
   const size = vocab.categories.length + vocab.tags.length;
   const interest = new Array(size).fill(0);

   for (const action of actions) {
      if (!action.productId) continue;
      const product = productMap.get(action.productId);
      if (!product) continue;

      const actionWeight = ACTION_WEIGHTS[action.action] ?? 0;
      if (actionWeight === 0) continue;

      const timeWeight = useRecencyDecay ? recencyWeight(action.timestamp, now) : 1;
      const totalWeight = actionWeight * timeWeight;

      const productVector = vectorizeProduct(product, vocab);
      for (let i = 0; i < size; i++) {
         interest[i] += productVector[i] * totalWeight;
      }
   }

   return interest;
};

const cosineSimilarity = (a: tf.Tensor2D, b: tf.Tensor2D): tf.Tensor1D => {
   const aNorm = tf.norm(a, 2, 1).reshape([-1, 1]);
   const bNorm = tf.norm(b, 2, 1).reshape([-1, 1]);

   const aNormalized = tf.div(a, tf.add(aNorm, 1e-8));
   const bNormalized = tf.div(b, tf.add(bNorm, 1e-8));

   //dot product of each candidate row against the single user row
   return tf.sum(tf.mul(aNormalized, bNormalized), 1) as tf.Tensor1D;
};

//how many scored candidates to persist in the cache so reads with a different `limit` than the
//training run still have enough to slice from, instead of forcing a recompute.
//50 is 5x the default page size (10) and about a quarter of the current 200-product catalog: enough headroom
//for larger pages and for products that get deleted before the next retrain, while the cached document stays
//tiny (50 id+score pairs per user). It no longer caches nearly the whole catalog, which would have made the
//"top N" ranking meaningless. Revisit if the catalog grows by an order of magnitude.
const CACHE_SNAPSHOT_SIZE = 50;

//read the cached snapshot written by the last training run (cron or on-demand) and hydrate it
//with fresh product data; returns null if there's nothing cached yet for this user
export const getCachedRecommendations = async (
   userId: string,
   limit = 10,
): Promise<any[] | null> => {
   const analytics = await prisma.userAnalytics.findUnique({
      where: { userId },
      select: { reccomendations: true },
   });

   const cached = (analytics?.reccomendations as { productId: string; score: number }[] | null) ?? null;
   if (!cached || cached.length === 0) return null;

   const productIds = cached.map((c) => c.productId);
   const products = await prisma.products.findMany({
      where: { id: { in: productIds }, isDeleted: false, status: "Active" },
      include: { images: true, Shop: true },
   });

   const scoreByProductId = new Map(cached.map((c) => [c.productId, c.score]));
   const productMap = new Map(products.map((p) => [p.id, p]));

   return productIds
      .filter((id) => productMap.has(id))
      .sort((a, b) => (scoreByProductId.get(b) ?? 0) - (scoreByProductId.get(a) ?? 0))
      .slice(0, limit)
      .map((id) => productMap.get(id));
};

export interface ScoringOptions {
   //weight actions by how recent they are (default true, which is what production uses)
   useRecencyDecay?: boolean;
   //add the small log-scaled popularity term to the similarity score (default true, which is what production uses)
   usePopularityBoost?: boolean;
   //reference time for the recency decay in epoch ms (default: now). The evaluation harness passes the moment of
   //its train/test split so that old synthetic history is weighted as it would have been at prediction time.
   now?: number;
}

export interface ScoringResult {
   //candidates ranked best first
   ranked: { product: any; score: number }[];
   //true when there was nothing to compare against and the ranking is plain popularity (totalSales, then rating)
   usedFallback: boolean;
}

//the pure core of the recommender: no database access, so it can be unit tested and evaluated offline.
//`actions` is the user's history, `interactedProducts` are the products those actions refer to (category and tags
//are enough) and `candidateProducts` are the products that may be recommended.
export const scoreCandidates = async (
   actions: UserAction[],
   interactedProducts: any[],
   candidateProducts: any[],
   options: ScoringOptions = {},
): Promise<ScoringResult> => {
   const { useRecencyDecay = true, usePopularityBoost = true, now = Date.now() } = options;

   const popularityRanking = (): ScoringResult => ({
      ranked: [...candidateProducts]
         .sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating)
         .map((product) => ({ product, score: product.totalSales || 0 })),
      usedFallback: true,
   });

   //cold start: no history and/or nothing to compare against, so fall back to popularity
   if (interactedProducts.length === 0 || candidateProducts.length === 0) return popularityRanking();

   const productMap = new Map(interactedProducts.map((p) => [p.id, p]));
   const vocab = buildVocab([...interactedProducts, ...candidateProducts]);

   if (vocab.categories.length + vocab.tags.length === 0) return popularityRanking();

   const userVectorArray = buildUserInterestVector(actions, productMap, vocab, useRecencyDecay, now);
   const candidateVectors = candidateProducts.map((p) => vectorizeProduct(p, vocab));

   const userTensor = tf.tensor2d([userVectorArray]);
   const candidateTensor = tf.tensor2d(candidateVectors);

   //broadcast the single user row against every candidate row for a similarity score each
   const similarities = cosineSimilarity(
      tf.tile(userTensor, [candidateProducts.length, 1]),
      candidateTensor,
   );

   const similarityScores = await similarities.array();

   userTensor.dispose();
   candidateTensor.dispose();
   similarities.dispose();

   const ranked = candidateProducts.map((product, index) => {
      const similarity = similarityScores[index] || 0;
      //blend content similarity with a light popularity signal so ties favor proven products
      const popularityBoost = usePopularityBoost ? Math.log10((product.totalSales || 0) + 1) * 0.05 : 0;
      return {
         product,
         score: similarity + popularityBoost,
      };
   });

   ranked.sort((a, b) => b.score - a.score);

   return { ranked, usedFallback: false };
};

export const generateRecommendations = async (
   userId: string,
   limit = 10,
): Promise<any[]> => {
   const actions = await fetchUserActivity(userId);

   //ids of products the user has already interacted with, so we don't recommend them again
   const interactedProductIds = new Set(
      actions.map((a) => a.productId).filter(Boolean) as string[],
   );

   const interactedProducts = interactedProductIds.size
      ? await prisma.products.findMany({
           where: { id: { in: Array.from(interactedProductIds) } },
           select: { id: true, category: true, tags: true },
        })
      : [];

   const candidateProducts = await prisma.products.findMany({
      where: {
         isDeleted: false,
         status: "Active",
         id: { notIn: Array.from(interactedProductIds) },
      },
      include: { images: true, Shop: true },
   });

   const { ranked, usedFallback } = await scoreCandidates(actions, interactedProducts, candidateProducts);

   //nothing was learned about this user, so there is nothing worth caching
   if (usedFallback) return ranked.slice(0, limit).map((r) => r.product);

   const recommendations = ranked.slice(0, limit).map((r) => r.product);

   //cache a larger snapshot than what was requested so future reads at other limits don't miss
   const snapshot = ranked.slice(0, CACHE_SNAPSHOT_SIZE);
   await prisma.userAnalytics.update({
      where: { userId },
      data: {
         reccomendations: snapshot.map((s) => ({
            productId: s.product.id,
            score: s.score,
         })) as any,
         lastTrained: new Date(),
      },
   }).catch(() => {
      //if no userAnalytics row exists yet, there's nothing to cache against — safe to ignore
   });

   return recommendations;
};
