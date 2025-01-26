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

// Pretraživanje recepata
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

    const korisnikId = req.user.id; 

    const noviRecept = {
      naziv,
      sastojci,
      upute,
      slika: slika || '',
      porcije: porcije || 1,
      svidanja: 0,
      komentari: [],
      korisnikId: new ObjectId(korisnikId), 
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
    const userId = req.user.id; 
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
  const { receptId } = req.query; 

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
      return res.status(200).json([]); 
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

// Dodavanje lajka recepta
router.post('/korisnici/lajk', authMiddleware, async (req, res) => {
  const { receptId } = req.body;

  if (!ObjectId.isValid(receptId)) {
    return res.status(400).json({ message: 'Neispravan ID recepta.' });
  }

  try {
    const korisnikId = req.user.id;
    const korisnici = await getCollection('korisnici');

    const korisnik = await korisnici.findOne({ _id: new ObjectId(korisnikId) });
    if (!korisnik) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    const receptObjectId = new ObjectId(receptId);

    if (korisnik.lajkaniRecepti?.some((id) => id.equals(receptObjectId))) {
      return res.status(200).json({ message: 'Recept je već lajkan.' });
    }

    await korisnici.updateOne(
      { _id: new ObjectId(korisnikId) },
      { $push: { lajkaniRecepti: receptObjectId } }
    );

    res.status(200).json({ message: 'Recept je lajkan.' });
  } catch (error) {
    console.error('Greška pri lajkanju recepta:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

// Uklanjanje lajka recepta
router.delete('/korisnici/lajk', authMiddleware, async (req, res) => {
  const { receptId } = req.query; // Dohvaćanje receptId iz query parametara

  if (!ObjectId.isValid(receptId)) {
    return res.status(400).json({ message: 'Neispravan ID recepta.' });
  }

  try {
    const userId = req.user.id;
    const korisnici = await getCollection('korisnici');

    const user = await korisnici.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    const receptObjectId = new ObjectId(receptId);

    if (!user.lajkaniRecepti?.some((id) => id.equals(receptObjectId))) {
      return res.status(400).json({ message: 'Recept nije lajkan.' });
    }

    await korisnici.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { lajkaniRecepti: receptObjectId } }
    );

    res.status(200).json({ message: 'Recept je uklonjen iz lajkanja.' });
  } catch (error) {
    console.error('Greška pri uklanjanju iz lajkanja:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});
// Dohvaćanje lajkanih recepata
router.get('/korisnici/lajkani', authMiddleware, async (req, res) => {
  try {
    const korisnikId = req.user.id;

    const korisnici = await getCollection('korisnici');
    const korisnik = await korisnici.findOne({ _id: new ObjectId(korisnikId) });

    if (!korisnik) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    const lajkaniRecepti = korisnik.lajkaniRecepti || [];

    res.status(200).json(lajkaniRecepti); 
  } catch (error) {
    console.error('Greška pri dohvaćanju lajkanih recepata:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});
// Dohvaćanje komentiranih recepata
router.get('/korisnici/komentirani', authMiddleware, async (req, res) => {
  try {
    const korisnikId = req.user.id;
    const recepti = await getCollection('recepti');

    // Pronađi recepte koje je komentirao korisnik
    const komentiraniRecepti = await recepti
      .find({ "komentari.korisnik": new ObjectId(korisnikId) })
      .project({ _id: 1 }) // Vraća samo ID recepata
      .toArray();

    res.status(200).json(komentiraniRecepti.map((r) => r._id));
  } catch (error) {
    console.error("Greška pri dohvaćanju komentiranih recepata:", error);
    res.status(500).json({ message: "Došlo je do greške na serveru." });
  }
});

//Dodavanje komentara na recept
  router.post('/recepti/:id/komentari', authMiddleware, async (req, res) => {
    try {
    const { id } = req.params;
    const { tekst } = req.body;

    if (!tekst || tekst.trim() === '') {
      return res.status(400).json({ message: 'Tekst komentara je obavezan.' });
    }

    const korisnikId = req.user.id; // Preuzimanje korisničkog ID-a iz autentifikacije
    const komentari = {
      korisnik: new ObjectId(korisnikId), // Konverzija korisničkog ID-a u ObjectId
      tekst,
      datum: new Date(),
    };

    const recepti = await getCollection('recepti');
    const result = await recepti.updateOne(
      { _id: new ObjectId(id) },
      { $push: { komentari } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Recept nije pronađen.' });
    }

    res.status(200).json(komentari); // Vraćamo dodat komentar
  } catch (error) {
    console.error('Greška pri dodavanju komentara:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});


//Brisanje komentara na recept
router.delete('/recepti/:id/komentari/:komentarId', authMiddleware, async (req, res) => {
  try {
    const { id, komentarId } = req.params;
    const korisnikId = req.user.id;

    const recepti = await getCollection('recepti');
    const result = await recepti.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { komentari: { _id: new ObjectId(komentarId), korisnik: korisnikId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Komentar nije pronađen ili nemate dozvolu za brisanje.' });
    }

    res.status(200).json({ message: 'Komentar obrisan.' });
  } catch (error) {
    console.error('Greška pri brisanju komentara:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

//Dohvaćanje komentara za određeni recept
router.get('/recepti/:id/komentari', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Neispravan ID recepta.' });
    }

    const recepti = await getCollection('recepti');

    const recept = await recepti.aggregate([
      { $match: { _id: new ObjectId(id) } },
      { $unwind: '$komentari' },
      {
        $lookup: {
          from: 'korisnici',
          localField: 'komentari.korisnik',
          foreignField: '_id',
          as: 'korisnikInfo',
        },
      },
      {
        $project: {
          _id: 0,
          'komentari.tekst': 1,
          'komentari.datum': 1,
          'korisnikInfo.ime': 1,
        },
      },
    ]).toArray();

    if (!recept.length) {
      return res.status(404).json({ message: 'Recept nije pronađen ili nema komentara.' });
    }

    const komentari = recept.map((k) => ({
      tekst: k.komentari.tekst,
      datum: k.komentari.datum,
      korisnik: k.korisnikInfo[0]?.ime || 'Nepoznati korisnik',
    }));

    res.status(200).json(komentari);
  } catch (error) {
    console.error('Greška pri dohvatanju komentara:', error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});
export default router;