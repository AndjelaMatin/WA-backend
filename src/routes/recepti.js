import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import { MongoClient } from 'mongodb';

const router = express.Router();
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI nije definisan u .env fajlu!");
}

const client = new MongoClient(uri);

router.get('/recepti', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('naseMaleSlastice');
    const collection = database.collection('recepti');

    const recepti = await collection.find({}).toArray();
    res.json(recepti);
  } catch (error) {
    console.error('Greška u ruti /api/recepti:', error); 
    res.status(500).send('Došlo je do greške na serveru');
  } finally {
    await client.close();
  }
});
router.get('/recepti/:id', async (req, res) => {
  try {
    const recept = await client.db('naseMaleSlastice').collection('recepti').findById(req.params.id); 
    if (!recept) {
      return res.status(404).json({ message: 'Recept nije pronađen' });
    }
    res.json(recept); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
});
export default router;
