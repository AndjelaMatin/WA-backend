import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI nije definisan u .env fajlu!');
}

let client;
let database;

// Funkcija za spajanje na bazu
export const connectToStore = async () => {
  if (!client || !database) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    database = client.db('naseMaleSlastice'); // Ime baze podataka
    console.log('Povezan na MongoDB');
  }
  return database;
};

// Funkcija za dobivanje kolekcije
export const getCollection = async (collectionName) => {
  const db = await connectToStore();
  return db.collection(collectionName);
};

// Funkcija za zatvaranje veze
export const closeStore = async () => {
  if (client) {
    await client.close();
    console.log('Veza s MongoDB zatvorena');
  }
};
