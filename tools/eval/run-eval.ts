//Path: tools/eval/run-eval.ts
//offline evaluation of the recommender. usage: npm run eval:ml
//writes docs/ml-evaluation.md and tools/eval/results.json
import "dotenv/config";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import prisma from "../../packages/libs/prisma";
import { scoreCandidates, buildVocab, vectorizeProduct, ScoringOptions } from "../../apps/reccomendation-service/src/services/reccomendationService";
import { loadDataset, EvalUser } from "./dataset";
import { makeRandomRecommender, popularityRecommender, topCategoryPopularityRecommender } from "./baselines";
import {
  precisionAtK,
  recallAtK,
  hitRateAtK,
  averagePrecisionAtK,
  ndcgAtK,
  catalogCoverage,
  intraListDiversity,
  mean,
  percentile,
  bootstrapMeanCI,
} from "./metrics";
import type { Recommender } from "./types";

const KS = [5, 10, 20];
const MAX_K = Math.max(...KS);
const REPORT_K = 10;
const RANDOM_SEED = 42;
const PRODUCTION_LATENCY_SAMPLE = 15;

// ------------------------------------------------------------------------------------------ strategies
//the real model: scoring goes through the exact function production uses. `now` is the moment of the split.
const contentBased =
  (options: ScoringOptions): Recommender =>
  async ({ training, interactedProducts, candidates, now }) => {
    const { ranked } = await scoreCandidates(training, interactedProducts, candidates, { ...options, now });
    return ranked.map((entry) => entry.product.id);
  };

const MAIN_STRATEGIES: Record<string, Recommender> = {
  "Content-based (production model)": contentBased({}),
  "Popularity baseline": popularityRecommender,
  "Top-category popularity baseline": topCategoryPopularityRecommender,
  "Random baseline": makeRandomRecommender(RANDOM_SEED),
};

const ABLATIONS: Record<string, Recommender> = {
  "Full model (decay + popularity boost)": contentBased({}),
  "Without recency decay": contentBased({ useRecencyDecay: false }),
  "Without popularity boost": contentBased({ usePopularityBoost: false }),
  "Without either": contentBased({ useRecencyDecay: false, usePopularityBoost: false }),
};

// ------------------------------------------------------------------------------------------ evaluation
type Row = { ranked: string[]; ms: number };
type Metric = "precision" | "recall" | "hitRate" | "map" | "ndcg" | "diversity";
type PerUser = Record<number, Record<Metric, number[]>>;

async function runStrategy(recommender: Recommender, users: EvalUser[]): Promise<Row[]> {
  const rows: Row[] = [];
  for (const user of users) {
    const started = performance.now();
    const ranked = await recommender({
      userId: user.userId,
      training: user.training,
      candidates: user.candidates,
      interactedProducts: user.interactedProducts,
      now: user.splitTime,
    });
    rows.push({ ranked: ranked.slice(0, MAX_K), ms: performance.now() - started });
  }
  return rows;
}

function scoreRows(rows: Row[], users: EvalUser[], vectorOf: Map<string, number[]>): PerUser {
  const perUser: PerUser = {};
  for (const k of KS) {
    perUser[k] = { precision: [], recall: [], hitRate: [], map: [], ndcg: [], diversity: [] };
    rows.forEach((row, i) => {
      const relevant = users[i].relevant;
      perUser[k].precision.push(precisionAtK(row.ranked, relevant, k));
      perUser[k].recall.push(recallAtK(row.ranked, relevant, k));
      perUser[k].hitRate.push(hitRateAtK(row.ranked, relevant, k));
      perUser[k].map.push(averagePrecisionAtK(row.ranked, relevant, k));
      perUser[k].ndcg.push(ndcgAtK(row.ranked, relevant, k));
      perUser[k].diversity.push(intraListDiversity(row.ranked.slice(0, k).map((id) => vectorOf.get(id) ?? [])));
    });
  }
  return perUser;
}

const f3 = (n: number) => n.toFixed(3);
const f1 = (n: number) => n.toFixed(1);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(3)}`;
const table = (headers: string[], rows: string[][]) =>
  [`| ${headers.join(" | ")} |`, `| ${headers.map((_, i) => (i === 0 ? "---" : "---:")).join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

const verdict = (ci: { low: number; high: number }) => (ci.low > 0 ? "better" : ci.high < 0 ? "worse" : "no clear difference");
//reads naturally in a sentence: "<better than> random", "<no clear difference from> popularity"
const versus = (ci: { low: number; high: number }) => (ci.low > 0 ? "better than" : ci.high < 0 ? "worse than" : "no clear difference from");

const paired = (a: number[], b: number[]) => bootstrapMeanCI(a.map((value, i) => value - b[i]));

async function main() {
  const dataset = await loadDataset();
  const { users, catalog } = dataset;
  if (users.length < 5) throw new Error(`only ${users.length} usable buyers; run \`npm run seed\` first`);

  const vocab = buildVocab(catalog);
  const vectorOf = new Map(catalog.map((product) => [product.id, vectorizeProduct(product, vocab)]));

  console.log(`Evaluating ${users.length} buyers (of ${dataset.totalBuyersWithHistory} with history) against ${catalog.length} products\n`);

  //first call pays TensorFlow's one-off start-up cost; keep it out of the timings
  await MAIN_STRATEGIES["Content-based (production model)"]({
    userId: users[0].userId,
    training: users[0].training,
    candidates: users[0].candidates,
    interactedProducts: users[0].interactedProducts,
    now: users[0].splitTime,
  });

  // ---------------------------------------------------------------------------------------- main comparison
  const main: Record<string, { rows: Row[]; perUser: PerUser }> = {};
  for (const [name, recommender] of Object.entries(MAIN_STRATEGIES)) {
    const rows = await runStrategy(recommender, users);
    main[name] = { rows, perUser: scoreRows(rows, users, vectorOf) };
    console.log(`  ran ${name}`);
  }

  // ---------------------------------------------------------------------------------------- ablation
  const ablation: Record<string, { rows: Row[]; perUser: PerUser }> = {};
  for (const [name, recommender] of Object.entries(ABLATIONS)) {
    const rows = await runStrategy(recommender, users);
    ablation[name] = { rows, perUser: scoreRows(rows, users, vectorOf) };
    console.log(`  ran ablation: ${name}`);
  }

  // ---------------------------------------------------------------------------------------- aggregate
  const summarise = (entry: { rows: Row[]; perUser: PerUser }) => {
    const out: Record<number, Record<string, number>> = {};
    for (const k of KS) {
      const m = entry.perUser[k];
      out[k] = {
        precision: mean(m.precision),
        recall: mean(m.recall),
        hitRate: mean(m.hitRate),
        map: mean(m.map),
        ndcg: mean(m.ndcg),
        coverage: catalogCoverage(entry.rows.map((r) => r.ranked), catalog.length, k),
        diversity: mean(m.diversity),
      };
    }
    return out;
  };
  const mainSummary = Object.fromEntries(Object.entries(main).map(([name, entry]) => [name, summarise(entry)]));
  const ablationSummary = Object.fromEntries(Object.entries(ablation).map(([name, entry]) => [name, summarise(entry)]));

  const model = main["Content-based (production model)"];
  const ci = (name: string, metric: Metric) => bootstrapMeanCI(main[name].perUser[REPORT_K][metric]);

  const latencyOf = (rows: Row[]) => {
    const ms = rows.map((r) => r.ms);
    return { mean: mean(ms), p50: percentile(ms, 50), p95: percentile(ms, 95), p99: percentile(ms, 99), max: Math.max(...ms) };
  };
  const mainLatency = Object.fromEntries(Object.entries(main).map(([name, entry]) => [name, latencyOf(entry.rows)]));

  // ---------------------------------------------------------------------------------------- production-style latency
  //what a request really costs today: load every candidate product WITH its images and shop from the database,
  //then score. Compared with scoring from an already-loaded catalog, this shows where the time goes.
  const sample = users.slice(0, PRODUCTION_LATENCY_SAMPLE);
  const productionMs: number[] = [];
  const loadMs: number[] = [];
  for (const user of sample) {
    const started = performance.now();
    const ids = [...new Set(user.training.map((a) => a.productId as string))];
    const interacted = await prisma.products.findMany({ where: { id: { in: ids } }, select: { id: true, category: true, tags: true } });
    const candidates = await prisma.products.findMany({
      where: { isDeleted: false, status: "Active", id: { notIn: ids } },
      include: { images: true, Shop: true },
    });
    const loaded = performance.now();
    await scoreCandidates(user.training, interacted, candidates, { now: user.splitTime });
    productionMs.push(performance.now() - started);
    loadMs.push(loaded - started);
  }

  // ---------------------------------------------------------------------------------------- report
  const KEYS: [string, string][] = [
    ["precision", "Precision"],
    ["recall", "Recall"],
    ["hitRate", "Hit rate"],
    ["map", "MAP"],
    ["ndcg", "NDCG"],
    ["coverage", "Coverage"],
    ["diversity", "Diversity"],
  ];

  const comparisonTables = KS.map((k) =>
    [
      `#### k = ${k}`,
      "",
      table(
        ["Strategy", ...KEYS.map(([, label]) => `${label}@${k}`)],
        Object.keys(MAIN_STRATEGIES).map((name) => [name, ...KEYS.map(([key]) => f3(mainSummary[name][k][key]))]),
      ),
    ].join("\n"),
  ).join("\n\n");

  const ciRows = Object.keys(MAIN_STRATEGIES).map((name) => {
    const cell = (metric: Metric) => {
      const c = ci(name, metric);
      return `${f3(c.mean)} (${f3(c.low)} to ${f3(c.high)})`;
    };
    return [name, cell("precision"), cell("recall"), cell("ndcg"), cell("map")];
  });

  const rivals = ["Popularity baseline", "Top-category popularity baseline", "Random baseline"];
  const pairedMetrics: [Metric, string][] = [["precision", "Precision"], ["recall", "Recall"], ["ndcg", "NDCG"], ["map", "MAP"]];
  const pairedRows = rivals.flatMap((rival) =>
    pairedMetrics.map(([metric, label]) => {
      const diff = paired(model.perUser[REPORT_K][metric], main[rival].perUser[REPORT_K][metric]);
      return [rival, `${label}@${REPORT_K}`, signed(diff.mean), `${signed(diff.low)} to ${signed(diff.high)}`, verdict(diff)];
    }),
  );

  const full = ablation["Full model (decay + popularity boost)"];
  const ablationRows: string[][] = [];
  for (const k of KS) {
    for (const name of Object.keys(ABLATIONS).slice(1)) {
      const s = ablationSummary[name][k];
      const f = ablationSummary["Full model (decay + popularity boost)"][k];
      ablationRows.push([`${name}`, String(k), signed(s.precision - f.precision), signed(s.recall - f.recall), signed(s.map - f.map), signed(s.ndcg - f.ndcg), signed(s.coverage - f.coverage)]);
    }
  }
  const ablationPairedRows = Object.keys(ABLATIONS).slice(1).map((name) => {
    const d = paired(ablation[name].perUser[REPORT_K].ndcg, full.perUser[REPORT_K].ndcg);
    return [name, signed(d.mean), `${signed(d.low)} to ${signed(d.high)}`, verdict(d)];
  });

  const latencyRows = Object.entries(mainLatency).map(([name, l]) => [name, f1(l.mean), f1(l.p50), f1(l.p95), f1(l.p99), f1(l.max)]);
  const meanOf = (xs: number[]) => mean(xs);

  const head = main["Content-based (production model)"];
  const popAt = mainSummary["Popularity baseline"][REPORT_K];
  const rndAt = mainSummary["Random baseline"][REPORT_K];
  const catAt = mainSummary["Top-category popularity baseline"][REPORT_K];
  const modAt = mainSummary["Content-based (production model)"][REPORT_K];
  const vsPop = paired(head.perUser[REPORT_K].precision, main["Popularity baseline"].perUser[REPORT_K].precision);
  const vsCat = paired(head.perUser[REPORT_K].precision, main["Top-category popularity baseline"].perUser[REPORT_K].precision);
  const vsRnd = paired(head.perUser[REPORT_K].precision, main["Random baseline"].perUser[REPORT_K].precision);

  const vsCatNdcg = paired(head.perUser[REPORT_K].ndcg, main["Top-category popularity baseline"].perUser[REPORT_K].ndcg);
  const beatsNaive = vsRnd.low > 0 && vsPop.low > 0;
  const beatsHeuristic = vsCat.low > 0 || vsCatNdcg.low > 0;
  const ablationVerdicts = Object.keys(ABLATIONS).slice(1).map((name) => verdict(paired(ablation[name].perUser[REPORT_K].ndcg, full.perUser[REPORT_K].ndcg)));
  const ablationAllFlat = ablationVerdicts.every((v) => v === "no clear difference");

  const conclusion = beatsNaive
    ? beatsHeuristic
      ? "The model clearly beats random, popularity **and** the top-category heuristic on this data."
      : `The model clearly beats random and popularity, but it is **not statistically distinguishable from the top-category heuristic** (NDCG@${REPORT_K} difference ${signed(vsCatNdcg.mean)}, 95% CI ${signed(vsCatNdcg.low)} to ${signed(vsCatNdcg.high)}). The honest reading is that the recommender picks up each buyer's category preference, which a one-line rule also does. A claim should therefore say it outperforms popularity and random baselines, **not** that it outperforms simple heuristics.`
    : "The model does not clearly beat the naive baselines on this data.";

  const powerNote =
    !beatsHeuristic && vsCatNdcg.mean > 0
      ? ` As a rough estimate only: if the observed NDCG@${REPORT_K} advantage over the heuristic (${signed(vsCatNdcg.mean)}) were real, separating it from zero would take on the order of ${Math.ceil((users.length * Math.pow((vsCatNdcg.high - vsCatNdcg.low) / 2 / vsCatNdcg.mean, 2)) / 10) * 10} buyers, because the interval narrows with the square root of the sample size. That is an extrapolation, not a result.`
      : "";

  //the largest amount the popularity term can add on THIS catalog (it is log10(sales + 1) * 0.05 per product)
  const maxBoost = Math.log10(Math.max(...catalog.map((p) => p.totalSales)) + 1) * 0.05;

  const ablationNote = ablationAllFlat
    ? "**Neither recency decay nor the popularity boost shows a measurable contribution on this dataset** (every interval above includes zero). That is plausible rather than alarming: the data generator gives each buyer a fixed preference with no drift over time, so there is nothing for recency weighting to exploit, and the popularity term is small (at most " + f3(maxBoost) + " on this catalog, added to a similarity score that ranges from 0 to 1). It does mean these two features cannot be claimed to improve accuracy; they would need data with real preference drift, or more buyers, to justify themselves."
    : "At least one component shows a measurable effect; see the paired intervals above.";

  const avgRelevant = mean(users.map((u) => u.relevant.length));
  const avgTraining = mean(users.map((u) => u.training.length));
  const avgCandidates = mean(users.map((u) => u.candidates.length));
  const generated = new Date().toISOString().slice(0, 10);

  const doc = `# Recommender evaluation

> Generated by \`npm run eval:ml\` on ${generated}. Do not edit by hand: re-run the command to refresh the numbers.

**Read this first.** The interaction data used here was generated by \`prisma/seed.ts\`, and the generator deliberately gives each buyer a 70% preference for one or two favourite categories. These numbers therefore show that the recommender **recovers a known, planted preference structure**. They are **not** a prediction of how it would perform on real shoppers. See [Limitations](#limitations).

## Headline

On ${users.length} buyers, ranking ${f1(avgCandidates)} candidate products per buyer, the production content-based recommender reached **precision@${REPORT_K} = ${f3(modAt.precision)}** and **NDCG@${REPORT_K} = ${f3(modAt.ndcg)}**, against ${f3(popAt.precision)} / ${f3(popAt.ndcg)} for recommending best sellers to everyone, ${f3(catAt.precision)} / ${f3(catAt.ndcg)} for a simple "best sellers in your favourite category" rule, and ${f3(rndAt.precision)} / ${f3(rndAt.ndcg)} for random order.

Paired across the same buyers, the model's precision@${REPORT_K} is **${versus(vsRnd)}** random (${signed(vsRnd.mean)}, 95% CI ${signed(vsRnd.low)} to ${signed(vsRnd.high)}), **${versus(vsPop)}** popularity (${signed(vsPop.mean)}, CI ${signed(vsPop.low)} to ${signed(vsPop.high)}) and **${versus(vsCat)}** top-category popularity (${signed(vsCat.mean)}, CI ${signed(vsCat.low)} to ${signed(vsCat.high)}).

**What this means.** ${conclusion}

## Methodology

**Question.** For a buyer, given their history up to some moment, does the recommender rank the products they go on to show interest in near the top?

**Split: leave-last-k-out, by time.** For every buyer, actions are sorted by timestamp. The last ${dataset.options.holdOut} *positive* actions are held out as the ground truth. A positive action is a \`purchase\`, \`add_to_cart\` or \`add_to_wishlist\`. Views are too weak a signal to count as success and removals are negative, so neither is ground truth. The model sees only actions **strictly before the earliest held-out action**. Anything later, including views of the held-out products, is discarded so it cannot leak into training. A temporal split is used instead of a random holdout because a random holdout would train on the future to predict the past, which flatters the model.

**Ground truth.** A held-out product only counts if the buyer had not already shown positive interest in it earlier (it would not be a *new* recommendation otherwise). Buyers left with no such product are excluded.

**Candidate set (the same for every strategy).** The products ranked for a buyer are the whole active catalog minus products the buyer had an earlier **positive** interaction with. The production recommender excludes everything the buyer has interacted with, *including plain views*. In a held-out evaluation that would make any held-out product the buyer had merely looked at earlier impossible to retrieve, which lowers recall for reasons unrelated to model quality, so this evaluation excludes only positives. All strategies, including the baselines, rank the identical set so the comparison is fair.

**Who is included.** Buyers with at least ${dataset.options.minActions} actions and at least ${dataset.options.minTraining} actions before the split. Cold-start buyers are excluded, because the production system handles them with the popularity fallback and there is nothing to model. Of ${dataset.totalBuyersWithHistory} buyers with a history, ${users.length} were usable (skipped: ${Object.entries(dataset.skipped).map(([reason, count]) => `${count} ${reason}`).join(", ")}).

**Dataset facts.** ${catalog.length} active products. On average ${f1(avgTraining)} training actions and ${f1(avgRelevant)} ground-truth products per buyer.

**The model under test.** \`scoreCandidates\` in \`apps/reccomendation-service/src/services/reccomendationService.ts\`, the same function production calls. It turns each product into a one-hot vector over categories and tags, builds the buyer's interest vector as a sum of those vectors weighted by action type and recency, and ranks candidates by cosine similarity (computed with TensorFlow.js) plus a small log-scaled popularity term. It is a content-based similarity ranker. It has no learned parameters, so "training" here means building the interest vector from the history. The recency decay is \`exp(-age / 14 days)\`: a 14-day time constant, which is a half-life of about 9.7 days.

**Baselines.**
- *Random*: a reproducible random order (seed ${RANDOM_SEED}). The floor.
- *Popularity*: best sellers first, then rating, identical for every buyer. This is what the production code shows a brand-new user.
- *Top-category popularity*: the buyer's most-interacted category's best sellers first, then the next category, and so on. A strong, very simple heuristic. If the model cannot beat it, the machine learning is not earning its keep.

**Metrics** (all averaged over buyers; k = 5, 10, 20). *Precision@k*: share of the k slots that are relevant. *Recall@k*: share of the buyer's relevant products found. *Hit rate@k*: share of buyers with at least one hit. *MAP@k*: average precision, which rewards hits near the top. *NDCG@k*: hits near the top count more, normalised against a perfect ranking. *Coverage@k*: share of the catalog recommended to anyone. *Diversity@k*: 1 minus the mean pairwise cosine similarity of the items in a list.

**Uncertainty.** With only ${users.length} buyers the averages are noisy. Intervals are 95% percentile-bootstrap intervals (2000 resamples of buyers, fixed seed). Model-versus-baseline differences are *paired*: computed per buyer, then bootstrapped.

## Results

### Mean metrics

${comparisonTables}

### Precision, recall, NDCG and MAP at k = ${REPORT_K} with 95% confidence intervals

${table(["Strategy", `Precision@${REPORT_K}`, `Recall@${REPORT_K}`, `NDCG@${REPORT_K}`, `MAP@${REPORT_K}`], ciRows)}

### Is the model better than each baseline? (paired by buyer, k = ${REPORT_K})

${table(["Versus", "Metric", "Mean difference", "95% CI", "Verdict"], pairedRows)}

"better" means the whole interval is above zero; "no clear difference" means the interval includes zero.

## Ablation: what does each part of the model contribute?

Differences are *variant minus full model*, so a negative number means removing that part made the model worse.

${table(["Variant", "k", "Δ Precision", "Δ Recall", "Δ MAP", "Δ NDCG", "Δ Coverage"], ablationRows)}

Paired effect on NDCG@${REPORT_K}, with 95% confidence intervals:

${table(["Variant", "Δ NDCG", "95% CI", "Verdict"], ablationPairedRows)}

${ablationNote}

Note on recency decay: the decay multiplies every action's weight by a factor that depends on its age, and cosine similarity ignores overall scale. The decay therefore only changes rankings through the *relative* weighting of older and newer actions inside one buyer's history.

## Latency

Scoring one buyer from an already-loaded catalog (${users.length} buyers, one call each, milliseconds). This is the cost of the ranking logic alone:

${table(["Strategy", "Mean", "p50", "p95", "p99", "Max"], latencyRows)}

What a request really costs today, measured on ${sample.length} buyers: loading every candidate product with its images and shop from MongoDB, then scoring.

${table(["Step", "Mean (ms)", "p50 (ms)", "p95 (ms)"], [
    ["Database load (products + images + shop)", f1(meanOf(loadMs)), f1(percentile(loadMs, 50)), f1(percentile(loadMs, 95))],
    ["Whole request (load + score)", f1(meanOf(productionMs)), f1(percentile(productionMs, 50)), f1(percentile(productionMs, 95))],
  ])}

${f1((meanOf(loadMs) / meanOf(productionMs)) * 100)}% of a request is spent loading data, not ranking. In production a retrain job caches each buyer's top 50, so the typical request is a cache read; the cost above is paid on cache misses and by the 30-minute retrain job.

## Limitations

- **Synthetic interaction data.** The histories come from \`prisma/seed.ts\`, which plants a 70% category preference. A model that recovers a planted preference is only evidence that the mechanism works. It says nothing about real shopper behaviour, which is noisier and less structured.
- **Small sample.** ${users.length} buyers and about ${f1(avgRelevant)} ground-truth products each. Treat differences smaller than the confidence intervals as noise.${powerNote}
- **Single domain, single dataset.** One synthetic marketplace, ten categories, ${catalog.length} products.
- **No online evaluation.** There is no A/B test, so nothing here measures clicks, conversion or revenue. Offline ranking metrics are not business outcomes.
- **Cold-start buyers are excluded.** Buyers with little history get the popularity fallback in production and are not evaluated here.
- **Popularity leaks slightly.** \`totalSales\` is the *current* sales count, which includes the held-out purchases themselves and sales after the split. That favours the popularity baseline and the model's popularity term equally, so it makes the comparison conservative rather than flattering.
- **Time ordering of the catalog is ignored.** The generator picks products without regard to when they were created, so a few "future" products can appear in a buyer's past.
- **Accuracy is not the whole story.** Coverage and diversity are reported, but nothing here measures fairness to sellers or the user experience.

## Reproduce

\`\`\`bash
npm run seed       # regenerate the deterministic dataset
npm run eval:ml    # re-run this evaluation (about a minute)
npm run test:tools # unit tests for the metrics, the split and the baselines
\`\`\`

Raw numbers: \`tools/eval/results.json\`.
`;

  const results = {
    generatedAt: new Date().toISOString(),
    settings: { ...dataset.options, ks: KS, reportK: REPORT_K, randomSeed: RANDOM_SEED, bootstrapResamples: 2000 },
    dataset: {
      buyersEvaluated: users.length,
      buyersWithHistory: dataset.totalBuyersWithHistory,
      skipped: dataset.skipped,
      catalogSize: catalog.length,
      avgTrainingActions: avgTraining,
      avgGroundTruthPerBuyer: avgRelevant,
      avgCandidatesPerBuyer: avgCandidates,
    },
    comparison: mainSummary,
    comparisonLatencyMs: mainLatency,
    ablation: ablationSummary,
    productionStyleLatencyMs: {
      sampleSize: sample.length,
      databaseLoad: { mean: meanOf(loadMs), p50: percentile(loadMs, 50), p95: percentile(loadMs, 95) },
      wholeRequest: { mean: meanOf(productionMs), p50: percentile(productionMs, 50), p95: percentile(productionMs, 95) },
    },
  };

  const docsDir = path.join(process.cwd(), "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "ml-evaluation.md"), doc);
  fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(results, null, 2));

  console.log("\n" + doc.split("## Methodology")[0]);
  console.log("## Results\n\n### Mean metrics\n\n" + comparisonTables);
  console.log("\n### k = " + REPORT_K + " with 95% confidence intervals\n\n" + table(["Strategy", `Precision@${REPORT_K}`, `Recall@${REPORT_K}`, `NDCG@${REPORT_K}`, `MAP@${REPORT_K}`], ciRows));
  console.log("\n### Model vs baselines (paired)\n\n" + table(["Versus", "Metric", "Mean difference", "95% CI", "Verdict"], pairedRows));
  console.log("\n### Ablation (variant minus full)\n\n" + table(["Variant", "k", "Δ Precision", "Δ Recall", "Δ MAP", "Δ NDCG", "Δ Coverage"], ablationRows));
  console.log("\n### Ablation, paired NDCG@" + REPORT_K + "\n\n" + table(["Variant", "Δ NDCG", "95% CI", "Verdict"], ablationPairedRows));
  console.log("\n### Latency (ms)\n\n" + table(["Strategy", "Mean", "p50", "p95", "p99", "Max"], latencyRows));
  console.log(`\nproduction-style request: load ${f1(meanOf(loadMs))} ms + score = ${f1(meanOf(productionMs))} ms mean over ${sample.length} buyers`);
  console.log("\nwrote docs/ml-evaluation.md and tools/eval/results.json");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
