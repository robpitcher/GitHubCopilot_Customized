import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter, { resetProducts } from './product';

let app: express.Express;

describe('Product API - Search', () => {
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

    it('should return an empty array when no products match', async () => {
        const response = await request(app).get('/products/search?name=zzznomatchzzz');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('should return products where the term matches the name', async () => {
        // "SmartFeeder One" (productId 1) has "SmartFeeder" in its name
        const response = await request(app).get('/products/search?name=SmartFeeder');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        const ids = response.body.map((p: any) => p.productId);
        expect(ids).toContain(1);
        response.body.forEach((product: any) => {
            expect(product.name.toLowerCase()).toContain('smartfeeder');
        });
    });

    it('should return products where the term matches the description but not the name', async () => {
        // "commits" appears in the AutoClean Litter Dome (productId 2) description but not in its name
        const response = await request(app).get('/products/search?name=commits');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        const ids = response.body.map((p: any) => p.productId);
        expect(ids).toContain(2);
        const names = response.body.map((p: any) => p.name.toLowerCase());
        names.forEach((name: string) => {
            expect(name).not.toContain('commits');
        });
        response.body.forEach((product: any) => {
            expect(product.description?.toLowerCase()).toContain('commits');
        });
    });

    it('should be case-insensitive', async () => {
        const lower = await request(app).get('/products/search?name=smart');
        const upper = await request(app).get('/products/search?name=SMART');
        expect(lower.status).toBe(200);
        expect(upper.status).toBe(200);
        expect(lower.body).toEqual(upper.body);
    });
});
