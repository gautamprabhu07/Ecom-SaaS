import router from '../../apps/product-service/src/routes/product.routes';
import prisma from '@packages/libs/prisma';
import { client, makeProduct, makeSellerWithShop, resetDatabase, startApp } from './helpers';

jest.mock('@packages/libs/imagekit', () => ({ __esModule: true, default: {} }));

let app: Awaited<ReturnType<typeof startApp>>;

beforeAll(async () => {
  app = await startApp(router);
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});
beforeEach(resetDatabase);

const newProduct = (slug = 'blue-widget') => ({
  title: 'Blue Widget',
  short_description: 'A widget',
  detailed_description: 'A very good widget',
  slug,
  tags: ['blue', 'widget'],
  category: 'Electronics',
  subCategory: 'Gadgets',
  stock: 5,
  sale_price: 25,
  regular_price: 30,
});

const sellerClient = async () => {
  const { seller, shop } = await makeSellerWithShop();
  const http = client(app.baseUrl);
  http.signInAs(seller.id, 'seller');
  return { seller, shop, http };
};

describe('creating and updating products', () => {
  it('lets a seller create a product in their own shop', async () => {
    const { shop, http } = await sellerClient();
    const created = await http.post('/create-product', newProduct());
    expect(created.status).toBe(201);
    const row = await prisma.products.findUnique({ where: { slug: 'blue-widget' } });
    expect(row).toMatchObject({ shopId: shop.id, stock: 5, sale_price: 25, isDeleted: false });
  });

  it('rejects missing fields and duplicate slugs', async () => {
    const { http } = await sellerClient();
    expect((await http.post('/create-product', { title: 'only a title' })).status).toBe(400);
    expect((await http.post('/create-product', newProduct())).status).toBe(201);
    expect((await http.post('/create-product', newProduct())).status).toBe(400);
  });

  it('requires a seller session', async () => {
    const http = client(app.baseUrl);
    expect((await http.post('/create-product', newProduct())).status).toBe(401);
  });

  it('lets the owner update the product and refuses another seller', async () => {
    const owner = await sellerClient();
    const product = await makeProduct(owner.shop.id, owner.seller.id);

    const ok = await owner.http.put(`/update-product/${product.id}`, { title: 'Renamed', stock: 99 });
    expect(ok.status).toBe(200);
    expect(await prisma.products.findUnique({ where: { id: product.id } })).toMatchObject({ title: 'Renamed', stock: 99 });

    const intruder = await sellerClient();
    const denied = await intruder.http.put(`/update-product/${product.id}`, { title: 'Hijacked' });
    expect(denied.status).toBe(403);
    expect((await prisma.products.findUnique({ where: { id: product.id } }))!.title).toBe('Renamed');
  });
});

describe('deleting and restoring (ownership enforced)', () => {
  it('soft-deletes for the owner, hides the product from the storefront, and restores it', async () => {
    const owner = await sellerClient();
    const product = await makeProduct(owner.shop.id, owner.seller.id, { slug: 'to-delete' });
    const anonymous = client(app.baseUrl);

    expect((await anonymous.get('/get-product/to-delete')).status).toBeLessThan(300);

    const before = Date.now();
    const deleted = await owner.http.delete(`/delete-product/${product.id}`);
    expect(deleted.status).toBe(200);
    const row = await prisma.products.findUnique({ where: { id: product.id } });
    expect(row!.isDeleted).toBe(true);
    //scheduled about 24 hours ahead (regression: it once landed thousands of years in the future)
    expect(row!.deletedAt!.getTime()).toBeGreaterThan(before + 23 * 3600 * 1000);
    expect(row!.deletedAt!.getTime()).toBeLessThan(before + 25 * 3600 * 1000);

    //gone from the storefront while deleted
    expect((await anonymous.get('/get-product/to-delete')).status).toBe(404);
    const listing = await anonymous.get('/get-all-products');
    expect(listing.body.products.map((p: any) => p.id)).not.toContain(product.id);
    const search = await anonymous.get('/search-products?q=Widget');
    expect(search.body.products.map((p: any) => p.id)).not.toContain(product.id);

    expect((await owner.http.put(`/restore-product/${product.id}`)).status).toBe(200);
    expect((await prisma.products.findUnique({ where: { id: product.id } }))!.isDeleted).toBe(false);
    expect((await anonymous.get('/get-product/to-delete')).status).toBeLessThan(300);
  });

  it('refuses to delete or restore another seller\'s product', async () => {
    const owner = await sellerClient();
    const product = await makeProduct(owner.shop.id, owner.seller.id);
    const intruder = await sellerClient();

    expect((await intruder.http.delete(`/delete-product/${product.id}`)).status).toBe(403);
    expect((await prisma.products.findUnique({ where: { id: product.id } }))!.isDeleted).toBe(false);

    await prisma.products.update({ where: { id: product.id }, data: { isDeleted: true, deletedAt: new Date() } });
    expect((await intruder.http.put(`/restore-product/${product.id}`)).status).toBe(403);
    expect((await prisma.products.findUnique({ where: { id: product.id } }))!.isDeleted).toBe(true);
  });

  it('returns 404 for a product that does not exist', async () => {
    const { http } = await sellerClient();
    expect((await http.delete(`/delete-product/${'f'.repeat(24)}`)).status).toBe(404);
  });

  it('keeps a user (non-seller) session out of seller product routes', async () => {
    const user = await prisma.users.create({ data: { name: 'U', email: 'u@test.dev', password: 'x' } });
    const owner = await sellerClient();
    const product = await makeProduct(owner.shop.id, owner.seller.id);
    const http = client(app.baseUrl);
    http.signInAs(user.id, 'user');
    expect((await http.delete(`/delete-product/${product.id}`)).status).toBe(403);
  });
});
