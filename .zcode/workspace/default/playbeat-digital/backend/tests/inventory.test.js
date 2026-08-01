const { setup, teardown, clearDb, seedAdmin } = require('./helpers');
const ProductCategory = require('../src/models/ProductCategory');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const inventoryService = require('../src/services/inventory.service');

describe('Inventory reservation service', () => {
  beforeAll(setup);
  afterAll(teardown);
  beforeEach(clearDb);

  let product;
  let orderId;

  beforeEach(async () => {
    const category = await ProductCategory.create({ name: 'Gift Cards', slug: 'gift-cards' });
    product = await Product.create({
      name: 'Steam Card', slug: 'steam-card', category: category._id,
      price: 20, status: 'active', stockQuantity: 2,
    });
    await inventoryService.addItems({
      productId: product._id, type: 'activation_code',
      payloads: ['CODE-1', 'CODE-2'], batchId: 'test',
    });
    orderId = new (require('mongoose').Types.ObjectId)();
  });

  it('reserves units atomically', async () => {
    const reserved = await inventoryService.reserve({
      productId: product._id, qty: 2, orderId,
    });
    expect(reserved).toHaveLength(2);
    const available = await Inventory.countDocuments({ product: product._id, status: 'available' });
    expect(available).toBe(0);
  });

  it('rolls back on partial shortfall', async () => {
    const firstOrder = new (require('mongoose').Types.ObjectId)();
    await inventoryService.reserve({ productId: product._id, qty: 2, orderId: firstOrder });

    await expect(
      inventoryService.reserve({ productId: product._id, qty: 1, orderId })
    ).rejects.toThrow();

    const available = await Inventory.countDocuments({ product: product._id, status: 'available' });
    expect(available).toBe(0); // both already reserved by firstOrder
  });

  it('fulfils reserved inventory into decrypted assets', async () => {
    await inventoryService.reserve({ productId: product._id, qty: 2, orderId });
    const assets = await inventoryService.fulfill({ productId: product._id, qty: 2, orderId });
    expect(assets).toHaveLength(2);
    expect(assets.map((a) => a.payload).sort()).toEqual(['CODE-1', 'CODE-2']);
    const sold = await Inventory.countDocuments({ product: product._id, status: 'sold' });
    expect(sold).toBe(2);
  });

  it('releases reservations back to available', async () => {
    await inventoryService.reserve({ productId: product._id, qty: 1, orderId });
    await inventoryService.release(orderId);
    const available = await Inventory.countDocuments({ product: product._id, status: 'available' });
    expect(available).toBe(2);
  });
});
