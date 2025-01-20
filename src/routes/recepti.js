import express from 'express';
import { getCollection } from '../store/store.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Dohvaćanje svih recepata
router.get('/recepti', async (req, res) => {
  try {
    const collection = await getCollection('recepti');
    const recepti = await collection.find({}).toArray();
    res.json(recepti);
  } catch (error) {
    console.error('Greška pri dohvaćanju recepata:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru' });
  }
});

// Pretraživanje recepata - mora biti definirano prije "/recepti/:id"
router.get('/recepti/pretraga', async (req, res) => {
  try {
    const { naziv } = req.query;
    if (!naziv) {
      return res.status(400).json({ message: 'Naziv za pretragu nije naveden.' });
    }
    const collection = await getCollection('recepti');
    const recepti = await collection
      .find({ naziv: { $regex: naziv, $options: 'i' } })
      .toArray();

    if (recepti.length === 0) {
      return res.status(404).json({ message: 'Recept nije pronađen.' });
    }
    res.json(recepti);
  } catch (error) {
    console.error('Greška pri pretrazi recepata:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

// Dohvaćanje pojedinačnog recepta
router.get('/recepti/:id', async (req, res) => {
  try {
    const receptId = req.params.id;
    if (!ObjectId.isValid(receptId)) {
      return res.status(400).json({ message: 'Neispravan ID recepta' });
    }

    const collection = await getCollection('recepti');
    const recept = await collection.findOne({ _id: new ObjectId(receptId) });

    if (!recept) {
      return res.status(404).json({ message: 'Recept nije pronađen' });
    }

    res.json(recept);
  } catch (error) {
    console.error('Greška pri dohvaćanju recepta:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});



// Dodavanje novog recepta
router.post('/recepti', async (req, res) => {
  try {
    const { naziv, sastojci, upute, slika, porcije } = req.body;

    // Validacija unosa
    if (!naziv || !sastojci || !upute || !Array.isArray(upute) || !Array.isArray(sastojci)) {
      return res.status(400).json({ message: 'Molimo popunite sva potrebna polja.' });
    }

    const noviRecept = {
      naziv,
      sastojci,
      upute,
      slika: slika || '',
      porcije: porcije || 1,
      svidanja: 0,
      komentari: [],
    };

    const collection = await getCollection('recepti');
    const result = await collection.insertOne(noviRecept);

    res.status(201).json({ ...noviRecept, _id: result.insertedId });
  } catch (error) {
    console.error('Greška pri dodavanju recepta:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru' });
  }
});

export default router;