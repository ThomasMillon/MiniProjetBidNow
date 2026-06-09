const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Create a new auction item
 * Calculates endsAt based on durationMinutes
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, description, startPrice, durationMinutes } = req.body;
        const db = await connectDB();
        const items = db.collection('items');

        const endsAt = new Date(Date.now() + durationMinutes * 60000);

        const newItem = {
            title,
            description,
            startPrice: parseFloat(startPrice),
            currentPrice: parseFloat(startPrice),
            currentBidder: null,
            ownerId: new ObjectId(req.user.id),
            ownerUsername: req.user.username,
            status: 'active',
            createdAt: new Date(),
            endsAt
        };

        const result = await items.insertOne(newItem);
        res.status(201).json({ ...newItem, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating auction item.' });
    }
});

/**
 * List auction items with status filter
 * Demonstrates $in operator and sort
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const db = await connectDB();
        const items = db.collection('items');

        let query = {};
        if (status) {
            query.status = status === 'active' ? 'active' : 'ended';
        }

        const auctionItems = await items.find(query).sort({ createdAt: -1 }).toArray();
        res.json(auctionItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items.' });
    }
});

/**
 * Get single item detail
 */
router.get('/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const items = db.collection('items');
        const item = await items.findOne({ _id: new ObjectId(req.params.id) });

        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching item detail.' });
    }
});

/**
 * Get bid history for an item
 */
router.get('/:id/bids', async (req, res) => {
    try {
        const db = await connectDB();
        const bids = db.collection('bids');
        const itemBids = await bids.find({ itemId: new ObjectId(req.params.id) })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        res.json(itemBids);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bids.' });
    }
});

/**
 * Delete an item
 * Security: Only owner can delete, and only if status is "ended"
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const db = await connectDB();
        const items = db.collection('items');

        const result = await items.deleteOne({
            _id: new ObjectId(req.params.id),
            ownerId: new ObjectId(req.user.id),
            status: 'ended'
        });

        if (result.deletedCount === 0) {
            return res.status(403).json({ message: 'Unauthorized or item is still active.' });
        }

        res.json({ message: 'Item deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item.' });
    }
});

module.exports = router;
