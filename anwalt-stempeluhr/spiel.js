// Stempeluhr („Akten & Action“): Arbeitswoche im Zeitraffer (1 Arbeitsstunde = 1,5s). Rechtzeitig „Pause“ und
// „Feierabend“ tippen; knapp vor der Grenze = volle Punkte, zu spät = Verstoß, drei Verstöße = Abbruch.
// Level 1 „Arbeitstag“: eine Person, Pause nach 6/9 Std., höchstens 10 Std. (MZ, 22.10.2026).
// Level 2 „Wer stempelt heute?“: je Tag eine Person mit eigenen Regeln (Azubi, Schwangere) und Rückfragen des Chefs.
// Level 3 „Die Abteilung“: zwei Personen gleichzeitig, Ruhezeit-Fragen am Morgen, Sonntag mit Frage.
// Personen, Regeln und Fragen stehen in daten.js (Entwurf, MZ prüft). Vorbild Einspruch!/Frist-Alarm.
(function () {
  'use strict';
  const R_ = Rahmen, F = R_.farben, K = R_.kunde;
  const SCHRIFT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const BLAUGRAU = F.blaugrau || '#475e6c';
  const WARNUNG = '#d9483b';      // Stempel „Verstoß“, verlorenes Leben (wie Einspruch!)
  const GUT = '#3f7f2a';          // Stempel „Pünktlich“/„OK“/„Richtig“ (wie Einspruch!)
  const HINWEIS = '#b5701c';      // Stempel „Zu früh“, „Überstunden“, „Unnötig“, „Falsch“ (Abzug, kein Verstoß)
  const TEXT = '#1c252b';
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NBSP = ' ';   // geschütztes Leerzeichen (vor „–“)

  // ---------- Daten (daten.js) ----------
  const PERSONEN = window.STEMPELUHR_PERSONEN || { du: { name: '', hinweis: '', pausen: [[6, 0.5], [9, 0.25]], max: 10, bis: null, ruhe: 11, regel: '' } };
  const TAGE2 = window.STEMPELUHR_TAGE2 || [], RUHEZEIT = window.STEMPELUHR_RUHEZEIT || [], SONNTAG = window.STEMPELUHR_SONNTAG || [];
  const pers = k => PERSONEN[k] || PERSONEN.du;

  // ---------- Level ----------
  // gekürzt (passt bei 320 × 640 samt Knöpfen)
  const ANLEITUNG1 = 'Eine Arbeitswoche im Zeitraffer. Tippe auf „Pause“ spätestens nach 6 und nach 9' + NBSP + 'Stunden Arbeit' + NBSP + '– ' +
    'gern bis zu einer Stunde früher. Tippe auf „Feierabend“ zur geplanten Zeit' + NBSP + '– höchstens nach 10' + NBSP + 'Stunden. ' +
    'Drei Verstöße beenden das Spiel.';
  const ANLEITUNG2 = 'Jeden Tag stempelt jemand anderes' + NBSP + '– mit eigenen Regeln: Azubis höchstens 8, Schwangere 8½' + NBSP +
    'Stunden, beide nicht nach 20' + NBSP + 'Uhr. Die Grenzen stehen auf der Karte. Fragt der Chef, antworte mit „Ja“ oder „Nein“. ' +
    'Drei Verstöße beenden das Spiel.';
  const ANLEITUNG3 = 'Zwei Kollegen gleichzeitig' + NBSP + '– jede Karte hat eigene Knöpfe. Achte morgens auf die Ruhezeit ' +
    '(11' + NBSP + 'Stunden, unter 18 Jahren 12) und sonntags auf die Sonntagsruhe. Drei Verstöße beenden das Spiel.';
  // Level (MZ, 22.10.2026): je höchstens 1.000 Punkte, eigener Bestwert, nacheinander freischalten.
  // art: einzeln = eine Person, Uhr springt bei der Pause; abteilung = zwei Personen, Uhr läuft durch
  const LEVEL = [
    { nr: 1, name: 'Arbeitstag', id: 'stempeluhr', gebaut: true, anleitung: ANLEITUNG1, art: 'einzeln', personen: false, tage: 5, wort: 'Stempeln' },
    { nr: 2, name: 'Wer stempelt heute?', id: 'stempeluhr-2', gebaut: true, anleitung: ANLEITUNG2, art: 'einzeln', personen: true, tage: 5, wort: 'Entscheidungen' },
    { nr: 3, name: 'Die Abteilung', id: 'stempeluhr-3', gebaut: true, anleitung: ANLEITUNG3, art: 'abteilung', personen: true, tage: 6, wort: 'Entscheidungen' },
  ];
  let LV = LEVEL[0];
  const FREI_KEY = 'mg:frei:stempeluhr:' + (K.firma || '');
  const ZULETZT_KEY = 'mg:zuletzt:stempeluhr:' + (K.firma || '');   // zuletzt gespieltes Level (Supervisor, 22.10.2026)
  function frei() { let f = 1; try { f = +localStorage.getItem(FREI_KEY) || 1; } catch (e) { /* privat */ } return Math.max(1, f); }
  function freischalten(n) { if (n > frei()) try { localStorage.setItem(FREI_KEY, String(n)); } catch (e) { /* privat */ } }
  function bestwertVon(lv) { try { const b = localStorage.getItem('mg:best:' + lv.id + ':' + (K.firma || '')); return b == null ? null : +b; } catch (e) { return null; } }

  // ---------- Regeln (Stunden als Dezimalzahl, 6,5 = 6:30) ----------
  const STD_SEK = 1.5;                 // 1 Arbeitsstunde = 1,5s
  // Wertung neu (MZ-Test, 22.10.2026): 1 Spielminute = 0,025s – daher Toleranz („Knapp“)
  const VOLL = 0.25;                   // Feierabend: ±15 Min. ums geplante Ende = volle Punkte („Pünktlich“)
  const PAUSE_VOLL = 1;                // Pause: letzte Stunde vor der Grenze = volle Punkte
  const TOLERANZ = 1 / 6;              // 10 Spielminuten nach jeder Grenze: „Knapp“ (wenig Punkte, kein Verstoß), danach Verstoß
  const KNAPP_ANTEIL = 0.3;            // Punkteanteil bei „Knapp“
  const WARNUNG_VOR = 0.5;             // 30 Spielminuten vor jeder Grenze und vor dem geplanten Feierabend pulsiert die
                                       // Arbeitszeit als Warnhinweis (Zeitlupe auf Wunsch von MZ wieder entfernt, 22.10.2026)
  const ABZUG_UNNOETIG = 0.5;          // unnötige Pause: Abzug = halber Stempel-Moment, kein Verstoß
  const MAX_VERSTOESSE = 3;
  const FRAGE_ZEIT = 5;                // Sekunden zum Antworten (Supervisor: danach „keine Antwort“)
  const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Sonntag'];
  const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'So'];
  const PLAN = [5, 5.5, 6.5, 7.5, 8, 8.5, 9, 9.5, 10];   // Level 1: geplante Arbeitszeit je Tag (Vorschlag Supervisor)
  const BEGINN = [7, 7.5, 8, 8.5, 9];                    // Level 1: Arbeitsbeginn 7:00–9:00
  const BEGINN23 = [7, 7.5, 8, 8.5, 9, 9.5, 10];         // Level 2/3: Arbeitsbeginn 7:00–10:00 (Entwurf Level 2)

  // Feierabend: Anteil nach Abstand x (Std.) außerhalb von ±15 Min.: bis x = 1,75 linear auf 40 %, danach bis 20 % (Mindestwert)
  function anteilNachAbstand(x) {
    if (x <= 0) return 1;
    if (x <= 1.75) return 1 - 0.6 * x / 1.75;
    return Math.max(0.2, 0.4 - 0.2 * (x - 1.75) / 2);
  }
  // Pause: Anteil nach Abstand x vor der letzten Stunde: bis 3 Std. vor der Grenze (x = 2) auf 60 %, danach bis 20 %
  function anteilPause(x) {
    if (x <= 0) return 1;
    if (x <= 2) return 1 - 0.4 * x / 2;
    return Math.max(0.2, 0.6 - 0.4 * (x - 2) / 2);
  }
  const stdZahl = h => String(Math.floor(h)) + (Math.abs(h % 1 - 0.5) < 1e-6 ? '½' : Math.abs(h % 1 - 0.25) < 1e-6 ? '¼' : '');
  // Wertung eines Stempels. art 'pause' | 'feierabend', a = Arbeitszeit, P = geplant, pausen = schon genommene Pausen,
  // person = Schlüssel in daten.js (Standard „du“ = Level 1), uhr = Uhrzeit (für „nicht nach 20 Uhr“)
  // → { ergebnis: puenktlich | ok | frueh | ueberstunden | knapp | unnoetig | verstoss, anteil (0–1), abzug, grund }
  function wertung(art, a, P, pausen, person, uhr) {
    const E = 1e-6, p = pers(person || 'du');
    if (art === 'pause') {
      if (pausen >= p.pausen.length) return null;
      const G = p.pausen[pausen][0], grund = 'Über ' + stdZahl(G) + NBSP + 'Std. ohne Pause';
      if (a > G + TOLERANZ + E) return { ergebnis: 'verstoss', anteil: 0, grund };
      if (a > G + E) return { ergebnis: 'knapp', anteil: P > G ? KNAPP_ANTEIL : 0, grund: 'Knapp über ' + stdZahl(G) + NBSP + 'Std. ohne Pause' };
      if (!(P > G)) return { ergebnis: 'unnoetig', anteil: 0, abzug: ABZUG_UNNOETIG, grund: 'Heute war keine Pause nötig' };
      const an = anteilPause((G - PAUSE_VOLL) - a);
      return { ergebnis: an >= 1 ? 'puenktlich' : 'ok', anteil: an };
    }
    const ueberMax = a - p.max, ueberBis = p.bis != null && uhr != null ? uhr - p.bis : -1;
    if (ueberMax > TOLERANZ + E) return { ergebnis: 'verstoss', anteil: 0, grund: 'Feierabend verpasst' + NBSP + '– über ' + stdZahl(p.max) + NBSP + 'Std.' };
    if (ueberBis > TOLERANZ + E) return { ergebnis: 'verstoss', anteil: 0, grund: 'Nach ' + p.bis + NBSP + 'Uhr gearbeitet' };
    if (ueberMax > E) return { ergebnis: 'knapp', anteil: KNAPP_ANTEIL, grund: 'Knapp über ' + stdZahl(p.max) + NBSP + 'Std.' };
    if (ueberBis > E) return { ergebnis: 'knapp', anteil: KNAPP_ANTEIL, grund: 'Knapp nach ' + p.bis + NBSP + 'Uhr' };
    const Pk = Math.min(P, p.max), d = a - Pk;
    if (Math.abs(d) <= VOLL + E) return { ergebnis: 'puenktlich', anteil: 1 };
    if (d < 0) return { ergebnis: 'frueh', anteil: anteilNachAbstand(-d - VOLL) };
    return { ergebnis: 'ueberstunden', anteil: anteilNachAbstand(d - VOLL) };
  }
  // Antwort auf eine Frage: richtig = volle Punkte; falsches „Ja“ = Verstoß; falsches „Nein“ / keine Antwort = 0 Punkte
  function antwortWertung(frage, antwort) {
    if (antwort == null) return { ergebnis: 'keine', anteil: 0 };
    if (antwort === frage.antwort) return { ergebnis: 'richtig', anteil: 1 };
    return antwort === 'ja' ? { ergebnis: 'verstoss', anteil: 0 } : { ergebnis: 'falsch', anteil: 0 };
  }
  // Stempel-Momente einer Person an einem Tag: Feierabend + nötige Pausen
  const momente = (P, person) => 1 + pers(person || 'du').pausen.filter(([n]) => P > n).length;
  const pausenSumme = (P, person) => pers(person).pausen.filter(([n]) => P > n).reduce((s, x) => s + x[1], 0);
  // Bewertungen (MZ bestätigt, 22.10.2026): gemeinsame Grenzen 900/800/700/550
  function stufe(p) {
    return p >= 900 ? 'Punktgenau gestempelt' : p >= 800 ? 'Gut eingeteilt' : p >= 700 ? 'Solide Arbeitswoche' : p >= 550 ? 'Knapp im Rahmen' : 'Viel Zeit verschenkt';
  }
  const ABBRUCH_TITEL = 'Zu viele Verstöße';
  function zahl(p) { return p.toLocaleString('de-DE'); }
  // 5,7 → „5:42“; Uhrzeit 13,75 → „13:45“
  function hm(h) { const m = Math.floor(h * 60 + 1e-6); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
  const std = h => hm(h) + NBSP + 'Std.';
  const uhrText = h => hm(((h % 24) + 24) % 24);

  function mischen(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const zufall = a => a[Math.floor(Math.random() * a.length)];
  const planListe = person => { const l = []; for (let p = 5; p <= pers(person).max + 1e-6; p += 0.5) l.push(p); return l; };
  const ende = (beginn, plan, person) => beginn + plan + pausenSumme(plan, person);
  // freier Tag (ohne Frage) für eine Person: Ende spätestens 30 Min. vor ihrer Uhrzeit-Grenze bzw. 20:30
  function freierTag(person, beginnFest) {
    const p = pers(person);
    for (let v = 0; v < 200; v++) {
      const beginn = beginnFest != null ? beginnFest : zufall(BEGINN23), plan = zufall(planListe(person)), e = ende(beginn, plan, person);
      if (e > (p.bis != null ? p.bis - 0.5 : 20.5)) continue;
      return { person, beginn, plan, frage: null };
    }
    return { person, beginn: beginnFest != null ? beginnFest : 8, plan: 5, frage: null };
  }

  // Level 1: 5 verschiedene Längen, mindestens ein kurzer Tag (≤ 6:00) und ein langer (≥ 9:15)
  function woche1(fest) {
    let plaene;
    if (fest && fest.length) plaene = TAGE.slice(0, 5).map((_, i) => fest[i % fest.length]);
    else for (let v = 0; v < 200; v++) {
      plaene = mischen(PLAN.slice()).slice(0, 5);
      if (plaene.some(p => p <= 6) && plaene.some(p => p >= 9.25)) break;
    }
    return plaene.map((P, i) => ({ name: TAGE[i], leute: [{ person: 'du', beginn: zufall(BEGINN), plan: P, frage: null }] }));
  }
  // Level 2: 3 Tage mit Rückfrage (verschiedene Personen), 2 freie Tage; jede Person mindestens einmal
  function woche2(festNr) {
    const fest = festNr ? TAGE2.find(t => t.nr === festNr) : null;
    const fragen = fest ? [fest] : [];
    mischen(['berger', 'lena', 'weiss']).forEach(k => {
      if (fragen.length < 3 && !fragen.some(t => t.person === k)) fragen.push(zufall(TAGE2.filter(t => t.person === k)));
    });
    const tage = fragen.map(t => ({ person: t.person, beginn: t.beginn, plan: t.plan, frage: t.frage, nr: t.nr }));
    for (let i = 0; i < 2; i++) tage.push(freierTag(zufall(['berger', 'lena', 'weiss'])));
    const reihe = fest ? [tage[0]].concat(mischen(tage.slice(1))) : mischen(tage);
    return reihe.map((t, i) => ({ name: TAGE[i], leute: [t] }));
  }
  // Zeitpunkte, an denen eine Person stempeln muss (Beginn, ideale Pausen, Feierabend) – für Level 3 ohne Überschneidung
  function ereignisse(t) {
    const z = [t.beginn]; let summe = 0;
    pers(t.person).pausen.forEach(([n, d]) => { if (t.plan > n) { z.push(t.beginn + n - 0.1 + summe); summe += d; } });
    z.push(t.beginn + t.plan + summe);
    return z;
  }
  // Level 3: Herr Berger + abwechselnd Lena/Frau Weiß, an 2 Tagen (Di–Fr) eine Ruhezeit-Frage, Sonntag mit einer Frage
  function woche3(festRuhe, festSonntag) {
    const erster = zufall(['lena', 'weiss']), zweiter = erster === 'lena' ? 'weiss' : 'lena';
    const partner = i => i % 2 ? zweiter : erster;
    const frageTage = festRuhe ? [1] : mischen([1, 2, 3, 4]).slice(0, 2);
    const benutzt = [];
    const tage = [];
    for (let i = 0; i < 5; i++) {
      const leute = ['berger', partner(i)];
      let morgen = null;
      if (frageTage.includes(i)) {
        const pool = RUHEZEIT.filter(f => leute.includes(f.person) && !benutzt.includes(f));
        morgen = (festRuhe && i === 1 ? RUHEZEIT.find(f => f.nr === festRuhe) : null) || (pool.length ? zufall(pool) : null);
        if (morgen && !leute.includes(morgen.person)) leute[1] = morgen.person;   // Testhilfe: Person der Frage arbeitet heute
        if (morgen) benutzt.push(morgen);
      }
      let paar = null;
      for (let v = 0; v < 600 && !paar; v++) {
        const p = leute.map(k => {
          const fix = morgen && morgen.person === k ? (morgen.antwort === 'ja' ? morgen.heute : morgen.sonst) : null;
          return freierTag(k, fix);
        });
        if (p[0].beginn === p[1].beginn) continue;
        const e0 = ereignisse(p[0]), e1 = ereignisse(p[1]);
        if (e0.every(a => e1.every(b => Math.abs(a - b) >= 0.75))) paar = p;
      }
      if (!paar) paar = leute.map((k, j) => ({ person: k, beginn: 7 + j * 1.5, plan: 6, frage: null }));
      tage.push({ name: TAGE[i], leute: paar, morgen: morgen ? Object.assign({ art: 'ruhe' }, morgen) : null });
    }
    const so = (festSonntag ? SONNTAG.find(f => f.nr === festSonntag) : null) || zufall(SONNTAG);
    tage.push({ name: TAGE[5], sonntag: true, leute: [], morgen: so ? Object.assign({ art: 'sonntag' }, so) : null });
    return tage;
  }
  // ---------- Daten prüfen (Supervisor, 22.10.2026): passt die richtige Antwort zu den Regeln der Person? ----------
  // Level 2: neuer Plan laut Prüfung (['+', h], ['gesamt', h], ['bis', uhr]); erlaubt, wenn ≤ Höchstzeit und Ende
  // (mit Pausen) nicht nach der Uhrzeit-Grenze; ['ohnePause', n] erlaubt, wenn der Tag die Grenze n nicht überschreitet;
  // ['pauseNach', h] erlaubt, wenn h nicht später als die erste Pausengrenze ist.
  function wunschPlan(t) {
    const p = t.frage.pruef || [];
    if (p[0] === '+') return t.plan + p[1];
    if (p[0] === 'gesamt') return p[1];
    if (p[0] === 'bis') { let plan = p[1] - t.beginn; for (let k = 0; k < 4; k++) plan = p[1] - t.beginn - pausenSumme(plan, t.person); return plan; }
    return t.plan;
  }
  function erlaubtBeiJa(t) {
    const P = pers(t.person), p = t.frage.pruef || [], E = 1e-6;
    if (p[0] === 'ohnePause') return !(t.plan > P.pausen[p[1]][0]);
    if (p[0] === 'pauseNach') return p[1] <= P.pausen[0][0] + E;
    const plan = wunschPlan(t), e = ende(t.beginn, plan, t.person);
    return plan <= P.max + E && (P.bis == null || e <= P.bis + E);
  }
  const ruheOk = (f, beginn) => { const P = pers(f.person); return 24 - f.gestern + beginn >= P.ruhe - 1e-6 && (P.ab == null || beginn >= P.ab - 1e-6); };
  function datenPruefen() {
    const m = [];
    TAGE2.forEach(t => {
      const P = pers(t.person), f = t.frage, e = ende(t.beginn, t.plan, t.person);
      if (t.plan > P.max + 1e-6) m.push(`L2 Nr. ${t.nr}: geplant ${t.plan} Std. über Höchstzeit`);
      if (P.bis != null && e > P.bis + 1e-6) m.push(`L2 Nr. ${t.nr}: Ende ${uhrText(e)} nach ${P.bis} Uhr`);
      if (P.ab != null && t.beginn < P.ab) m.push(`L2 Nr. ${t.nr}: Beginn vor ${P.ab} Uhr`);
      if (f.nach >= t.plan) m.push(`L2 Nr. ${t.nr}: Frage nach ${f.nach} Std. kommt erst nach Feierabend`);
      if (!f.pruef) m.push(`L2 Nr. ${t.nr}: keine Prüfung angegeben`);
      else if ((erlaubtBeiJa(t) ? 'ja' : 'nein') !== f.antwort) m.push(`L2 Nr. ${t.nr}: Antwort „${f.antwort}“ passt nicht zu den Regeln`);
    });
    RUHEZEIT.forEach(f => {
      if ((ruheOk(f, f.heute) ? 'ja' : 'nein') !== f.antwort) m.push(`L3 Ruhezeit Nr. ${f.nr}: Antwort „${f.antwort}“ passt nicht zu Ruhezeit/Beginn`);
      if (!ruheOk(f, f.sonst)) m.push(`L3 Ruhezeit Nr. ${f.nr}: Beginn bei „Nein“ (${uhrText(f.sonst)}) ist selbst nicht erlaubt`);
    });
    SONNTAG.forEach(f => { if (!/^(ja|nein)$/.test(f.antwort)) m.push(`L3 Sonntag Nr. ${f.nr}: Antwort fehlt`); });
    return m;
  }
  const DATEN_HINWEISE = datenPruefen();
  DATEN_HINWEISE.forEach(t => console.warn('Stempeluhr: ' + t));
  // neuer Plan nach richtigem „Ja“ (aus der Prüfung, wenn nicht ausdrücklich angegeben)
  TAGE2.forEach(t => { if (t.frage.antwort === 'ja' && t.frage.neu == null && t.frage.pruef && erlaubtBeiJa(t)) { const w = wunschPlan(t); if (Math.abs(w - t.plan) > 1e-6) t.frage.neu = w; } });

  // Punkte-Momente eines Tages (für die Verteilung der 1.000 Punkte): Stempel nach dem richtigen Weg + Fragen
  function tagMomente(t) {
    let m = t.morgen ? 1 : 0;
    t.leute.forEach(a => {
      const f = a.frage, plan = f && f.antwort === 'ja' && f.neu ? f.neu : a.plan;
      m += momente(plan, a.person) + (f ? 1 : 0);
    });
    return m;
  }

  // ---------- Bilder ----------
  // haus-morgen/-abend.webp 1100×1100 (aus stempeluhr-haus-morgen/-abend.png 1254×1254, deckungsgleich).
  // Maße unten in Pixeln des Originals (1254), Umrechnung mit HS.
  const HB = 1100, HS = HB / 1254;
  // Schild vor dem Haus (weiß, leer): Ecken oben links/rechts und Oberkante des Streifens (#00FF00) links/rechts
  const SCHILD = { tl: [758, 571], tr: [1092, 425], br: [1198, 1042], bl: [785, 1085] };
  const STREIFEN = [768, 1032, 1206, 1192];   // Rechteck um den Streifen (nur hier umfärben – Laub im Bild ist auch grün)
  // Logo auf dem Schild: Breite 80 % (u 0,1–0,9), Mitte bei 28 % der Höhe bis zum Streifen; Schildmaße ca. 380 × 560 px
  const LOGO_FELD = { u0: 0.1, u1: 0.9, vMitte: 0.28, breitePx: 380, hoehePx: 560 };
  // Erdgeschossfenster in der Mitte (Glas, leuchtet nachts): aus dem Abend-Bild übernommen
  const FENSTER = [[616, 652], [666, 634], [666, 800], [616, 816]];
  const SONNE = [140, 580];           // Sonne im Morgen-Bild (nachts abgedunkelt)
  function schildPunkt(u, v) {        // Punkt auf dem Schild (u quer, v hoch), in Pixeln von haus-*.webp
    const q = SCHILD, l = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const o = l(q.tl, q.tr, u), un = l(q.bl, q.br, u), p = l(o, un, v);
    return [p[0] * HS, p[1] * HS];
  }
  const LOGO_SEITE = 1443 / 598;      // Seitenverhältnis des Kanzlei-Logos (für die Aufteilung, bevor es geladen ist)
  function logoV(seite) {
    const vh = (LOGO_FELD.breitePx * (LOGO_FELD.u1 - LOGO_FELD.u0) / seite) / LOGO_FELD.hoehePx;
    return [LOGO_FELD.vMitte - vh / 2, LOGO_FELD.vMitte + vh / 2];
  }
  const LOGO_MITTE = schildPunkt(0.5, LOGO_FELD.vMitte), LOGO_UNTEN = schildPunkt(0.5, logoV(LOGO_SEITE)[1])[1];
  const LOGO_OBEN = Math.min(schildPunkt(LOGO_FELD.u0, logoV(LOGO_SEITE)[0])[1], schildPunkt(LOGO_FELD.u1, logoV(LOGO_SEITE)[0])[1]);

  // Teile aus stempeluhr-teile.png (freigestellt, Schatten als durchscheinendes Schwarz):
  // gehaeuse.webp 378×567: Zifferblatt-Mitte (186,5|225), Schlitz für die Karte x 75–320, y 444–472, Körper x 12–365, y 14–552
  // zeiger-std.webp 58×188: Drehpunkt (29|160), Länge bis Spitze 152; zeiger-min.webp 54×296: Drehpunkt (27,5|268), Länge 260
  // Zeiger mit Faktor 0,454 gezeichnet: Minutenzeiger reicht wie in der Vorlage (1) bis kurz vor die Striche (118 px)
  // karte.webp 226×497: Körper x 8–217, Kopfstreifen (#00FF00) y 9–32, Papier ohne Linien y 33–70, eine Zeile mit
  // Linie oben y 93–115, Rand unten y 460–486; senkrechte Linien bei x 17, 34, 70, 156, 206 (Mittelteil x 75–150 frei)
  const GEH = { b: 378, h: 567, mx: 186.5, my: 225, schlitzX0: 75, schlitzX1: 320, schlitzY: 458, zeiger: 0.454 };
  const ZEIGER = { std: { px: 29, py: 160 }, min: { px: 27.5, py: 268 } };
  const KARTE = { x0: 8, x1: 217, links: [8, 16], mitte: [75, 150], rechts: [207, 217], kopf: [9, 32], papier: [33, 70], zeile: [93, 115], unten: [460, 486] };

  const BILD = {};
  function laden(name, datei, fertig) {
    const img = new Image();
    img.onload = () => { BILD[name] = img; if (fertig) fertig(img); };
    img.src = datei;
  }
  const HAUS = {};   // fertige Leinwände: morgen, mittag, abend, nacht
  let logoBild = null, logoFertig = false;
  if (K.logoAufHell || K.logo) {
    logoBild = new Image();
    logoBild.onload = () => { logoFertig = true; hausBauen(); };
    logoBild.onerror = () => { logoBild = null; logoFertig = true; hausBauen(); };
    logoBild.src = K.logoAufHell || K.logo;
  } else logoFertig = true;
  laden('morgen', 'bilder/haus-morgen.webp', hausBauen);
  laden('abend', 'bilder/haus-abend.webp', hausBauen);
  laden('gehaeuse', 'bilder/gehaeuse.webp', img => { BILD.gehaeuse = R_.umfaerben(img); });
  laden('karte', 'bilder/karte.webp', img => { BILD.karte = R_.umfaerben(img); });
  laden('zeigerStd', 'bilder/zeiger-std.webp');
  laden('zeigerMin', 'bilder/zeiger-min.webp');

  function rgb(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  // Streifen auf dem Schild in die Kundenfarbe (wie Rahmen.umfaerben, aber nur im Rechteck STREIFEN)
  function streifenFaerben(c) {
    const x = c.getContext('2d'), [x0, y0, x1, y1] = STREIFEN.map(v => Math.round(v * HS));
    const bild = x.getImageData(x0, y0, x1 - x0, y1 - y0), d = bild.data, ziel = rgb(F.haupt);
    for (let i = 0; i < d.length; i += 4) {
      const gruen = d[i + 1] - Math.max(d[i], d[i + 2]);
      if (gruen < 16) continue;
      const t = Math.min(1, (gruen - 16) / 36), hell = Math.min(1.3, d[i + 1] / 210);
      for (let k = 0; k < 3; k++) d[i + k] += (Math.min(255, ziel[k] * hell) - d[i + k]) * t;
    }
    x.putImageData(bild, x0, y0);
  }
  // Logo perspektivisch aufs Schild drucken: in 40 senkrechten Streifen, je Streifen eine affine Abbildung;
  // „multiply“, damit Licht und Laubschatten auf dem Schild durchscheinen
  function logoAufSchild(c) {
    if (!logoBild || !logoBild.naturalWidth) return;
    const x = c.getContext('2d'), lw = logoBild.naturalWidth, lh = logoBild.naturalHeight;
    const [v0, v1] = logoV(lw / lh), N = 40;
    x.save();
    x.globalCompositeOperation = 'multiply';
    for (let j = 0; j < N; j++) {
      const u0 = LOGO_FELD.u0 + (LOGO_FELD.u1 - LOGO_FELD.u0) * j / N, u1 = LOGO_FELD.u0 + (LOGO_FELD.u1 - LOGO_FELD.u0) * (j + 1) / N;
      const p00 = schildPunkt(u0, v0), p10 = schildPunkt(u1, v0), p01 = schildPunkt(u0, v1);
      const sx0 = lw * j / N, sw = lw / N;
      const a = (p10[0] - p00[0]) / sw, b = (p10[1] - p00[1]) / sw, cc = (p01[0] - p00[0]) / lh, dd = (p01[1] - p00[1]) / lh;
      x.setTransform(a, b, cc, dd, p00[0] - a * sx0, p00[1] - b * sx0);
      x.drawImage(logoBild, sx0, 0, Math.min(sw + 0.6, lw - sx0), lh, sx0, 0, Math.min(sw + 0.6, lw - sx0), lh);
    }
    x.restore();
  }
  function leinwand(img) {
    const c = document.createElement('canvas'); c.width = HB; c.height = HB;
    c.getContext('2d').drawImage(img, 0, 0, HB, HB);
    return c;
  }
  // Himmel-Maske (blauer Himmel im Morgen-Bild), 0–1
  function himmel(r, g, b) { return Math.max(0, Math.min(1, (b - r - 15) / 30)) * Math.max(0, Math.min(1, (b - 120) / 40)); }
  // Mittag (MZ: aus dem Morgen-Bild): heller, neutraler, Himmel leicht kühler
  function mittagBauen(quelle) {
    const c = leinwand(quelle), x = c.getContext('2d'), bild = x.getImageData(0, 0, HB, HB), d = bild.data;
    const sx = SONNE[0] * HS, sy = SONNE[1] * HS, sr = 300 * HS, hoch = v => 255 * Math.pow(v / 255, 0.86);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const s = himmel(r, g, b), ds = Math.hypot(p % HB - sx, Math.floor(p / HB) - sy);
      // Morgensonne weniger golden (Licht von oben, neutraler)
      if (ds < sr) { const l = 0.3 * r + 0.59 * g + 0.11 * b, f = 0.45 * (1 - ds / sr); r += (l - r) * f; g += (l - g) * f; b += (l - b) * f; }
      d[i] = Math.min(255, hoch(r) * 0.95 - 6 * s);
      d[i + 1] = Math.min(255, hoch(g) * 0.99);
      d[i + 2] = Math.min(255, hoch(b) * 1.05 + 6 * s);
    }
    x.putImageData(bild, 0, 0);
    return c;
  }
  // Nacht (MZ: aus dem Morgen-Bild): dunkelblau, Sternenhimmel oben, Fenster dunkel, ein Erdgeschossfenster leuchtet warm
  function nachtBauen(quelle, abend) {
    const c = leinwand(quelle), x = c.getContext('2d'), bild = x.getImageData(0, 0, HB, HB), d = bild.data;
    const sx = SONNE[0] * HS, sy = SONNE[1] * HS, sr = 330 * HS;
    const maske = new Float32Array(HB * HB);
    // Schild-Maske (Schild reicht bis zum Bildrand unten): wird nachts schwach beleuchtet, damit das Logo lesbar bleibt
    const sm = document.createElement('canvas'); sm.width = HB; sm.height = HB;
    const smx = sm.getContext('2d'), q = SCHILD;
    smx.fillStyle = '#fff'; smx.beginPath();
    [q.tl, q.tr, [1222, 1254], [778, 1254]].forEach(([a, b], i) => i ? smx.lineTo(a * HS, b * HS) : smx.moveTo(a * HS, b * HS));
    smx.closePath(); smx.fill();
    const schild = smx.getImageData(0, 0, HB, HB).data, schildOben = q.tr[1] * HS;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const r = d[i], g = d[i + 1], b = d[i + 2], y = Math.floor(p / HB), xx = p % HB;
      const s = himmel(r, g, b) * (y < HB * 0.75 ? 1 : 0);
      maske[p] = s;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255, l = Math.pow(lum, 1.5);
      const h = Math.min(1, y / (HB * 0.62));
      // tiefes Nachtblau bis fast schwarz (MZ, 22.10.2026: dunkler, weniger violett), Haus nur schwach sichtbar
      let nr = 3 + l * 26, ng = 5 + l * 34, nb = 11 + l * 58;
      const hr = 2 + 6 * h, hg = 4 + 10 * h, hb = 10 + 24 * h;   // Himmel: oben fast schwarz, zum Horizont tiefblau
      nr += (hr - nr) * s; ng += (hg - ng) * s; nb += (hb - nb) * s;
      const sa = schild[i + 3] / 255;
      if (sa > 0) {   // Schild: kühles, schwaches Licht von unten
        const f = 0.7 + 0.3 * Math.min(1, Math.max(0, (y - schildOben) / (HB - schildOben)));
        nr += (f * (14 + lum * 120) - nr) * sa; ng += (f * (16 + lum * 128) - ng) * sa; nb += (f * (24 + lum * 140) - nb) * sa;
      }
      const ds = Math.hypot(xx - sx, y - sy), f = ds < sr ? 1 - 0.55 * (1 - ds / sr) : 1;   // Sonne dunkel
      d[i] = nr * f; d[i + 1] = ng * f; d[i + 2] = nb * f;
    }
    x.putImageData(bild, 0, 0);
    // Sterne nur im Himmel (fester Zufall, damit das Bild immer gleich aussieht)
    let z = 7;
    const zufall = () => (z = (z * 16807) % 2147483647) / 2147483647;
    for (let n = 0, v = 0; n < 170 && v < 6000; v++) {
      const px = Math.floor(zufall() * HB), py = Math.floor(zufall() * HB * 0.62);
      if (maske[py * HB + px] < 0.8) continue;
      n++;
      const r = 0.5 + zufall() * 1.1;
      x.globalAlpha = 0.45 + zufall() * 0.55;
      x.fillStyle = zufall() < 0.15 ? '#ffe9c4' : '#f4f7ff';
      x.beginPath(); x.arc(px + 0.5, py + 0.5, r, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    // leuchtendes Fenster: Glas aus dem Abend-Bild, dazu warmer Schein auf der Wand
    const poly = FENSTER.map(([a, b]) => [a * HS, b * HS]);
    const mx = poly.reduce((s, p) => s + p[0], 0) / 4, my = poly.reduce((s, p) => s + p[1], 0) / 4;
    x.save();
    x.globalCompositeOperation = 'lighter';
    const schein = x.createRadialGradient(mx, my, 10, mx, my, 120 * HS);
    schein.addColorStop(0, 'rgba(255,170,80,.30)'); schein.addColorStop(1, 'rgba(255,170,80,0)');
    x.fillStyle = schein; x.fillRect(mx - 130, my - 130, 260, 260);
    x.restore();
    x.save();
    x.beginPath(); poly.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip();
    x.drawImage(abend, 0, 0);
    x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(255,190,110,.5)'; x.fillRect(mx - 60, my - 120, 120, 240);
    x.restore();
    return c;
  }
  let hausFertig = false;
  function hausBauen() {
    if (hausFertig || !BILD.morgen || !BILD.abend || !logoFertig) return;
    hausFertig = true;
    const morgen = leinwand(BILD.morgen), abend = leinwand(BILD.abend);
    [morgen, abend].forEach(c => { streifenFaerben(c); logoAufSchild(c); });
    HAUS.morgen = morgen; HAUS.abend = abend;
    HAUS.mittag = mittagBauen(morgen);
    HAUS.nacht = nachtBauen(morgen, abend);
    if (R_.zettel) R_.schirmBild('start', morgen.toDataURL('image/jpeg', 0.86), SCHIRM_POS);
  }
  const SCHIRM_POS = '72% 50%';      // Start-/Endbild: Haus rechts mit Schild und Logo
  const endBildAdresse = {};
  function endBild(name) {
    if (!endBildAdresse[name] && HAUS[name]) endBildAdresse[name] = HAUS[name].toDataURL('image/jpeg', 0.86);
    return endBildAdresse[name];
  }
  // Tageszeit nach der Uhrzeit (Stunden 0–24): Gewichte der vier Fassungen
  const VERLAUF = [[0, 'nacht'], [5.5, 'nacht'], [7, 'morgen'], [9.5, 'morgen'], [11.5, 'mittag'], [14.5, 'mittag'], [17, 'abend'], [18, 'abend'], [19.5, 'nacht'], [24, 'nacht']];
  function tageszeit(h) {
    h = ((h % 24) + 24) % 24;
    const w = { morgen: 0, mittag: 0, abend: 0, nacht: 0 };
    for (let i = 0; i < VERLAUF.length - 1; i++) {
      const [a, na] = VERLAUF[i], [b, nb] = VERLAUF[i + 1];
      if (h >= a && h <= b) { const t = b > a ? (h - a) / (b - a) : 0, s = t * t * (3 - 2 * t); w[na] += 1 - s; w[nb] += s; return w; }
    }
    w.nacht = 1; return w;
  }

  // Fotos der Personen (Level 2/3), freigestellt aus stempeluhr-personen.png
  Object.keys(PERSONEN).forEach(k => { if (PERSONEN[k].bild) laden('person-' + k, PERSONEN[k].bild); });

  // ---------- Klänge ----------
  // Auswahl Sound Artist (Anwalt-Game/Material/Texte/stempeluhr-klaenge.md, 22.10.2026), Quellen in Material/Sounds/quellen.txt.
  // Fehlt eine Datei (da: false), spielt der Ersatzton. pause = Sonniss-Notlösung (Metall-Deckel) – austauschbar:
  // neue Datei als klaenge/pause.mp3 ablegen und proben anpassen (z. B. Freesound „Cup and Saucer“, lädt MZ evtl.).
  const KLAENGE = {
    stempeln: { datei: 'klaenge/stempeln.mp3', proben: 6174, pegel: 0.5, da: true },      // Ratschen + Klack der Stempeluhr
    ticken: { datei: 'klaenge/ticken.mp3', proben: 2646, pegel: 0.1, da: true },          // Einzel-Tick, im Spiel wiederholt
    verstoss: { datei: 'klaenge/verstoss.mp3', proben: 14332, pegel: 0.6, da: true },     // tiefer Metallschlag (sehr tief: etwas lauter)
    pause: { datei: 'klaenge/pause.mp3', proben: 10804, pegel: 0.4, da: true },
    feierabend: { datei: 'klaenge/feierabend.mp3', proben: 12789, pegel: 0.45, da: true },  // Lichtschalter + Kalimba
    sieg: { datei: 'klaenge/sieg.wav', pegel: 0.45, da: true },                            // wie Frist-Alarm (Familie der Sammlung)
    niederlage: { datei: 'klaenge/niederlage.mp3', proben: 28665, pegel: 0.5, da: true },  // Metallschlag mit Ausklang
  };
  const TICK_ABSTAND = 0.135;   // Zeitraffer-Ticken: Einzel-Tick ca. 7 × pro Sekunde, nur solange die Arbeitszeit läuft
  // Ersatztöne; Rückfragen: richtig = „gut“, falsch/keine Antwort = „fehler“ (erzeugte Töne des Rahmens), Verstoß = verstoss
  const ERSATZ = { stempeln: 'dreh', verstoss: 'fehler', pause: 'klick', feierabend: 'gut', sieg: 'sieg', niederlage: 'fehler' };   // ticken: still
  function klang(name) { if (KLAENGE[name] && KLAENGE[name].da) R_.ton(name); else if (ERSATZ[name]) R_.ton(ERSATZ[name]); }
  const klaengeDa = {};
  Object.keys(KLAENGE).forEach(n => { if (KLAENGE[n].da) klaengeDa[n] = KLAENGE[n]; });
  let tickT = 0;

  // ---------- Zustand ----------
  // DAUER in Sekunden: stempeln = Karte in den Schlitz und zurück, rueck = Rückmeldung (Stempel, Punkte, Uhr springt),
  // frageRueck = Rückmeldung auf eine Antwort (Zeit steht)
  const DAUER = { titel: 2.5, titelAus: 0.4, tagStart: 1.3, stempeln: 0.58, klack: 0.26, rueck: { beginn: 0.35, pause: 1.5, feierabend: 1.6 },
    rueck3: { beginn: 0.3, pause: 1.2, feierabend: 1.3 }, frageRueck: 2.2, tagEnde: 0.55, spinVon: 0.15, spinBis: 0.95 };
  let woche, tagNr, tag, phase, phaseT, summeAnteil, abzuege, verstoesse, anzahl, korrekt, unnoetig, letzter, aktiv, uhr, uhrAnz, uhrAnim,
    gewicht, wackeln, rot, druck, frage, sprungEnde, sprungEndeArt = '', M = 1;
  const einzeln = () => LV.art === 'einzeln';

  function neu() {
    const h = location.hash;
    const pl = /plan=([\d.,]+)/.exec(h), tg = /tag=(\d)/.exec(h), fr = /frage=(\d+)/.exec(h), so = /sonntag=(\d+)/.exec(h);
    if (LV.nr === 1) woche = woche1(pl ? pl[1].split(',').map(Number).filter(v => v > 0) : null);
    else if (LV.nr === 2) woche = woche2(fr ? +fr[1] : 0);
    else woche = woche3(fr ? +fr[1] : 0, so ? +so[1] : 0);
    M = Math.max(1, woche.reduce((s, t) => s + tagMomente(t), 0));
    tagNr = so && LV.nr === 3 ? 5 : fr && LV.nr === 3 ? 1 : tg ? Math.max(0, Math.min(woche.length - 1, +tg[1] - 1)) : 0;
    sprungEnde = /ende=([a-z]+)(?:-(\d+))?/.exec(h) || null;
    summeAnteil = 0; abzuege = 0; verstoesse = 0; anzahl = 0; korrekt = 0; unnoetig = 0; letzter = null; aktiv = null; frage = null;
    tag = null; uhr = 6; uhrAnz = 6; uhrAnim = null; gewicht = tageszeit(7); wackeln = 0; rot = 0; druck = {};
    phase = 'titel'; phaseT = 0; Lschluessel = '';
    anzeigen();
  }
  function punkteRoh() { return Math.round(1000 * (summeAnteil - ABZUG_UNNOETIG * abzuege) / M); }
  function punkteJetzt() { return Math.max(0, punkteRoh()); }
  function anzeigen() {
    if (R_.zustand !== 'spiel') return;
    const n = woche ? woche.length : 5, i = Math.min(tagNr, n - 1);
    const links = (LV.nr === 1 || innerWidth < 360 ? '' : TAGE_KURZ[i] + NBSP + '– ') + `Tag ${i + 1}/${n}`;
    R_.anzeige(links, zahl(punkteJetzt()) + ' Punkte');
  }
  // Uhrzeit: Level 1/2 aus der Arbeitszeit der einen Person (Pause = Sprung), Level 3 läuft die Uhr selbst
  function echteUhr() {
    if (einzeln() && tag && tag.leute[0]) { const a = tag.leute[0]; return a.beginn + a.arbeit + a.pausenzeit; }
    return uhr;
  }
  function tagBeginnen() {
    const d = woche[tagNr];
    tag = { nr: tagNr, name: d.name, sonntag: !!d.sonntag, morgen: d.morgen,
      leute: d.leute.map((x, i) => ({ i, person: x.person, P: pers(x.person), beginn: x.beginn, plan: x.plan, arbeit: 0, pausenzeit: 0, pauseRest: 0,
        pausen: 0, stempel: [], begonnen: false, fertig: false, frage: x.frage || null, gefragt: false })) };
    // Uhr läuft vorwärts bis zum Arbeitsbeginn (über Nacht), Hintergrund folgt; Sonntag: Vormittag
    const ziel = tag.sonntag ? 10 : Math.min(...tag.leute.map(a => a.beginn)) - (tag.morgen ? 0.5 : 0);
    let bis = ziel; while (bis < uhrAnz) bis += 24;
    uhrAnim = { von: uhrAnz, bis, t: 0, dauer: DAUER.tagStart * 0.8 };
    uhr = ziel;
    aktiv = null; letzter = null;
    phase = 'tagStart'; phaseT = 0;
    Lschluessel = '';
    anzeigen();
  }
  function nachTagStart() {
    uhrAnim = null; uhrAnz = uhr;
    if (tag.morgen) return frageStellen(tag.morgen, null);
    tagLos();
  }
  function tagLos() {
    if (tag.sonntag) { phase = 'tagEnde'; phaseT = 0; return; }
    if (einzeln()) { tag.leute[0].begonnen = true; uhrAnz = tag.leute[0].beginn; stempeln(tag.leute[0], 'beginn'); }
    else { phase = 'lauf'; phaseT = 0; }
  }

  // Stempel setzen: art 'beginn' | 'pause' | 'feierabend'; erzwungen = Grenze überschritten (Verstoß, Moment nachgeholt)
  function stempeln(a, art, erzwungen) {
    const vorher = punkteRoh();   // Abzug auch zeigen, wenn die Anzeige noch bei 0 steht
    const jetzt = echteUhr();
    let w = null;
    if (art !== 'beginn') {
      w = wertung(art, a.arbeit, a.plan, a.pausen, a.person, jetzt);
      if (erzwungen && (!w || w.ergebnis !== 'verstoss')) w = { ergebnis: 'verstoss', anteil: 0, grund: w && w.grund };
      if (!w) return false;
      if (art === 'pause') {
        const geplant = a.plan > a.P.pausen[a.pausen][0];
        if (w.ergebnis === 'unnoetig') { abzuege++; unnoetig++; }
        else if (geplant) summeAnteil += w.anteil;
      } else {
        summeAnteil += w.anteil;
        // geplante Pausen, die durch frühen Feierabend nicht mehr nötig sind, zählen wie der Feierabend
        for (let n = a.pausen; n < a.P.pausen.length; n++) if (a.plan > a.P.pausen[n][0]) summeAnteil += w.anteil;
        // offene Rückfrage dieser Person endet ohne Antwort
        if (frage && frage.a === a && !frage.antwort) { anzahl++; frage = null; }
      }
      anzahl++;
      if (w.ergebnis === 'verstoss') { verstoesse++; rot = 0.6; wackeln = 0.4; R_.vibrieren([80, 60, 80]); }
      else if (w.ergebnis !== 'unnoetig') korrekt++;
    }
    const s = { art, uhr: jetzt, arbeit: a.arbeit, ergebnis: w ? w.ergebnis : null, anteil: w ? w.anteil : null, grund: w && w.grund || '', delta: 0, erzwungen: !!erzwungen };
    s.delta = punkteRoh() - vorher;
    a.stempel.push(s);
    letzter = s; aktiv = a;
    uhrAnz = jetzt;
    if (art === 'pause') {
      const d = a.P.pausen[a.pausen][1];
      if (einzeln()) a.pausenzeit += d; else a.pauseRest = d;
      a.pausen++;
    }
    if (art === 'feierabend') a.fertig = true;
    phase = 'stempeln'; phaseT = 0;
    if (RUHIG) klang('stempeln');
    anzeigen();
    return true;
  }
  function knopfAktiv(a, art) {
    if (phase !== 'lauf' || !a || !a.begonnen || a.fertig || a.pauseRest > 0) return false;
    return art !== 'pause' || a.pausen < a.P.pausen.length;
  }
  function tippe(art, i) {
    const a = tag && tag.leute[i || 0];
    if (!knopfAktiv(a, art)) return false;
    druck[art + (i || 0)] = 0.24;
    return stempeln(a, art, false);
  }

  // ---------- Fragen (Level 2: Chef mitten am Tag; Level 3: morgens bzw. sonntags) – die Uhr steht, bis geantwortet ist ----------
  function frageStellen(def, a) {
    frage = { def, a, t: 0, antwort: null, ergebnis: null, delta: 0, morgen: !a };
    // Uhr steht, solange eine Frage offen ist – auch die Chef-Frage in Level 2 (Player-Test, MZ 22.10.2026): Lesen kostet keine Spielzeit
    phase = 'frage'; phaseT = 0;
    R_.ton('klick');
    Lschluessel = '';
  }
  function antworte(antw) {
    if (!frage || frage.ergebnis) return false;
    if (phase !== 'frage') return false;
    if (antw) druck[antw] = 0.24;
    const w = antwortWertung(frage.def, antw), vorher = punkteRoh();
    summeAnteil += w.anteil; anzahl++;
    if (w.ergebnis === 'richtig') {
      korrekt++;
      if (antw === 'ja' && frage.def.neu && frage.a) frage.a.plan = frage.def.neu;   // Plan ändert sich nur bei richtigem „Ja“
      R_.ton('gut');
    } else if (w.ergebnis === 'verstoss') { verstoesse++; rot = 0.6; wackeln = 0.4; R_.vibrieren([80, 60, 80]); klang('verstoss'); }
    else R_.ton('fehler');
    frage.antwort = antw || '–'; frage.ergebnis = w.ergebnis; frage.delta = punkteRoh() - vorher;
    phase = 'frageRueck'; phaseT = 0;
    anzeigen();
    return true;
  }

  function schritt(dt) {
    phaseT += dt;
    wackeln = Math.max(0, wackeln - dt); rot = Math.max(0, rot - dt);
    Object.keys(druck).forEach(k => { druck[k] = Math.max(0, druck[k] - dt); });
    if (sprungEnde) { beispielEnde(sprungEnde[1], sprungEnde[2]); sprungEnde = null; return; }
    // Uhr-Animation (Sprung über Nacht bzw. Pause)
    if (uhrAnim) {
      uhrAnim.t += dt;
      const t = Math.max(0, Math.min(1, uhrAnim.t / uhrAnim.dauer)), s = RUHIG ? 1 : t * t * (3 - 2 * t);
      uhrAnz = uhrAnim.von + (uhrAnim.bis - uhrAnim.von) * s;
      if (t >= 1) { uhrAnz = uhrAnim.bis % 24; uhrAnim = null; }
    }
    const rueck = einzeln() ? DAUER.rueck : DAUER.rueck3;
    if (phase === 'titel') {
      if (phaseT > DAUER.titel) {
        try { localStorage.setItem(ZULETZT_KEY, String(LV.nr)); } catch (e) { /* privat */ }   // zuletzt gespieltes Level
        tagBeginnen();
      }
    } else if (phase === 'tagStart') {
      if (phaseT > DAUER.tagStart) nachTagStart();
    } else if (phase === 'frage') {
      frage.t += dt;
      if (frage.t > FRAGE_ZEIT) antworte(null);
    } else if (phase === 'frageRueck') {
      if (phaseT > DAUER.frageRueck) {
        const morgen = frage.morgen;
        frage = null;
        if (verstoesse >= MAX_VERSTOESSE) return abbruch();
        if (morgen) tagLos(); else { phase = 'lauf'; phaseT = 0; }
      }
    } else if (phase === 'stempeln') {
      if (!RUHIG && phaseT - dt < DAUER.klack && phaseT >= DAUER.klack) { klang('stempeln'); wackeln = Math.max(wackeln, 0.12); }
      if (phaseT > (RUHIG ? 0.2 : DAUER.stempeln)) {
        phase = 'rueck'; phaseT = 0;
        const e = letzter.ergebnis;
        if (e === 'verstoss') klang('verstoss');
        else if (letzter.art === 'feierabend') klang('feierabend');
        if (letzter.art === 'pause') {
          if (e !== 'verstoss') klang('pause');
          if (einzeln()) uhrAnim = { von: uhrAnz, bis: echteUhr(), t: -DAUER.spinVon, dauer: DAUER.spinBis - DAUER.spinVon };
        }
      }
    } else if (phase === 'rueck') {
      if (phaseT > rueck[letzter.art] + (letzter.grund ? 0.9 : 0)) {
        if (verstoesse >= MAX_VERSTOESSE) return abbruch();
        if (tag.leute.every(a => a.fertig)) { phase = 'tagEnde'; phaseT = 0; }
        else { phase = 'lauf'; phaseT = 0; uhrAnz = echteUhr(); }
      }
    } else if (phase === 'tagEnde') {
      if (phaseT > DAUER.tagEnde) {
        tagNr++;
        if (tagNr >= woche.length) return geschafft();
        tagBeginnen();
      }
    } else if (phase === 'lauf') {
      if (lauf(dt)) return;
    }
    // Ticken: Einzel-Tick wiederholt, nur solange der Tag läuft
    if (phase === 'lauf') { tickT += dt; if (tickT >= TICK_ABSTAND) { tickT -= TICK_ABSTAND; klang('ticken'); } } else tickT = TICK_ABSTAND * 0.7;
    // Hintergrund folgt der Uhrzeit weich (auch beim Sprung über Nacht)
    const ziel = tageszeit(uhrAnz), k = Math.min(1, dt * (RUHIG ? 2 : 4));
    Object.keys(gewicht).forEach(n => { gewicht[n] += (ziel[n] - gewicht[n]) * k; });
  }
  // Arbeitszeit läuft; Grenzen überschritten: Verstoß, der Moment gilt als nachgeholt (Pause bzw. Feierabend wird gestempelt)
  function grenzen(a, jetzt) {
    const T = TOLERANZ;
    if (a.pauseRest <= 0 && a.pausen < a.P.pausen.length && a.arbeit > a.P.pausen[a.pausen][0] + T) { a.arbeit = a.P.pausen[a.pausen][0] + T + 1 / 60; return stempeln(a, 'pause', true); }
    if (a.arbeit > a.P.max + T) { a.arbeit = a.P.max + T + 1 / 60; return stempeln(a, 'feierabend', true); }
    if (a.P.bis != null && jetzt > a.P.bis + T) return stempeln(a, 'feierabend', true);
    return false;
  }
  // Warnhinweis: 30 Spielminuten vor jeder Grenze bis zum Ende der Toleranz bzw. vor dem geplanten Feierabend bis
  // 15 Min. danach pulsiert die Arbeitszeit auf der Karte (die Uhr läuft unverändert, 1 Std. = 1,5s)
  function warnen(a, jetzt) {
    if (!a.begonnen || a.fertig || a.pauseRest > 0) return false;
    const drin = (z, nach) => z <= WARNUNG_VOR && z >= -nach;
    if (a.pausen < a.P.pausen.length) {
      const G = a.P.pausen[a.pausen][0];
      if ((a.plan > G || a.arbeit > a.plan) && drin(G - a.arbeit, TOLERANZ)) return true;
    }
    if (drin(a.P.max - a.arbeit, TOLERANZ) || drin(Math.min(a.plan, a.P.max) - a.arbeit, VOLL)) return true;
    return a.P.bis != null && drin(a.P.bis - jetzt, TOLERANZ);
  }
  function lauf(dt) {
    const jetzt0 = echteUhr();
    tag.leute.forEach(a => { a.warnung = warnen(a, jetzt0); });
    const dh = dt / STD_SEK;
    if (einzeln()) {
      const a = tag.leute[0];
      a.arbeit += dh;
      uhrAnz = echteUhr();
      if (a.frage && !a.gefragt && a.arbeit >= a.frage.nach) { a.gefragt = true; frageStellen(a.frage, a); return true; }
      if (grenzen(a, echteUhr())) { uhrAnz = echteUhr(); return true; }
      return false;
    }
    uhr += dh; uhrAnz = uhr;
    for (const a of tag.leute) {
      if (a.fertig) continue;
      if (!a.begonnen) {
        if (uhr >= a.beginn) { uhr = a.beginn; uhrAnz = uhr; a.begonnen = true; stempeln(a, 'beginn'); return true; }
        continue;
      }
      if (a.pauseRest > 0) { a.pauseRest -= dh; if (a.pauseRest < 0) { a.arbeit -= a.pauseRest; a.pauseRest = 0; } }
      else a.arbeit += dh;
      if (grenzen(a, uhr)) return true;
    }
    return false;
  }

  // ---------- Level-Wahl im Startbild (wie Einspruch!) ----------
  const SCHLOSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const stil = document.createElement('style');
  stil.textContent = `
    .levelwahl { display: flex; gap: 6px; margin: 0 0 12px; }
    .levelwahl button { flex: 1 1 0; min-width: 0; padding: 6px 4px 5px; border-radius: 8px; border: 2px solid rgba(0,0,0,.15);
      background: rgba(255,255,255,.55); color: inherit; font: inherit; cursor: pointer; line-height: 1.15; }
    .levelwahl button.aktiv { border-color: var(--haupt); background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .levelwahl button:disabled { cursor: default; opacity: .45; filter: grayscale(1); }
    .levelwahl b { display: block; font-size: 14px; font-weight: 900; }
    .levelwahl span { display: block; font-size: 11.5px; font-weight: 600; opacity: .8; line-height: 1.15; white-space: normal; }
    .levelwahl small { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; opacity: .75; }
    .levelwahl svg { width: 12px; height: 12px; vertical-align: -1px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
    @media (max-width: 340px) { .levelwahl button { padding-left: 1px; padding-right: 1px; } .levelwahl span { font-size: 10.5px; } }
    @media (max-height: 400px) { .levelwahl { margin-bottom: 6px; } .levelwahl button { padding: 3px 3px; } .levelwahl b { font-size: 12.5px; } .levelwahl span { display: none; } }
    /* schmales, niedriges Hochformat (320 × 640): Anleitung etwas kleiner, damit „Los geht's“ und „Zum Menü“ ganz zu sehen sind */
    @media (orientation: portrait) and (max-width: 360px) and (max-height: 700px) {
      .stil-zettel #startSchirm .anleitung { font-size: 12.5px; line-height: 1.35; margin-bottom: 9px; }
      .stil-zettel #startSchirm .unter { margin-bottom: 6px; } .levelwahl { margin-bottom: 8px; } }`;
  document.head.append(stil);
  const wahl = document.createElement('div');
  wahl.className = 'levelwahl';
  function wahlAufbauen() {
    wahl.textContent = '';
    LEVEL.forEach(lv => {
      const b = document.createElement('button');
      b.type = 'button';
      const offen = lv.nr <= frei(), spielbar = offen && lv.gebaut;
      b.disabled = !spielbar;
      b.classList.toggle('aktiv', lv === LV);
      // ungebautes Level bleibt grau mit Schloss „nach Level N“, auch wenn schon freigeschaltet (MZ: kein „demnächst“)
      const unter = spielbar ? zahl(bestwertVon(lv) || 0) + ' Pkt.' : SCHLOSS + ' nach Level ' + (lv.nr - 1);
      b.innerHTML = `<b>Level ${lv.nr}</b><span>${lv.name}</span><small>${unter}</small>`;
      b.setAttribute('aria-label', 'Level ' + lv.nr + NBSP + '– ' + lv.name + (spielbar ? '' : ' (gesperrt)'));
      if (spielbar) b.addEventListener('click', () => { levelWaehlen(lv.nr); R_.ton('klick'); });
      wahl.append(b);
    });
  }
  function levelWaehlen(n) {
    const lv = LEVEL[n - 1];
    if (!lv || !lv.gebaut) return false;
    LV = lv;
    DEF.id = LV.id;          // eigener Bestwert je Level
    Lschluessel = '';
    wahlAufbauen();
    R_.startbildAktualisieren({ anleitung: LV.anleitung });
    return true;
  }
  R_.startElement(wahl);

  function dach() { return 'Level ' + LV.nr + NBSP + '– ' + LV.name; }
  function geschafft() {
    phase = 'fertig';
    const p = Math.max(1, Math.min(1000, punkteJetzt()));   // wer die Woche schafft, bekommt mindestens 1 Punkt
    klang('sieg');
    const naechstes = LEVEL[LV.nr];
    const neuFrei = naechstes && frei() < naechstes.nr;
    if (neuFrei) freischalten(naechstes.nr);
    // „Weiter zu Level N“ nach jedem geschafften Level, sobald N frei und gebaut ist; „freigeschaltet“ nur beim ersten Mal
    const weiter = naechstes && naechstes.gebaut && naechstes.nr <= frei(), zeigen = neuFrei && weiter;
    R_.ende(p, {
      dach: dach(), ueberschrift: stufe(p), zeile: bilanz(true),
      hinweis: zeigen ? 'Level ' + naechstes.nr + ' freigeschaltet' : '',
      extraKnopf: weiter ? { text: 'Weiter zu Level ' + naechstes.nr, klick: () => levelWaehlen(naechstes.nr) } : null,
      text: K.spruch || '', bild: endBild('abend'), bildPosition: SCHIRM_POS, verzoegerung: 500,
    });
    wahlAufbauen();
  }
  function abbruch() {
    phase = 'fertig';
    klang('niederlage');
    R_.ende(0, { dach: dach(), ueberschrift: ABBRUCH_TITEL, wert: bilanz(false), bild: endBild('nacht'), bildPosition: SCHIRM_POS, text: '', verzoegerung: 300, nochmalZuerst: true });
  }
  // Bilanz „14 von 15 Stempeln korrekt – 1 Verstoß“ (Level 2/3: „Entscheidungen“ = Stempel und Antworten);
  // unnötige Pausen zusätzlich genannt; Verlierer zweizeilig
  function bilanz(einzeilig, werte) {
    const v = werte || { anzahl, korrekt, verstoesse, unnoetig };
    const vt = v.verstoesse === 0 ? 'kein Verstoß' : v.verstoesse === 1 ? '1 Verstoß' : v.verstoesse + ' Verstöße';
    const ut = v.unnoetig ? ', ' + (v.unnoetig === 1 ? '1 unnötige Pause' : v.unnoetig + ' unnötige Pausen') : '';
    return `${v.korrekt} von ${v.anzahl} ${LV.wort} korrekt${NBSP}–${einzeilig ? ' ' : '\n'}${vt}${ut}`;
  }
  // Beispiel-Endbilder (#ende=sieg-854, #ende=verloren, #ende=frei) – schreiben wie ein echtes Spiel den Bestwert
  function beispielEnde(art, wert) {
    phase = 'fertig';
    if (art === 'verloren') {
      sprungEndeArt = 'verloren';
      R_.ende(0, { dach: dach(), ueberschrift: ABBRUCH_TITEL, wert: bilanz(false, { anzahl: 9, korrekt: 6, verstoesse: 3, unnoetig: 0 }), bild: endBild('nacht'), bildPosition: SCHIRM_POS, text: '', verzoegerung: 0, nochmalZuerst: true });
    } else {
      // wie im echten Spiel: „Weiter“, wenn das nächste Level gebaut und schon frei ist (#ende=frei: zusätzlich „freigeschaltet“)
      const p = wert ? +wert : 854, nx = LV.nr + 1, gebaut = nx <= LEVEL.length && LEVEL[nx - 1].gebaut;
      const f = art === 'frei' && gebaut, knopf = gebaut && (f || nx <= frei());
      R_.ende(p, { dach: dach(), ueberschrift: stufe(p), zeile: bilanz(true, { anzahl: 15, korrekt: 14, verstoesse: 1, unnoetig: 0 }), text: K.spruch || '', bild: endBild('abend'), bildPosition: SCHIRM_POS, verzoegerung: 0,
        hinweis: f ? 'Level ' + nx + ' freigeschaltet' : '', extraKnopf: knopf ? { text: 'Weiter zu Level ' + nx, klick: () => levelWaehlen(nx) } : null });
    }
  }

  // ---------- Aufteilung ----------
  // Level 1/2 (eine Karte): Hochformat Haus oben (Schild mit Logo über der Uhr), unten Uhr links, Karte rechts, darunter
  // „Pause“ und „Feierabend“; Querformat ab 400 px Höhe Knöpfe unter der Gruppe (links), Schild rechts frei; flacher:
  // Knöpfe rechts neben der Karte. Level 2/3: Foto der Person ragt oben rechts über die Karte (Platz dafür reserviert).
  // Level 3 (zwei Karten): Hochformat Uhr oben links, zwei Karten nebeneinander, unter jeder Karte ihre zwei Knöpfe
  // übereinander; Querformat Uhr links, Karten rechts daneben, je Karte zwei Knöpfe nebeneinander darunter.
  // Notiz (Frage): Hochformat oben über dem Haus, Querformat rechts neben der Gruppe (zu schmal: über der Uhr).
  let L = null, Lschluessel = '';
  const begrenzen = (v, a, b) => Math.max(a, Math.min(b, v));
  const UHR_SEITE = GEH.b / GEH.h, KARTE_F = 0.62;   // Kartenbreite = 0,62 × Uhrhöhe
  const FOTO = { b: 0.46, seite: 1.25, raus: 0.65 };  // Foto: Breite 46 % der Karte, Höhe 1,25 × Breite, 65 % ragen über die Karte
  function aufteilen(B, H) {
    const quer = B > H * 1.05, breit = B >= 560, lebenY = breit ? 24 : 60, oben = breit ? 54 : 76, gap = 12;
    const foto = LV.personen, fotoRaus = foto ? FOTO.b * FOTO.seite * FOTO.raus * KARTE_F : 0;   // Anteil der Uhrhöhe
    const knoepfe = [], karten = [];
    // längste Regel des Tages bestimmt die Schriftgröße (beide Karten in Level 3 gleich)
    const regeln = tag ? tag.leute.map(a => a.P.regel || '') : [];
    const regelLang = LV.personen ? regeln.reduce((a, b) => (b.length > a.length ? b : a), '') || PERSONEN.lena.regel : '';
    let C, notiz, fb = FOTO.b, zeilenAnz = 4;
    if (LV.art === 'abteilung') {
      if (!quer) {
        // Level 3 hoch (MZ, 22.10.2026): Stempeluhr klein oben mittig, darunter zwei gleich große Karten nebeneinander mit
        // kleinem Foto, unter jeder Karte ihre zwei Knöpfe übereinander; Karte kompakt (4 Stempelzeilen, sehr eng nur 2)
        fb = 0.36;
        const kh = begrenzen(H * 0.06, 40, 50), y2 = H - kh - begrenzen(H * 0.025, 10, 20), y1 = y2 - kh - 8;
        const W = Math.min(B, 720), cw = (W - 24 - gap) / 2, x0 = (B - (2 * cw + gap)) / 2;
        const uh = begrenzen(H * 0.17, 110, 150);
        C = { x: (B - uh * UHR_SEITE) / 2, y: oben + 4, w: uh * UHR_SEITE, h: uh };
        const chMax = y1 - 12 - (C.y + C.h + 10 + fb * FOTO.seite * FOTO.raus * cw);
        zeilenAnz = karteMasse({ w: cw, h: chMax }, regelLang, 4).fs >= 11 ? 4 : 2;
        const ch = karteMasse({ w: cw, h: chMax }, regelLang, zeilenAnz).h, cy = y1 - 12 - ch;
        for (let i = 0; i < 2; i++) {
          const x = x0 + i * (cw + gap);
          karten.push({ x, y: cy, w: cw, h: ch });
          knoepfe.push({ id: 'pause' + i, art: 'pause', i, x, y: y1, w: cw, h: kh }, { id: 'feierabend' + i, art: 'feierabend', i, x, y: y2, w: cw, h: kh });
        }
        notiz = { x: (B - Math.min(B - 24, 400)) / 2, y: oben + 8, w: Math.min(B - 24, 400), hMax: cy - 16 - (oben + 8) };
      } else {
        const m = begrenzen(B * 0.04, 12, 48), kh = begrenzen(H * 0.11, 38, 54), ky = H - kh - begrenzen(H * 0.03, 8, 20);
        let gh = (ky - 10 - oben - 2) / (1 + FOTO.b * FOTO.seite * FOTO.raus * 0.7);
        gh = Math.min(gh, 440, (B - 2 * m - 2 * gap) / (UHR_SEITE + 1.4));
        const cw = 0.7 * gh, cy = ky - 10 - gh;
        C = { x: m, y: cy, w: gh * UHR_SEITE, h: gh };
        for (let i = 0; i < 2; i++) {
          const x = C.x + C.w + gap + i * (cw + gap), bw = (cw - 6) / 2;
          karten.push({ x, y: cy, w: cw, h: gh });
          knoepfe.push({ id: 'pause' + i, art: 'pause', i, x, y: ky, w: bw, h: kh }, { id: 'feierabend' + i, art: 'feierabend', i, x: x + bw + 6, y: ky, w: bw, h: kh });
        }
        const rechts = karten[1].x + cw + 16;
        notiz = B - rechts - 12 >= 230 ? { x: rechts, y: oben + 8, w: Math.min(B - rechts - 12, 380), hMax: H - oben - 24, mitte: true }
          : { x: m, y: oben + 8, w: Math.min(360, B - 2 * m), hMax: H - oben - 24, mitte: true };
      }
    } else {
      const unten = !quer || H >= 400;
      let gh, cx0, cy0;
      if (unten) {
        const kh = begrenzen(H * 0.085, 46, 66), ky = H - kh - begrenzen(H * 0.03, 12, 24);
        const W = quer ? Math.min(B * 0.55, 640) : Math.min(B - 24, 640);
        gh = quer ? Math.min((W - gap) / (UHR_SEITE + KARTE_F), (ky - 14 - oben - 10) / (1 + fotoRaus), 460)
          : Math.min((W - gap) / (UHR_SEITE + KARTE_F), H * 0.46, ky - 14 - oben - 100);
        const gw = gh * (UHR_SEITE + KARTE_F) + gap;
        cx0 = quer ? begrenzen(B * 0.04, 12, 48) : (B - gw) / 2; cy0 = ky - 14 - gh;
        const kw = quer ? gw : Math.min(B - 24, 460), kb = (kw - 12) / 2, kx = quer ? cx0 : (B - kw) / 2;
        knoepfe.push({ id: 'pause0', art: 'pause', i: 0, x: kx, y: ky, w: kb, h: kh }, { id: 'feierabend0', art: 'feierabend', i: 0, x: kx + kb + 12, y: ky, w: kb, h: kh });
      } else {
        const m = begrenzen(B * 0.04, 12, 48), bw = begrenzen(B * 0.2, 124, 220);
        gh = Math.min((H - oben - 14) / (1 + fotoRaus), 460, (B - 2 * m - gap - 18 - bw) / (UHR_SEITE + KARTE_F));
        cx0 = m; cy0 = H - 10 - gh;
        const kh = begrenzen(gh * 0.2, 44, 64), kx = cx0 + gh * (UHR_SEITE + KARTE_F) + gap + 18, mitte = cy0 + gh * 0.55;
        knoepfe.push({ id: 'pause0', art: 'pause', i: 0, x: kx, y: mitte - kh - 7, w: bw, h: kh }, { id: 'feierabend0', art: 'feierabend', i: 0, x: kx, y: mitte + 7, w: bw, h: kh });
      }
      C = { x: cx0, y: cy0, w: gh * UHR_SEITE, h: gh };
      karten.push({ x: C.x + C.w + gap, y: C.y + gh * 0.035, w: gh * KARTE_F, h: gh * 0.93 });
      const R = karten[0], fotoOben = R.y - FOTO.b * FOTO.seite * FOTO.raus * R.w;
      if (!quer) notiz = { x: (B - Math.min(B - 24, 400)) / 2, y: oben + 8, w: Math.min(B - 24, 400), hMax: (foto ? fotoOben : C.y) - 12 - (oben + 8) };
      else {
        const rechts = Math.max(R.x + R.w, knoepfe[1].x + knoepfe[1].w) + 16;
        // zu schmal: Notiz über Uhr und Karte, links von den Knöpfen (die bleiben frei)
        notiz = B - rechts - 12 >= 230 ? { x: rechts, y: oben + 8, w: Math.min(B - rechts - 12, 380), hMax: H - oben - 24, mitte: true }
          : { x: C.x, y: oben + 8, w: Math.min(340, B - 2 * C.x, knoepfe[0].x - C.x - 10), hMax: H - oben - 24, mitte: true };
      }
    }
    // Karteninhalt (Schriftgröße) und Karten mittig neben der Uhr; beide Karten in Level 3 gleich groß
    let inhalt = karten.map(R => karteMasse(R, regelLang, zeilenAnz)), regelKurz = false;
    // sehr kleine Karten (z. B. Level 3 bei 568 × 320): nur die Kurzregel, damit der Rest lesbar bleibt (QA, 22.10.2026)
    if (LV.personen && inhalt[0].fs < 9.5) {
      regelKurz = true;
      const kurz = (tag ? tag.leute.map(a => a.P.regelKurz || '') : [PERSONEN.lena.regelKurz || '']).reduce((a, b) => (b.length > a.length ? b : a), '');
      inhalt = karten.map(R => karteMasse(R, kurz, zeilenAnz));
    }
    karten.forEach((R, i) => { if (LV.art !== 'abteilung') R.y = C.y + Math.max(0, (C.h - inhalt[i].h) / 2); else R.h = inhalt[i].h; });
    // Haus: Bild füllt den Schirm; Hochformat: Logo auf dem Schild endet über der Uhr, Querformat: Logo rechts der Gruppe
    let s = Math.max(B / HB, H / HB), ox, oy;
    const oberkante = Math.min(C.y, ...karten.map(R => R.y - (foto ? fb * FOTO.seite * FOTO.raus * R.w : 0)));
    if (!quer && LV.art === 'abteilung') {
      // Level 3 hoch: Logo mittig über den Fotos; die Uhr oben darf es teils verdecken (MZ, 22.10.2026)
      const fo = Math.min(...karten.map(R => R.y - fb * FOTO.seite * FOTO.raus * R.w));
      s = Math.max(s, (H - (fo - 12)) / (HB - LOGO_UNTEN));
      oy = begrenzen(fo - 12 - LOGO_UNTEN * s, H - HB * s, 0);
      ox = begrenzen(B / 2 - LOGO_MITTE[0] * s, B - HB * s, 0);
    } else if (!quer) {
      s = Math.max(s, (H - (oberkante - 26)) / (HB - LOGO_UNTEN));
      oy = begrenzen(oberkante - 26 - LOGO_UNTEN * s, H - HB * s, 0);
      ox = begrenzen(B * 0.6 - LOGO_MITTE[0] * s, B - HB * s, 0);
    } else {
      const rechts = Math.max(...karten.map(R => R.x + R.w), ...knoepfe.map(k => k.x + k.w));
      ox = begrenzen((rechts + B) / 2 - LOGO_MITTE[0] * s, B - HB * s, 0);
      oy = begrenzen(H * 0.42 - LOGO_MITTE[1] * s, H - HB * s, 0);
    }
    const k = C.w / GEH.b;
    const schlitz = { x: C.x + (GEH.schlitzX0 + GEH.schlitzX1) / 2 * k, y: C.y + GEH.schlitzY * k, w: (GEH.schlitzX1 - GEH.schlitzX0) * k };
    return { quer, lebenY, oben, C, karten, inhalt, knoepfe, notiz, fotoB: fb, zeilenAnz, regelKurz, haus: { s, ox, oy }, schlitz, rechts: Math.max(...karten.map(R => R.x + R.w), ...knoepfe.map(k => k.x + k.w)) };
  }
  // Inhalt der Karte: Schriftgröße so, dass Kopf, „Heute geplant“, Regel der Person, Arbeitszeit und vier Zeilen hineinpassen
  const messG = document.createElement('canvas').getContext('2d');
  function karteMasse(R, regel, n) {
    n = n || 4;
    const g = messG;
    let fs = begrenzen(R.w * 0.088, 9, 16), m;
    for (;;) {
      const pad = Math.max(5, fs * 0.6), kopf = Math.max(18, fs * 1.85);
      g.font = `600 ${fs * 0.92}px ${SCHRIFT}`;
      const plan1 = g.measureText('Heute geplant: 10:00' + NBSP + 'Std.').width <= R.w - 2 * pad;
      g.font = `600 ${fs * 0.76}px ${SCHRIFT}`;
      const regelZeilen = regel ? umbrechen(g, regel, R.w - 2 * pad) : [];
      const info = pad * 0.8 + (plan1 ? 1 : 2) * fs * 1.15 + regelZeilen.length * fs * 0.92 + (regel ? fs * 0.25 : 0) + fs * 0.55 + fs * 1.05 + fs * 1.85 + pad * 0.6;
      const unten = fs * 0.8, rest = R.h - kopf - info - unten, zeile = Math.min(fs * 2.7, rest / n);
      m = { fs, pad, kopf, plan1, info, unten, zeile, regelZeilen, zeilenAnz: n };
      if (zeile >= fs * 1.95 || fs <= 7.5) break;
      fs -= 0.5;
    }
    m.h = m.kopf + m.info + n * m.zeile + m.unten;
    return m;
  }
  function umbrechen(g, text, breite) {
    text = text.replace(/(\d½?) (Std\.|Uhr|Stunden)/g, '$1' + NBSP + '$2');   // Zahl und Einheit zusammenhalten
    const zeilen = []; let zeile = '';
    for (const wort of text.split(' ')) {
      const probe = zeile ? zeile + ' ' + wort : wort;
      if (g.measureText(probe).width <= breite || !zeile) zeile = probe;
      else { zeilen.push(zeile); zeile = wort; }
    }
    if (zeile) zeilen.push(zeile);
    return zeilen;
  }
  // Notiz mit Frage: Maße abhängig vom Text; Knöpfe „Ja“/„Nein“ unten auf der Notiz
  function notizMasse() {
    if (!frage || !L) return null;
    if (frage.masse && frage.masseL === L) return frage.masse;
    const N = L.notiz, g = messG, pad = 14;
    let fs = begrenzen(N.w * 0.05, 13, 18), zeilen, h, kh;
    for (;;) {
      g.font = `600 ${fs}px ${SCHRIFT}`;
      zeilen = umbrechen(g, frage.def.text, N.w - 2 * pad);
      kh = begrenzen(fs * 2.6, 36, 48);
      h = pad + fs * 1.3 + 6 + zeilen.length * fs * 1.3 + 12 + kh + pad + 6;
      if (h <= N.hMax || fs <= 11) break;
      fs -= 0.5;
    }
    const y = N.mitte ? N.y + Math.max(0, (N.hMax - h) / 2) : N.y;
    const kw = (N.w - 2 * pad - 12) / 2, ky = y + h - pad - 6 - kh;
    frage.masse = { x: N.x, y, w: N.w, h, fs, pad, zeilen, ja: { x: N.x + pad, y: ky, w: kw, h: kh }, nein: { x: N.x + pad + kw + 12, y: ky, w: kw, h: kh } };
    frage.masseL = L;
    return frage.masse;
  }

  // ---------- Eingabe ----------
  const drin = (k, x, y, r) => x >= k.x - r && x <= k.x + k.w + r && y >= k.y - r && y <= k.y + k.h + r;
  function runter(x, y) {
    if (!L) return;
    if (phase === 'titel') { phaseT = Math.max(phaseT, DAUER.titel - DAUER.titelAus); return; }   // Tippen überspringt den Titel
    const nm = notizMasse();
    if (nm && !frage.ergebnis) {
      if (drin(nm.ja, x, y, 6)) { antworte('ja'); return; }
      if (drin(nm.nein, x, y, 6)) { antworte('nein'); return; }
    }
    for (const k of L.knoepfe) if (drin(k, x, y, 6)) { tippe(k.art, k.i); return; }
  }
  addEventListener('keydown', e => {
    if (R_.zustand !== 'spiel' || e.repeat) return;
    const k = e.key.toLowerCase();
    if (phase === 'titel' && (k === ' ' || k === 'enter' || k === 'p' || k === 'f')) { e.preventDefault(); runter(-1, -1); return; }
    if (frage && !frage.ergebnis && (k === 'j' || k === 'n')) { antworte(k === 'j' ? 'ja' : 'nein'); return; }
    if (k === 'p' || e.code === 'Space') { e.preventDefault(); tippe('pause', 0); }
    else if (k === 'f' || k === 'enter') { e.preventDefault(); tippe('feierabend', 0); }
    else if (k === 'o') tippe('pause', 1);
    else if (k === 'e') tippe('feierabend', 1);
  });

  // ---------- Zeichnen ----------
  const glatt = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const beschl = t => Math.pow(Math.max(0, Math.min(1, t)), 2);
  const weich = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  function zeichne(g, B, H, zustand, dt) {
    const sch = B + 'x' + H + ':' + LV.nr;
    if (sch !== Lschluessel) { L = aufteilen(B, H); Lschluessel = sch; }
    if (zustand === 'ende') { zeichneHausFest(g, B, H, verstoesse >= MAX_VERSTOESSE || sprungEndeArt === 'verloren' ? 'nacht' : 'abend'); return; }
    if (zustand !== 'spiel') { zeichneHausFest(g, B, H, 'morgen'); return; }
    zeichneHaus(g, B, H);
    // oben leicht abdunkeln (Anzeige lesbar), unten bzw. links hinter Uhr und Karten ein weicher Schatten
    let v = g.createLinearGradient(0, 0, 0, 90);
    v.addColorStop(0, 'rgba(0,0,0,.35)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, B, 90);
    const y0 = L.quer ? 0 : Math.min(L.C.y, ...L.karten.map(R => R.y)) - 30, xr = L.rechts + 60;
    v = L.quer ? g.createLinearGradient(0, 0, xr, 0) : g.createLinearGradient(0, y0, 0, H);
    v.addColorStop(0, L.quer ? 'rgba(10,16,22,.38)' : 'rgba(10,16,22,0)'); v.addColorStop(1, L.quer ? 'rgba(10,16,22,0)' : 'rgba(10,16,22,.42)');
    g.fillStyle = v; g.fillRect(0, y0, L.quer ? xr : B, H - y0);
    zeichneUhr(g);
    zeichneKartenSzene(g);
    zeichneKnoepfe(g);
    zeichneNotiz(g);
    zeichneLeben(g, B);
    if (rot > 0 && !RUHIG) {   // Verstoß: Rand kurz rot
      const a = rot / 0.6 * 0.35, r = g.createRadialGradient(B / 2, H / 2, Math.min(B, H) * 0.35, B / 2, H / 2, Math.max(B, H) * 0.75);
      r.addColorStop(0, 'rgba(217,72,59,0)'); r.addColorStop(1, `rgba(217,72,59,${a})`);
      g.fillStyle = r; g.fillRect(0, 0, B, H);
    }
    if (phase === 'titel') zeichneLevelTitel(g, B, H);
  }

  function hausRahmen() { const h = L.haus; return [h.ox, h.oy, HB * h.s, HB * h.s]; }
  function zeichneHausFest(g, B, H, name) {
    const c = HAUS[name];
    if (!c) { g.fillStyle = '#7d8f9c'; g.fillRect(0, 0, B, H); return; }
    g.drawImage(c, ...hausRahmen());
  }
  // Tageszeit: die vier Fassungen nach Gewicht übereinander (richtig gemischt: Deckkraft w_i / Summe bis i)
  function zeichneHaus(g, B, H) {
    if (!HAUS.morgen) { g.fillStyle = '#7d8f9c'; g.fillRect(0, 0, B, H); return; }
    const r = hausRahmen();
    let summe = 0;
    g.save();
    ['morgen', 'mittag', 'abend', 'nacht'].forEach(n => {
      const w = gewicht[n];
      if (w < 0.004) return;
      summe += w;
      g.globalAlpha = Math.min(1, w / summe);
      g.drawImage(HAUS[n], ...r);
    });
    g.restore();
  }

  // Stempeluhr mit drehenden Zeigern (Stunden- und Minutenzeiger um die Achse)
  function zeichneUhr(g) {
    const C = L.C, img = BILD.gehaeuse;
    const dx = wackeln > 0 && !RUHIG ? Math.sin(wackeln * 90) * 1.5 : 0;
    if (!img) return;
    g.save();
    g.translate(dx, 0);
    g.drawImage(img, C.x, C.y, C.w, C.h);
    const k = C.w / GEH.b, mx = C.x + GEH.mx * k, my = C.y + GEH.my * k, zk = k * GEH.zeiger;
    const h = ((uhrAnz % 24) + 24) % 24;
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3 * k * 2; g.shadowOffsetX = 1.5; g.shadowOffsetY = 2;
    [['zeigerStd', ZEIGER.std, (h % 12) / 12], ['zeigerMin', ZEIGER.min, h % 1]].forEach(([n, z, anteil]) => {
      const b = BILD[n];
      if (!b) return;
      g.save();
      g.translate(mx, my); g.rotate(anteil * Math.PI * 2);
      g.drawImage(b, -z.px * zk, -z.py * zk, b.naturalWidth * zk, b.naturalHeight * zk);
      g.restore();
    });
    g.restore();
  }

  // Lage einer Karte je Phase (kommt zum Tagesbeginn von rechts, die aktive fährt zum Stempeln in den Schlitz und zurück)
  function karteLage(a) {
    const R = L.karten[a.i], S = L.schlitz;
    let x = R.x, y = R.y, f = 1, alpha = 1, schnitt = null;
    if (phase === 'tagStart') {
      const t = glatt((phaseT - DAUER.tagStart * 0.35 - a.i * 0.12) / (DAUER.tagStart * 0.5));
      if (t <= 0) return null;
      x += RUHIG ? 0 : (1 - t) * (L.quer ? 120 : innerWidth - R.x); alpha = t;
    } else if (phase === 'tagEnde') {
      const t = beschl(phaseT / DAUER.tagEnde);
      x += RUHIG ? 0 : t * 90; y += RUHIG ? 0 : t * 30; alpha = 1 - t;
    } else if (phase === 'stempeln' && a === aktiv && !RUHIG && LV.art === 'abteilung' && !L.quer) {
      // Level 3 hoch: zwei Karten, kleine Uhr – die Karte hebt sich kurz an und setzt mit dem Klack auf
      const t = phaseT / DAUER.stempeln;
      y -= Math.sin(Math.min(1, t / 0.45) * Math.PI) * 10; f = 1 + Math.sin(Math.min(1, t / 0.45) * Math.PI) * 0.03;
    } else if (phase === 'stempeln' && a === aktiv && !RUHIG) {
      // unter den Schlitz (0–0,18s), hinein (bis 0,26s, Klack), kurz halten, heraus und zurück
      const sf = S.w * 0.9 / R.w, unterX = S.x - R.w * sf / 2, unterY = S.y + 3, tief = R.h * sf * 0.22, t = phaseT;
      let u = 0, rein = 0;
      if (t < 0.18) u = weich(t / 0.18);
      else if (t < 0.26) { u = 1; rein = weich((t - 0.18) / 0.08); }
      else if (t < 0.34) { u = 1; rein = 1; }
      else if (t < 0.40) { u = 1; rein = 1 - weich((t - 0.34) / 0.06); }
      else u = 1 - weich((t - 0.40) / 0.18);
      x = R.x + (unterX - R.x) * u; y = R.y + (unterY - R.y) * u - tief * rein; f = 1 + (sf - 1) * u;
      if (u >= 1) schnitt = S.y;
    }
    return { x, y, w: R.w * f, h: R.h * f, f, alpha, schnitt };
  }
  function zeichneKartenSzene(g) {
    if (!tag || phase === 'titel') return;
    const reihe = tag.leute.slice().sort((p, q) => (p === aktiv) - (q === aktiv));   // aktive Karte zuletzt (oben)
    reihe.forEach(a => {
      const lage = karteLage(a);
      if (!lage) return;
      zeichneKarte(g, lage, a, L.inhalt[a.i]);
      if (LV.personen && !lage.schnitt) zeichneFoto(g, lage, a);
    });
    if (letzter && letzter.ergebnis && phase === 'rueck' && aktiv) zeichneGrossStempel(g);
  }

  // Foto der Person: Polaroid mit Name und Hinweis, oben rechts über die Karte geklemmt
  function zeichneFoto(g, lage, a) {
    const p = a.P, img = BILD['person-' + a.person];
    const bw = lage.w * L.fotoB, bh = bw * FOTO.seite, x = lage.x + lage.w - bw * 0.92, y = lage.y - bh * FOTO.raus;
    g.save();
    g.globalAlpha = lage.alpha * (a.fertig && phase !== 'rueck' && phase !== 'tagEnde' && LV.art === 'abteilung' ? 0.8 : 1);
    g.translate(x + bw / 2, y + bh / 2); g.rotate(0.05);
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
    g.fillStyle = '#fbfaf5'; g.fillRect(-bw / 2, -bh / 2, bw, bh);
    g.shadowColor = 'transparent';
    const r = bw * 0.07, fw = bw - 2 * r, fh = bh - r - bh * 0.27;
    g.fillStyle = '#d9cbb3'; g.fillRect(-bw / 2 + r, -bh / 2 + r, fw, fh);
    if (img && p.ausschnitt) {
      const [sx, sy, sw, sh] = p.ausschnitt, f = Math.max(fw / sw, fh / sh), dw = sw * f, dh = sh * f;
      g.save(); g.beginPath(); g.rect(-bw / 2 + r, -bh / 2 + r, fw, fh); g.clip();
      g.drawImage(img, sx, sy, sw, sh, -bw / 2 + r + (fw - dw) / 2, -bh / 2 + r, dw, dh);
      g.restore();
    }
    const ty = -bh / 2 + r + fh;
    g.fillStyle = TEXT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${bh * 0.085}px ${SCHRIFT}`;
    g.fillText(p.name, 0, ty + bh * 0.085, bw - 2 * r);
    g.fillStyle = BLAUGRAU; g.font = `600 ${bh * 0.07}px ${SCHRIFT}`;
    g.fillText(p.hinweis, 0, ty + bh * 0.185, bw - 2 * r);
    g.restore();
  }

  // Stempelkarte aus dem gemalten Bild zusammengesetzt (Kopfstreifen, Papier, Zeilen mit Linie, Rand unten);
  // Text setzt der Code: Wochentag bzw. Name, „Heute geplant“, Regel der Person, Arbeitszeit, Stempel-Zeilen
  function zeichneKarte(g, lage, a, m) {
    const img = BILD.karte;
    if (!img) return;
    const { x, y, w, f } = lage, kx = w / (KARTE.x1 - KARTE.x0);
    g.save();
    g.globalAlpha = lage.alpha * (a.fertig && LV.art === 'abteilung' && !(phase === 'rueck' && a === aktiv) && phase !== 'tagEnde' ? 0.8 : 1);
    if (lage.schnitt != null) { g.beginPath(); g.rect(-1e4, lage.schnitt, 2e4, 2e4); g.clip(); }
    g.translate(x, y); g.scale(f, f);
    const W = w / f, s = kx / f;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
    g.fillStyle = '#e3d6c2'; g.fillRect(1, 1, W - 2, m.h - 2);
    g.restore();
    const lw = (KARTE.links[1] - KARTE.links[0]) * s, rw = (KARTE.rechts[1] - KARTE.rechts[0]) * s;
    function streifen(sy0, sy1, dy, dh) {
      g.drawImage(img, KARTE.links[0], sy0, KARTE.links[1] - KARTE.links[0], sy1 - sy0, 0, dy, lw + 0.5, dh);
      g.drawImage(img, KARTE.mitte[0], sy0, KARTE.mitte[1] - KARTE.mitte[0], sy1 - sy0, lw, dy, W - lw - rw + 0.5, dh);
      g.drawImage(img, KARTE.rechts[0], sy0, KARTE.rechts[1] - KARTE.rechts[0], sy1 - sy0, W - rw, dy, rw, dh);
    }
    let yy = 0;
    streifen(KARTE.kopf[0], KARTE.kopf[1], yy, m.kopf); yy += m.kopf;
    streifen(KARTE.papier[0], KARTE.papier[1], yy, m.info); const infoY = yy; yy += m.info;
    const zeilenY = yy;
    for (let i = 0; i < m.zeilenAnz; i++) { streifen(KARTE.zeile[0], KARTE.zeile[1], yy, m.zeile); yy += m.zeile; }
    streifen(KARTE.unten[0], KARTE.unten[1], yy, m.unten);
    const fs = m.fs, pad = m.pad, fotoB = LV.personen ? W * L.fotoB * 0.92 : 0;
    // Kopf: Wochentag (Level 1) bzw. Name der Person (links, rechts ragt das Foto herein)
    g.fillStyle = F.hauptText || R_.textFarbe(F.haupt);
    g.font = `800 ${fs * 1.02}px ${SCHRIFT}`; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = '0.5px';
    if (LV.personen) { g.textAlign = 'left'; g.fillText(a.P.name.toUpperCase(), pad, m.kopf / 2 + 1, W - fotoB - pad * 1.5); }
    else { g.textAlign = 'center'; g.fillText(tag.name.toUpperCase(), W / 2, m.kopf / 2 + 1, W - 2 * pad); }
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    // Heute geplant, Regel
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    let ty = infoY + pad * 0.8 + fs * 0.92;
    g.fillStyle = BLAUGRAU; g.font = `600 ${fs * 0.92}px ${SCHRIFT}`;
    if (m.plan1) g.fillText('Heute geplant: ' + std(a.plan), pad, ty, W - 2 * pad);
    else { g.fillText('Heute geplant:', pad, ty); ty += fs * 1.15; g.fillText(std(a.plan), pad, ty); }
    const regelText = L.regelKurz ? a.P.regelKurz : a.P.regel;
    if (LV.personen && regelText) {
      g.font = `600 ${fs * 0.76}px ${SCHRIFT}`; g.fillStyle = HINWEIS;
      const zeilen = umbrechen(g, regelText, W - 2 * pad);
      ty += fs * 0.25;
      zeilen.forEach(z => { ty += fs * 0.92; g.fillText(z, pad, ty, W - 2 * pad); });
      ty += (m.regelZeilen.length - zeilen.length) * fs * 0.92;
    }
    // Arbeitszeit (läuft); Level 3: vor Beginn „ab 9:30“, in der Pause „Pause – noch 0:18“
    ty += fs * 0.55 + fs * 1.05;
    g.font = `700 ${fs * 0.8}px ${SCHRIFT}`; g.fillStyle = a.pauseRest > 0 ? HINWEIS : BLAUGRAU;
    if ('letterSpacing' in g) g.letterSpacing = '0.6px';
    g.fillText(a.pauseRest > 0 ? 'PAUSE' + NBSP + '– NOCH ' + hm(a.pauseRest) : 'ARBEITSZEIT', pad, ty, W - 2 * pad);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    ty += fs * 1.85;
    g.fillStyle = TEXT; g.font = `800 ${fs * 1.75}px ${SCHRIFT}`;
    // Ruhezeit-Frage offen: Beginn dieser Person bleibt bis zur Antwort offen (verrät sonst die Antwort, QA 22.10.2026)
    const offen = tag.morgen && tag.morgen.person === a.person && (phase === 'tagStart' || (phase === 'frage' && frage && !frage.ergebnis));
    const wert = !a.begonnen && !einzeln() ? (offen ? 'Beginn: ?' : 'ab ' + uhrText(a.beginn) + NBSP + 'Uhr') : std(a.arbeit);
    if (a.warnung && phase === 'lauf') {
      // Warnhinweis vor einer Grenze: Arbeitszeit leuchtet dezent (pulsierender warmer Hintergrund)
      const p = RUHIG ? 0.5 : 0.5 + 0.5 * Math.sin(performance.now() / 1000 * Math.PI * 2 * 1.2);
      const ww = Math.min(g.measureText(wert).width, W - 2 * pad) + fs * 0.6;
      g.save();
      runderKasten(g, pad - fs * 0.3, ty - fs * 1.55, ww, fs * 1.95, fs * 0.35);
      g.fillStyle = `rgba(255,205,90,${0.28 + 0.3 * p})`; g.fill();
      g.restore();
    }
    g.fillText(wert, pad, ty - fs * 0.15, W - 2 * pad);
    // Stempel-Zeilen: oben klein die Art, darunter die Uhrzeit wie gestempelt; rechts der kleine Stempel
    const sichtbar = a.stempel.length - ((phase === 'stempeln' && a === aktiv) ? 1 : 0);
    // nur die letzten Zeilen (kompakte Karte: 2)
    const erste = Math.max(0, sichtbar - m.zeilenAnz);
    for (let j = 0; j < Math.min(m.zeilenAnz, sichtbar); j++) {
      const i = erste + j, st = a.stempel[i], zy = zeilenY + j * m.zeile;
      const neu = a === aktiv && i === a.stempel.length - 1 && phase === 'rueck', ein = neu && !RUHIG ? glatt(phaseT / 0.25) : 1;
      g.save();
      g.globalAlpha *= ein;
      g.fillStyle = BLAUGRAU; g.font = `600 ${fs * 0.72}px ${SCHRIFT}`;
      g.fillText(st.art === 'beginn' ? 'Eingestempelt' : st.art === 'pause' ? 'Pause' : 'Feierabend', pad, zy + m.zeile * 0.42);
      g.fillStyle = '#3a3357'; g.font = `700 ${fs * 0.9}px "Courier New", Courier, monospace`;
      g.fillText(uhrText(st.uhr) + NBSP + 'Uhr', pad, zy + m.zeile * 0.86);
      g.restore();
      if (st.ergebnis && (!neu || phaseT > STEMPEL_KLEIN)) zeichneKleinStempel(g, st, W * 0.5, zy + m.zeile * 0.12, W * 0.5 - pad * 0.6, m.zeile * 0.76, 1);
    }
    g.restore();
  }
  const STEMPEL = { puenktlich: 'PÜNKTLICH', ok: 'OK', frueh: 'ZU FRÜH', ueberstunden: 'ÜBERSTUNDEN', unnoetig: 'UNNÖTIG', verstoss: 'VERSTOSS',
    richtig: 'RICHTIG', falsch: 'FALSCH', keine: 'KEINE ANTWORT', knapp: 'KNAPP' };
  const stempelFarbe = e => e === 'verstoss' ? WARNUNG : e === 'puenktlich' || e === 'ok' || e === 'richtig' ? GUT : HINWEIS;
  const STEMPEL_KLEIN = 1.0;   // ab hier steht der kleine Stempel in der Zeile
  function zeichneKleinStempel(g, st, x, y, w, h, a) {
    const farbe = stempelFarbe(st.ergebnis), text = STEMPEL[st.ergebnis];
    g.save();
    g.globalAlpha *= a * 0.92;
    let fs = h * 0.5;
    g.font = `900 ${fs}px ${SCHRIFT}`;
    const tw = g.measureText(text).width;
    if (tw + fs * 0.8 > w) { fs *= w / (tw + fs * 0.8); g.font = `900 ${fs}px ${SCHRIFT}`; }
    const bw = g.measureText(text).width + fs * 0.8, bh = fs * 1.5;
    g.translate(x + w - bw / 2, y + h / 2); g.rotate(-0.09);
    runderKasten(g, -bw / 2, -bh / 2, bw, bh, fs * 0.25);
    g.lineWidth = Math.max(1, fs * 0.12); g.strokeStyle = farbe; g.stroke();
    g.fillStyle = farbe; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, fs * 0.05);
    g.restore();
  }
  // Stempel, der aufs Papier fällt (wie Einspruch!) – auf der Karte bzw. der Notiz
  function stempelFallen(g, text, farbe, mx, my, maxB, t, klein) {
    let fs = begrenzen(maxB * 0.16, 14, 30);
    g.save();
    g.font = `900 ${fs}px ${SCHRIFT}`;
    let tw = g.measureText(text).width;
    if (tw + fs * 0.9 > maxB) { fs *= maxB / (tw + fs * 0.9); g.font = `900 ${fs}px ${SCHRIFT}`; tw = g.measureText(text).width; }
    const bw = tw + fs * 0.9, bh = fs * 1.65;
    const sk0 = RUHIG ? 1 : t < 0.16 ? 1.7 - beschl(t / 0.16) * 0.7 : t < 0.36 ? 1 - Math.sin((t - 0.16) / 0.2 * Math.PI) * 0.06 : 1;
    const sch = klein ? klein.t : 0, sk = sk0 * (1 + ((klein ? klein.f(bh) : 1) - 1) * sch);
    const px = klein ? mx + (klein.x - mx) * sch : mx, py = klein ? my + (klein.y - my) * sch : my;
    g.globalAlpha = Math.min(1, t / 0.12) * 0.95;
    g.translate(px, py); g.rotate(-0.12 + 0.03 * sch); g.scale(sk, sk);
    runderKasten(g, -bw / 2, -bh / 2, bw, bh, fs * 0.22);
    g.fillStyle = 'rgba(255,253,246,.85)'; g.fill();
    g.lineWidth = fs * 0.13; g.strokeStyle = farbe; g.stroke();
    g.fillStyle = farbe; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, fs * 0.06);
    g.restore();
    return bh;
  }
  function punktePille(g, delta, px, py, t, breite) {
    if (!delta || t < 0.25 || t > 1.6) return;
    const pf = begrenzen(breite * 0.095, 12, 17), txt = (delta > 0 ? '+' : '−') + Math.abs(delta) + ' Punkte';
    g.save();
    g.globalAlpha = Math.min(1, (t - 0.25) / 0.2) * (1 - weich((t - 1.2) / 0.3));
    g.font = `800 ${pf}px ${SCHRIFT}`;
    const pw = g.measureText(txt).width + pf * 1.6, ph = pf * 1.9;
    py -= Math.max(0, 0.45 - t) * 30;
    runderKasten(g, px - pw / 2, py - ph / 2, pw, ph, ph / 2);
    g.fillStyle = 'rgba(28,37,43,.9)'; g.fill(); g.lineWidth = 2; g.strokeStyle = delta > 0 ? '#5f9e3a' : HINWEIS; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, px, py + 1);
    g.restore();
  }
  // großer Stempel über der aktiven Karte, danach schrumpft er in seine Zeile; darunter „+91 Punkte“
  function zeichneGrossStempel(g) {
    const st = letzter, t = phaseT, R = L.karten[aktiv.i], m = L.inhalt[aktiv.i];
    const zeile = aktiv.stempel.length - 1, zy = R.y + m.kopf + m.info + Math.min(m.zeilenAnz - 1, zeile) * m.zeile + m.zeile / 2;
    // kleiner und tiefer als früher: auf den Stempelzeilen, die Arbeitszeit bleibt lesbar (MZ-Test, 22.10.2026)
    const zx = R.x + R.w * 0.75 - m.pad * 0.3, mx = R.x + R.w / 2, my = R.y + m.kopf + m.info + m.zeile * 0.55;
    const klein = { x: zx, y: zy, t: RUHIG ? (t > 0.8 ? 1 : 0) : weich((t - 0.75) / 0.25), f: bh => (m.zeile * 0.76 * 0.5 * 1.5) / bh };
    let bh = R.w * 0.2;
    if (t <= STEMPEL_KLEIN) bh = stempelFallen(g, STEMPEL[st.ergebnis], stempelFarbe(st.ergebnis), mx, my, R.w * 0.82, t, klein);
    let py = my + R.w * 0.11 + 18;
    // Begründung bei Verstoß, Knapp und unnötiger Pause (z. B. „Über 6 Std. ohne Pause“), bis zum Ende der Rückmeldung
    if (st.grund && t > 0.2) {
      const gf = begrenzen(R.w * 0.075, 10, 14);
      g.save();
      g.globalAlpha = Math.min(1, (t - 0.2) / 0.2);
      g.font = `700 ${gf}px ${SCHRIFT}`;
      const zl = umbrechen(g, st.grund, Math.max(R.w * 1.1, 120) - gf * 1.4), bw = Math.max(...zl.map(z => g.measureText(z).width)) + gf * 1.4, bhh = zl.length * gf * 1.25 + gf * 0.8;
      runderKasten(g, mx - bw / 2, py - gf * 0.6, bw, bhh, gf * 0.5);
      g.fillStyle = stempelFarbe(st.ergebnis); g.fill();
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      zl.forEach((z, i) => g.fillText(z, mx, py - gf * 0.6 + gf * 0.4 + gf * 1.25 * (i + 0.5)));
      g.restore();
      py += bhh + gf * 0.4 + 12;
    }
    punktePille(g, st.delta, mx, py, t, R.w);
  }

  // Notiz mit Frage („Chef:“ bzw. „Frage:“), Ja/Nein, Restzeit als Balken; nach der Antwort Stempel und Begründung
  function zeichneNotiz(g) {
    const nm = notizMasse();
    if (!nm) return;
    const f = frage, t = f.ergebnis ? 9 : f.t, rein = RUHIG ? 1 : glatt(t / 0.3);
    let aus = 0;
    if (phase === 'frageRueck') aus = RUHIG ? 0 : beschl((phaseT - (DAUER.frageRueck - 0.3)) / 0.3);
    g.save();
    g.globalAlpha = Math.min(rein, 1 - aus);
    g.translate(nm.x + nm.w / 2, nm.y + nm.h / 2 - (1 - rein) * 20); g.rotate(-0.015);
    const x0 = -nm.w / 2, y0 = -nm.h / 2;
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
    const pap = g.createLinearGradient(0, y0, 0, -y0);
    pap.addColorStop(0, '#fff6b8'); pap.addColorStop(1, '#f6e48c');
    g.fillStyle = pap; g.fillRect(x0, y0, nm.w, nm.h);
    g.shadowColor = 'transparent';
    const p = nm.pad, fs = nm.fs;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = BLAUGRAU; g.font = `800 ${fs * 0.9}px ${SCHRIFT}`;
    g.fillText(f.morgen ? 'Frage:' : 'Chef:', x0 + p, y0 + p + fs * 0.9);
    g.fillStyle = TEXT; g.font = `600 ${fs}px ${SCHRIFT}`;
    nm.zeilen.forEach((z, i) => g.fillText(z, x0 + p, y0 + p + fs * 1.3 + 6 + (i + 1) * fs * 1.3 - fs * 0.3));
    const ky = nm.ja.y - nm.y + y0;
    if (!f.ergebnis) {
      // Restzeit
      const rest = Math.max(0, 1 - f.t / FRAGE_ZEIT), bx = x0 + p, bwid = nm.w - 2 * p;
      g.fillStyle = 'rgba(71,94,108,.25)'; g.fillRect(bx, ky - 9, bwid, 3);
      g.fillStyle = rest < 0.3 ? WARNUNG : BLAUGRAU; g.fillRect(bx, ky - 9, bwid * rest, 3);
      const aktivJN = phase === 'frage';
      [['ja', 'Ja', F.haupt, F.hauptText || R_.textFarbe(F.haupt)], ['nein', 'Nein', BLAUGRAU, '#ffffff']].forEach(([id, text, farbe, schrift]) => {
        const k = nm[id];
        knopf(g, { x: k.x - nm.x + x0, y: k.y - nm.y + y0, w: k.w, h: k.h }, text, farbe, schrift, aktivJN ? 1 : 0.55, druck[id] || 0);
      });
    } else {
      const tt = phase === 'frageRueck' ? phaseT : 9;
      const by = ky + nm.ja.h * 0.5;
      const bh = stempelFallen(g, STEMPEL[f.ergebnis], stempelFarbe(f.ergebnis), -nm.w * 0.2, by - nm.ja.h * 0.1, Math.min(nm.w * 0.48, nm.ja.h * 3.6), tt, null);
      // Begründung (nur nach der Antwort): bei falscher oder fehlender Antwort beginnt sie mit der richtigen
      const begr = (f.ergebnis === 'richtig' ? '' : 'Richtig: „' + (f.def.antwort === 'ja' ? 'Ja' : 'Nein') + '“' + NBSP + '– ') + f.def.grund;
      g.save();
      g.globalAlpha *= Math.min(1, Math.max(0, (tt - 0.3) / 0.25));
      g.fillStyle = TEXT; g.font = `700 ${fs * 0.82}px ${SCHRIFT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
      let bf = fs * 0.82, zl;
      for (;;) { g.font = `700 ${bf}px ${SCHRIFT}`; zl = umbrechen(g, begr, nm.w * 0.37 - p); if (zl.length * bf * 1.08 <= nm.ja.h + p || bf <= 9) break; bf -= 0.5; }
      zl.forEach((z, i) => g.fillText(z, nm.w * 0.13, by - nm.ja.h * 0.1 + (i - (zl.length - 1) / 2) * bf * 1.08));
      g.restore();
      punktePille(g, f.delta, -nm.w * 0.18, by + bh / 2 + 6, tt, nm.w * 0.6);
    }
    g.restore();
  }

  // Knöpfe „Pause“ (Blaugrau) und „Feierabend“ (Kundenfarbe); aktiv nur, während die Arbeitszeit läuft
  const knopfHell = {};
  function knopf(g, k, text, farbe, schrift, hell, d) {
    const vergangen = 0.24 - d, tief = d <= 0 || RUHIG ? 0 : vergangen < 0.06 ? vergangen / 0.06 : 1 - glatt((vergangen - 0.06) / 0.18);
    g.save();
    g.translate(k.x + k.w / 2, k.y + k.h / 2 + tief * 3); g.scale(1 - tief * 0.05, 1 - tief * 0.05);
    g.globalAlpha *= hell;
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 14 - tief * 8; g.shadowOffsetY = 5 - tief * 3;
    runderKasten(g, -k.w / 2, -k.h / 2, k.w, k.h, Math.min(16, k.h / 2));
    const v = g.createLinearGradient(0, -k.h / 2, 0, k.h / 2);
    v.addColorStop(0, R_.toenen(farbe, 0.12)); v.addColorStop(1, R_.toenen(farbe, -0.12));
    g.fillStyle = v; g.fill();
    g.shadowColor = 'transparent';
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
    g.fillStyle = schrift; g.textAlign = 'center'; g.textBaseline = 'middle';
    // Schrift so groß wie möglich, aber ganz im Knopf (nicht gestaucht)
    let fs = Math.round(Math.min(k.h * 0.38, 24));
    g.font = `900 ${fs}px ${SCHRIFT}`;
    const tw = g.measureText(text).width;
    if (tw > k.w - 10) { fs = Math.max(9, Math.floor(fs * (k.w - 10) / tw)); g.font = `900 ${fs}px ${SCHRIFT}`; }
    g.fillText(text, 0, 1);
    g.restore();
  }
  function zeichneKnoepfe(g) {
    if (tag && tag.sonntag) return;
    L.knoepfe.forEach(k => {
      const a = tag && tag.leute[k.i], aktivK = knopfAktiv(a, k.art);
      knopfHell[k.id] = (knopfHell[k.id] == null ? 0.55 : knopfHell[k.id]) + ((aktivK ? 1 : 0.55) - (knopfHell[k.id] || 0.55)) * 0.2;
      const p = k.art === 'pause';
      knopf(g, k, p ? 'Pause' : k.w < 84 ? 'Ende' : 'Feierabend', p ? BLAUGRAU : F.haupt, p ? '#ffffff' : F.hauptText || R_.textFarbe(F.haupt), knopfHell[k.id], druck[k.art + k.i] || 0);
    });
  }

  // Drei Leben oben (Kreise mit Paragrafenzeichen), je Verstoß eins durchgestrichen (wie Einspruch!)
  function zeichneLeben(g, B) {
    const r = 9, y = L.lebenY, x0 = B / 2 - (2 * r + 6);
    for (let i = 0; i < MAX_VERSTOESSE; i++) {
      const weg = i < verstoesse, x = x0 + i * (2 * r + 6);
      const dx = weg && i === verstoesse - 1 && wackeln > 0 && !RUHIG ? Math.sin(wackeln * 60) * 3 : 0;
      g.save();
      g.translate(x + dx, y);
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.fillStyle = weg ? WARNUNG : 'rgba(255,255,255,.94)'; g.fill();
      g.lineWidth = 1.6; g.strokeStyle = weg ? '#ffffff' : BLAUGRAU; g.stroke();
      if (weg) { g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, -4); g.lineTo(4, 4); g.moveTo(4, -4); g.lineTo(-4, 4); g.stroke(); }
      else { g.fillStyle = BLAUGRAU; g.font = `800 13px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('§', 0, 1); }
      g.restore();
    }
  }

  // Level-Titel vor dem Spiel (wie Einspruch!): Notizzettel mit Klebestreifen, „Level 1“ in Titelfarbe, darunter der Name
  function zeichneLevelTitel(g, B, H) {
    const t = phaseT, aus = Math.max(0, (t - (DAUER.titel - DAUER.titelAus)) / DAUER.titelAus);
    const rein = RUHIG ? 1 : glatt(t / 0.45);
    const w = Math.min(B * 0.84, 400), h = w * 0.56;
    const titelFarbe = getComputedStyle(document.documentElement).getPropertyValue('--titel-farbe').trim() || F.haupt;
    g.save();
    g.globalAlpha = Math.min(1, t / 0.15) * (1 - aus);
    g.translate(B / 2, H * 0.42 - (1 - rein) * 40 - (RUHIG ? 0 : beschl(aus) * H * 0.55));
    g.rotate((-3 - (1 - rein) * 7) * Math.PI / 180);
    g.scale(1.25 - 0.25 * rein, 1.25 - 0.25 * rein);
    g.save();
    g.shadowColor = 'rgba(0,0,0,.38)'; g.shadowBlur = 24; g.shadowOffsetY = 12;
    const pap = g.createLinearGradient(0, -h / 2, 0, h / 2);
    pap.addColorStop(0, '#fffdf4'); pap.addColorStop(1, '#f7efd6');
    g.fillStyle = pap; g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
    const kt = Math.min(1, Math.max(0, (t - 0.35) / 0.2));
    if (kt > 0) {
      const kw = w * 0.34 * (0.3 + 0.7 * kt), kh = w * 0.09;
      g.save(); g.translate(0, -h / 2); g.rotate(0.07); g.globalAlpha *= kt;
      g.beginPath();
      const z = 6;
      for (let i = 0; i <= z; i++) g.lineTo(kw / 2 - (i % 2 ? kw * 0.035 : 0), -kh / 2 + kh * i / z);
      for (let i = z; i >= 0; i--) g.lineTo(-kw / 2 + (i % 2 ? kw * 0.035 : 0), -kh / 2 + kh * i / z);
      g.closePath();
      g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5;
      g.fillStyle = 'rgba(248,242,212,.92)'; g.fill();
      g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(110,98,62,.4)'; g.lineWidth = 1; g.stroke();
      g.restore();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = titelFarbe;
    g.font = `italic 700 ${w * 0.2}px Georgia, "Times New Roman", Times, serif`;
    g.fillText('Level ' + LV.nr, 0, -h * 0.1);
    g.fillStyle = F.dunkel || '#1f2a31';
    g.font = `800 ${w * 0.08}px ${SCHRIFT}`;
    g.fillText(LV.name, 0, h * 0.22, w * 0.9);
    g.restore();
  }

  function runderPfad(g, x, y, w, h, r) {
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function runderKasten(g, x, y, w, h, r) { g.beginPath(); runderPfad(g, x, y, w, h, r); }

  // ---------- Testhilfen (für Spieler unsichtbar) ----------
  // Adresse: #level=N, #tag=3 (mit Mittwoch beginnen), #plan=5,9.5,6.5,8,10 (Level 1: geplante Stunden je Tag),
  //          #frage=N (Level 2: Tag Nr. N aus daten.js zuerst; Level 3: Ruhezeit-Frage Nr. N am Dienstag, Start Dienstag),
  //          #sonntag=N (Level 3: gleich Sonntag mit Frage Nr. N), #ende=sieg-854 / #ende=verloren / #ende=frei.
  // window.__test: wertung, antwortWertung, woche, zustand, tippe('pause'|'feierabend', karte), antworte('ja'|'nein'),
  //                level(n), freischaltungZuruecksetzen(), endbild(art, wert), knoepfe (Mitten zum echten Tippen, auch ja/nein),
  //                arbeitSetzen(h, karte), uhrSetzen(h) (Level 3) – nur zum Testen
  const mitte = k => ({ x: k.x + k.w / 2, y: k.y + k.h / 2 });
  window.__test = {
    LEVEL, PERSONEN, TAGE2, RUHEZEIT, SONNTAG, VOLL, STD_SEK, DAUER, PLAN, BEGINN, FRAGE_ZEIT,
    DATEN_HINWEISE, wunschPlan, erlaubtBeiJa, wertung, antwortWertung, anteilNachAbstand, momente, stufe, bilanz, woche1, woche2, woche3, tagMomente, frei, tageszeit,
    get woche() { return woche && JSON.parse(JSON.stringify(woche)); },
    tippe: (art, i) => tippe(art, i || 0),
    antworte: a => antworte(a),
    level: n => levelWaehlen(n),
    freischaltungZuruecksetzen: () => { try { localStorage.removeItem(FREI_KEY); } catch (e) { /* privat */ } wahlAufbauen(); },
    endbild: (art, wert) => { sprungEndeArt = art; beispielEnde(art, wert); },
    arbeitSetzen: (h, i) => { const a = tag && tag.leute[i || 0]; if (a && phase === 'lauf') { a.arbeit = h; uhrAnz = echteUhr(); } },
    uhrSetzen: h => { if (!einzeln() && phase === 'lauf') { uhr = h; uhrAnz = h; } },
    get knoepfe() {
      if (!L) return null;
      const o = {};
      L.knoepfe.forEach(k => { o[k.id] = mitte(k); });
      const nm = notizMasse();
      if (nm) { o.ja = mitte(nm.ja); o.nein = mitte(nm.nein); }
      return o;
    },
    get layout() { return L; },
    get haus() { return HAUS; },
    get zustand() {
      return { level: LV.nr, phase, phaseT, tagNr, punkte: punkteJetzt(), summeAnteil, abzuege, M, verstoesse, anzahl, korrekt, unnoetig, uhr: uhrAnz,
        tag: tag && { name: tag.name, sonntag: tag.sonntag, morgen: tag.morgen && tag.morgen.nr,
          leute: tag.leute.map(a => ({ person: a.person, plan: a.plan, beginn: a.beginn, arbeit: a.arbeit, pausen: a.pausen, pausenzeit: a.pausenzeit, pauseRest: a.pauseRest,
            begonnen: a.begonnen, fertig: a.fertig, frage: a.frage && a.frage.text, stempel: a.stempel.map(s => s.art + ':' + (s.ergebnis || '') + '@' + uhrText(s.uhr)) })) },
        frage: frage && { text: frage.def.text, antwort: frage.antwort, ergebnis: frage.ergebnis, t: frage.t, richtig: frage.def.antwort },
        gewicht: Object.assign({}, gewicht) };
    },
  };
  if (/ende=verloren/.test(location.hash)) sprungEndeArt = 'verloren';

  const DEF = {
    id: LV.id,
    wertung: 'hoch',
    format: p => zahl(p) + ' Punkte',
    hoechst: 1000,
    texte: {
      titel: 'Stempeluhr',
      untertitel: 'Hältst du das Arbeitszeitgesetz ein?',
      anleitung: LV.anleitung,
    },
    klaenge: klaengeDa,
    // Musik der Sammlung (wie Frist-Alarm und Einspruch!): läuft im Startbild und endet mit „Los geht's“
    // läuft auch im Spiel weiter, dort auf 45 % abgesenkt, im Endbild wieder voll (MZ, 22.10.2026; Rahmen-Option imSpiel)
    startMusik: { datei: '../klaenge/musik.mp3', proben: 1281969, pegel: 0.22, imSpiel: 0.45 },
    neu, schritt, zeichne, runter,
  };
  R_.spiel(DEF);
  const lvHash = /level=(\d)/.exec(location.hash);
  // Vorauswahl: #level= hat Vorrang (Testhilfe, auch gesperrt), sonst das zuletzt gespielte Level, wenn es frei ist
  let zuletzt = 1;
  try { zuletzt = +localStorage.getItem(ZULETZT_KEY) || 1; } catch (e) { /* privat */ }
  if (!(zuletzt >= 1 && zuletzt <= frei())) zuletzt = 1;
  if (!levelWaehlen(lvHash ? Math.max(1, Math.min(3, +lvHash[1])) : zuletzt)) levelWaehlen(1);
})();
