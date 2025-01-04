import express from 'express'
import connect from './db.js'
import cors from "cors"
const app = express()
const port = 3000

app.use(express.json());
app.use(cors())
// 1. Prikaz svih recepata

app.get('/recepti', async (req, res) => {
  let db = await connect()
  let query = req.query;

  let selekcija = {}

  if(query.title){
    selekcija.title = new RegExp(query.title)
  }

  let cursor = await db.collection("recepti").find(selekcija)
  let results = await cursor.toArray()
  
  res.json(results)
});
app.get('/recepti/:id', async (req, res) => {
  let db = await connect()
  let query = req.query;

  let selekcija = {}

  if(query._id){
    selekcija.id = new RegExp(query._id)
  }

  let cursor = await db.collection("recepti").find(selekcija)
  let results = await cursor.toArray()
  
  res.json(results)
});
 
// 1. Prikaz svih recepata
app.get('/recepti', (req, res) => res.json(podaci.recepti));

// 2. Prikaz pojedinačnog recepta
app.get('/recept/:id', (req, res) => {
  const idRecepta = parseInt(req.params.id);
  const recept = podaci.recepti.find((r) => r.id === idRecepta);

  if (recept) {
    res.json(recept);
  } else {
    res.status(404).json({ greška: 'Recept nije pronađen' });
  }
});

// 3. Dodavanje recepta
app.post('/recept', (req, res) => {
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
app.post('/recept/:id/sviđaMiSe', (req, res) => {
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
  app.post('/recept', (req, res) => {
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
  app.post('/recept/:id/komentiraj', (req, res) => {
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
  app.post('/korisnik/:id/favoriti', (req, res) => {
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
