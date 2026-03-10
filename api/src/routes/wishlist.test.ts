import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlist } from './wishlist';
import { products as seedProducts } from '../seedData';

let app: express.Express;

describe('Wishlist API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/wishlist', wishlistRouter);
        resetWishlist();
    });

    it('should return 400 when userId is missing on GET', async () => {
        const response = await request(app).get('/wishlist');
        expect(response.status).toBe(400);
    });

    it('should return an empty list for a user with no wishlist items', async () => {
        const response = await request(app).get('/wishlist?userId=test@example.com');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('should add a product to the wishlist', async () => {
        const product = seedProducts[0];
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: product.productId });
        expect(response.status).toBe(201);
        expect(response.body.userId).toBe('test@example.com');
        expect(response.body.productId).toBe(product.productId);
        expect(typeof response.body.priceAtTimeOfAdding).toBe('number');
        expect(typeof response.body.addedAt).toBe('string');
        expect(response.body.wishlistItemId).toBe(1);
    });

    it('should return 409 when adding a duplicate product', async () => {
        const product = seedProducts[0];
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: product.productId });
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: product.productId });
        expect(response.status).toBe(409);
    });

    it('should return 404 when adding a non-existing product', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 99999 });
        expect(response.status).toBe(404);
    });

    it('should return 400 when userId is missing on POST', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ productId: seedProducts[0].productId });
        expect(response.status).toBe(400);
    });

    it('should return 400 when productId is invalid on POST', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: -1 });
        expect(response.status).toBe(400);
    });

    it('should return enriched wishlist items with priceDrop field', async () => {
        const product = seedProducts[0];
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: product.productId });
        const response = await request(app).get('/wishlist?userId=test@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        const item = response.body[0];
        expect(item.name).toBe(product.name);
        expect(item.sku).toBe(product.sku);
        expect(typeof item.currentPrice).toBe('number');
        expect(typeof item.priceDrop).toBe('number');
    });

    it('should delete a wishlist item by ID', async () => {
        const product = seedProducts[0];
        const addResponse = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: product.productId });
        const wishlistItemId = addResponse.body.wishlistItemId;
        const deleteResponse = await request(app).delete(`/wishlist/${wishlistItemId}`);
        expect(deleteResponse.status).toBe(204);

        const getResponse = await request(app).get('/wishlist?userId=test@example.com');
        expect(getResponse.body.length).toBe(0);
    });

    it('should return 404 when deleting a non-existing wishlist item', async () => {
        const response = await request(app).delete('/wishlist/9999');
        expect(response.status).toBe(404);
    });

    it('should clear all wishlist items for a user', async () => {
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: seedProducts[0].productId });
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: seedProducts[1].productId });

        const clearResponse = await request(app).delete('/wishlist?userId=test@example.com');
        expect(clearResponse.status).toBe(204);

        const getResponse = await request(app).get('/wishlist?userId=test@example.com');
        expect(getResponse.body.length).toBe(0);
    });

    it('should not affect other users when clearing a wishlist', async () => {
        await request(app)
            .post('/wishlist')
            .send({ userId: 'user1@example.com', productId: seedProducts[0].productId });
        await request(app)
            .post('/wishlist')
            .send({ userId: 'user2@example.com', productId: seedProducts[1].productId });

        await request(app).delete('/wishlist?userId=user1@example.com');

        const getResponse = await request(app).get('/wishlist?userId=user2@example.com');
        expect(getResponse.body.length).toBe(1);
    });

    it('should return 400 when userId is missing on DELETE all', async () => {
        const response = await request(app).delete('/wishlist');
        expect(response.status).toBe(400);
    });

    it('should snapshot priceAtTimeOfAdding with discount applied', async () => {
        const discountedProduct = seedProducts.find(p => p.discount);
        if (!discountedProduct) return;
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: discountedProduct.productId });
        expect(response.status).toBe(201);
        const expectedPrice = discountedProduct.price * (1 - (discountedProduct.discount ?? 0));
        expect(response.body.priceAtTimeOfAdding).toBeCloseTo(expectedPrice, 5);
    });
});
