import { buildVocab, vectorizeProduct, scoreCandidates, generateRecommendations } from '../../apps/reccomendation-service/src/services/reccomendationService';
import { fetchUserActivity } from '../../apps/reccomendation-service/src/services/fetch-user-activity';
import prisma from '@packages/libs/prisma';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: { products: { findMany: jest.fn() }, userAnalytics: { update: jest.fn() } },
}));
jest.mock('../../apps/reccomendation-service/src/services/fetch-user-activity', () => ({ fetchUserActivity: jest.fn() }));

const NOW = Date.UTC(2026, 0, 31);
const DAY = 24 * 3600 * 1000;
const product = (id: string, category: string, tags: string[] = [], totalSales = 0, rating = 5) => ({ id, category, tags, totalSales, rating });
const at = (productId: string, action: string, daysAgo = 0) => ({ productId, action, timestamp: NOW - daysAgo * DAY });
const topId = async (...args: Parameters<typeof scoreCandidates>) => (await scoreCandidates(...args)).ranked[0].product.id;

describe('vocabulary and vectors', () => {
  it('lowercases and de-duplicates categories and tags', () => {
    const vocab = buildVocab([product('1', 'Shoes', ['Red', 'red']), product('2', 'shoes', ['Blue'])]);
    expect(vocab.categories).toEqual(['shoes']);
    expect(vocab.tags).toEqual(['red', 'blue']);
  });

  it('vectorizes as one-hot categories followed by tag flags', () => {
    const vocab = { categories: ['a', 'b'], tags: ['x', 'y'] };
    expect(vectorizeProduct(product('1', 'B', ['y']), vocab)).toEqual([0, 1, 0, 1]);
  });
});

describe('cosine similarity (hand computed)', () => {
  //vocab: categories [a, b], tags [x]. One purchase (weight 6, now) of {a, x} gives user vector [6, 0, 6].
  const interacted = [product('i', 'a', ['x'])];
  const actions = [at('i', 'purchase')];
  const candidates = [product('c1', 'a'), product('c2', 'a', ['x']), product('c3', 'b', ['x'])];

  it('matches the analytic values', async () => {
    const { ranked } = await scoreCandidates(actions, interacted, candidates, { now: NOW, usePopularityBoost: false });
    const score = Object.fromEntries(ranked.map((r) => [r.product.id, r.score]));
    expect(score.c2).toBeCloseTo(1, 5); // [6,0,6].[1,0,1] / (6*sqrt2 * sqrt2) = 1
    expect(score.c1).toBeCloseTo(Math.SQRT1_2, 5); // 6 / (6*sqrt2 * 1)
    expect(score.c3).toBeCloseTo(0.5, 5); // [6,0,6].[0,1,1] / (6*sqrt2 * sqrt2) = 6/12
    expect(ranked[0].product.id).toBe('c2');
  });

  it('gives an orthogonal candidate a score of zero', async () => {
    const { ranked } = await scoreCandidates([at('i', 'product_view')], [product('i', 'a')], [product('far', 'zzz'), product('near', 'a')], { now: NOW, usePopularityBoost: false });
    expect(ranked.find((r) => r.product.id === 'far')!.score).toBeCloseTo(0, 5);
    expect(ranked[0].product.id).toBe('near');
  });
});

describe('action weighting', () => {
  const interacted = [product('A', 'catA'), product('B', 'catB')];
  const candidates = [product('cA', 'catA'), product('cB', 'catB')];
  const opts = { now: NOW, usePopularityBoost: false };

  it('lets a purchase outweigh a cart add, and a cart add outweigh a view', async () => {
    expect(await topId([at('A', 'purchase'), at('B', 'add_to_cart')], interacted, candidates, opts)).toBe('cA');
    expect(await topId([at('A', 'product_view'), at('B', 'add_to_cart')], interacted, candidates, opts)).toBe('cB');
    expect(await topId([at('A', 'add_to_wishlist'), at('B', 'product_view')], interacted, candidates, opts)).toBe('cA');
  });

  it('treats removing from cart as negative interest', async () => {
    //B: view(1) then remove_from_cart(-2) = -1 net; A: a single view = +1
    expect(await topId([at('A', 'product_view'), at('B', 'product_view'), at('B', 'remove_from_cart')], interacted, candidates, opts)).toBe('cA');
  });

  it('ignores unknown actions and actions on unknown products', async () => {
    const { ranked } = await scoreCandidates([at('A', 'teleport'), at('ghost', 'purchase'), at('B', 'product_view')], interacted, candidates, opts);
    expect(ranked[0].product.id).toBe('cB');
  });
});

describe('recency decay (14-day time constant)', () => {
  const interacted = [product('A', 'catA'), product('B', 'catB')];
  const candidates = [product('cA', 'catA'), product('cB', 'catB')];

  it('discounts old actions: a stale purchase loses to a fresh view', async () => {
    //purchase 60 days ago = 6*e^(-60/14) = 0.083, a fresh view = 1
    const actions = [at('A', 'purchase', 60), at('B', 'product_view', 0)];
    expect(await topId(actions, interacted, candidates, { now: NOW, usePopularityBoost: false })).toBe('cB');
  });

  it('is switched off by useRecencyDecay: false, where the purchase then wins', async () => {
    const actions = [at('A', 'purchase', 60), at('B', 'product_view', 0)];
    expect(await topId(actions, interacted, candidates, { now: NOW, usePopularityBoost: false, useRecencyDecay: false })).toBe('cA');
  });

  it('weights an action 14 days old at 1/e of a fresh one', async () => {
    //fresh view of A (weight 1) vs a 14-day-old view of B (weight 1/e = 0.368); cosine only sees direction, so use a mixed tag
    const iA = product('A', 'catA', ['t']);
    const iB = product('B', 'catB', ['t']);
    const cands = [product('c', 'catA')];
    const { ranked } = await scoreCandidates([at('A', 'product_view', 0), at('B', 'product_view', 14)], [iA, iB], cands, { now: NOW, usePopularityBoost: false });
    //user vector over [catA, catB, t] = [1, e^-1, 1 + e^-1]; candidate = [1, 0, 0]
    const e = Math.exp(-1);
    const expected = 1 / Math.sqrt(1 + e * e + (1 + e) * (1 + e));
    expect(ranked[0].score).toBeCloseTo(expected, 5);
  });
});

describe('popularity boost', () => {
  const interacted = [product('i', 'a')];
  const actions = [at('i', 'product_view')];
  const candidates = [product('low', 'a', [], 0), product('high', 'a', [], 999)];

  it('adds log10(sales + 1) * 0.05 to the similarity', async () => {
    const { ranked } = await scoreCandidates(actions, interacted, candidates, { now: NOW });
    const high = ranked.find((r) => r.product.id === 'high')!;
    const low = ranked.find((r) => r.product.id === 'low')!;
    expect(high.score - low.score).toBeCloseTo(Math.log10(1000) * 0.05, 5);
    expect(ranked[0].product.id).toBe('high');
  });

  it('is removed by usePopularityBoost: false', async () => {
    const { ranked } = await scoreCandidates(actions, interacted, candidates, { now: NOW, usePopularityBoost: false });
    expect(ranked[0].score).toBeCloseTo(ranked[1].score, 8);
  });
});

describe('cold start', () => {
  const candidates = [product('mid', 'a', [], 5, 4), product('best', 'b', [], 50, 3), product('tie-high-rating', 'c', [], 5, 5)];

  it('falls back to popularity (sales, then rating) when the user has no history', async () => {
    const result = await scoreCandidates([], [], candidates, { now: NOW });
    expect(result.usedFallback).toBe(true);
    expect(result.ranked.map((r) => r.product.id)).toEqual(['best', 'tie-high-rating', 'mid']);
  });

  it('falls back when there are no candidates to rank', async () => {
    const result = await scoreCandidates([at('i', 'purchase')], [product('i', 'a')], [], { now: NOW });
    expect(result.usedFallback).toBe(true);
    expect(result.ranked).toEqual([]);
  });

  it('falls back when no product has a category or tags to compare', async () => {
    const result = await scoreCandidates([at('i', 'purchase')], [{ id: 'i', category: '', tags: [], totalSales: 0, rating: 5 }], [{ id: 'c', category: '', tags: [], totalSales: 3, rating: 5 }], { now: NOW });
    expect(result.usedFallback).toBe(true);
  });

  it('is not used when there is history', async () => {
    const result = await scoreCandidates([at('i', 'purchase')], [product('i', 'a')], candidates, { now: NOW });
    expect(result.usedFallback).toBe(false);
  });
});

describe('generateRecommendations', () => {
  const mocked = { activity: fetchUserActivity as jest.Mock, find: prisma.products.findMany as jest.Mock, update: prisma.userAnalytics.update as jest.Mock };

  beforeEach(() => {
    jest.resetAllMocks();
    mocked.update.mockResolvedValue({});
  });

  it('excludes products the user already interacted with from the candidate query', async () => {
    mocked.activity.mockResolvedValue([at('p1', 'purchase'), at('p2', 'product_view'), at('p1', 'product_view')]);
    mocked.find.mockResolvedValueOnce([product('p1', 'a'), product('p2', 'a')]).mockResolvedValueOnce([product('p3', 'a')]);

    await generateRecommendations('user1', 5);

    const candidateQuery = mocked.find.mock.calls[1][0];
    expect(candidateQuery.where.id.notIn.sort()).toEqual(['p1', 'p2']);
    expect(candidateQuery.where).toMatchObject({ isDeleted: false, status: 'Active' });
  });

  it('caches a 50-item snapshot but returns only the requested limit', async () => {
    mocked.activity.mockResolvedValue([at('p0', 'purchase')]);
    const many = Array.from({ length: 80 }, (_, i) => product(`c${i}`, 'a', [], i));
    mocked.find.mockResolvedValueOnce([product('p0', 'a')]).mockResolvedValueOnce(many);

    const result = await generateRecommendations('user1', 10);

    expect(result).toHaveLength(10);
    const cached = mocked.update.mock.calls[0][0].data.reccomendations;
    expect(cached).toHaveLength(50);
  });

  it('serves popularity without caching for a user with no history', async () => {
    mocked.activity.mockResolvedValue([]);
    //no history means the interacted-products query is skipped, so the candidate query is the only database call
    mocked.find.mockResolvedValueOnce([product('a', 'x', [], 1), product('b', 'x', [], 9)]);
    const result = await generateRecommendations('newbie', 5);
    expect(result.map((p: any) => p.id)).toEqual(['b', 'a']);
    expect(mocked.update).not.toHaveBeenCalled();
  });
});
