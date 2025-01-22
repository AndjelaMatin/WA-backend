import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { connectToStore } from '../store/store.js';
import authMiddleware from '../middleware/auth.js';
import mongodb from 'mongodb';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const db = await connectToStore();
    const collection = db.collection('korisnici');

    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await collection.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const db = await connectToStore();
    const collection = db.collection('korisnici');

    const user = await collection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

router.get('/korisnici', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await connectToStore();
    const collection = db.collection('korisnici');

    const user = await collection.findOne({ _id: new mongodb.ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error });
  }
});

export default router;
