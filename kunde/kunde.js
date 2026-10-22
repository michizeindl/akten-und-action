// Kundendaten für die Startseite mit allen Spielen.
window.KUNDE = {
  firma: 'Schust & Federle',
  logo: 'kunde/logo.png',              // für dunkle Flächen (Schriftzug weiß)
  logoAufHell: 'kunde/logo-hell.png',  // Original für helle Flächen (Startseite: weißes Schild)
  // haupt = Olivgrün aus dem Logo (Aktendeckel), blaugrau = Schrift „SCHUST | FEDERLE“, dunkel = abgedunkeltes Blaugrau
  farben: { haupt: '#91a534', hauptText: '#1c252b', akzent: '#acb750', dunkel: '#1f2a31', hell: '#ffffff', blaugrau: '#475e6c' },
  texte: {
    titel: 'Akten & Action',
  },
  spruch: 'Mit Recht zufrieden!',
  // Pflichtangaben der Kanzlei, dezent im Band unten unter dem Spruch (MZ, 22.10.2026; Adressen geprüft: Status 200)
  rechtliches: [
    { text: 'Impressum', link: 'https://www.anwaltrottweil.de/impressum/' },
    { text: 'Datenschutz', link: 'https://www.anwaltrottweil.de/datenschutz/' },
  ],
  // Kontakt für das Band unten auf der Startseite (wie auf der Kanzlei-Website); je Standort Titel, Adresszeilen und
  // optional Telefon, Fax, E-Mail, Web (nur Text)
  // Kanzleiname im Band (links, Gegenstück zum Spruch rechts)
  kanzlei: 'Schust & Federle Rechtsanwälte',
  kontakt: [
    { titel: 'Rottweil', zeilen: ['Lorenz-Bock-Straße 10', '78628 Rottweil'],
      telefon: '0741 15047', fax: '0741 23225', web: 'https://www.anwaltrottweil.de/' },   // ohne E-Mail (MZ, 22.10.2026)
    { titel: 'Zweigstelle Schönwald', zeilen: ['Schanzenblick 17', '78141 Schönwald im Schwarzwald'],
      telefon: '07722 9384873', fax: '07722 9384874', web: 'https://www.anwaltrottweil.de/schoenwald/' },   // Fax: führende 0 vom Supervisor ergänzt (Vorlage MZ ohne 0)
  ],
};
