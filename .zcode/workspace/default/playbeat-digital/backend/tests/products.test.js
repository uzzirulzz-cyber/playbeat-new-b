const { setup, teardown, clearDb } = require('./helpers');
const ProductCategory = require('../src/models/ProductCategory');
const Product = require('../src/models/Product');

describe('Products API', () => {
  let api;

  beforeAll(async () => {
    const ctx = await setup();
    api = ctx.request;
  });
  afterAll(teardown);
  beforeEach(clearDb);

  it('lists only active products', async () => {
    const category = await ProductCategory.create({ name: 'Gaming', slug: 'gaming' });
    await Product.create({
      name: 'Active Game Key', slug: 'active-game-key', category: category._id,
      price: 10, status: 'active', stockQuantity: 5,
    });
    await Product.create({
      name: 'Draft Game Key', slug: 'draft-game-key', category: category._id,
      price: 10, status: 'draft', stockQuantity: 5,
    });

    const res = await api().get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('active-game-key');
  });

  it('fetches a product by slug with related items', async () => {
    const category = await ProductCategory.create({ name: 'Software', slug: 'software' });
    await Product.create({
      name: 'Product A', slug: 'product-a', category: category._id, price: 5, status: 'active',
    });
    await Product.create({
      name: 'Product B', slug: 'product-b', category: category._id, price: 5, status: 'active',
    });

    const res = await api().get('/api/products/product-a');
    expect(res.status).toBe(200);
    expect(res.body.data.product.slug).toBe('product-a');
    expect(res.body.data.related).toHaveLength(1);
  });

  it('filters by category slug', async () => {
    const gaming = await ProductCategory.create({ name: 'Gaming', slug: 'gaming' });
    const software = await ProductCategory.create({ name: 'Software', slug: 'software' });
    await Product.create({ name: 'A', slug: 'a', category: gaming._id, price: 1, status: 'active' });
    await Product.create({ name: 'B', slug: 'b', category: software._id, price: 1, status: 'active' });

    const res = await api().get('/api/products?category=software');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category.slug).toBe('software');
  });
});
