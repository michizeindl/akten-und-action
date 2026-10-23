// Kundendaten – nur diese Datei und das Logo ändern sich pro Kunde.
// Fehlt ein Eintrag, nimmt das Spiel den Standard.
window.KUNDE = {
  firma: 'Schust & Federle',

  // Logo für dunkle Flächen (Schriftzug weiß, Waage olivgrün) und für helle Flächen (Original),
  // aus den RGB-PNGs der Kanzlei verkleinert (Original in Anwalt-Game/Material/Logo/)
  logo: 'kunde/logo.png',
  logoAufHell: 'kunde/logo-hell.png',
  // Logo ganz in Weiß (Vektor), perspektivisch auf die Mappen/Ordner im Start- und Endbild gedruckt (MZ, 23.10.2026);
  // fehlt es, nimmt das Spiel logo als weiße Silhouette
  logoWeiss: 'kunde/logo-weiss.svg',

  // Farben als Hex-Code: haupt = Markenfarbe (Olivgrün, auch die Aktendeckel), hauptText = Schrift auf der Markenfarbe,
  // akzent = Hervorhebung, dunkel = Hintergrund (Blaugrau abgedunkelt), hell = Schrift.
  // blaugrau = zweite Hausfarbe (Schilder an den Körben, Schrift auf den Akten)
  farben: { haupt: '#91a534', hauptText: '#1c252b', akzent: '#acb750', dunkel: '#1f2a31', hell: '#ffffff', blaugrau: '#475e6c' },

  // Texte überschreiben (alle optional): titel, untertitel, anleitung, ende, endeTitel
  texte: {},

  // Start- und Endbild im Stil „Notizzettel“ (MZ, 20.10.2026; eigener Look der Sammlung „Akten & Action“)
  stil: 'zettel',

  // Spruch der Kanzlei, dezent im Endbild
  spruch: 'Mit Recht zufrieden!',

  // Startseite mit allen Spielen (Haus-Knopf oben links und Knopf im Start-/Endbild); weglassen, wenn das Spiel allein läuft
  startseite: '../',

  // Knopf am Ende (ohne link wird er nicht gezeigt)
  knopf: { text: 'Zur Website', link: 'https://www.anwaltrottweil.de/' },
};
