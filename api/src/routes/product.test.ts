import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter, { resetProducts } from './product';

let app: express.Express;

describe('Product API', () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/products', productRouter);
    resetProducts();
  });

  it('should create a new product with valid payload', async () => {
    const newProduct = {
      productId: 999,
      supplierId: 1,
      name: 'New Product',
      description: 'New product description',
      price: 10.5,
      sku: 'SKU-NEW-001',
      unit: 'piece',
      imgName: 'new-product.png'
    };

    const response = await request(app).post('/products').send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(newProduct);
  });

  it('should reject invalid payload when required fields are missing', async () => {
    const invalidProduct = {
      productId: 1000,
      supplierId: 1,
      description: 'Missing name',
      price: 10.5,
      sku: 'SKU-NEW-002',
      unit: 'piece',
      imgName: 'missing-name.png'
    };

    const response = await request(app).post('/products').send(invalidProduct);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid product payload' });
  });

  it('should reject duplicate product IDs', async () => {
    const duplicateIdProduct = {
      productId: 1001,
      supplierId: 1,
      name: 'Duplicate Product',
      description: 'Duplicate ID product',
      price: 10.5,
      sku: 'SKU-NEW-003',
      unit: 'piece',
      imgName: 'duplicate-product.png'
    };

    await request(app).post('/products').send(duplicateIdProduct);
    const response = await request(app).post('/products').send(duplicateIdProduct);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Product ID already exists' });
  });
});
