import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI nije definisan u .env fajlu!');
}

let client;
let database;

export const connectToStore = async () => {
  if (!client || !database) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    database = client.db('naseMaleSlastice'); 
    console.log('Povezan na MongoDB');
  }
  return database;
};

export const closeStore = async () => {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log('Veza s MongoDB zatvorena');
  }
};

export const getCollection = async (collectionName) => {
  const db = await connectToStore();
  return db.collection(collectionName);
};
