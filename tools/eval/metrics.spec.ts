//Path: tools/eval/metrics.spec.ts
//every expected value below was worked out by hand (the working is in the comments)
import {
  precisionAtK,
  recallAtK,
  hitRateAtK,
  averagePrecisionAtK,
  mapAtK,
  ndcgAtK,
  catalogCoverage,
  intraListDiversity,
  mean,
  percentile,
  bootstrapMeanCI,
} from "./metrics";

//ranked list a,b,c,d,e against ground truth {a, c, x}: hits at rank 1 and rank 3, and x is never recommended
const recommended = ["a", "b", "c", "d", "e"];
const relevant = ["a", "c", "x"];

describe("precisionAtK", () => {
  it("is hits divided by k", () => {
    expect(precisionAtK(recommended, relevant, 5)).toBeCloseTo(2 / 5); //a, c
    expect(precisionAtK(recommended, relevant, 3)).toBeCloseTo(2 / 3); //a, c
    expect(precisionAtK(recommended, relevant, 2)).toBeCloseTo(1 / 2); //a
    expect(precisionAtK(recommended, relevant, 1)).toBe(1);
  });

  it("counts empty slots as misses when the list is shorter than k", () => {
    expect(precisionAtK(["a"], relevant, 5)).toBeCloseTo(1 / 5);
  });

  it("is 0 for a list with no hits", () => {
    expect(precisionAtK(["p", "q"], relevant, 2)).toBe(0);
  });
});

describe("recallAtK", () => {
  it("is hits divided by the number of relevant items", () => {
    expect(recallAtK(recommended, relevant, 5)).toBeCloseTo(2 / 3); //a, c of {a, c, x}
    expect(recallAtK(recommended, relevant, 2)).toBeCloseTo(1 / 3); //only a
  });

  it("is 0 when there is no ground truth", () => {
    expect(recallAtK(recommended, [], 5)).toBe(0);
  });
});

describe("hitRateAtK", () => {
  it("is 1 when any relevant item is in the top k and 0 otherwise", () => {
    expect(hitRateAtK(recommended, relevant, 1)).toBe(1); //a is first
    expect(hitRateAtK(["p", "q", "a"], relevant, 2)).toBe(0); //a is third
    expect(hitRateAtK(["p", "q", "a"], relevant, 3)).toBe(1);
  });
});

describe("averagePrecisionAtK", () => {
  it("averages precision at each hit and divides by min(|relevant|, k)", () => {
    //hit at rank 1: precision 1/1 = 1. hit at rank 3: precision 2/3. sum = 5/3. divide by min(3, 5) = 3 -> 5/9
    expect(averagePrecisionAtK(recommended, relevant, 5)).toBeCloseTo(5 / 9);
  });

  it("uses k as the divisor when k is smaller than the ground truth", () => {
    //top 2 = a, b. one hit at rank 1 -> sum = 1. divide by min(3, 2) = 2 -> 0.5
    expect(averagePrecisionAtK(recommended, relevant, 2)).toBeCloseTo(0.5);
  });

  it("is highest when the hits come first", () => {
    const hitsFirst = averagePrecisionAtK(["a", "c", "p", "q"], relevant, 4);
    const hitsLast = averagePrecisionAtK(["p", "q", "a", "c"], relevant, 4);
    expect(hitsFirst).toBeGreaterThan(hitsLast);
    expect(hitsFirst).toBeCloseTo((1 + 1) / 3); //precision 1 at ranks 1 and 2, divided by 3
  });
});

describe("mapAtK", () => {
  it("averages average-precision over buyers", () => {
    //buyer 1: 5/9 (above). buyer 2: single hit at rank 1 out of one relevant item -> 1. mean = (5/9 + 1) / 2 = 7/9
    const value = mapAtK(
      [
        { recommended, relevant },
        { recommended: ["z", "y"], relevant: ["z"] },
      ],
      5,
    );
    expect(value).toBeCloseTo(7 / 9);
  });
});

describe("ndcgAtK", () => {
  it("matches a hand-computed value", () => {
    //DCG: hit at rank 1 = 1/log2(2) = 1, hit at rank 3 = 1/log2(4) = 0.5 -> 1.5
    //ideal DCG for 3 relevant items in the top 5: 1 + 1/log2(3) + 1/log2(4) = 1 + 0.63093 + 0.5 = 2.13093
    expect(ndcgAtK(recommended, relevant, 5)).toBeCloseTo(1.5 / (1 + 1 / Math.log2(3) + 0.5));
  });

  it("is exactly 1 for a perfect ranking", () => {
    expect(ndcgAtK(["a", "c", "x", "p"], relevant, 4)).toBeCloseTo(1);
  });

  it("is 0 when nothing relevant is recommended", () => {
    expect(ndcgAtK(["p", "q"], relevant, 2)).toBe(0);
  });

  it("scores a hit at rank 1 higher than the same hit at rank 3", () => {
    expect(ndcgAtK(["a", "p", "q"], ["a"], 3)).toBeGreaterThan(ndcgAtK(["p", "q", "a"], ["a"], 3));
  });
});

describe("catalogCoverage", () => {
  it("is the share of the catalog recommended to anyone", () => {
    //unique ids across both lists: a, b, c -> 3 of 10
    expect(catalogCoverage([["a", "b"], ["b", "c"]], 10, 2)).toBeCloseTo(0.3);
  });

  it("only looks at the top k of each list", () => {
    expect(catalogCoverage([["a", "b", "c"]], 10, 1)).toBeCloseTo(0.1);
  });
});

describe("intraListDiversity", () => {
  it("is 1 for orthogonal items and 0 for identical items", () => {
    expect(intraListDiversity([[1, 0], [0, 1]])).toBeCloseTo(1);
    expect(intraListDiversity([[1, 0], [1, 0]])).toBeCloseTo(0);
  });

  it("is 1 minus the mean pairwise cosine similarity", () => {
    //pairs: (1,0)&(0,1) = 0, (1,0)&(1,1) = 0.7071, (0,1)&(1,1) = 0.7071 -> mean 0.4714 -> diversity 0.5286
    expect(intraListDiversity([[1, 0], [0, 1], [1, 1]])).toBeCloseTo(1 - (2 * Math.SQRT1_2) / 3);
  });

  it("is 0 for a list too short to have a pair", () => {
    expect(intraListDiversity([[1, 0]])).toBe(0);
  });
});

describe("descriptive statistics", () => {
  it("mean and percentile", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([10, 20], 50)).toBe(15); //linear interpolation between ranks
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
  });

  it("bootstrap interval is reproducible and brackets the mean", () => {
    const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    const first = bootstrapMeanCI(values);
    const second = bootstrapMeanCI(values);
    expect(first).toEqual(second);
    expect(first.low).toBeLessThanOrEqual(first.mean);
    expect(first.high).toBeGreaterThanOrEqual(first.mean);
  });
});
