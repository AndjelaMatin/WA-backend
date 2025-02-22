import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import recipesRoutes from './routes/recepti.js';
import { connectToStore } from './store/store.js';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import shoppingListRoutes from './routes/shoppingLista.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(express.json());
app.use('/api', recipesRoutes);
app.use('/api/shoppingLista', shoppingListRoutes);
app.use('/api/auth', authRoutes);

export const getCollection = async (collectionName) => {
const db = await connectToStore();
return db.collection(collectionName);
};
const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI nije definisan u .env fajlu!");
}
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server je pokrenut na https://wa-backend-he0u.onrender.com`);
    })
  })
  .catch((error) => console.error('Error kod spajanja na MongoDB', error));