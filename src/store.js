let recept={
    recepti: [
      {
        id: 1,
        naziv: 'Čokoladna torta',
        sastojci: ['brašno', 'šećer', 'čokolada'],
        upute: 'Pomiješajte i pecite!',
        sviđanja: 10,
      },
      {
        id: 1,
        naziv: 'Čokoladna torta',
        sastojci: ['brašno', 'šećer', 'čokolada'],
        upute: 'Pomiješajte i pecite!',
        sviđanja: 10,
      },
    ],
  }
let korisnik={
  korisnici: [
    {
      id: 1,
      korisničkoIme: 'korisnik1',
      favoriti: [1],
    },
    {
        id: 2,
        korisničkoIme: 'korisnik2',
        favoriti: [3],
      },
  ],
}
let komentar={
  komentari:[
      {
        id: 1,
        datum: "2024-03-20",
        komentar: 'Ukusno je',
      },
      {
        id: 1,
        datum: "2022-03-25",
        komentar: 'uzasno je',
      },
    ],
}
export {recept, korisnik, komentar};