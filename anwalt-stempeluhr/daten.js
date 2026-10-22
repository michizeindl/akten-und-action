// Stempeluhr – Personen, Regeln und Fragen für Level 2 und 3 (MZ bestätigt 22.10.2026; Verdreifachung Nr. 25–72,
// Ruhezeit 11–30, Sonntag 5–12 aus Material/Texte/stempeluhr-level2-entwurf.md, Abschnitt „Verdreifachung“, zur Prüfung).
// Zeiten als Dezimalzahl: 8,5 = 8:30 Uhr bzw. 8½ Std. Nach Textänderungen hier eintragen – der Spielcode bleibt gleich.

// Regeln je Person. pausen: [spätestens nach … Std. Arbeit, Dauer in Std.] – nötig nur, wenn der Tag länger wird;
// max: Höchstarbeitszeit; bis: keine Arbeit nach dieser Uhrzeit; ab: keine Arbeit vor dieser Uhrzeit;
// ruhe: Mindestruhe zwischen zwei Arbeitstagen (Std.). regel: Kurztext auf der Stempelkarte.
// bild/ausschnitt: Foto (person-*.webp) und Ausschnitt [x, y, b, h] für Kopf und Brust.
window.STEMPELUHR_PERSONEN = {
  du: { name: '', hinweis: '', pausen: [[6, 0.5], [9, 0.25]], max: 10, bis: null, ab: null, ruhe: 11, regel: '' },
  berger: { name: 'Herr Berger', hinweis: 'Angestellter', pausen: [[6, 0.5], [9, 0.25]], max: 10, bis: null, ab: null, ruhe: 11,
    regel: 'max. 10 Std. – Pause nach 6 und 9 Std.', regelKurz: 'max. 10 Std.', bild: 'bilder/person-berger.webp', ausschnitt: [85, 0, 220, 259] },
  // Jugendliche: § 8 (8 Std.), § 11 (Pausen), § 13 (12 Std. Freizeit), § 14 (nicht vor 6 und nach 20 Uhr) JArbSchG
  lena: { name: 'Lena', hinweis: 'Azubi, 17', pausen: [[4.5, 0.5], [6, 0.5]], max: 8, bis: 20, ab: 6, ruhe: 12,
    regel: 'max. 8 Std. – Pause nach 4½ und 6 Std. – bis 20 Uhr', regelKurz: 'max. 8 Std. – bis 20 Uhr', bild: 'bilder/person-lena.webp', ausschnitt: [29, 0, 200, 235] },
  // Schwangere: § 4 (8½ Std.), § 5 (nicht zwischen 20 und 6 Uhr) MuSchG
  weiss: { name: 'Frau Weiß', hinweis: 'schwanger', pausen: [[6, 0.5], [9, 0.25]], max: 8.5, bis: 20, ab: 6, ruhe: 11,
    regel: 'max. 8½ Std. – Pause nach 6 Std. – bis 20 Uhr', regelKurz: 'max. 8½ Std. – bis 20 Uhr', bild: 'bilder/person-weiss.webp', ausschnitt: [43, 0, 210, 247] },
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
];
