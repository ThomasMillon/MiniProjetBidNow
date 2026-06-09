const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');
const verifyToken = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Register a new user
 * Hashes password and checks for existing email/username
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const db = await connectDB();
        const users = db.collection('users');

        // Check if user exists
        const existingUser = await users.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await users.insertOne({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        });

        const user = { id: result.insertedId, username, email };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

/**
 * Login user
 * Verifies credentials and returns JWT
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await connectDB();
        const users = db.collection('users');

        const userRecord = await users.findOne({ email });
        if (!userRecord) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const user = { id: userRecord._id, username: userRecord.username, email: userRecord.email };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

/**
 * Get current user profile
 * Protected by verifyToken
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const db = await connectDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: new ObjectId(req.user.id) }, { projection: { password: 0 } });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
});

module.exports = router;
