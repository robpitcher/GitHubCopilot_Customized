import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlist } from './wishlist';

let app: express.Express;

describe('Wishlist API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/wishlist', wishlistRouter);
        resetWishlist();
    });

    it('should return 400 when getting wishlist without userId', async () => {
        const response = await request(app).get('/wishlist');
        expect(response.status).toBe(400);
    });

    it('should return empty array for a user with no wishlist items', async () => {
        const response = await request(app).get('/wishlist?userId=test@example.com');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('should add a product to the wishlist', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 1 });
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            wishlistItemId: 1,
            userId: 'test@example.com',
            productId: 1,
        });
        expect(response.body.addedAt).toBeDefined();
    });

    it('should not add a duplicate product to the wishlist', async () => {
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 1 });
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 1 });
        expect(response.status).toBe(201);

        const getResponse = await request(app).get('/wishlist?userId=test@example.com');
        expect(getResponse.body.length).toBe(1);
    });

    it('should get all wishlist items for a user', async () => {
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 1 });
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 2 });

        const response = await request(app).get('/wishlist?userId=test@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
    });

    it('should not return items belonging to another user', async () => {
        await request(app)
            .post('/wishlist')
            .send({ userId: 'user1@example.com', productId: 1 });
        await request(app)
            .post('/wishlist')
            .send({ userId: 'user2@example.com', productId: 2 });

        const response = await request(app).get('/wishlist?userId=user1@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].userId).toBe('user1@example.com');
    });

    it('should remove a wishlist item by ID', async () => {
        const addResponse = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 1 });
        const { wishlistItemId } = addResponse.body;

        const deleteResponse = await request(app).delete(`/wishlist/${wishlistItemId}`);
        expect(deleteResponse.status).toBe(204);

        const getResponse = await request(app).get('/wishlist?userId=test@example.com');
        expect(getResponse.body.length).toBe(0);
    });

    it('should return 404 when removing a non-existing wishlist item', async () => {
        const response = await request(app).delete('/wishlist/9999');
        expect(response.status).toBe(404);
    });

    it('should clear all wishlist items for a user', async () => {
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 1 });
        await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: 2 });

        const clearResponse = await request(app).delete('/wishlist?userId=test@example.com');
        expect(clearResponse.status).toBe(204);

        const getResponse = await request(app).get('/wishlist?userId=test@example.com');
        expect(getResponse.body.length).toBe(0);
    });

    it('should return 400 for clearing wishlist without userId', async () => {
        const response = await request(app).delete('/wishlist');
        expect(response.status).toBe(400);
    });

    it('should return 400 when adding item with invalid userId', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: '   ', productId: 1 });
        expect(response.status).toBe(400);
    });

    it('should return 400 when adding item with invalid productId', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: 'test@example.com', productId: -1 });
        expect(response.status).toBe(400);
    });

    it('should trim whitespace from userId', async () => {
        const response = await request(app)
            .post('/wishlist')
            .send({ userId: '  test@example.com  ', productId: 1 });
        expect(response.status).toBe(201);
        expect(response.body.userId).toBe('test@example.com');
    });
});
