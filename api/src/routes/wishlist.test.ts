import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlists } from './wishlist';

let app: express.Express;

describe('Wishlist API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/wishlists', wishlistRouter);
        resetWishlists();
    });

    // --- Wishlist CRUD ---

    it('should create a new wishlist', async () => {
        const response = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'Birthday ideas' });
        expect(response.status).toBe(201);
        expect(response.body.userId).toBe('user@example.com');
        expect(response.body.name).toBe('Birthday ideas');
        expect(response.body.wishlistId).toBe(1);
        expect(response.body.isPublic).toBe(false);
        expect(typeof response.body.shareToken).toBe('string');
        expect(response.body.shareToken.length).toBeGreaterThan(0);
    });

    it('should return 400 when creating a wishlist with missing userId', async () => {
        const response = await request(app)
            .post('/wishlists')
            .send({ name: 'My list' });
        expect(response.status).toBe(400);
    });

    it('should return 400 when creating a wishlist with missing name', async () => {
        const response = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com' });
        expect(response.status).toBe(400);
    });

    it('should return 400 when name exceeds 100 characters', async () => {
        const response = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'a'.repeat(101) });
        expect(response.status).toBe(400);
    });

    it('should list wishlists for a user', async () => {
        await request(app).post('/wishlists').send({ userId: 'user@example.com', name: 'List 1' });
        await request(app).post('/wishlists').send({ userId: 'user@example.com', name: 'List 2' });
        await request(app).post('/wishlists').send({ userId: 'other@example.com', name: 'Other' });

        const response = await request(app).get('/wishlists?userId=user@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe('List 1');
        expect(response.body[1].name).toBe('List 2');
    });

    it('should return 400 when listing wishlists without userId', async () => {
        const response = await request(app).get('/wishlists');
        expect(response.status).toBe(400);
    });

    it('should update a wishlist name', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'Old Name' });
        const { wishlistId } = created.body;

        const response = await request(app)
            .put(`/wishlists/${wishlistId}`)
            .send({ name: 'New Name' });
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('New Name');
    });

    it('should update a wishlist isPublic flag', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        const response = await request(app)
            .put(`/wishlists/${wishlistId}`)
            .send({ isPublic: true });
        expect(response.status).toBe(200);
        expect(response.body.isPublic).toBe(true);
    });

    it('should return 404 when updating non-existing wishlist', async () => {
        const response = await request(app).put('/wishlists/999').send({ name: 'X' });
        expect(response.status).toBe(404);
    });

    it('should delete a wishlist', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'To delete' });
        const { wishlistId } = created.body;

        const deleteResponse = await request(app).delete(`/wishlists/${wishlistId}`);
        expect(deleteResponse.status).toBe(204);

        const listResponse = await request(app).get('/wishlists?userId=user@example.com');
        expect(listResponse.body.length).toBe(0);
    });

    it('should return 404 when deleting non-existing wishlist', async () => {
        const response = await request(app).delete('/wishlists/999');
        expect(response.status).toBe(404);
    });

    // --- Wishlist Items ---

    it('should add an item to a wishlist', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        const response = await request(app)
            .post(`/wishlists/${wishlistId}/items`)
            .send({ productId: 42 });
        expect(response.status).toBe(201);
        expect(response.body.wishlistId).toBe(wishlistId);
        expect(response.body.productId).toBe(42);
        expect(response.body.wishlistItemId).toBe(1);
    });

    it('should return 400 when adding a duplicate item', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        await request(app).post(`/wishlists/${wishlistId}/items`).send({ productId: 42 });
        const response = await request(app)
            .post(`/wishlists/${wishlistId}/items`)
            .send({ productId: 42 });
        expect(response.status).toBe(400);
    });

    it('should return 404 when adding item to non-existing wishlist', async () => {
        const response = await request(app)
            .post('/wishlists/999/items')
            .send({ productId: 1 });
        expect(response.status).toBe(404);
    });

    it('should list items in a wishlist', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        await request(app).post(`/wishlists/${wishlistId}/items`).send({ productId: 1 });
        await request(app).post(`/wishlists/${wishlistId}/items`).send({ productId: 2 });

        const response = await request(app).get(`/wishlists/${wishlistId}/items`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
    });

    it('should return 404 when listing items for non-existing wishlist', async () => {
        const response = await request(app).get('/wishlists/999/items');
        expect(response.status).toBe(404);
    });

    it('should remove an item from a wishlist', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        const addedItem = await request(app)
            .post(`/wishlists/${wishlistId}/items`)
            .send({ productId: 5 });
        const { wishlistItemId } = addedItem.body;

        const deleteResponse = await request(app)
            .delete(`/wishlists/${wishlistId}/items/${wishlistItemId}`);
        expect(deleteResponse.status).toBe(204);

        const listResponse = await request(app).get(`/wishlists/${wishlistId}/items`);
        expect(listResponse.body.length).toBe(0);
    });

    it('should return 404 when removing non-existing item', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        const response = await request(app)
            .delete(`/wishlists/${wishlistId}/items/999`);
        expect(response.status).toBe(404);
    });

    it('should delete a wishlist and cascade-delete its items', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'My list' });
        const { wishlistId } = created.body;

        await request(app).post(`/wishlists/${wishlistId}/items`).send({ productId: 1 });
        await request(app).post(`/wishlists/${wishlistId}/items`).send({ productId: 2 });

        await request(app).delete(`/wishlists/${wishlistId}`);

        // Wishlist is gone — items endpoint should 404
        const itemsResponse = await request(app).get(`/wishlists/${wishlistId}/items`);
        expect(itemsResponse.status).toBe(404);
    });

    // --- Share ---

    it('should return 404 for share token when wishlist is not public', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'Private list' });
        const { shareToken } = created.body;

        const response = await request(app).get(`/wishlists/share/${shareToken}`);
        expect(response.status).toBe(404);
    });

    it('should return the wishlist and items via share token when public', async () => {
        const created = await request(app)
            .post('/wishlists')
            .send({ userId: 'user@example.com', name: 'Public list' });
        const { wishlistId, shareToken } = created.body;

        await request(app).post(`/wishlists/${wishlistId}/items`).send({ productId: 10 });
        await request(app).put(`/wishlists/${wishlistId}`).send({ isPublic: true });

        const response = await request(app).get(`/wishlists/share/${shareToken}`);
        expect(response.status).toBe(200);
        expect(response.body.wishlist.wishlistId).toBe(wishlistId);
        expect(response.body.wishlist.isPublic).toBe(true);
        expect(response.body.items.length).toBe(1);
        expect(response.body.items[0].productId).toBe(10);
    });

    it('should return 404 for unknown share token', async () => {
        const response = await request(app).get('/wishlists/share/unknowntoken');
        expect(response.status).toBe(404);
    });
});
