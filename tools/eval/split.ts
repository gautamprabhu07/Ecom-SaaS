//Path: tools/eval/split.ts
//the leave-last-k-out temporal split. Pure and database-free so the no-leakage guarantees can be unit tested.
import type { CatalogProduct, EvalAction } from "./types";

//behaviour that signals real interest. Views are too weak to count as ground truth and removals are negative.
export const POSITIVE_ACTIONS = ["purchase", "add_to_cart", "add_to_wishlist"];

export interface SplitOptions {
  //how many of the buyer's most recent positive actions become ground truth
  holdOut?: number;
  //buyers with fewer actions in total are treated as cold-start and excluded
  minActions?: number;
  //buyers with less history than this BEFORE the split can't be modelled and are excluded
  minTraining?: number;
}

export interface UserSplit {
  //actions strictly before the earliest held-out action, oldest first
  training: EvalAction[];
  //the held-out positive actions themselves
  heldOut: EvalAction[];
  //ground truth: products from the held-out actions that the buyer had NOT already shown positive interest in
  relevant: string[];
  //products the buyer had already shown positive interest in before the split (never recommended again)
  positiveTrainingIds: string[];
  //epoch ms of the earliest held-out action: the moment the recommendation is "made"
  splitTime: number;
}

export type SkipReason = "too-few-actions" | "no-positive-actions" | "too-little-training" | "no-new-relevant-items";

export type SplitResult = { ok: true; split: UserSplit } | { ok: false; reason: SkipReason };

const isPositive = (action: EvalAction) => POSITIVE_ACTIONS.includes(action.action);

export const splitUser = (rawActions: EvalAction[], options: SplitOptions = {}): SplitResult => {
  const { holdOut = 5, minActions = 20, minTraining = 10 } = options;

  //oldest first; actions without a usable timestamp or product can't be placed in time, so they are dropped
  const actions = rawActions
    .map((action, index) => ({ action, index, time: new Date(action.timestamp).getTime() }))
    .filter(({ action, time }) => action && !Number.isNaN(time) && action.productId)
    .sort((a, b) => a.time - b.time || a.index - b.index)
    .map(({ action }) => action);

  if (actions.length < minActions) return { ok: false, reason: "too-few-actions" };

  const positiveIndexes = actions.map((a, i) => (isPositive(a) ? i : -1)).filter((i) => i >= 0);
  if (positiveIndexes.length === 0) return { ok: false, reason: "no-positive-actions" };

  //the last `holdOut` positive actions are the test set; everything from the earliest of them onwards is off limits
  const heldOutIndexes = positiveIndexes.slice(-holdOut);
  const firstHeldOut = heldOutIndexes[0];

  const training = actions.slice(0, firstHeldOut);
  if (training.length < minTraining) return { ok: false, reason: "too-little-training" };

  const heldOut = heldOutIndexes.map((i) => actions[i]);
  const positiveTrainingIds = [...new Set(training.filter(isPositive).map((a) => a.productId as string))];
  const alreadyPositive = new Set(positiveTrainingIds);

  //a product the buyer already carted or bought can't be a "new" recommendation, so it isn't ground truth
  const relevant = [...new Set(heldOut.map((a) => a.productId as string))].filter((id) => !alreadyPositive.has(id));
  if (relevant.length === 0) return { ok: false, reason: "no-new-relevant-items" };

  return {
    ok: true,
    split: {
      training,
      heldOut,
      relevant,
      positiveTrainingIds,
      splitTime: new Date(actions[firstHeldOut].timestamp).getTime(),
    },
  };
};

//the set of products a recommender may rank for this buyer. Only products with an earlier POSITIVE interaction are
//excluded. The production code excludes anything the buyer has even viewed, but in a held-out evaluation that would
//make any held-out product the buyer had merely looked at earlier impossible to retrieve, which deflates recall for
//reasons that have nothing to do with how good the model is. The same set is given to every strategy.
export const buildCandidates = (catalog: CatalogProduct[], positiveTrainingIds: string[]): CatalogProduct[] => {
  const excluded = new Set(positiveTrainingIds);
  return catalog.filter((product) => !excluded.has(product.id));
};
