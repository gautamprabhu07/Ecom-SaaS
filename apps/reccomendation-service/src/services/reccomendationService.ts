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

//how many days until an action's influence decays to ~37% of its original weight
const DECAY_HALF_LIFE_DAYS = 14;

const recencyWeight = (timestamp: string | number): number => {
   const ageMs = Date.now() - new Date(timestamp).getTime();
   const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 0);
   return Math.exp(-ageDays / DECAY_HALF_LIFE_DAYS);
};

interface FeatureVocab {
   categories: string[];
   tags: string[];
}

const buildVocab = (products: any[]): FeatureVocab => {
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
const vectorizeProduct = (product: any, vocab: FeatureVocab): number[] => {
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
): number[] => {
   const size = vocab.categories.length + vocab.tags.length;
   const interest = new Array(size).fill(0);

   for (const action of actions) {
      if (!action.productId) continue;
      const product = productMap.get(action.productId);
      if (!product) continue;

      const actionWeight = ACTION_WEIGHTS[action.action] ?? 0;
      if (actionWeight === 0) continue;

      const timeWeight = recencyWeight(action.timestamp);
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
//training run still have enough to slice from, instead of forcing a recompute
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

   //cold start: no history and/or nothing to compare against — fall back to popularity
   if (interactedProducts.length === 0 || candidateProducts.length === 0) {
      return candidateProducts
         .sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating)
         .slice(0, limit);
   }

   const productMap = new Map(interactedProducts.map((p) => [p.id, p]));
   const vocab = buildVocab([...interactedProducts, ...candidateProducts]);

   if (vocab.categories.length + vocab.tags.length === 0) {
      return candidateProducts
         .sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating)
         .slice(0, limit);
   }

   const userVectorArray = buildUserInterestVector(actions, productMap, vocab);
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

   const scored = candidateProducts.map((product, index) => {
      const similarity = similarityScores[index] || 0;
      //blend content similarity with a light popularity signal so ties favor proven products
      const popularityBoost = Math.log10((product.totalSales || 0) + 1) * 0.05;
      return {
         product,
         score: similarity + popularityBoost,
      };
   });

   scored.sort((a, b) => b.score - a.score);

   const recommendations = scored.slice(0, limit).map((s) => s.product);

   //cache a larger snapshot than what was requested so future reads at other limits don't miss
   const snapshot = scored.slice(0, CACHE_SNAPSHOT_SIZE);
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