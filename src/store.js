export const podaci = {
    recepti: [
      {
        id: 1,
        naziv: 'Čokoladna torta',
        sastojci: ['brašno', 'šećer', 'čokolada'],
        upute: 'Pomiješajte i pecite!',
        sviđanja: 10,
        komentari: [
          { korisnik: 'korisnik1', komentar: 'Fino!' },
          { korisnik: 'korisnik2', komentar: 'Lako za napraviti!' },
        ],
      },
    ],
    korisnici: [
      {
        id: 1,
        korisničkoIme: 'korisnik1',
        favoriti: [1],
        popisNamirnica: ['brašno', 'jaja'],
      },
      {
          id: 2,
          korisničkoIme: 'korisnik2',
          favoriti: [3],
          popisNamirnica: ['sir', 'mlijeko'],
        },
    ],
  };
  