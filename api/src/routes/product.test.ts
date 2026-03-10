import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter, { resetProducts } from './product';
import { products as seedProducts } from '../seedData';

let app: express.Express;

describe('Product API', () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/products', productRouter);
    resetProducts();
  });

  describe('GET /products/search', () => {
    it('should return 400 when name query parameter is missing', async () => {
      const response = await request(app).get('/products/search');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Query parameter "name" is required' });
    });

    it('should return an empty array when no products match', async () => {
      const response = await request(app).get('/products/search?name=zzznomatch');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return matching products for a known seed-data name', async () => {
      const response = await request(app).get('/products/search?name=SmartFeeder');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((product: any) => {
        expect(product.name.toLowerCase()).toContain('smartfeeder');
      });
    });

    it('should perform a case-insensitive search', async () => {
      const response = await request(app).get('/products/search?name=smartfeeder');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject(seedProducts.find(p => p.name === 'SmartFeeder One')!);
    });

    it('should return multiple products for a partial name match', async () => {
      const response = await request(app).get('/products/search?name=smart');
      expect(response.status).toBe(200);
      const names = response.body.map((p: any) => p.name.toLowerCase());
      names.forEach((name: string) => expect(name).toContain('smart'));
    });
  });
});
