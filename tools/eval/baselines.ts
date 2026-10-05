//Path: tools/eval/baselines.ts
//reference recommenders with the same interface as the real one. A model's score only means something next to these.
import type { Recommender } from "./types";

//seeded generator: the same seed always gives the same shuffles, so results are reproducible
const mulberry32 = (seed: number) => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

//floor: recommends a random ordering of the candidates (a different, reproducible order for every buyer)
export const makeRandomRecommender =
  (seed = 42): Recommender =>
  async ({ userId, candidates }) => {
    const random = mulberry32(seed ^ hashString(userId));
    const ids = candidates.map((product) => product.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  };

//the same ordering the production code falls back to for brand-new users: best sellers first, then best rated.
//identical for every buyer, so it measures how far "show everyone the hits" gets you
export const popularityRecommender: Recommender = async ({ candidates }) =>
  [...candidates].sort((a, b) => b.totalSales - a.totalSales || b.rating - a.rating).map((product) => product.id);

//a stronger, still very simple baseline: find the buyer's most-interacted category, show its best sellers first,
//then the second most-interacted category, and so on. If the content-based model cannot beat this, the machine
//learning is not earning its keep.
export const topCategoryPopularityRecommender: Recommender = async ({ training, interactedProducts, candidates }) => {
  const categoryOf = new Map(interactedProducts.map((product) => [product.id, product.category]));
  const interest: Record<string, number> = {};
  for (const action of training) {
    const category = action.productId ? categoryOf.get(action.productId) : undefined;
    if (category) interest[category] = (interest[category] || 0) + 1;
  }

  return [...candidates]
    .sort(
      (a, b) =>
        (interest[b.category] || 0) - (interest[a.category] || 0) ||
        b.totalSales - a.totalSales ||
        b.rating - a.rating,
    )
    .map((product) => product.id);
};
