import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import recipesRoutes from './routes/recepti.js';
import shoppingListaRoutes from "./routes/shoppingLista.js";
import { connectToStore, closeStore } from './store/store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rute
app.use('/api', recipesRoutes);
app.use('/api/shoppingLista', shoppingListaRoutes);
// Pokretanje servera
const startServer = async () => {
  try {
    await connectToStore();
    app.listen(PORT, () => console.log(`Server pokrenut na http://localhost:${PORT}`));
  } catch (error) {
    console.error('Greška pri pokretanju servera:', error);
  }
};

// Zatvaranje veze pri prekidu servera
process.on('SIGINT', async () => {
  console.log('Zatvaranje servera...');
  await closeStore();
  process.exit(0);
});

startServer();

/* 
// 1. Prikaz svih recepata
app.get('/recepti', (req, res) => res.json(podaci.recepti));

// 2. Prikaz pojedinačnog recepta
app.get('/recepti/:id', (req, res) => {
  const idRecepta = parseInt(req.params.id);
  const recept = podaci.recepti.find((r) => r.id === idRecepta);

  if (recept) {
    res.json(recept);
  } else {
    res.status(404).json({ greška: 'Recept nije pronađen' });
  }
});

// 3. Dodavanje recepta
app.post('/recepti', (req, res) => {
  const korisnik = podaci.korisnici[0];

  const noviRecept = {
    id: podaci.recepti.length + 1,
    ...req.body,
    sviđanja: 0,
    komentari: [],
    slika: req.body.slika || null,
    porcije: req.body.porcije || 1,
  };

  podaci.recepti.push(noviRecept);
  res.status(201).json(noviRecept);
});

// 4. Označavanje recepta kao "sviđa mi se" (like)
app.post('/recepti/:id/sviđaMiSe', (req, res) => {
  const idRecepta = parseInt(req.params.id);
  const recept = podaci.recepti.find((r) => r.id === idRecepta);

  if (recept) {
    const korisnik = podaci.korisnici[0];

    if (!korisnik.favoriti.includes(idRecepta)) {
      korisnik.favoriti.push(idRecepta);
      recept.sviđanja += 1;
      res.json({ poruka: 'Recept je uspješno sviđa mi se' });
    } else {
      res.status(400).json({ greška: 'Recept već sviđa mi se' });
    }
  } else {
    res.status(404).json({ greška: 'Recept nije pronađen' });
  }
});

// 5. Pretraživanje recepata
app.get('/recepti/pretraga', (req, res) => {
    const kriteriji = req.query;
    const rezultati = podaci.recepti.filter((recept) => {
      return (
        recept.naziv.includes(kriteriji.naziv) ||
        recept.sastojci.some((sastojak) => sastojak.includes(kriteriji.sastojak))
      );
    });
  
    res.json(rezultati);
  });
  
  // 6. Dodavanje slika uz recepte
  app.post('/recepti', (req, res) => {
    const korisnik = podaci.korisnici[0];
  
    const noviRecept = {
      id: podaci.recepti.length + 1,
      ...req.body,
      sviđanja: 0,
      komentari: [],
      slika: req.body.slika || null,
      porcije: req.body.porcije || 1,
    };
  
    podaci.recepti.push(noviRecept);
    res.status(201).json(noviRecept);
  });
  
  // 7. Komentiranje recepata
  app.post('/recepti/:id/komentiraj', (req, res) => {
    const idRecepta = parseInt(req.params.id);
    const recept = podaci.recepti.find((r) => r.id === idRecepta);
  
    if (recept) {
      const korisnik = podaci.korisnici[0];
  
      const noviKomentar = {
        korisnik: korisnik.korisničkoIme,
        komentar: req.body.komentar,
      };
  
      recept.komentari.push(noviKomentar);
      res.status(201).json({ poruka: 'Komentar dodan' });
    } else {
      res.status(404).json({ greška: 'Recept nije pronađen' });
    }
  });
  
  // 8. Dodavanje u kolekciju omiljenih recepata
  app.post('/korisnici/:id/favoriti', (req, res) => {
    const idKorisnika = parseInt(req.params.id);
    const korisnik = podaci.korisnici.find((k) => k.id === idKorisnika);
  
    if (korisnik) {
      const idRecepta = req.body.idRecepta;
  
      if (!korisnik.favoriti.includes(idRecepta)) {
        korisnik.favoriti.push(idRecepta);
        res.status(201).json({ poruka: 'Recept dodan u omiljene' });
      } else {
        res.status(400).json({ greška: 'Recept već u omiljenima' });
      }
    } else {
      res.status(404).json({ greška: 'Korisnik nije pronađen' });
    }
  });  
  app.listen(port, () => console.log(`Slušam na portu ${port}`));
 */

