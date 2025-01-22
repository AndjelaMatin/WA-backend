import express from 'express';
import { getCollection } from '../store/store.js';
import { ObjectId } from 'mongodb';
import authMiddleware from '../middleware/auth.js';

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
router.post('/recepti', authMiddleware, async (req, res) => {
  try {
    const { naziv, sastojci, upute, slika, porcije } = req.body;

    if (!naziv || !sastojci || !upute || !Array.isArray(sastojci) || !Array.isArray(upute)) {
      return res.status(400).json({ message: 'Molimo popunite sva potrebna polja.' });
    }

    const korisnikId = req.user.id; // Dohvaćanje korisničkog ID-a iz tokena

    const noviRecept = {
      naziv,
      sastojci,
      upute,
      slika: slika || '',
      porcije: porcije || 1,
      svidanja: 0,
      komentari: [],
      korisnikId: new ObjectId(korisnikId), // Referenca na korisnika
    };

    const collection = await getCollection('recepti');
    const result = await collection.insertOne(noviRecept);

    res.status(201).json({ ...noviRecept, _id: result.insertedId });
  } catch (error) {
    console.error('Greška pri dodavanju recepta:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru' });
  }
});

router.get('/mojirecepti', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Dohvat ID korisnika iz tokena
    // Provjerite je li ID validan
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Neispravan korisnički ID." });
    }

    const db = await getCollection('recepti');
    const userRecipes = await db.find({ korisnikId: new ObjectId(userId) }).toArray();

    if (!userRecipes || userRecipes.length === 0) {
      return res.status(404).json({ message: "Nema recepata za ovog korisnika." });
    }

    res.status(200).json(userRecipes);
  } catch (error) {
    console.error("Greška pri dohvaćanju recepata korisnika:", error);
    res.status(500).json({ message: "Greška pri dohvaćanju recepata" });
  }
});

//Brisanje recepta
router.delete('/brisanjerecepta/:id', authMiddleware, async (req, res) => {
  const receptId = req.params.id;

  if (!ObjectId.isValid(receptId)) {
    return res.status(400).json({ message: 'Neispravan ID recepta' });
  }

  const db = await getCollection('recepti');
  const recept = await db.findOne({ _id: new ObjectId(receptId) });

  if (!recept) {
    return res.status(404).json({ message: 'Recept nije pronađen' });
  }

  if (recept.korisnikId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Nemate dopuštenje za brisanje ovog recepta' });
  }

  await db.deleteOne({ _id: new ObjectId(receptId) });
  res.status(200).json({ message: 'Recept uspješno obrisan' });
});


export default router;