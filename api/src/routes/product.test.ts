import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter, { resetProducts } from './product';

let app: express.Express;

describe('Product Search API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/products', productRouter);
        resetProducts();
    });

    it('should return 400 when name query parameter is missing', async () => {
        const response = await request(app).get('/products/search');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Query parameter "name" is required' });
    });

    it('should return empty array when there is no match', async () => {
        const response = await request(app).get('/products/search?name=zzznomatch');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('should return exact name match before partial matches', async () => {
        const exactMatchName = 'Smart Fountain Flow+';
        const response = await request(app).get(`/products/search?name=${encodeURIComponent(exactMatchName)}`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        // The exact match should be first
        expect(response.body[0].name.toLowerCase()).toBe(exactMatchName.toLowerCase());
    });

    it('should return only matching products and not unrelated ones', async () => {
        const response = await request(app).get('/products/search?name=smart');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((product: any) => {
            expect(product.name.toLowerCase()).toContain('smart');
        });
    });

    it('should be case-insensitive when searching', async () => {
        const lower = await request(app).get('/products/search?name=smartfeeder');
        const upper = await request(app).get('/products/search?name=SMARTFEEDER');
        const mixed = await request(app).get('/products/search?name=SmartFeeder');
        expect(lower.status).toBe(200);
        expect(upper.status).toBe(200);
        expect(mixed.status).toBe(200);
        expect(lower.body).toEqual(upper.body);
        expect(lower.body).toEqual(mixed.body);
    });
});
