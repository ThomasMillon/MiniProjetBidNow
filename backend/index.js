const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');
const setupSocket = require('./src/socket/socket.manager');

/**
 * Main server entry point
 * Initializes Express, Socket.IO, and Database connection
 */
async function startServer() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });
    setupSocket(io);

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    const authRoutes = require('./src/routes/auth.routes');
    const itemRoutes = require('./src/routes/item.routes');
    app.use('/api/auth', authRoutes);
    app.use('/api/items', itemRoutes);

    // Connect to DB
    const db = await connectDB();

    // Basic route
    app.get('/', (req, res) => {
        res.json({ message: "Welcome to BidNow Luxury Auction API" });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
