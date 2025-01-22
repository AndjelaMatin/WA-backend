import express from "express";
import { getCollection } from "../store/store.js";
import { ObjectId } from "mongodb";
const router = express.Router();

// ID shopping liste - koristimo statični ID za sada
const SHOPPING_LIST_ID = "64bfc72f9a2cdd0012345678"; // Zamijeni s odgovarajućim ID-om
router.put("/", async (req, res) => {
    try {
      const { items } = req.body;
  
      const collection = await getCollection("shoppingLista");
      await collection.updateOne(
        { _id: new ObjectId(SHOPPING_LIST_ID) },
        { $set: { items } }
      );
  
      res.status(200).json({ message: "Lista ažurirana." });
    } catch (error) {
      console.error("Greška pri ažuriranju liste:", error);
      res.status(500).json({ message: "Greška na serveru." });
    }
  });
  router.put("/:index", async (req, res) => {
    try {
      const { index } = req.params;
      const { name, completed } = req.body; // Dohvati podatke iz zahtjeva
  
      const collection = await getCollection("shoppingLista");
      const list = await collection.findOne({ _id: new ObjectId(SHOPPING_LIST_ID) });
  
      if (!list || !list.items[index]) {
        return res.status(404).json({ message: "Stavka nije pronađena." });
      }
  
      // Ažuriraj status i/ili ime stavke
      list.items[index] = { ...list.items[index], name, completed };
  
      // Spremi promjene u bazi
      await collection.updateOne(
        { _id: new ObjectId(SHOPPING_LIST_ID) },
        { $set: { items: list.items } }
      );
  
      res.status(200).json({ message: "Stavka ažurirana." });
    } catch (error) {
      console.error("Greška pri ažuriranju stavke:", error);
      res.status(500).json({ message: "Greška na serveru." });
    }
  });
  
// Dohvati sve stavke iz shopping liste
router.get("/", async (req, res) => {
  try {
    const collection = await getCollection("shoppingLista");
    const list = await collection.findOne({ _id: new ObjectId(SHOPPING_LIST_ID) });

    if (!list) {
      return res.status(404).json({ message: "Lista nije pronađena." });
    }

    res.status(200).json(list.items || []);
  } catch (error) {
    console.error("Greška pri dohvaćanju liste:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
});

// Dodaj novu stavku u shopping listu
router.post("/", async (req, res) => {
  try {
    const { name, completed } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Ime stavke je obavezno." });
    }

    const collection = await getCollection("shoppingLista");
    const result = await collection.updateOne(
      { _id: new ObjectId(SHOPPING_LIST_ID) },
      { $push: { items: { name, completed: completed || false } } },
      { upsert: true } // Ako lista ne postoji, kreiraj je
    );

    res.status(201).json({ name, completed: completed || false });
  } catch (error) {
    console.error("Greška pri dodavanju stavke:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
});

// Ažuriraj stavku po indeksu
router.put("/:index", async (req, res) => {
    try {
      const { index } = req.params;
      const { name, completed } = req.body;
  
      const collection = await getCollection("shoppingLista");
      const list = await collection.findOne({ _id: new ObjectId(SHOPPING_LIST_ID) });
  
      if (!list || !list.items[index]) {
        return res.status(404).json({ message: "Stavka nije pronađena." });
      }
  
      list.items[index] = { ...list.items[index], name, completed };
  
      await collection.updateOne(
        { _id: new ObjectId(SHOPPING_LIST_ID) },
        { $set: { items: list.items } }
      );
  
      res.status(200).json({ message: "Stavka ažurirana." });
    } catch (error) {
      console.error("Greška pri ažuriranju stavke:", error);
      res.status(500).json({ message: "Greška na serveru." });
    }
  });
  
// Obriši stavku po indeksu
router.delete("/:index", async (req, res) => {
    try {
      const { index } = req.params;
  
      const collection = await getCollection("shoppingLista");
      const list = await collection.findOne({ _id: new ObjectId(SHOPPING_LIST_ID) });
  
      if (!list || !list.items[index]) {
        return res.status(404).json({ message: "Stavka nije pronađena." });
      }
  
      // Ukloni stavku iz polja `items`
      list.items.splice(index, 1);
  
      // Ažuriraj dokument u bazi
      await collection.updateOne(
        { _id: new ObjectId(SHOPPING_LIST_ID) },
        { $set: { items: list.items } }
      );
  
      res.status(200).json({ message: "Stavka uspješno obrisana." });
    } catch (error) {
      console.error("Greška pri brisanju stavke:", error);
      res.status(500).json({ message: "Greška na serveru." });
    }
  });  

// Obriši sve stavke
router.delete("/", async (req, res) => {
  try {
    const collection = await getCollection("shoppingLista");
    await collection.updateOne(
      { _id: new ObjectId(SHOPPING_LIST_ID) },
      { $set: { items: [] } }
    );

    res.status(200).json({ message: "Sve stavke obrisane." });
  } catch (error) {
    console.error("Greška pri brisanju svih stavki:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
});

export default router;
