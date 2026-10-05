//Path: tools/eval/dataset.ts
//loads buyer histories and the catalog from the database and applies the leave-last-k-out split
import prisma from "../../packages/libs/prisma";
import { splitUser, buildCandidates, SkipReason, SplitOptions } from "./split";
import type { CatalogProduct, EvalAction } from "./types";

export interface EvalUser {
  userId: string;
  training: EvalAction[];
  //ground-truth product ids
  relevant: string[];
  splitTime: number;
  //candidate products for this buyer (the catalog minus earlier positive interactions)
  candidates: CatalogProduct[];
  interactedProducts: CatalogProduct[];
}

export interface EvalDataset {
  users: EvalUser[];
  catalog: CatalogProduct[];
  options: Required<SplitOptions>;
  totalBuyersWithHistory: number;
  skipped: Record<SkipReason, number>;
}

export async function loadDataset(options: SplitOptions = {}): Promise<EvalDataset> {
  const settings: Required<SplitOptions> = { holdOut: 5, minActions: 20, minTraining: 10, ...options };

  //the same product filter the production recommender applies to its candidates
  const catalog: CatalogProduct[] = (
    await prisma.products.findMany({
      where: { isDeleted: false, status: "Active" },
      select: { id: true, title: true, category: true, subCategory: true, tags: true, totalSales: true, rating: true },
    })
  ).map((p) => ({ ...p, totalSales: p.totalSales ?? 0 }));
  const catalogById = new Map(catalog.map((product) => [product.id, product]));

  const rows = await prisma.userAnalytics.findMany({ select: { userId: true, actions: true }, orderBy: { userId: "asc" } });

  const skipped: Record<SkipReason, number> = {
    "too-few-actions": 0,
    "no-positive-actions": 0,
    "too-little-training": 0,
    "no-new-relevant-items": 0,
  };
  const users: EvalUser[] = [];

  for (const row of rows) {
    const actions = ((row.actions as any[]) ?? []).filter((a) => a && typeof a === "object" && a.action) as EvalAction[];
    const result = splitUser(actions, settings);
    if (!result.ok) {
      skipped[result.reason]++;
      continue;
    }

    const { split } = result;
    const interacted = [...new Set(split.training.map((a) => a.productId as string))]
      .map((id) => catalogById.get(id))
      .filter((p): p is CatalogProduct => Boolean(p));

    users.push({
      userId: row.userId,
      training: split.training,
      relevant: split.relevant.filter((id) => catalogById.has(id)),
      splitTime: split.splitTime,
      candidates: buildCandidates(catalog, split.positiveTrainingIds),
      interactedProducts: interacted,
    });
  }

  return {
    users: users.filter((u) => u.relevant.length > 0),
    catalog,
    options: settings,
    totalBuyersWithHistory: rows.length,
    skipped,
  };
}
