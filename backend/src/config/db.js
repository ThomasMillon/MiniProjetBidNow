const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Singleton class to manage MongoDB connection
 * @returns {Promise<Db>} The MongoDB database instance
 */
let db = null;

async function connectDB() {
    if (db) return db;

    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db();
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

module.exports = connectDB;
