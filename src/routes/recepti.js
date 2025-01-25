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
router.get('/recepti/:id', authMiddleware, async (req, res) => {
  try {
    const receptId = req.params.id;
    const korisnikId = req.user.id;

    if (!ObjectId.isValid(receptId)) {
      return res.status(400).json({ message: 'Neispravan ID recepta' });
    }

    const recepti = await getCollection('recepti');
    const recept = await recepti.findOne({ _id: new ObjectId(receptId) });

    if (!recept) {
      return res.status(404).json({ message: 'Recept nije pronađen.' });
    }

    // Provjeri je li recept u omiljenima korisnika
    const korisnici = await getCollection('korisnici');
    const korisnik = await korisnici.findOne({ _id: new ObjectId(korisnikId) });

    const isFavorite = korisnik?.omiljeniRecepti?.some((id) => id.equals(receptId));

    res.status(200).json({ ...recept, isFavorite });
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
// Dohvaćanje svojih recepata
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
// Ažuriranje recepta
router.put('/recepti/:id', authMiddleware, async (req, res) => {
  const receptId = req.params.id;

  if (!ObjectId.isValid(receptId)) {
    return res.status(400).json({ message: 'Neispravan ID recepta' });
  }

  const azuriranja = req.body;

  if (Object.keys(azuriranja).length === 0) {
    return res.status(400).json({ message: 'Nema promjena za ažuriranje.' });
  }

  try {
    const db = await getCollection('recepti');
    const recept = await db.findOne({ _id: new ObjectId(receptId) });

    if (!recept) {
      return res.status(404).json({ message: 'Recept nije pronađen' });
    }

    if (recept.korisnikId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Nemate dopuštenje za uređivanje ovog recepta' });
    }

    await db.updateOne(
      { _id: new ObjectId(receptId) },
      { $set: azuriranja }
    );

    res.status(200).json({ message: 'Recept uspješno ažuriran' });
  } catch (error) {
    console.error('Greška pri ažuriranju recepta:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

// Dodavanje recepta u omiljene
router.post('/korisnici/omiljeni', authMiddleware, async (req, res) => {
  const { receptId } = req.body;

  if (!ObjectId.isValid(receptId)) {
    return res.status(400).json({ message: 'Neispravan ID recepta' });
  }

  try {
    const userId = req.user.id;
    const korisnici = await getCollection('korisnici');

    const user = await korisnici.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    const receptObjectId = new ObjectId(receptId);

    if (user.omiljeniRecepti?.some((id) => id.equals(receptObjectId))) {
      return res.status(400).json({ message: 'Recept je već u omiljenima.' });
    }

    await korisnici.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { omiljeniRecepti: receptObjectId } }
    );

    res.status(200).json({ message: 'Recept je dodan u omiljene.' });
  } catch (error) {
    console.error('Greška pri dodavanju u omiljene:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

// Uklanjanje recepta iz omiljenih
router.delete('/korisnici/omiljeni', authMiddleware, async (req, res) => {
  const { receptId } = req.query; // Dohvaćanje receptId iz query parametara

  if (!ObjectId.isValid(receptId)) {
    return res.status(400).json({ message: 'Neispravan ID recepta' });
  }

  try {
    const userId = req.user.id;
    const korisnici = await getCollection('korisnici');

    const user = await korisnici.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    const receptObjectId = new ObjectId(receptId);

    if (!user.omiljeniRecepti?.some((id) => id.equals(receptObjectId))) {
      return res.status(400).json({ message: 'Recept nije u omiljenima.' });
    }

    await korisnici.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { omiljeniRecepti: receptObjectId } }
    );

    res.status(200).json({ message: 'Recept je uklonjen iz omiljenih.' });
  } catch (error) {
    console.error('Greška pri uklanjanju iz omiljenih:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

// Dohvaćanje omiljenih
router.get('/omiljenirecepti', authMiddleware, async (req, res) => {
  try {
    const korisnici = await getCollection('korisnici');
    const korisnik = await korisnici.findOne({ _id: new ObjectId(req.user.id) });

    if (!korisnik || !korisnik.omiljeniRecepti) {
      return res.status(200).json([]); // Ako nema omiljenih recepata, vraća prazan niz
    }

    const recepti = await getCollection('recepti');
    const favoriteRecipes = await recepti
      .find({ _id: { $in: korisnik.omiljeniRecepti.map((id) => new ObjectId(id)) } })
      .toArray();

    res.status(200).json(favoriteRecipes);
  } catch (error) {
    console.error('Greška pri dohvaćanju omiljenih recepata:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

export default router;