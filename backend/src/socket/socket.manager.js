const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');

/**
 * Manages Socket.IO events and real-time logic
 * @param {Server} io - The Socket.IO server instance
 */
function setupSocket(io) {
    // Middleware for authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username}`);

        // Join auction room
        socket.on('join-item', (itemId) => {
            socket.join(`item:${itemId}`);
            console.log(`${socket.user.username} joined room: item:${itemId}`);
        });

        // Leave auction room
        socket.on('leave-item', (itemId) => {
            socket.leave(`item:${itemId}`);
            console.log(`${socket.user.username} left room: item:${itemId}`);
        });

        // Place a bid
        socket.on('place-bid', async ({ itemId, amount }) => {
            try {
                const db = await connectDB();
                const items = db.collection('items');
                const bids = db.collection('bids');

                const item = await items.findOne({ _id: new ObjectId(itemId) });

                // 1. Validations
                if (!item) {
                    return socket.emit('bid-rejected', { reason: 'Item not found' });
                }

                if (item.status !== 'active' || new Date() > new Date(item.endsAt)) {
                    return socket.emit('bid-rejected', { reason: 'Auction is closed' });
                }

                if (item.ownerId.toString() === socket.user.id) {
                    return socket.emit('bid-rejected', { reason: 'You cannot bid on your own item' });
                }

                if (parseFloat(amount) <= parseFloat(item.currentPrice)) {
                    return socket.emit('bid-rejected', { reason: 'Amount too low' });
                }

                // 2. Atomic update (best practice even if not strictly required by README)
                // However, README asks for:
                // updateOne({ _id }, { $set: { currentPrice: amount, currentBidder: username } })
                const updateResult = await items.updateOne(
                    { _id: new ObjectId(itemId) },
                    { $set: { currentPrice: parseFloat(amount), currentBidder: socket.user.username } }
                );

                if (updateResult.modifiedCount === 0) {
                    return socket.emit('bid-rejected', { reason: 'Update failed' });
                }

                // 3. Insert bid record
                const bidRecord = {
                    itemId: new ObjectId(itemId),
                    bidder: socket.user.username,
                    amount: parseFloat(amount),
                    createdAt: new Date()
                };
                await bids.insertOne(bidRecord);

                // 4. Emits
                io.to(`item:${itemId}`).emit('new-bid', {
                    itemId,
                    amount: parseFloat(amount),
                    bidder: socket.user.username,
                    at: bidRecord.createdAt
                });

                io.emit('item-updated', {
                    itemId,
                    currentPrice: parseFloat(amount),
                    currentBidder: socket.user.username,
                    status: 'active'
                });

            } catch (error) {
                console.error('Bid error:', error);
                socket.emit('bid-rejected', { reason: 'Internal server error' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);
        });
    });

    // Auto-closure service (setInterval global)
    setInterval(async () => {
        try {
            const db = await connectDB();
            const items = db.collection('items');

            const expiredItems = await items.find({
                status: 'active',
                endsAt: { $lte: new Date() }
            }).toArray();

            for (const item of expiredItems) {
                await items.updateOne(
                    { _id: item._id },
                    { $set: { status: 'ended' } }
                );

                io.to(`item:${item._id.toString()}`).emit('auction-ended', {
                    itemId: item._id.toString(),
                    winner: item.currentBidder,
                    finalPrice: item.currentPrice
                });

                io.emit('item-updated', {
                    itemId: item._id.toString(),
                    currentPrice: item.currentPrice,
                    currentBidder: item.currentBidder,
                    status: 'ended'
                });

                console.log(`Auction ended: ${item.title}`);
            }
        } catch (error) {
            console.error('Auto-closure error:', error);
        }
    }, 5000);
}

module.exports = setupSocket;
