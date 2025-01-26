import express from 'express';
import { getCollection } from '../store/store.js';
import authMiddleware from '../middleware/auth.js';
import mongodb from 'mongodb';

const router = express.Router();

// Dohvati shopping listu za prijavljenog korisnika
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const collection = await getCollection('shoppingLista');

    // Pronađi shopping listu korisnika
    const shoppingList = await collection.findOne({ userId: new mongodb.ObjectId(userId) });

    // Ako lista ne postoji, vrati praznu
    if (!shoppingList) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(shoppingList.items);
  } catch (error) {
    res.status(500).json({ message: 'Greška pri dohvaćanju shopping liste', error });
  }
});

// Dodaj novu stavku u shopping listu
router.post('/', authMiddleware, async (req, res) => {
  const { name, completed = false } = req.body;

  try {
    const userId = req.user.id;
    const collection = await getCollection('shoppingLista');

    // Pronađi ili kreiraj shopping listu korisnika
    let shoppingList = await collection.findOne({ userId: new mongodb.ObjectId(userId) });
    if (!shoppingList) {
      shoppingList = {
        userId: new mongodb.ObjectId(userId),
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await collection.insertOne(shoppingList);
    }

    // Dodaj novu stavku
    const newItem = { id: new mongodb.ObjectId(), name, completed };
    shoppingList.items.push(newItem);

    // Ažuriraj shopping listu u bazi
    await collection.updateOne(
      { userId: new mongodb.ObjectId(userId) },
      { $set: { items: shoppingList.items, updatedAt: new Date() } }
    );

    res.status(201).json({ message: 'Stavka dodana', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri dodavanju stavke', error });
  }
});

// Ažuriraj stavku u shopping listi
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
    const userId = req.user.id;
    const collection = await getCollection('shoppingLista');

    const shoppingList = await collection.findOne({ userId: new mongodb.ObjectId(userId) });
    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping lista nije pronađena' });
    }

    const itemIndex = shoppingList.items.findIndex((item) => item.id.toString() === id);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Stavka nije pronađena' });
    }

    shoppingList.items[itemIndex].completed = completed;

    await collection.updateOne(
      { userId: new mongodb.ObjectId(userId) },
      { $set: { items: shoppingList.items, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'Stavka ažurirana' });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri ažuriranju stavke', error });
  }
});

// Obriši označene stavke iz shopping liste
router.delete('/completed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const collection = await getCollection('shoppingLista');

    // Pronađi shopping listu korisnika
    const shoppingList = await collection.findOne({ userId: new mongodb.ObjectId(userId) });
    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping lista nije pronađena' });
    }

    // Filtriraj stavke koje nisu označene
    shoppingList.items = shoppingList.items.filter((item) => !item.completed);

    // Spremi promjene u bazi
    await collection.updateOne(
      { userId: new mongodb.ObjectId(userId) },
      { $set: { items: shoppingList.items, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'Označene stavke obrisane' });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri brisanju označenih stavki', error });
  }
});


// Obriši pojedinačnu stavku
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const userId = req.user.id;
    const collection = await getCollection('shoppingLista');

    const shoppingList = await collection.findOne({ userId: new mongodb.ObjectId(userId) });
    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping lista nije pronađena' });
    }

    shoppingList.items = shoppingList.items.filter((item) => item.id.toString() !== id);

    await collection.updateOne(
      { userId: new mongodb.ObjectId(userId) },
      { $set: { items: shoppingList.items, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'Stavka obrisana' });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri brisanju stavke', error });
  }
});

export default router;
