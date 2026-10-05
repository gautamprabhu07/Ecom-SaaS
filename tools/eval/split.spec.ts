//Path: tools/eval/split.spec.ts
//the evaluation is only trustworthy if held-out behaviour can never leak into training: these tests guard that
import { splitUser, buildCandidates, POSITIVE_ACTIONS } from "./split";
import { makeRandomRecommender, popularityRecommender, topCategoryPopularityRecommender } from "./baselines";
import type { CatalogProduct, EvalAction, RecommendationContext } from "./types";

const day = 24 * 60 * 60 * 1000;
const t0 = Date.parse("2026-01-01T00:00:00Z");
const act = (productId: string, action: string, dayOffset: number): EvalAction => ({
  productId,
  action,
  timestamp: new Date(t0 + dayOffset * day).toISOString(),
});

//30 views of p0..p29 (days 0-29), then positives on days 30-39
const history = (): EvalAction[] => [
  ...Array.from({ length: 30 }, (_, i) => act(`p${i}`, "product_view", i)),
  act("a", "add_to_cart", 30),
  act("b", "add_to_wishlist", 31),
  act("c", "purchase", 32),
  act("d", "add_to_cart", 33),
  act("e", "purchase", 34),
  act("f", "add_to_wishlist", 35),
  act("g", "purchase", 36),
];

describe("splitUser", () => {
  it("holds out the last k positive actions as ground truth", () => {
    const result = splitUser(history(), { holdOut: 3 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.split.relevant.sort()).toEqual(["e", "f", "g"]);
  });

  it("never lets a held-out product or anything at/after the split time into training", () => {
    const result = splitUser(history(), { holdOut: 3 });
    if (!result.ok) throw new Error("expected a split");
    const { training, relevant, splitTime } = result.split;
    for (const action of training) {
      expect(new Date(action.timestamp).getTime()).toBeLessThan(splitTime);
      expect(relevant).not.toContain(action.productId);
    }
  });

  it("drops views that happen after the split too, since they could reveal the held-out items", () => {
    const withLateViews = [...history(), act("e", "product_view", 37), act("g", "product_view", 38)];
    const result = splitUser(withLateViews, { holdOut: 3 });
    if (!result.ok) throw new Error("expected a split");
    expect(result.split.training.some((a) => a.productId === "e" || a.productId === "g")).toBe(false);
  });

  it("is not fooled by unsorted input", () => {
    const shuffled = [...history()].reverse();
    const result = splitUser(shuffled, { holdOut: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.split.relevant.sort()).toEqual(["e", "f", "g"]);
  });

  it("does not count a product the buyer already showed positive interest in as ground truth", () => {
    //b was wishlisted early, then wishlisted again in the held-out window: not a new item
    const repeat = [...history(), act("b", "add_to_cart", 37)];
    const result = splitUser(repeat, { holdOut: 3 });
    if (!result.ok) throw new Error("expected a split");
    //held-out = f, g, b(again). b has an earlier positive in training, so only f and g remain
    expect(result.split.relevant.sort()).toEqual(["f", "g"]);
    expect(result.split.positiveTrainingIds).toContain("b");
  });

  it("only treats purchase, add_to_cart and add_to_wishlist as positive", () => {
    expect(POSITIVE_ACTIONS.sort()).toEqual(["add_to_cart", "add_to_wishlist", "purchase"]);
    const onlyViews = Array.from({ length: 40 }, (_, i) => act(`p${i}`, "product_view", i));
    const result = splitUser(onlyViews);
    expect(result).toEqual({ ok: false, reason: "no-positive-actions" });
  });

  it("excludes cold-start buyers and buyers without enough history before the split", () => {
    expect(splitUser(history().slice(0, 10))).toEqual({ ok: false, reason: "too-few-actions" });
    //20 actions but the positives come first, leaving almost nothing to train on
    const front = [act("a", "purchase", 0), act("b", "purchase", 1), ...Array.from({ length: 18 }, (_, i) => act(`p${i}`, "product_view", 2 + i))];
    expect(splitUser(front, { holdOut: 5 })).toEqual({ ok: false, reason: "too-little-training" });
  });
});

describe("buildCandidates", () => {
  const product = (id: string): CatalogProduct => ({ id, title: id, category: "x", subCategory: "y", tags: [], totalSales: 0, rating: 5 });

  it("excludes products with an earlier positive interaction but keeps merely-viewed ones", () => {
    const catalog = ["a", "b", "viewed"].map(product);
    const candidates = buildCandidates(catalog, ["a", "b"]);
    expect(candidates.map((p) => p.id)).toEqual(["viewed"]);
  });
});

describe("baselines", () => {
  const candidates: CatalogProduct[] = [
    { id: "low", title: "", category: "books", subCategory: "", tags: [], totalSales: 1, rating: 5 },
    { id: "mid", title: "", category: "books", subCategory: "", tags: [], totalSales: 5, rating: 3 },
    { id: "top", title: "", category: "games", subCategory: "", tags: [], totalSales: 9, rating: 4 },
    { id: "tie", title: "", category: "games", subCategory: "", tags: [], totalSales: 5, rating: 4.5 },
  ];
  const context = (userId: string): RecommendationContext => ({
    userId,
    candidates,
    training: [{ productId: "x", action: "product_view", timestamp: 0 }, { productId: "x", action: "add_to_cart", timestamp: 1 }],
    interactedProducts: [{ id: "x", title: "", category: "books", subCategory: "", tags: [], totalSales: 0, rating: 5 }],
    now: 2,
  });

  it("popularity ranks by sales, then rating", async () => {
    expect(await popularityRecommender(context("u"))).toEqual(["top", "tie", "mid", "low"]);
  });

  it("random is reproducible for the same seed and buyer, and differs between buyers", async () => {
    const random = makeRandomRecommender(42);
    const first = await random(context("buyer-1"));
    expect(await random(context("buyer-1"))).toEqual(first);
    expect([...first].sort()).toEqual(["low", "mid", "tie", "top"]);

    const orders = await Promise.all(["b1", "b2", "b3", "b4", "b5"].map((id) => random(context(id))));
    expect(new Set(orders.map((o) => o.join(","))).size).toBeGreaterThan(1);
  });

  it("top-category popularity puts the buyer's favourite category first, best sellers within it", async () => {
    expect(await topCategoryPopularityRecommender(context("u"))).toEqual(["mid", "low", "top", "tie"]);
  });
});
