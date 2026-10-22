// Stempeluhr – Personen, Regeln und Fragen für Level 2 und 3 (MZ bestätigt 22.10.2026; Verdreifachung Nr. 25–72,
// Ruhezeit 11–30, Sonntag 5–12 aus Material/Texte/stempeluhr-level2-entwurf.md, Abschnitt „Verdreifachung“, zur Prüfung).
// Zeiten als Dezimalzahl: 8,5 = 8:30 Uhr bzw. 8½ Std. Nach Textänderungen hier eintragen – der Spielcode bleibt gleich.

// Regeln je Person. pausen: [spätestens nach … Std. Arbeit, Dauer in Std.] – nötig nur, wenn der Tag länger wird;
// max: Höchstarbeitszeit; bis: keine Arbeit nach dieser Uhrzeit; ab: keine Arbeit vor dieser Uhrzeit;
// ruhe: Mindestruhe zwischen zwei Arbeitstagen (Std.). regel: Kurztext auf der Stempelkarte.
// bild/ausschnitt: Foto (person-*.webp) und Ausschnitt [x, y, b, h] für Kopf und Brust.
// plaene: [kürzester, längster] geplanter Tag ohne Frage (Standard: 5 Std. bis Höchstzeit); berufsschule: bekommt Berufsschul-Fragen.
// Neue Figuren (MZ, 23.10.2026, Entwurf Material/Texte/stempeluhr-figuren-neu-entwurf.md): freigestellt aus
// stempeluhr-personen-neu-a.png (Hofmann, Karim, Krämer, Neumann) und -neu-b.png (Kaiser, Sommer, Felix), Faktor 0,75.
const ERWACHSEN = { pausen: [[6, 0.5], [9, 0.25]], max: 10, bis: null, ab: null, ruhe: 11 };
const JUGEND = { pausen: [[4.5, 0.5], [6, 0.5]], max: 8, bis: 20, ab: 6, ruhe: 12 };
window.STEMPELUHR_PERSONEN = {
  du: { name: '', hinweis: '', pausen: [[6, 0.5], [9, 0.25]], max: 10, bis: null, ab: null, ruhe: 11, regel: '' },
  berger: { name: 'Herr Berger', hinweis: 'Angestellter', pausen: [[6, 0.5], [9, 0.25]], max: 10, bis: null, ab: null, ruhe: 11,
    regel: 'max. 10 Std. – Pause nach 6 und 9 Std.', regelKurz: 'max. 10 Std.', bild: 'bilder/person-berger.webp', ausschnitt: [85, 0, 220, 259] },
  // Jugendliche: § 8 (8 Std.), § 11 (Pausen), § 13 (12 Std. Freizeit), § 14 (nicht vor 6 und nach 20 Uhr), § 9 (Berufsschule) JArbSchG
  lena: { name: 'Lena', hinweis: 'Azubi, 17', pausen: [[4.5, 0.5], [6, 0.5]], max: 8, bis: 20, ab: 6, ruhe: 12, berufsschule: true,
    regel: 'max. 8 Std. – Pause nach 4½ und 6 Std. – bis 20 Uhr', regelKurz: 'max. 8 Std. – bis 20 Uhr', bild: 'bilder/person-lena.webp', ausschnitt: [29, 0, 200, 235] },
  // Schwangere: § 4 (8½ Std.), § 5 (nicht zwischen 20 und 6 Uhr) MuSchG
  weiss: { name: 'Frau Weiß', hinweis: 'schwanger', pausen: [[6, 0.5], [9, 0.25]], max: 8.5, bis: 20, ab: 6, ruhe: 11,
    regel: 'max. 8½ Std. – Pause nach 6 Std. – bis 20 Uhr', regelKurz: 'max. 8½ Std. – bis 20 Uhr', bild: 'bilder/person-weiss.webp', ausschnitt: [43, 0, 210, 247] },
  // Erwachsene (ArbZG §§ 3, 4) – angestellte Anwälte und ein Angestellter
  hofmann: Object.assign({ name: 'Frau Hofmann', hinweis: 'Rechtsanwältin', regel: 'max. 10 Std. – Pause nach 6 und 9 Std.', regelKurz: 'max. 10 Std.',
    bild: 'bilder/person-hofmann.webp', ausschnitt: [50, 0, 210, 247] }, ERWACHSEN),
  kaiser: Object.assign({ name: 'Herr Kaiser', hinweis: 'Rechtsanwalt', regel: 'max. 10 Std. – Pause nach 6 und 9 Std.', regelKurz: 'max. 10 Std.',
    bild: 'bilder/person-kaiser.webp', ausschnitt: [142, 0, 210, 247] }, ERWACHSEN),
  neumann: Object.assign({ name: 'Herr Neumann', hinweis: 'Angestellter', regel: 'max. 10 Std. – Pause nach 6 und 9 Std.', regelKurz: 'max. 10 Std.',
    bild: 'bilder/person-neumann.webp', ausschnitt: [25, 0, 210, 247] }, ERWACHSEN),
  // Teilzeit: Gesetz wie Vollzeit, aber kurze Tage – bis 6 Std. keine Pause nötig (sonst „UNNÖTIG“)
  kraemer: Object.assign({ name: 'Frau Krämer', hinweis: 'Büroleitung, Teilzeit', plaene: [4, 6], regel: 'Teilzeit – Pause erst über 6 Std. – max. 10 Std.',
    regelKurz: 'Pause erst über 6 Std.', bild: 'bilder/person-kraemer.webp', ausschnitt: [29, 0, 210, 247] }, ERWACHSEN),
  sommer: Object.assign({ name: 'Frau Sommer', hinweis: 'Teilzeit', plaene: [4, 6], regel: 'Teilzeit – Pause erst über 6 Std. – max. 10 Std.',
    regelKurz: 'Pause erst über 6 Std.', bild: 'bilder/person-sommer.webp', ausschnitt: [32, 0, 210, 247] }, ERWACHSEN),
  // Werkstudent: Erwachsenenregeln, kurze bis mittlere Tage (die 20-Std.-Grenze im Semester betrifft nur die Sozialversicherung)
  felix: Object.assign({ name: 'Felix', hinweis: 'Werkstudent, 22', plaene: [4, 8], regel: 'Werkstudent – Pause nach 6 und 9 Std. – max. 10 Std.',
    regelKurz: 'Pause erst über 6 Std.', bild: 'bilder/person-felix.webp', ausschnitt: [39, 0, 210, 247] }, ERWACHSEN),
  // Azubi 16: Jugendregeln wie Lena, dazu Berufsschultage (§ 9 JArbSchG)
  karim: Object.assign({ name: 'Karim', hinweis: 'Azubi, 16', plaene: [4, 8], berufsschule: true, regel: 'max. 8 Std. – Pause nach 4½ und 6 Std. – bis 20 Uhr',
    regelKurz: 'max. 8 Std. – bis 20 Uhr', bild: 'bilder/person-karim.webp', ausschnitt: [32, 0, 210, 247] }, JUGEND),
};

// Level 2: Tage mit Rückfrage des Chefs.
// T(nr, person, beginn, geplant, Frage nach … Std. Arbeit, Text, richtige Antwort, Begründung, Prüfung)
// Prüfung (das Spiel rechnet nach, ob die Antwort zu den Regeln passt; bei richtigem „Ja“ ergibt sich daraus der neue Plan):
//   ['+', h] = h Std. länger · ['gesamt', h] = insgesamt h Std. · ['bis', uhr] = bis zu dieser Uhrzeit bleiben ·
//   ['ohnePause', n] = Pause Nr. n (0 = erste) weglassen · ['pauseNach', h] = erste Pause erst nach h Std.
window.STEMPELUHR_TAGE2 = (function () {
  const T = (nr, person, beginn, plan, nach, text, antwort, grund, pruef) => ({ nr, person, beginn, plan, frage: { nach, text, antwort, grund, pruef } });
  return [
  // Herr Berger
  T(1, 'berger', 8, 8, 5, 'Kannst du heute 2 Stunden länger bleiben?', 'ja', '10 Std. sind erlaubt', ['+', 2]),
  T(2, 'berger', 7.5, 9, 6, 'Hängst du noch 2 Stunden dran?', 'nein', 'Das wären 11 Std.', ['+', 2]),
  T(3, 'berger', 8, 9.5, 7, 'Noch eine halbe Stunde, damit der Bericht fertig wird?', 'ja', 'Genau 10 Std. – erlaubt', ['+', 0.5]),
  T(4, 'berger', 9, 10, 8, 'Kannst du heute noch eine Stunde länger?', 'nein', 'Das wären 11 Std.', ['+', 1]),
  T(5, 'berger', 8, 6, 3, 'Kannst du heute bis zum Abend bleiben, also 4 Stunden länger?', 'ja', '10 Std. sind erlaubt', ['+', 4]),
  T(6, 'berger', 7, 8.5, 6, 'Bleibst du heute 2 Stunden länger?', 'nein', 'Das wären 10½ Std.', ['+', 2]),
  T(7, 'berger', 8, 7, 5.5, 'Kannst du die Mittagspause heute ausfallen lassen?', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(8, 'berger', 8, 5.5, 3, 'Du kannst heute auch ohne Pause durcharbeiten, oder?', 'ja', 'Unter 6 Std. ist keine Pause nötig', ['ohnePause', 0]),
  T(25, 'berger', 8, 7, 4, 'Kannst du heute 3 Stunden länger bleiben?', 'ja', 'Genau 10 Std.', ['+', 3]),
  T(26, 'berger', 8, 8.5, 6, 'Bleibst du heute 2 Stunden länger?', 'nein', 'Das wären 10½ Std.', ['+', 2]),
  T(27, 'berger', 7, 9.5, 8, 'Eine halbe Stunde mehr für den Schriftsatz?', 'ja', 'Genau 10 Std.', ['+', 0.5]),
  T(28, 'berger', 7, 10, 9, 'Nur noch 10 Minuten, bitte?', 'nein', 'Über 10 Std.', ['+', 1 / 6]),
  T(29, 'berger', 9, 6, 3, 'Kannst du 4 Stunden dranhängen?', 'ja', 'Genau 10 Std.', ['+', 4]),
  T(30, 'berger', 9, 6, 3, 'Kannst du heute 5 Stunden länger bleiben?', 'nein', 'Das wären 11 Std.', ['+', 5]),
  T(31, 'berger', 8, 9.5, 8, 'Lass die zweite Pause heute weg, ja?', 'nein', 'Über 9 Std. weitere 15 Min. Pflicht', ['ohnePause', 1]),
  T(32, 'berger', 8, 8, 5, 'Lass die Mittagspause heute weg, ja?', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(33, 'berger', 8, 6, 3, 'Arbeite heute ohne Pause durch, sind ja nur 6 Stunden.', 'ja', 'Pause erst bei mehr als 6 Std.', ['ohnePause', 0]),
  T(34, 'berger', 7.5, 9, 7, 'Noch eine Stunde für die Akte Wagner?', 'ja', 'Genau 10 Std.', ['+', 1]),
  T(35, 'berger', 7.5, 9, 7, 'Noch anderthalb Stunden für die Akte Wagner?', 'nein', 'Das wären 10½ Std.', ['+', 1.5]),
  T(36, 'berger', 8, 5, 2, 'Kannst du heute 5 Stunden mehr machen?', 'ja', 'Genau 10 Std.', ['+', 5]),
  T(37, 'berger', 8, 8, 4, 'Kannst du heute ausnahmsweise 12 Stunden machen?', 'nein', 'Höchstens 10 Std.', ['gesamt', 12]),
  T(38, 'berger', 8, 7.5, 5, 'Kannst du heute 2½ Stunden länger?', 'ja', 'Genau 10 Std.', ['+', 2.5]),
  T(39, 'berger', 8, 9, 8, 'Hängst du noch eine Viertelstunde dran?', 'ja', '9¼ Std. sind erlaubt', ['+', 0.25]),
  T(40, 'berger', 8, 10, 8, 'Noch eine Stunde, dann hast du es geschafft?', 'nein', 'Das wären 11 Std.', ['+', 1]),
  // Lena, Azubi 17
  T(9, 'lena', 8, 7, 4, 'Lena, kannst du heute eine Stunde länger bleiben?', 'ja', '8 Std. sind erlaubt', ['+', 1]),
  T(10, 'lena', 8, 8, 6, 'Kannst du heute noch eine Stunde dranhängen?', 'nein', 'Azubis unter 18: höchstens 8 Std.', ['+', 1]),
  T(11, 'lena', 12, 7, 4, 'Bleibst du heute bis 21 Uhr?', 'nein', 'Unter 18 nicht nach 20 Uhr', ['bis', 21]),
  T(12, 'lena', 8, 6, 2, 'Mach heute doch erst nach 5 Stunden Pause.', 'nein', 'Pause spätestens nach 4½ Std.', ['pauseNach', 5]),
  T(13, 'lena', 7, 6, 3, 'Kannst du heute 2 Stunden länger bleiben?', 'ja', '8 Std. sind erlaubt', ['+', 2]),
  T(14, 'lena', 10, 8, 7, 'Eine halbe Stunde länger, geht das?', 'nein', 'Das wären 8½ Std.', ['+', 0.5]),
  T(15, 'lena', 8, 5, 2, 'Du brauchst heute keine Pause, oder?', 'nein', 'Ab 4½ Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(16, 'lena', 9, 6, 3, 'Kannst du bis 17 Uhr bleiben?', 'ja', 'Unter 8 Std. und vor 20 Uhr', ['bis', 17]),   // MZ: bis 17 Uhr = 7 Std., Ja
  T(41, 'lena', 8, 6, 3, 'Kannst du heute 2 Stunden länger bleiben?', 'ja', 'Genau 8 Std., Ende 17 Uhr', ['+', 2]),
  T(42, 'lena', 8, 7.5, 5, 'Noch eine Stunde, geht das?', 'nein', 'Das wären 8½ Std.', ['+', 1]),
  T(43, 'lena', 13, 5, 3, 'Bleibst du heute bis 21 Uhr?', 'nein', 'Nicht nach 20 Uhr', ['bis', 21]),
  T(44, 'lena', 10, 6, 3, 'Kannst du heute noch 2 Stunden dranhängen?', 'ja', '8 Std., Ende 19 Uhr', ['+', 2]),
  T(45, 'lena', 8, 7, 5, 'Lass die zweite Pause heute weg, ja?', 'nein', 'Über 6 Std. insgesamt 60 Min. Pause', ['ohnePause', 1]),
  T(46, 'lena', 8, 4, 2, 'Du brauchst heute keine Pause, oder?', 'ja', 'Unter 4½ Std. keine Pause nötig', ['ohnePause', 0]),
  T(47, 'lena', 9, 5.5, 2, 'Arbeite heute einfach ohne Pause durch.', 'nein', 'Ab 4½ Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(48, 'lena', 7, 8, 7, 'Nur 30 Minuten länger, bitte.', 'nein', 'Höchstens 8 Std.', ['+', 0.5]),
  T(49, 'lena', 8, 6.5, 4, 'Kannst du eine Stunde länger bleiben?', 'ja', '7½ Std. sind erlaubt', ['+', 1]),
  T(50, 'lena', 12, 6, 3, 'Kannst du heute bis 20:30 Uhr bleiben?', 'nein', 'Nicht nach 20 Uhr', ['bis', 20.5]),
  T(51, 'lena', 8, 5, 3, 'Schaffst du heute 3 Stunden extra?', 'ja', 'Genau 8 Std., Ende 17 Uhr', ['+', 3]),
  T(52, 'lena', 8, 8, 6, 'Kommst du nach Feierabend noch eine Stunde zur Inventur?', 'nein', 'Das wären 9 Std.', ['+', 1]),
  T(53, 'lena', 9, 7, 5, 'Bleibst du heute eine halbe Stunde länger?', 'ja', '7½ Std. sind erlaubt', ['+', 0.5]),
  T(54, 'lena', 8, 6, 1, 'Mach deine erste Pause heute erst nach 5 Stunden.', 'nein', 'Spätestens nach 4½ Std.', ['pauseNach', 5]),
  T(55, 'lena', 7.5, 7, 6, 'Hängst du eine Stunde dran?', 'ja', 'Genau 8 Std.', ['+', 1]),
  T(56, 'lena', 7.5, 7, 6, 'Hängst du anderthalb Stunden dran?', 'nein', 'Das wären 8½ Std.', ['+', 1.5]),
  // Frau Weiß, schwanger
  T(17, 'weiss', 8, 7, 4, 'Können Sie heute eine Stunde länger bleiben?', 'ja', '8 Std. – erlaubt sind 8½', ['+', 1]),
  T(18, 'weiss', 8, 8, 6, 'Noch eine Stunde, geht das heute?', 'nein', 'Schwanger: höchstens 8½ Std.', ['+', 1]),
  T(19, 'weiss', 13, 6, 3, 'Können Sie heute bis 21 Uhr bleiben?', 'nein', 'Schwanger: nicht nach 20 Uhr', ['bis', 21]),
  T(20, 'weiss', 8, 8, 7, 'Eine halbe Stunde länger für die Akte Müller?', 'ja', 'Genau 8½ Std. – erlaubt', ['+', 0.5]),
  T(21, 'weiss', 7.5, 6, 3, 'Können Sie heute 2 Stunden länger?', 'ja', '8 Std., Ende vor 20 Uhr', ['+', 2]),
  T(22, 'weiss', 9, 8.5, 8, 'Nur noch 15 Minuten, bitte?', 'nein', 'Das wären über 8½ Std.', ['+', 0.25]),
  T(23, 'weiss', 8, 7, 5.5, 'Lassen Sie die Pause heute ausfallen?', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(24, 'weiss', 11, 8, 5, 'Bleiben Sie heute bis zum Schluss, ca. 20:30 Uhr?', 'nein', 'Schwanger: nicht nach 20 Uhr', ['bis', 20.5]),
  T(57, 'weiss', 8, 6.5, 4, 'Können Sie heute 2 Stunden länger bleiben?', 'ja', 'Genau 8½ Std.', ['+', 2]),
  T(58, 'weiss', 8, 7, 4, 'Können Sie heute 2 Stunden länger bleiben?', 'nein', 'Das wären 9 Std.', ['+', 2]),
  T(59, 'weiss', 14, 5, 3, 'Können Sie heute bis 21 Uhr bleiben?', 'nein', 'Nicht nach 20 Uhr', ['bis', 21]),
  T(60, 'weiss', 8, 8.5, 8, 'Nur eine Viertelstunde mehr?', 'nein', 'Höchstens 8½ Std.', ['+', 0.25]),
  T(61, 'weiss', 7, 6, 3, 'Können Sie heute 2½ Stunden dranhängen?', 'ja', 'Genau 8½ Std.', ['+', 2.5]),
  T(62, 'weiss', 8, 5.5, 3, 'Arbeiten Sie heute ohne Pause durch?', 'ja', 'Unter 6 Std. keine Pause nötig', ['ohnePause', 0]),
  T(63, 'weiss', 8, 8, 5, 'Verzichten Sie heute auf die Pause?', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(64, 'weiss', 12, 7, 4, 'Bleiben Sie heute bis 20:30 Uhr?', 'nein', 'Nicht nach 20 Uhr', ['bis', 20.5]),
  T(65, 'weiss', 9, 7.5, 6, 'Eine Stunde länger für die Fristenkontrolle?', 'ja', 'Genau 8½ Std.', ['+', 1]),
  T(66, 'weiss', 9, 7.5, 6, 'Anderthalb Stunden länger?', 'nein', 'Das wären 9 Std.', ['+', 1.5]),
  T(67, 'weiss', 8, 6, 3, 'Können Sie heute eine Stunde länger bleiben?', 'ja', '7 Std. sind erlaubt', ['+', 1]),
  T(68, 'weiss', 10, 8, 5, 'Können Sie heute eine halbe Stunde länger bleiben?', 'ja', 'Genau 8½ Std., Ende 19 Uhr', ['+', 0.5]),
  T(69, 'weiss', 8, 8.5, 6, 'Helfen Sie nach Feierabend noch 2 Stunden beim Aufbau der Kanzleifeier?', 'nein', 'Das wären 10½ Std.', ['+', 2]),
  T(70, 'weiss', 7.5, 5, 2, 'Können Sie 3 Stunden länger bleiben?', 'ja', '8 Std. sind erlaubt', ['+', 3]),
  T(71, 'weiss', 7.5, 5, 2, 'Können Sie 4 Stunden länger bleiben?', 'nein', 'Das wären 9 Std.', ['+', 4]),
  T(72, 'weiss', 12, 6, 3, 'Können Sie heute eine halbe Stunde länger bleiben?', 'ja', '6½ Std., Ende 19 Uhr', ['+', 0.5]),
  // Frau Hofmann, Rechtsanwältin (MZ, 23.10.2026: neue Figuren, Nr. 73–128)
  T(73, 'hofmann', 8, 8, 5, 'Können Sie heute 2 Stunden länger bleiben? Der Schriftsatz muss raus.', 'ja', 'Genau 10 Std.', ['+', 2]),
  T(74, 'hofmann', 8, 9, 7, 'Können Sie für die Fristsache noch anderthalb Stunden dranhängen?', 'nein', 'Das wären 10½ Std.', ['+', 1.5]),
  T(75, 'hofmann', 9, 6, 3, 'Der Termin zieht sich. Können Sie 3 Stunden länger bleiben?', 'ja', '9 Std. – dann Pause nach 6 Std.', ['+', 3]),
  T(76, 'hofmann', 8, 9.5, 8, 'Lassen Sie die zweite Pause heute aus?', 'nein', 'Über 9 Std. weitere 15 Min. Pflicht', ['ohnePause', 1]),
  T(77, 'hofmann', 8, 9, 7, 'Die zweite Pause brauchen Sie heute nicht, oder?', 'ja', 'Genau 9 Std. – zweite Pause erst darüber', ['ohnePause', 1]),
  T(78, 'hofmann', 7.5, 8, 4, 'Können Sie heute ausnahmsweise 11 Stunden machen? Morgen ist Verhandlung.', 'nein', 'Höchstens 10 Std.', ['gesamt', 11]),
  T(79, 'hofmann', 8, 7, 5, 'Arbeiten Sie heute ohne Mittagspause durch?', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(80, 'hofmann', 10, 6, 3, 'Können Sie heute bis 19 Uhr bleiben?', 'ja', '8½ Std. Arbeit plus Pause', ['bis', 19]),
  // Herr Kaiser, Rechtsanwalt
  T(81, 'kaiser', 8, 9.5, 8, 'Noch eine halbe Stunde für die Berufungsbegründung?', 'ja', 'Genau 10 Std.', ['+', 0.5]),
  T(82, 'kaiser', 8, 10, 9, 'Nur noch 20 Minuten für das Diktat?', 'nein', 'Über 10 Std.', ['+', 1 / 3]),
  T(83, 'kaiser', 7, 6, 3, 'Können Sie nach dem Gerichtstermin noch 4 Stunden ins Büro?', 'ja', 'Genau 10 Std.', ['+', 4]),
  T(84, 'kaiser', 8, 8.5, 6, 'Hängen Sie heute 2 Stunden dran?', 'nein', 'Das wären 10½ Std.', ['+', 2]),
  T(85, 'kaiser', 8, 5.5, 3, 'Sie arbeiten heute ohne Pause durch, oder?', 'ja', 'Unter 6 Std. keine Pause nötig', ['ohnePause', 0]),
  T(86, 'kaiser', 8, 8, 2, 'Machen Sie Ihre Pause heute erst nach 7 Stunden?', 'nein', 'Spätestens nach 6 Std.', ['pauseNach', 7]),
  T(87, 'kaiser', 9, 7, 4, 'Können Sie heute bis 20 Uhr bleiben?', 'nein', 'Das wären über 10 Std. Arbeit', ['bis', 20]),
  T(88, 'kaiser', 8, 7.5, 5, 'Können Sie heute 2½ Stunden länger bleiben?', 'ja', 'Genau 10 Std.', ['+', 2.5]),
  // Herr Neumann, Angestellter
  T(89, 'neumann', 8, 7, 4, 'Kannst du heute 3 Stunden länger bleiben? Die Akten müssen heute noch eingescannt werden.', 'ja', 'Genau 10 Std.', ['+', 3]),
  T(90, 'neumann', 8, 9, 6, 'Hängst du noch 2 Stunden dran?', 'nein', 'Das wären 11 Std.', ['+', 2]),
  T(91, 'neumann', 7.5, 8, 5, 'Lass die Mittagspause heute ausfallen, ja?', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(92, 'neumann', 8, 6, 2, 'Du machst heute 6 Stunden – eine Pause brauchst du nicht, oder?', 'ja', 'Pause erst bei mehr als 6 Std.', ['ohnePause', 0]),
  T(93, 'neumann', 8, 9, 8, 'Noch eine Viertelstunde für die E-Akte?', 'ja', '9¼ Std. – dann 2. Pause nach 9 Std.', ['+', 0.25]),
  T(94, 'neumann', 9, 8, 5, 'Kannst du heute bis 21 Uhr bleiben?', 'nein', 'Das wären über 10 Std. Arbeit', ['bis', 21]),
  T(95, 'neumann', 8, 5, 2, 'Kannst du heute 4½ Stunden mehr machen?', 'ja', '9½ Std. – dann beide Pausen', ['+', 4.5]),
  T(96, 'neumann', 8, 10, 8, 'Nur noch eine halbe Stunde, bitte?', 'nein', 'Höchstens 10 Std.', ['+', 0.5]),
  // Frau Krämer, Büroleitung, Teilzeit
  T(97, 'kraemer', 8, 5, 3, 'Können Sie heute ohne Pause durcharbeiten?', 'ja', '5 Std. – keine Pause nötig', ['ohnePause', 0]),
  T(98, 'kraemer', 8, 5, 3, 'Können Sie heute 2 Stunden länger bleiben?', 'ja', '7 Std. – dann Pause nach 6 Std.', ['+', 2]),
  T(99, 'kraemer', 7.5, 6, 3, 'Bei 6 Stunden brauchen Sie keine Pause, oder?', 'ja', 'Pause erst bei mehr als 6 Std.', ['ohnePause', 0]),
  T(100, 'kraemer', 8, 4, 2, 'Können Sie heute ausnahmsweise 7 Stunden länger bleiben?', 'nein', 'Das wären 11 Std.', ['+', 7]),
  T(101, 'kraemer', 8, 4.5, 2, 'Können Sie heute bis 19 Uhr bleiben? Sonst ist das Telefon nicht besetzt.', 'nein', 'Das wären über 10 Std. Arbeit', ['bis', 19]),
  T(102, 'kraemer', 8, 5.5, 4, 'Hängen Sie eine halbe Stunde dran? Dann sind es genau 6 Stunden.', 'ja', '6 Std. – weiter ohne Pause', ['+', 0.5]),
  T(103, 'kraemer', 8, 4, 2, 'Können Sie heute 6 Stunden länger bleiben?', 'ja', 'Genau 10 Std. – mit beiden Pausen', ['+', 6]),
  T(104, 'kraemer', 8, 6, 3, 'Können Sie heute ausnahmsweise 12 Stunden machen?', 'nein', 'Höchstens 10 Std.', ['gesamt', 12]),
  // Frau Sommer, Teilzeit
  T(105, 'sommer', 8, 4, 2, 'Du brauchst heute keine Pause, oder?', 'ja', '4 Std. – keine Pause nötig', ['ohnePause', 0]),
  T(106, 'sommer', 8, 5, 3, 'Kannst du heute 3 Stunden länger bleiben?', 'ja', '8 Std. – dann Pause nach 6 Std.', ['+', 3]),
  T(107, 'sommer', 8, 6, 3, 'Kannst du heute 5 Stunden länger bleiben?', 'nein', 'Das wären 11 Std.', ['+', 5]),
  T(108, 'sommer', 9, 5.5, 3, 'Mach heute ohne Pause, die Post muss raus.', 'ja', '5½ Std. – keine Pause nötig', ['ohnePause', 0]),
  T(109, 'sommer', 8, 4, 2, 'Kannst du bis 19:30 Uhr bleiben? Die Fristenpost muss noch weg.', 'nein', 'Das wären über 10 Std. Arbeit', ['bis', 19.5]),
  T(110, 'sommer', 8, 5, 4, 'Hängst du eine Stunde dran?', 'ja', '6 Std. – noch ohne Pause', ['+', 1]),
  T(111, 'sommer', 7, 6, 3, 'Kannst du heute 4½ Stunden länger bleiben?', 'nein', 'Das wären 10½ Std.', ['+', 4.5]),
  T(112, 'sommer', 8, 4.5, 2, 'Kannst du heute 5½ Stunden länger bleiben?', 'ja', 'Genau 10 Std. – mit beiden Pausen', ['+', 5.5]),
  // Felix, Werkstudent
  T(113, 'felix', 10, 4, 2, 'Kannst du heute 2 Stunden länger bleiben?', 'ja', '6 Std. – keine Pause nötig', ['+', 2]),
  T(114, 'felix', 10, 6, 4, 'Hängst du eine Stunde dran?', 'ja', '7 Std. – dann Pause nach 6 Std.', ['+', 1]),
  T(115, 'felix', 9, 5, 2, 'Du brauchst heute keine Pause, oder?', 'ja', 'Unter 6 Std. keine Pause nötig', ['ohnePause', 0]),
  T(116, 'felix', 9, 7, 4, 'Arbeite heute ohne Pause durch, als Student bist du das doch gewohnt.', 'nein', 'Über 6 Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(117, 'felix', 8, 8, 5, 'Kannst du heute 3 Stunden länger bleiben?', 'nein', 'Das wären 11 Std.', ['+', 3]),
  T(118, 'felix', 12, 6, 3, 'Kannst du heute bis 21 Uhr bleiben?', 'ja', 'Die 20-Uhr-Grenze gilt nur für Jugendliche und Schwangere', ['bis', 21]),
  T(119, 'felix', 8, 8, 2, 'Mach deine Pause heute erst nach 6½ Stunden.', 'nein', 'Spätestens nach 6 Std.', ['pauseNach', 6.5]),
  T(120, 'felix', 8, 7, 4, 'Kannst du heute 3 Stunden länger bleiben?', 'ja', 'Genau 10 Std.', ['+', 3]),
  // Karim, Azubi 16
  T(121, 'karim', 8, 6, 3, 'Karim, kannst du heute 2 Stunden länger bleiben?', 'ja', 'Genau 8 Std., Ende 17 Uhr', ['+', 2]),
  T(122, 'karim', 8, 7.5, 5, 'Noch eine Stunde, geht das?', 'nein', 'Das wären 8½ Std.', ['+', 1]),
  T(123, 'karim', 12, 6, 3, 'Bleibst du heute bis 20:30 Uhr?', 'nein', 'Unter 18 nicht nach 20 Uhr', ['bis', 20.5]),
  T(124, 'karim', 8, 4, 2, 'Du brauchst heute keine Pause, oder?', 'ja', 'Unter 4½ Std. keine Pause nötig', ['ohnePause', 0]),
  T(125, 'karim', 8, 5, 2, 'Lass die Pause heute weg, sind ja nur 5 Stunden.', 'nein', 'Ab 4½ Std. ist die Pause Pflicht', ['ohnePause', 0]),
  T(126, 'karim', 7, 7, 5, 'Lass die zweite Pause heute weg, ja?', 'nein', 'Über 6 Std. insgesamt 60 Min. Pause', ['ohnePause', 1]),
  T(127, 'karim', 10, 6, 3, 'Kannst du heute bis 18:30 Uhr bleiben?', 'ja', '7½ Std. Arbeit plus Pausen, vor 20 Uhr', ['bis', 18.5]),
  T(128, 'karim', 8, 6, 1, 'Mach deine erste Pause heute erst nach 5 Stunden.', 'nein', 'Spätestens nach 4½ Std.', ['pauseNach', 5]),
  ];
})();

// Level 3, Ruhezeit-Fragen vor Arbeitsbeginn. gestern = Ende des Termins am Vortag, heute = gewünschter Beginn,
// sonst = Beginn bei „Nein“ (frühester erlaubter, auf halbe Stunden). Das Spiel prüft beim Laden: „Ja“ nur, wenn die
// Ruhezeit der Person reicht (11 Std., unter 18: 12 Std.) und der Beginn nicht vor ihrer frühesten Uhrzeit liegt.
window.STEMPELUHR_RUHEZEIT = [
  { nr: 1, person: 'berger', gestern: 22, heute: 7, sonst: 9, text: 'Herr Berger war gestern bis 22:00 Uhr bei einem Mandantentermin. Darf er heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 9 Std. Ruhe – nötig sind 11' },
  { nr: 2, person: 'berger', gestern: 21.5, heute: 7, sonst: 8.5, text: 'Herr Berger hat gestern bis 21:30 Uhr an einer Klageschrift gearbeitet. Darf er heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 9½ Std. Ruhe – nötig sind 11' },
  { nr: 3, person: 'berger', gestern: 20, heute: 7, sonst: 7, text: 'Herr Berger war gestern bis 20:00 Uhr beim Mandanten. Darf er heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 4, person: 'berger', gestern: 19, heute: 7.5, sonst: 7.5, text: 'Herr Berger hatte gestern bis 19:00 Uhr eine Fortbildung. Darf er heute um 7:30 Uhr anfangen?', antwort: 'ja', grund: '12½ Std. Ruhe' },
  { nr: 5, person: 'berger', gestern: 23, heute: 8.5, sonst: 10, text: 'Herr Berger war gestern bis 23:00 Uhr bei einer Eigentümerversammlung. Darf er heute um 8:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 9½ Std. Ruhe – nötig sind 11' },
  { nr: 6, person: 'berger', gestern: 21, heute: 8, sonst: 8, text: 'Herr Berger war gestern bis 21:00 Uhr auf einem Vortragsabend. Darf er heute um 8:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 7, person: 'weiss', gestern: 19.5, heute: 7, sonst: 7, text: 'Frau Weiß war gestern bis 19:30 Uhr bei einer Schulung. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '11½ Std. Ruhe' },
  { nr: 8, person: 'weiss', gestern: 20, heute: 6.5, sonst: 7, text: 'Frau Weiß hat gestern bis 20:00 Uhr einen Termin vorbereitet. Darf sie heute schon um 6:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 9, person: 'lena', gestern: 19.5, heute: 7, sonst: 7.5, text: 'Lena war gestern bis 19:30 Uhr bei einer Fortbildung. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Unter 18 sind 12 Std. Ruhe nötig' },
  { nr: 10, person: 'lena', gestern: 18, heute: 7, sonst: 7, text: 'Lena war gestern bis 18:00 Uhr beim Azubi-Projekttag. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '13 Std. Ruhe' },
  { nr: 11, person: 'berger', gestern: 22.5, heute: 8, sonst: 9.5, text: 'Herr Berger war gestern bis 22:30 Uhr bei einem auswärtigen Gerichtstermin. Darf er heute um 8:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 9½ Std. Ruhe – nötig sind 11' },
  { nr: 12, person: 'berger', gestern: 20.5, heute: 7.5, sonst: 7.5, text: 'Herr Berger war gestern bis 20:30 Uhr bei einem Notartermin. Darf er heute um 7:30 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 13, person: 'berger', gestern: 21, heute: 7.5, sonst: 8, text: 'Herr Berger war gestern bis 21:00 Uhr bei einem Mandantenbesuch. Darf er heute um 7:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 14, person: 'berger', gestern: 18.5, heute: 6, sonst: 6, text: 'Herr Berger hatte gestern bis 18:30 Uhr eine Fortbildung. Darf er heute schon um 6:00 Uhr anfangen?', antwort: 'ja', grund: '11½ Std. Ruhe' },
  { nr: 15, person: 'berger', gestern: 23.5, heute: 10, sonst: 10.5, text: 'Herr Berger war gestern bis 23:30 Uhr bei einer Eigentümerversammlung. Darf er heute um 10:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 16, person: 'berger', gestern: 22, heute: 9, sonst: 9, text: 'Herr Berger hat gestern bis 22:00 Uhr einen Vortrag gehalten. Darf er heute um 9:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 17, person: 'berger', gestern: 19.5, heute: 7, sonst: 7, text: 'Herr Berger war gestern bis 19:30 Uhr bei einem Ortstermin. Darf er heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '11½ Std. Ruhe' },
  { nr: 18, person: 'berger', gestern: 22.25, heute: 8.5, sonst: 9.5, text: 'Herr Berger war gestern bis 22:15 Uhr bei einem Haftprüfungstermin. Darf er heute um 8:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10¼ Std. Ruhe – nötig sind 11' },
  { nr: 19, person: 'weiss', gestern: 18, heute: 6, sonst: 6, text: 'Frau Weiß hatte gestern bis 18:00 Uhr eine Schulung. Darf sie heute schon um 6:00 Uhr anfangen?', antwort: 'ja', grund: '12 Std. Ruhe' },
  { nr: 20, person: 'weiss', gestern: 19.75, heute: 7, sonst: 7, text: 'Frau Weiß war gestern bis 19:45 Uhr bei einem Mandantentermin. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '11¼ Std. Ruhe' },
  { nr: 21, person: 'weiss', gestern: 19.5, heute: 6, sonst: 6.5, text: 'Frau Weiß war gestern bis 19:30 Uhr auf einem Seminar. Darf sie heute schon um 6:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 22, person: 'weiss', gestern: 18.5, heute: 6, sonst: 6, text: 'Frau Weiß war gestern bis 18:30 Uhr bei einem Gerichtstermin. Darf sie heute schon um 6:00 Uhr anfangen?', antwort: 'ja', grund: '11½ Std. Ruhe' },
  { nr: 23, person: 'weiss', gestern: 20, heute: 7.5, sonst: 7.5, text: 'Frau Weiß war gestern bis 20:00 Uhr bei einem Infoabend. Darf sie heute um 7:30 Uhr anfangen?', antwort: 'ja', grund: '11½ Std. Ruhe' },
  { nr: 24, person: 'lena', gestern: 18.5, heute: 7, sonst: 7, text: 'Lena war gestern bis 18:30 Uhr bei einem Azubi-Workshop. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '12½ Std. Ruhe' },
  { nr: 25, person: 'lena', gestern: 19, heute: 7, sonst: 7, text: 'Lena war gestern bis 19:00 Uhr auf einer Ausbildungsmesse. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 12 Std. Ruhe' },
  { nr: 26, person: 'lena', gestern: 19.5, heute: 7, sonst: 7.5, text: 'Lena war gestern bis 19:30 Uhr auf einem Seminar. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 11½ Std. – unter 18 sind 12 Std. Pflicht' },
  { nr: 27, person: 'lena', gestern: 17.5, heute: 6, sonst: 6, text: 'Lena war gestern bis 17:30 Uhr auf einer Exkursion. Darf sie heute schon um 6:00 Uhr anfangen?', antwort: 'ja', grund: '12½ Std. Ruhe' },
  { nr: 28, person: 'lena', gestern: 20, heute: 8, sonst: 8, text: 'Lena hat gestern bis 20:00 Uhr beim Aufbau des Kanzleifests geholfen. Darf sie heute um 8:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 12 Std. Ruhe' },
  { nr: 29, person: 'lena', gestern: 19, heute: 6.5, sonst: 7, text: 'Lena war gestern bis 19:00 Uhr auf einer Ausbildungsmesse. Darf sie heute schon um 6:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 11½ Std. – unter 18 sind 12 Std. Pflicht' },
  { nr: 30, person: 'lena', gestern: 18, heute: 5.5, sonst: 6, text: 'Lena war gestern bis 18:00 Uhr bei einer Fortbildung. Darf sie heute schon um 5:30 Uhr anfangen?', antwort: 'nein', grund: 'Unter 18 nicht vor 6 Uhr – und nur 11½ Std. Ruhe' },
  // neue Figuren (MZ, 23.10.2026), Nr. 31–58
  { nr: 31, person: 'hofmann', gestern: 21.5, heute: 8, sonst: 8.5, text: 'Frau Hofmann war gestern bis 21:30 Uhr bei einem Mandantenabend. Darf sie heute um 8:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 32, person: 'hofmann', gestern: 20, heute: 7, sonst: 7, text: 'Frau Hofmann war gestern bis 20:00 Uhr bei einem auswärtigen Verhandlungstermin. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 33, person: 'hofmann', gestern: 22, heute: 8.5, sonst: 9, text: 'Frau Hofmann war gestern bis 22:00 Uhr bei einem Vortrag in der Anwaltskammer. Darf sie heute um 8:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 34, person: 'hofmann', gestern: 19, heute: 7, sonst: 7, text: 'Frau Hofmann war gestern bis 19:00 Uhr bei einer Fachanwaltsfortbildung. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '12 Std. Ruhe' },
  { nr: 35, person: 'kaiser', gestern: 23, heute: 9, sonst: 10, text: 'Herr Kaiser war gestern bis 23:00 Uhr bei einer Gläubigerversammlung. Darf er heute um 9:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10 Std. Ruhe – nötig sind 11' },
  { nr: 36, person: 'kaiser', gestern: 21, heute: 8, sonst: 8, text: 'Herr Kaiser war gestern bis 21:00 Uhr bei einem Ortstermin. Darf er heute um 8:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 37, person: 'kaiser', gestern: 20.5, heute: 7, sonst: 7.5, text: 'Herr Kaiser war gestern bis 20:30 Uhr bei einem Haftprüfungstermin. Darf er heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 38, person: 'kaiser', gestern: 18.5, heute: 6.5, sonst: 6.5, text: 'Herr Kaiser war gestern bis 18:30 Uhr bei einem Notartermin. Darf er heute um 6:30 Uhr anfangen?', antwort: 'ja', grund: '12 Std. Ruhe' },
  { nr: 39, person: 'neumann', gestern: 22, heute: 8, sonst: 9, text: 'Herr Neumann war gestern bis 22:00 Uhr bei der Umstellung der Kanzleisoftware. Darf er heute um 8:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10 Std. Ruhe – nötig sind 11' },
  { nr: 40, person: 'neumann', gestern: 19.5, heute: 6.5, sonst: 6.5, text: 'Herr Neumann war gestern bis 19:30 Uhr bei einer Schulung zur E-Akte. Darf er heute um 6:30 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 41, person: 'neumann', gestern: 21, heute: 7.5, sonst: 8, text: 'Herr Neumann war gestern bis 21:00 Uhr bei der Wartung der Server. Darf er heute um 7:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 42, person: 'neumann', gestern: 20, heute: 7.5, sonst: 7.5, text: 'Herr Neumann war gestern bis 20:00 Uhr bei einem Infoabend für Mandanten. Darf er heute um 7:30 Uhr anfangen?', antwort: 'ja', grund: '11½ Std. Ruhe' },
  { nr: 43, person: 'kraemer', gestern: 20, heute: 7, sonst: 7, text: 'Frau Krämer war gestern bis 20:00 Uhr bei der Inventur im Archiv. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 44, person: 'kraemer', gestern: 21, heute: 7.5, sonst: 8, text: 'Frau Krämer war gestern bis 21:00 Uhr beim Umzug des Archivs. Darf sie heute um 7:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 45, person: 'kraemer', gestern: 19, heute: 6, sonst: 6, text: 'Frau Krämer war gestern bis 19:00 Uhr bei einer Schulung. Darf sie heute um 6:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 46, person: 'kraemer', gestern: 22, heute: 8, sonst: 9, text: 'Frau Krämer war gestern bis 22:00 Uhr beim Aufräumen nach der Kanzleifeier. Darf sie heute um 8:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10 Std. Ruhe – nötig sind 11' },
  { nr: 47, person: 'sommer', gestern: 20.5, heute: 7, sonst: 7.5, text: 'Frau Sommer war gestern bis 20:30 Uhr mit der Fristenpost beim Nachtbriefkasten. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 48, person: 'sommer', gestern: 19, heute: 7, sonst: 7, text: 'Frau Sommer war gestern bis 19:00 Uhr auf einem Seminar. Darf sie heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: '12 Std. Ruhe' },
  { nr: 49, person: 'sommer', gestern: 21, heute: 8, sonst: 8, text: 'Frau Sommer war gestern bis 21:00 Uhr beim Sortieren des Archivs. Darf sie heute um 8:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 50, person: 'sommer', gestern: 22.5, heute: 9, sonst: 9.5, text: 'Frau Sommer war gestern bis 22:30 Uhr bei der Inventur. Darf sie heute um 9:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 51, person: 'felix', gestern: 21.5, heute: 8, sonst: 8.5, text: 'Felix war gestern bis 21:30 Uhr beim Digitalisieren im Archiv. Darf er heute um 8:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10½ Std. Ruhe – nötig sind 11' },
  { nr: 52, person: 'felix', gestern: 20, heute: 7, sonst: 7, text: 'Felix war gestern bis 20:00 Uhr am Messestand der Kanzlei. Darf er heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 53, person: 'felix', gestern: 22, heute: 9, sonst: 9, text: 'Felix war gestern bis 22:00 Uhr beim Umzug der Server. Darf er heute um 9:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 11 Std. Ruhe' },
  { nr: 54, person: 'felix', gestern: 21, heute: 7, sonst: 8, text: 'Felix war gestern bis 21:00 Uhr beim Aufbau des Kanzleifests. Darf er heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 10 Std. Ruhe – nötig sind 11' },
  { nr: 55, person: 'karim', gestern: 19, heute: 7, sonst: 7, text: 'Karim war gestern bis 19:00 Uhr bei einem Azubi-Infoabend. Darf er heute um 7:00 Uhr anfangen?', antwort: 'ja', grund: 'Genau 12 Std. Ruhe' },
  { nr: 56, person: 'karim', gestern: 19.5, heute: 7, sonst: 7.5, text: 'Karim war gestern bis 19:30 Uhr auf einer Ausbildungsmesse. Darf er heute um 7:00 Uhr anfangen?', antwort: 'nein', grund: 'Nur 11½ Std. – unter 18 sind 12 Std. Pflicht' },
  { nr: 57, person: 'karim', gestern: 18, heute: 5.5, sonst: 6, text: 'Karim war gestern bis 18:00 Uhr bei einem Azubi-Projekttag. Darf er heute um 5:30 Uhr anfangen?', antwort: 'nein', grund: 'Unter 18 nicht vor 6 Uhr' },
  { nr: 58, person: 'karim', gestern: 20, heute: 7.5, sonst: 8, text: 'Karim war gestern bis 20:00 Uhr beim Aufbau des Kanzleifests. Darf er heute um 7:30 Uhr anfangen?', antwort: 'nein', grund: 'Nur 11½ Std. – unter 18 sind 12 Std. Pflicht' },
];

// Level 3, Sonntag (6. Tag, keine Arbeit): eine Frage, dann Ende der Woche. Sonntagsarbeit ist im Spiel immer „Nein“.
window.STEMPELUHR_SONNTAG = [
  { nr: 1, person: 'lena', text: 'Lena möchte heute zwei Stunden Akten sortieren. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 2, person: 'berger', text: 'Herr Berger will heute drei Stunden die Post durchsehen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe – auch für ein paar Stunden' },
  { nr: 3, person: 'weiss', text: 'Frau Weiß bietet an, heute den Fristenkalender nachzutragen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 4, person: 'berger', text: 'Herr Berger fragt, ob er heute frei hat und erst am Montag um 8:00 Uhr wiederkommt. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 5, person: 'weiss', text: 'Frau Weiß möchte heute eine Stunde Kanzlei-E-Mails beantworten. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 6, person: 'lena', text: 'Lena möchte nur 30 Minuten die Ablage fertig machen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe – auch für 30 Minuten' },
  { nr: 7, person: 'berger', text: 'Herr Berger sagt: „Ich habe heute frei und erhole mich.“ Passt das?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 8, person: 'berger', text: 'Der Chef möchte Herrn Berger heute 3 Stunden zum Mandantenessen mitnehmen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 9, person: 'weiss', text: 'Frau Weiß fragt, ob sie den Sonntag wie geplant frei hat. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 10, person: 'lena', text: 'Lena soll heute 4 Stunden beim Tag der offenen Tür helfen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 11, person: 'berger', text: 'Herr Berger will nur kurz 2 Stunden Akten im Büro bearbeiten. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 12, person: 'lena', text: 'Lena fragt, ob sie heute frei hat und am Montag um 8:00 Uhr kommen soll. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
  // neue Figuren (MZ, 23.10.2026), Nr. 13–26
  { nr: 13, person: 'hofmann', text: 'Frau Hofmann möchte heute 3 Stunden die Verhandlung am Montag vorbereiten. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 14, person: 'hofmann', text: 'Frau Hofmann fragt, ob sie heute frei hat und am Montag um 8:00 Uhr anfängt. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 15, person: 'kaiser', text: 'Herr Kaiser möchte heute 2 Stunden Schriftsätze diktieren. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 16, person: 'kaiser', text: 'Herr Kaiser soll heute 4 Stunden zu einer Mandantenbesprechung kommen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 17, person: 'neumann', text: 'Herr Neumann will heute 2 Stunden die Kanzleisoftware aktualisieren. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 18, person: 'neumann', text: 'Herr Neumann sagt: „Ich habe heute frei.“ Passt das?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 19, person: 'kraemer', text: 'Frau Krämer möchte heute eine Stunde die Telefonnotizen abtippen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 20, person: 'kraemer', text: 'Frau Krämer fragt, ob sie wie immer sonntags frei hat. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 21, person: 'sommer', text: 'Frau Sommer möchte heute nur 30 Minuten die Post sortieren. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe – auch für 30 Minuten' },
  { nr: 22, person: 'sommer', text: 'Frau Sommer soll heute 3 Stunden beim Tag der offenen Tür helfen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 23, person: 'felix', text: 'Felix möchte heute 4 Stunden im Archiv scannen, weil er unter der Woche Vorlesungen hat. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe gilt auch für Werkstudenten' },
  { nr: 24, person: 'felix', text: 'Felix fragt, ob er heute frei hat und am Montag um 10:00 Uhr kommt. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
  { nr: 25, person: 'karim', text: 'Karim soll heute 2 Stunden Akten ins Archiv tragen. Einverstanden?', antwort: 'nein', grund: 'Sonntagsruhe' },
  { nr: 26, person: 'karim', text: 'Karim fragt, ob er heute frei hat. Einverstanden?', antwort: 'ja', grund: 'Sonntags ist frei' },
];

// Berufsschul-Fragen (Morgenfrage in Level 2 und 3, nur Personen mit berufsschule: true; § 9 JArbSchG, MZ 23.10.2026).
// von/bis = Unterricht (Uhr), ustd = Unterrichtsstunden à 45 Min.; vor = Frage nach Arbeit vor dem Unterricht.
// gefragt = [Beginn, Std.] der Arbeit, nach der gefragt wird; bei „Ja“ wird so gearbeitet, bei „Nein“ gilt sonst [Beginn, Std.]
// bzw. null = heute keine Arbeit (nur erlaubt, wenn gar keine Arbeit ginge, also bei mehr als 5 Unterrichtsstunden).
// uhr = Uhrzeit, zu der die Frage gestellt wird (nur nötig, wenn sie vom Arbeitsbeginn abweicht).
// Regeln (das Spiel prüft sie beim Laden): mehr als 5 Unterrichtsstunden = danach keine Arbeit, der Tag zählt 8 Std.;
// sonst zählt die Unterrichtszeit einschließlich Pausen (bis − von) auf die Höchstzeit; beginnt der Unterricht vor 9 Uhr,
// vorher keine Arbeit. Die Pausenpflicht rechnet ab Arbeitsbeginn in der Kanzlei. Nr. 7 (zweiter langer Berufsschultag) entfällt.
window.STEMPELUHR_SCHULE = [
  { nr: 1, person: 'karim', von: 7.75, bis: 13, gefragt: [13.5, 2], ustd: 6, text: 'Karim hat heute 6 Unterrichtsstunden Berufsschule bis 13:00 Uhr. Darf er danach noch in die Kanzlei?', antwort: 'nein', grund: 'Über 5 Unterrichtsstunden: Der Tag zählt als 8 Std.', sonst: null },
  { nr: 2, person: 'karim', von: 8, bis: 12.25, ustd: 5, gefragt: [13, 3], text: 'Karim hat heute 5 Unterrichtsstunden bis 12:15 Uhr. Darf er danach von 13:00 bis 16:00 Uhr in die Kanzlei?', antwort: 'ja', grund: '4¼ Std. Schule + 3 Std. = 7¼ Std.' },
  { nr: 3, person: 'karim', von: 8, bis: 12.25, gefragt: [13, 4], ustd: 5, text: 'Karim hat heute 5 Unterrichtsstunden bis 12:15 Uhr. Darf er danach von 13:00 bis 17:00 Uhr in die Kanzlei?', antwort: 'nein', grund: '4¼ Std. Schule + 4 Std. = 8¼ Std. – höchstens 8', sonst: [13, 3.5] },
  { nr: 4, person: 'karim', von: 8, bis: 14.5, gefragt: [15, 2], ustd: 7, text: 'Karim hat heute 7 Unterrichtsstunden. Darf er danach noch 2 Stunden die Post erledigen?', antwort: 'nein', grund: 'Über 5 Unterrichtsstunden: Der Tag zählt als 8 Std.', sonst: null },
  { nr: 5, person: 'karim', von: 9.5, bis: 12.75, ustd: 4, vor: true, gefragt: [7.5, 1.5], text: 'Karims Unterricht beginnt heute erst um 9:30 Uhr. Darf er vorher von 7:30 bis 9:00 Uhr in der Kanzlei arbeiten?', antwort: 'ja', grund: 'Der Unterricht beginnt nach 9 Uhr – vorher ist Arbeit erlaubt' },
  { nr: 6, person: 'karim', von: 8, bis: 11.5, gefragt: [7, 0.5], ustd: 4, vor: true, uhr: 6.5, text: 'Karims Unterricht beginnt heute um 8:00 Uhr. Darf er vorher von 7:00 bis 7:30 Uhr die Post holen?', antwort: 'nein', grund: 'Beginnt der Unterricht vor 9 Uhr, ist vorher keine Arbeit erlaubt', sonst: [12.5, 3] },
  { nr: 8, person: 'karim', von: 8, bis: 11.5, ustd: 4, gefragt: [12, 4.5], text: 'Karim hat heute 4 Unterrichtsstunden bis 11:30 Uhr. Darf er danach noch 4½ Stunden in die Kanzlei?', antwort: 'ja', grund: '3½ Std. Schule + 4½ Std. = genau 8 Std.' },
  { nr: 9, person: 'karim', von: 7.75, bis: 13, gefragt: [13.5, 1], ustd: 6, text: 'Karim hat heute 6 Unterrichtsstunden bis 13:00 Uhr. Darf er wenigstens noch eine Stunde zur Ablage kommen?', antwort: 'nein', grund: 'Auch keine Stunde: Der Tag zählt als 8 Std.', sonst: null },
  { nr: 10, person: 'karim', von: 8, bis: 10.5, ustd: 3, gefragt: [11, 5], text: 'Karim hat heute nur 3 Unterrichtsstunden bis 10:30 Uhr. Darf er ab 11:00 Uhr noch 5 Stunden in der Kanzlei arbeiten?', antwort: 'ja', grund: '2½ Std. Schule + 5 Std. = 7½ Std.' },
  { nr: 11, person: 'lena', von: 8, bis: 13, gefragt: [13.5, 2], ustd: 6, text: 'Lena hat heute 6 Unterrichtsstunden bis 13:00 Uhr. Darf sie danach noch 2 Stunden in die Kanzlei?', antwort: 'nein', grund: 'Über 5 Unterrichtsstunden: Der Tag zählt als 8 Std.', sonst: null },
  { nr: 12, person: 'lena', von: 8, bis: 12.25, ustd: 5, gefragt: [13, 3.5], text: 'Lena hat heute 5 Unterrichtsstunden bis 12:15 Uhr. Darf sie danach von 13:00 bis 16:30 Uhr in die Kanzlei?', antwort: 'ja', grund: '4¼ Std. Schule + 3½ Std. = 7¾ Std.' },
  { nr: 13, person: 'lena', von: 8, bis: 11.5, gefragt: [12, 5], ustd: 4, text: 'Lena hat heute 4 Unterrichtsstunden bis 11:30 Uhr. Darf sie danach noch 5 Stunden in die Kanzlei?', antwort: 'nein', grund: '3½ Std. Schule + 5 Std. = 8½ Std. – höchstens 8', sonst: [12, 4.5] },
  { nr: 14, person: 'lena', von: 9.25, bis: 12.5, ustd: 4, vor: true, gefragt: [7.5, 1.25], text: 'Lenas Unterricht beginnt heute erst um 9:15 Uhr. Darf sie vorher von 7:30 bis 8:45 Uhr in der Kanzlei arbeiten?', antwort: 'ja', grund: 'Der Unterricht beginnt nach 9 Uhr – vorher ist Arbeit erlaubt' },
  { nr: 15, person: 'lena', von: 7.75, bis: 11.25, gefragt: [7, 0.25], ustd: 4, vor: true, uhr: 6.5, text: 'Lenas Unterricht beginnt heute um 7:45 Uhr. Darf sie vorher um 7:00 Uhr kurz die Post holen?', antwort: 'nein', grund: 'Beginnt der Unterricht vor 9 Uhr, ist vorher keine Arbeit erlaubt', sonst: [12, 4] },
];
