const mockDb = {
  products: { findUnique: jest.fn(), update: jest.fn() },
};

//product.controller creates its own PrismaClient, so the class itself is replaced
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockDb), Prisma: {} }));
jest.mock('@imagekit/nodejs', () => ({ toFile: jest.fn() }));
jest.mock('@packages/libs/imagekit', () => ({ __esModule: true, default: {} }));

//required after the mocks and the db object exist (an import would be hoisted above them)
const { deleteProduct, restoreProduct } = require('../../apps/product-service/src/controllers/product.controller');

const DAY = 24 * 60 * 60 * 1000;
const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const sellerReq = (shopId: string | undefined, productId = 'prod1'): any => ({ params: { productId }, seller: shopId ? { shop: { id: shopId } } : undefined });

beforeEach(() => jest.resetAllMocks());

describe('deleteProduct', () => {
  it('rejects a seller who does not own the product (403) and changes nothing', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: false });
    const next = jest.fn();
    await deleteProduct(sellerReq('shopB'), makeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(mockDb.products.update).not.toHaveBeenCalled();
  });

  it('rejects a request with no shop at all', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: false });
    const next = jest.fn();
    await deleteProduct(sellerReq(undefined), makeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(mockDb.products.update).not.toHaveBeenCalled();
  });

  it('returns 404 for a product that does not exist', async () => {
    mockDb.products.findUnique.mockResolvedValue(null);
    const next = jest.fn();
    await deleteProduct(sellerReq('shopA'), makeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('refuses to delete an already-deleted product', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: true });
    const next = jest.fn();
    await deleteProduct(sellerReq('shopA'), makeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(mockDb.products.update).not.toHaveBeenCalled();
  });

  it('soft-deletes the owner\'s product and schedules removal about 24 hours from now', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: false });
    mockDb.products.update.mockImplementation(async ({ data }: any) => data);
    const res = makeRes();
    const before = Date.now();
    await deleteProduct(sellerReq('shopA'), res, jest.fn());
    const after = Date.now();

    const { data } = mockDb.products.update.mock.calls[0][0];
    expect(data.isDeleted).toBe(true);
    //regression: this once was Date.now() * 24*60*60*1000, a date thousands of years away
    expect(data.deletedAt.getTime()).toBeGreaterThanOrEqual(before + DAY);
    expect(data.deletedAt.getTime()).toBeLessThanOrEqual(after + DAY);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('restoreProduct', () => {
  it('rejects a seller who does not own the product (403)', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: true });
    const next = jest.fn();
    await restoreProduct(sellerReq('shopB'), makeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(mockDb.products.update).not.toHaveBeenCalled();
  });

  it('rejects restoring a product that is not deleted', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: false });
    const res = makeRes();
    await restoreProduct(sellerReq('shopA'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockDb.products.update).not.toHaveBeenCalled();
  });

  it('restores the owner\'s deleted product and clears the deletion date', async () => {
    mockDb.products.findUnique.mockResolvedValue({ id: 'prod1', shopId: 'shopA', isDeleted: true });
    mockDb.products.update.mockResolvedValue({});
    const res = makeRes();
    await restoreProduct(sellerReq('shopA'), res, jest.fn());
    expect(mockDb.products.update.mock.calls[0][0].data).toEqual({ isDeleted: false, deletedAt: null });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
