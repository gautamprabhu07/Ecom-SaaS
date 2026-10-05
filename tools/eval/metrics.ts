//Path: tools/eval/metrics.ts
//ranking metrics for top-N recommendation. Everything here is a pure function.
//`recommended` is a ranked list of product ids (best first); `relevant` is the buyer's held-out ground truth.
//Relevance is binary: a recommended product is either in the ground-truth set or it is not.

const toSet = (relevant: Iterable<string>): Set<string> => new Set(relevant);

const hitsInTopK = (recommended: string[], relevant: Set<string>, k: number): number => {
  let hits = 0;
  for (const id of recommended.slice(0, k)) if (relevant.has(id)) hits++;
  return hits;
};

//share of the k recommended slots that are relevant. A list shorter than k is penalised: empty slots count as misses.
export const precisionAtK = (recommended: string[], relevant: Iterable<string>, k: number): number => {
  if (k <= 0) return 0;
  return hitsInTopK(recommended, toSet(relevant), k) / k;
};

//share of the relevant items that appear in the top k
export const recallAtK = (recommended: string[], relevant: Iterable<string>, k: number): number => {
  const truth = toSet(relevant);
  if (truth.size === 0) return 0;
  return hitsInTopK(recommended, truth, k) / truth.size;
};

//1 if at least one relevant item is in the top k, else 0
export const hitRateAtK = (recommended: string[], relevant: Iterable<string>, k: number): number =>
  hitsInTopK(recommended, toSet(relevant), k) > 0 ? 1 : 0;

//average precision at k for ONE buyer: the mean of precision@i taken at each rank i that holds a relevant item,
//divided by the most hits that were possible (min(|relevant|, k)). Rewards putting hits near the top.
export const averagePrecisionAtK = (recommended: string[], relevant: Iterable<string>, k: number): number => {
  const truth = toSet(relevant);
  if (truth.size === 0 || k <= 0) return 0;

  let hits = 0;
  let sum = 0;
  recommended.slice(0, k).forEach((id, index) => {
    if (truth.has(id)) {
      hits++;
      sum += hits / (index + 1);
    }
  });
  return sum / Math.min(truth.size, k);
};

//MAP@k: average precision at k, averaged over buyers
export const mapAtK = (cases: { recommended: string[]; relevant: Iterable<string> }[], k: number): number =>
  mean(cases.map((c) => averagePrecisionAtK(c.recommended, c.relevant, k)));

//normalised discounted cumulative gain with binary relevance: a hit at rank i is worth 1/log2(i+1),
//and the score is divided by the best score achievable for that buyer
export const ndcgAtK = (recommended: string[], relevant: Iterable<string>, k: number): number => {
  const truth = toSet(relevant);
  if (truth.size === 0 || k <= 0) return 0;

  let dcg = 0;
  recommended.slice(0, k).forEach((id, index) => {
    if (truth.has(id)) dcg += 1 / Math.log2(index + 2);
  });

  let idcg = 0;
  for (let i = 0; i < Math.min(truth.size, k); i++) idcg += 1 / Math.log2(i + 2);

  return idcg === 0 ? 0 : dcg / idcg;
};

//fraction of the catalog that shows up in at least one buyer's top-k list
export const catalogCoverage = (lists: string[][], catalogSize: number, k: number): number => {
  if (catalogSize <= 0) return 0;
  const seen = new Set<string>();
  for (const list of lists) for (const id of list.slice(0, k)) seen.add(id);
  return seen.size / catalogSize;
};

const cosine = (a: number[], b: number[]): number => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
};

//1 - the mean pairwise cosine similarity of a list's item feature vectors. 0 means every item looks identical,
//values near 1 mean the list is varied. Lists with fewer than two items have no pairs and score 0.
export const intraListDiversity = (vectors: number[][]): number => {
  if (vectors.length < 2) return 0;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      total += cosine(vectors[i], vectors[j]);
      pairs++;
    }
  }
  return 1 - total / pairs;
};

// ------------------------------------------------------------------------------------------ descriptive statistics
export const mean = (values: number[]): number => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

//p-th percentile (0-100) by linear interpolation between the closest ranks
export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
};

//small seeded generator so every bootstrap run is reproducible
const seededRandom = (seed: number) => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

//95% percentile-bootstrap confidence interval for the mean of `values` (resampling buyers with replacement)
export const bootstrapMeanCI = (values: number[], resamples = 2000, seed = 7): { mean: number; low: number; high: number } => {
  if (values.length === 0) return { mean: 0, low: 0, high: 0 };
  const random = seededRandom(seed);
  const means: number[] = [];
  for (let r = 0; r < resamples; r++) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) sum += values[Math.floor(random() * values.length)];
    means.push(sum / values.length);
  }
  return { mean: mean(values), low: percentile(means, 2.5), high: percentile(means, 97.5) };
};
