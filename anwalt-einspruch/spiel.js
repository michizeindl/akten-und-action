// Einspruch! („Akten & Action“): Ein Zeuge sagt im Gerichtssaal aus, Satz für Satz in einer Sprechblase. Genau ein Satz
// stimmt nicht – der Spieler tippt auf „Einspruch!“, solange dieser Satz zu sehen ist. Level 1: Widerspruch zum
// Beweisstück, Level 2: der Zeuge widerspricht sich selbst, Level 3: gemischt, dazu ehrliche Zeugen (nicht tippen).
// 10 Zeugen pro Spiel, drei Fehler = Abbruch. Konzept MZ 22.10.2026, Auftrag des Supervisors vom 22.10.2026.
// Vorbild Frist-Alarm (Level-Wahl, Level-Titel-Zettel, Freischaltung, Endbild im Notizzettel-Stil).
(function () {
  'use strict';
  const R_ = Rahmen, F = R_.farben, K = R_.kunde;
  const SCHRIFT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const BLAUGRAU = F.blaugrau || '#475e6c';
  const WARNUNG = '#d9483b';      // Stempel „Abgelehnt“/„Widerspruch übersehen“, verlorenes Leben
  const GUT = '#3f7f2a';          // Stempel „Stattgegeben“/„Aussage glaubwürdig“ (dunkles Grün, gut lesbar)
  const TEXT = '#1c252b';
  // Weniger Bewegung gewünscht (Systemeinstellung): nur Überblenden, kein Hüpfen, Wippen oder Hereingleiten
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NBSP = ' ';

  // ---------- Inhalte ----------
  // aussagen.js (automatisch erzeugt aus Material/Texte/einspruch-level1/2/3-entwurf.md, Abgleich 300/300):
  // { nr, art: B|S|E, zeuge: M60|F35|M20|F75, beweis, etikett, saetze, falsch (Index des ✗-Satzes, -1 = ehrlich) }
  const AUSSAGEN1 = window.EINSPRUCH_AUSSAGEN1 || [], AUSSAGEN2 = window.EINSPRUCH_AUSSAGEN2 || [], AUSSAGEN3 = window.EINSPRUCH_AUSSAGEN3 || [];

  const ANLEITUNG = 'Ein Zeuge sagt aus' + NBSP + '– Satz für Satz. Tippe auf „Einspruch!“, sobald etwas nicht stimmt. Je schneller du Einspruch erhebst, desto mehr Punkte. Falsch getippt oder verpasst zählt als Fehler. Nach drei Fehlern ist das Spiel vorbei.';
  const ANLEITUNG3 = 'Ein Zeuge sagt aus' + NBSP + '– Satz für Satz. Tippe auf „Einspruch!“, sobald etwas nicht stimmt. Je schneller du Einspruch erhebst, desto mehr Punkte. Manche Zeugen sagen die Wahrheit' + NBSP + '– dann nicht tippen. Falsch getippt oder verpasst zählt als Fehler. Nach drei Fehlern ist das Spiel vorbei.';
  // Level (MZ, 22.10.2026): je 10 Zeugen, höchstens 1.000 Punkte, eigener Bestwert, nacheinander freischalten.
  // tempo: Faktor für die Satzdauer (Level 2/3 etwas zügiger). beweise: Platz für das Beweisstück oben links.
  const LEVEL = [
    { nr: 1, name: 'Beweisstück', id: 'einspruch', aussagen: AUSSAGEN1, tempo: 1, beweise: true, anleitung: ANLEITUNG },
    { nr: 2, name: 'Widersprüche', id: 'einspruch-2', aussagen: AUSSAGEN2, tempo: 0.9, beweise: false, anleitung: ANLEITUNG },
    { nr: 3, name: 'Glaubwürdig?', id: 'einspruch-3', aussagen: AUSSAGEN3, tempo: 0.9, beweise: true, anleitung: ANLEITUNG3 },
  ];
  let LV = LEVEL[0];
  const FREI_KEY = 'mg:frei:einspruch:' + (K.firma || '');
  function frei() { let f = 1; try { f = +localStorage.getItem(FREI_KEY) || 1; } catch (e) { /* privat */ } return Math.max(1, f); }
  function freischalten(n) { if (n > frei()) try { localStorage.setItem(FREI_KEY, String(n)); } catch (e) { /* privat */ } }
  const ZULETZT_KEY = 'mg:zuletzt:einspruch:' + (K.firma || '');
  function zuletztMerken() { try { localStorage.setItem(ZULETZT_KEY, String(LV.nr)); } catch (e) { /* privat */ } }
  function zuletzt() { let n = 1; try { n = +localStorage.getItem(ZULETZT_KEY) || 1; } catch (e) { /* privat */ } return n; }
  function bestwertVon(lv) { try { const b = localStorage.getItem('mg:best:' + lv.id + ':' + (K.firma || '')); return b == null ? null : +b; } catch (e) { return null; } }

  // ---------- Regeln ----------
  const ANZAHL = 10;               // Zeugen pro Spiel
  const MAX_FEHLER = 3;            // dritter Fehler = Abbruch mit 0 Punkten
  const MISCHUNG3 = { B: 4, S: 3, E: 3 };   // Level 3: Beweisstück / Selbstwiderspruch / ehrlich
  // Punkte je Zeuge (höchstens 100 × 10 = 1.000): Tipp in der ersten 1,0s des ✗-Satzes = 100, danach linear bis 40
  // am Ende des Fensters. Fenster = Dauer des ✗-Satzes (bis der nächste erscheint); ist er der letzte, 2,5s länger.
  const PUNKTE = { voll: 100, letzt: 40, vollBis: 1.0 };
  const NACH_LETZTEM = 2.5;        // ✗ ist der letzte Satz: so lange danach zählt der Tipp noch
  const NACH_EHRLICH = 1.5;        // ehrlicher Zeuge: nach dem letzten Satz noch so lange warten, dann „glaubwürdig“
  // Ablauf in Sekunden
  const DRUCK = 0.24;               // Druck-Animation des Knopfs
  const UEBERBLENDEN = 0.22;        // Satzwechsel: alter Satz blendet aus, neuer ein
  // vorlaufBeweis (MZ, 22.10.2026): Lesepause bei jeder Aussage mit Beweisstück – erst nur Beweisstück und Etikett (pulsiert
  // leicht), dann der erste Satz. Immer gleich lang (verrät nichts über die Lage des ✗-Satzes). Knopf ist dabei ausgegraut
  // („Lies das Beweisstück“), ein Tipp zählt nicht (MZ, Player-Test 22.10.2026).
  const DAUER = { titel: 2.5, titelAus: 0.4, auftritt: 0.6, vorlauf: 0.8, vorlaufBeweis: 2.0, einspruch: 0.3,
    stattgegeben: 1.7, abgelehnt: 1.9, uebersehen: 2.9, glaubwuerdig: 1.7, abgang: 0.45, pause: 0.2 };

  // Satzdauer nach Länge (Richtwert Supervisor): 1,2s + 0,045s je Zeichen, mindestens 2,0s, höchstens 3,8s; × tempo
  function satzDauer(text, lv) {
    const d = Math.max(2.0, Math.min(3.8, 1.2 + 0.045 * text.length)) * (lv || LV).tempo;
    return Math.round(d * 100) / 100;
  }
  function fenster(a, lv) {   // Länge des Fensters für den ✗-Satz
    if (a.falsch < 0) return 0;
    return satzDauer(a.saetze[a.falsch], lv) + (a.falsch === a.saetze.length - 1 ? NACH_LETZTEM : 0);
  }
  function punkteFuer(t, T) {
    if (t <= PUNKTE.vollBis) return PUNKTE.voll;
    const a = Math.min(1, (t - PUNKTE.vollBis) / Math.max(0.01, T - PUNKTE.vollBis));
    return Math.round(PUNKTE.voll + (PUNKTE.letzt - PUNKTE.voll) * a);
  }
  // Wertung eines Tipps: Satz satz (Index) ist seit t Sekunden zu sehen
  function wertung(a, satz, t, lv) {
    if (a.falsch < 0 || satz < a.falsch) return { ergebnis: 'abgelehnt', punkte: 0 };
    if (satz === a.falsch && t <= fenster(a, lv)) return { ergebnis: 'stattgegeben', punkte: punkteFuer(t, fenster(a, lv)) };
    return { ergebnis: 'uebersehen', punkte: 0 };
  }
  // Bewertungen (Vorschlag Supervisor, MZ entscheidet): gemeinsame Grenzen 900/800/700/550
  function stufe(p) {
    return p >= 900 ? 'Scharfer Verstand' : p >= 800 ? 'Gutes Gehör' : p >= 700 ? 'Solide Verteidigung' : p >= 550 ? 'Knapp entschieden' : 'Viel überhört';
  }
  function sek(t) { return t.toFixed(2).replace('.', ',') + 's'; }
  function zahl(p) { return p.toLocaleString('de-DE'); }

  function mischen(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // 10 Aussagen ohne Wiederholung; Level 3 je 4 B, 3 S, 3 E. Möglichst nicht zweimal derselbe Zeuge hintereinander.
  // erste = Nummer einer Aussage, die zuerst kommen soll (Testhilfe #zeuge=N)
  function auswahl(erste, lv) {
    lv = lv || LV;
    const fest = erste ? lv.aussagen.find(a => a.nr === erste) : null;
    const pool = mischen(lv.aussagen.filter(a => a !== fest));
    let rest;
    if (lv.nr === 3) {
      const n = Object.assign({}, MISCHUNG3);
      if (fest) n[fest.art]--;
      rest = [];
      ['B', 'S', 'E'].forEach(k => rest.push(...pool.filter(a => a.art === k).slice(0, Math.max(0, n[k]))));
    } else rest = pool.slice(0, ANZAHL - (fest ? 1 : 0));
    let liste = null;
    for (let v = 0; v < 300; v++) {
      liste = (fest ? [fest] : []).concat(mischen(rest.slice()));
      if (liste.every((a, i) => !i || a.zeuge !== liste[i - 1].zeuge)) break;
    }
    return liste;
  }

  // ---------- Bilder ----------
  // saal.webp 1024×1536 (einspruch-gerichtssaal.png, Akte vorn #00FF00 → Kundenfarbe), auch Hintergrund des Startbilds.
  // Zeugenstand rechts im Bild (Bildpixel): Oberkante ca. y 750, Front x 614–990, unten y 990–1036.
  // zeuge-*.webp: aus einspruch-zeugen-saal.png freigestellt (Hintergrund mit Verlauf geschätzt; gleicher Maßstab,
  // unten alle auf Höhe der Oberschenkel, Bildzeile 899).
  // Im Saal mit Faktor 0,40 gezeichnet (gegenüber natürlich ca. 0,36 etwas größer, damit gut erkennbar),
  // Mitte x 870, Unterkante y 850 (hinter dem Zeugenstand, der die untere Hälfte verdeckt).
  // beweise.webp: 31 Beweisbeutel (Zeile 6: BAUSTELLE aus einspruch-beweis-baustelle.png, 22.10.2026) (freigestellt, Folie durchscheinend) aus einspruch-beweise(-2…-5).png, je 250 px hoch.
  // ende-sieg/ende-verloren.webp: Hälften von einspruch-ende.png (834×941 bzw. 834×941), Akte #00FF00 umfärben.
  const BILD = {};
  function laden(name, datei, faerben, fertig) {
    const img = new Image();
    img.onload = () => { BILD[name] = faerben ? R_.umfaerben(img) : img; if (fertig) fertig(BILD[name]); };
    img.src = datei;
  }
  if (R_.zettel) laden('saal', 'bilder/saal.webp', true, c => R_.schirmBild('start', c.toDataURL('image/jpeg', 0.86), '40% 50%'));
  else laden('saal', 'bilder/saal.webp', true);
  // Zeugen nach dem Laden an den Saal angleichen und ihren Schlagschatten vorbereiten (MZ, 22.10.2026)
  ['M60', 'F35', 'M20', 'F75'].forEach(z => laden(z, 'bilder/zeuge-' + z.toLowerCase() + '.webp', false, img => {
    BILD[z] = angleichen(img); BILD[z + ':schatten'] = schattenBild(BILD[z]);
  }));
  laden('beweise', 'bilder/beweise.webp', false);
  // Richterin (MZ, 22.10.2026): drei Gesichtsausdrücke aus einspruch-richterin.png, freigestellt und an Augen/Brille
  // aufeinander ausgerichtet (gleiche Größe 511×606), Kanten weich, minimal abgedunkelt (sitzt weiter hinten)
  ['neutral', 'zustimmend', 'skeptisch'].forEach(n => laden('richter-' + n, 'bilder/richterin-' + n + '.webp', false, img => {
    const c = angleichen(img), x = c.getContext('2d');
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(30,20,10,.08)'; x.fillRect(0, 0, c.width, c.height);
    BILD['richter-' + n] = c;
  }));
  laden('sieg', 'bilder/ende-sieg.webp', true);
  laden('verloren', 'bilder/ende-verloren.webp', true);
  const SAAL = { b: 1024, h: 1536 };
  const STAND = [[614, 754], [640, 748], [990, 751], [992, 760], [990, 1036], [800, 1036], [614, 992]];   // Umriss Zeugenstand
  // faktor 0,40 (MZ, 22.10.2026; vorher 0,45): etwas kleiner, Gesicht im Hochformat noch gut erkennbar
  const STAND_OBEN = 750, ZEUGE = { x: 870, unten: 850, faktor: 0.40 };
  // Zeuge an den Saal angleichen: Licht und Farbe stecken seit 22.10.2026 im Bild (einspruch-zeugen-saal.png, Tageslicht
  // von links, warm) – die frühere Farbangleichung (wärmer, Sättigung/Kontrast, Links-rechts-Verlauf) ist zurückgenommen
  // (MZ). Geblieben: Kanten ca. 1 px weich, damit die Figur nicht ausgeschnitten wirkt.
  function angleichen(img) {
    const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    // Kanten weich: Deckkraft mit einer leicht weichgezeichneten Kopie multiplizieren (innen bleibt alles voll deckend)
    if ('filter' in x) {
      const m = document.createElement('canvas'); m.width = w; m.height = h;
      const mx = m.getContext('2d'); mx.filter = 'blur(1px)'; mx.drawImage(c, 0, 0);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-over';
    }
    return c;
  }
  // Schlagschatten des Zeugen (weiche, dunkelbraune Silhouette), RAND = Platz für die Unschärfe in Bildpixeln
  const SCHATTEN_RAND = 40;
  function schattenBild(c) {
    const R = SCHATTEN_RAND, w = c.width + 2 * R, h = c.height + 2 * R, s = document.createElement('canvas');
    s.width = w; s.height = h;
    const x = s.getContext('2d');
    x.shadowColor = 'rgb(48,28,10)'; x.shadowBlur = 16; x.shadowOffsetX = w;   // nur der Schatten landet im Bild
    x.drawImage(c, R - w, R);
    return s;
  }
  const zeugeLeinwand = document.createElement('canvas'), zg = zeugeLeinwand.getContext('2d');

  // ---------- Richterin auf der Richterbank (MZ, 22.10.2026) ----------
  // Saal: mittlerer Richterstuhl x 502–576, Oberkante y 591, Oberkante der Richterbank y 649 (verdeckt Hände und Tisch).
  // Bild: Stuhl-Oberkante bei y 269, Mitte x 255,5, Hals (Drehpunkt fürs Kopfschütteln) bei y 251.
  // Maßstab 0,218: ihr Stuhl deckt den Stuhl im Saal, deutlich kleiner als der Zeuge (sie sitzt weiter hinten).
  const RICHTER = { x: 539, stuhl: 591, bank: 649, faktor: 0.218, stuhlBild: 269, mitteBild: 255.5, halsBild: 251 };
  // Ausdruck: neutral; Urteil gut → zustimmend + Nicken, schlecht → skeptisch + Kopfschütteln (0,6s), nach 1,8s wieder neutral
  const richter = { ausdruck: 'neutral', vorher: 'neutral', wechsel: 1, art: null, t: 9, sicht: 1 };
  const RICHTER_WECHSEL = 0.35, RICHTER_BEWEGUNG = 0.6, RICHTER_ZURUECK = 1.8;
  function richterAusdruck(n) { if (n === richter.ausdruck) return; richter.vorher = richter.ausdruck; richter.ausdruck = n; richter.wechsel = 0; }
  function richterReaktion(art) {
    const gut = art === 'stattgegeben' || art === 'glaubwuerdig';
    richterAusdruck(gut ? 'zustimmend' : 'skeptisch');
    richter.art = gut ? 'nicken' : 'schuetteln'; richter.t = 0;
  }
  const richterLeinwand = document.createElement('canvas'), rg = richterLeinwand.getContext('2d');
  function zeichneRichterin(g, dt) {
    const neu = BILD['richter-' + richter.ausdruck], alt = BILD['richter-' + richter.vorher];
    if (!neu) return;
    // vom Beweisstück-Etikett verdeckt (nur kleine Querformate, Aussagen mit Beweisstück): weich ausblenden statt halb verdeckt
    const ziel = L.richterVerdeckt && aussage && aussage.beweis && phase !== 'titel' ? 0 : 1;
    richter.sicht += Math.sign(ziel - richter.sicht) * Math.min(Math.abs(ziel - richter.sicht), dt / 0.35);
    if (richter.sicht <= 0.001) { richter.t += dt; return; }
    richter.t += dt; richter.wechsel = Math.min(1, richter.wechsel + dt / RICHTER_WECHSEL);
    if (richter.art && richter.t > RICHTER_ZURUECK) { richter.art = null; richterAusdruck('neutral'); }
    const s = L.s, k = RICHTER.faktor * s, w = neu.width * k, h = neu.height * k;
    const [cx, stuhlY] = L.P(RICHTER.x, RICHTER.stuhl), bankY = L.P(0, RICHTER.bank)[1];
    const oben = stuhlY - RICHTER.stuhlBild * k, links = cx - RICHTER.mitteBild * k;
    // Bewegung: Nicken (2× ca. 3,5 px nach unten) bzw. Kopfschütteln (2× ±2,5° um den Hals), danach Ruhe
    let dy = 0, dreh = 0;
    const tb = richter.t / RICHTER_BEWEGUNG;
    if (!RUHIG && richter.art && tb < 1) {
      if (richter.art === 'nicken') dy = 3.5 * (0.5 - 0.5 * Math.cos(tb * Math.PI * 4));
      else dreh = 2.5 * Math.PI / 180 * Math.sin(tb * Math.PI * 4) * (1 - tb * 0.5);
    }
    const atmen = RUHIG ? 1 : 1 + 0.004 * Math.sin(performance.now() / 1000 * 1.7 + 1);
    // Ausdrücke überblenden (neu über alt, beide deckungsgleich ausgerichtet) und Kontaktschatten an der Bankkante,
    // zusammen auf einer kleinen Leinwand, dann hinter der Bankkante abgeschnitten zeichnen
    const dpr = g.getTransform().a, tw = Math.max(1, Math.ceil(w * dpr)), th = Math.max(1, Math.ceil(h * dpr));
    if (richterLeinwand.width !== tw || richterLeinwand.height !== th) { richterLeinwand.width = tw; richterLeinwand.height = th; }
    else rg.clearRect(0, 0, tw, th);
    rg.globalCompositeOperation = 'source-over'; rg.globalAlpha = 1;
    if (richter.wechsel < 1 && alt) rg.drawImage(alt, 0, 0, tw, th);
    rg.globalAlpha = richter.wechsel < 1 && alt ? glatt(richter.wechsel) : 1;
    rg.drawImage(neu, 0, 0, tw, th);
    rg.globalAlpha = 1;
    const kante = (bankY - oben - dy) / h * th, band = 22 * s / h * th;
    rg.globalCompositeOperation = 'source-atop';
    const v = rg.createLinearGradient(0, kante - band, 0, kante);
    v.addColorStop(0, 'rgba(34,20,8,0)'); v.addColorStop(1, 'rgba(34,20,8,.5)');
    rg.fillStyle = v; rg.fillRect(0, kante - band, tw, th - kante + band);
    g.save();
    g.beginPath(); g.rect(0, 0, 1e5, bankY); g.clip();   // Richterbank verdeckt alles unterhalb ihrer Oberkante
    const hx = cx, hy = oben + RICHTER.halsBild * k + dy;
    g.translate(hx, hy); g.rotate(dreh); g.translate(-hx, -hy);
    g.translate(0, dy);
    g.translate(cx, bankY); g.scale(1, atmen); g.translate(-cx, -bankY);
    g.globalAlpha = richter.sicht;
    g.drawImage(richterLeinwand, links, oben, w, h);
    g.restore();
  }
  const ZEUGE_MAX_H = 678;           // höchster Zuschnitt (M20) in Pixeln
  const KOPF_OBEN = ZEUGE.unten - ZEUGE_MAX_H * ZEUGE.faktor;   // ≈ 542: oberster Kopf im Saal
  // Lage der Beutel in beweise.webp: [x, y, Breite, Höhe]
  const BEWEIS = {"NACHT": [2, 2, 163, 250], "UHR": [198, 2, 108, 250], "PARK": [369, 2, 101, 250], "HANDY": [524, 2, 127, 250], "BUS": [703, 2, 105, 250], "NOTIZ": [857, 2, 133, 250], "BON": [38, 256, 92, 250], "KARTE": [201, 256, 102, 250], "KALENDER": [347, 256, 145, 250], "BRIEF": [521, 256, 133, 250], "RECHNUNG": [690, 256, 131, 250], "ATTEST": [859, 256, 129, 250], "KONTO": [10, 510, 147, 250], "TICKET": [205, 510, 93, 250], "ZEITUNG": [358, 510, 123, 250], "MIETVERTRAG": [519, 510, 138, 250], "LIEFERSCHEIN": [695, 510, 121, 250], "STRAFZETTEL": [869, 510, 110, 250], "WOHNUNG": [24, 764, 119, 250], "GARTEN": [196, 764, 112, 250], "BLITZ": [364, 764, 112, 250], "KAMERA": [532, 764, 112, 250], "AUTOTUER": [699, 764, 113, 250], "RISS": [865, 764, 117, 250], "SCHLUESSEL": [22, 1018, 123, 250], "BRILLE": [197, 1018, 110, 250], "SCHIRM": [368, 1018, 104, 250], "SPRAY": [539, 1018, 98, 250], "SCHLOSS": [677, 1018, 158, 250], "LAMPE": [874, 1018, 100, 250], "BAUSTELLE": [21, 1272, 126, 250]};
  const endBildAdresse = {};
  function endBild(name) {
    if (!endBildAdresse[name] && BILD[name]) endBildAdresse[name] = BILD[name].toDataURL('image/jpeg', 0.86);
    return endBildAdresse[name];
  }

  // ---------- Klänge ----------
  // Auswahl Sound Artist (Anwalt-Game/Material/Texte/einspruch-klaenge.md, 22.10.2026), Quellen in Material/Sounds/quellen.txt.
  // sieg/niederlage: vorerst die Klänge von Frist-Alarm (Platzhalter). Fehlt eine Datei (da: false), spielt der Ersatzton.
  const KLAENGE = {
    satz: { datei: 'klaenge/satz.mp3', proben: 5954, pegel: 0.12, da: true },              // neuer Satz, sehr leise
    einspruch: { datei: 'klaenge/einspruch.mp3', proben: 7276, pegel: 0.5, da: true },     // Knopfdruck
    stattgegeben: { datei: 'klaenge/stattgegeben.mp3', proben: 12789, pegel: 0.45, da: true },
    abgelehnt: { datei: 'klaenge/abgelehnt.mp3', proben: 14332, pegel: 0.6, da: true },     // sehr tief: etwas lauter
    uebersehen: { datei: 'klaenge/uebersehen.mp3', proben: 8820, pegel: 0.42, da: true },   // ca. −6 dB gegenüber abgelehnt
    glaubwuerdig: { datei: 'klaenge/glaubwuerdig.mp3', proben: 16317, pegel: 0.45, da: true },
    sieg: { datei: 'klaenge/sieg.wav', pegel: 0.45, da: true },
    niederlage: { datei: 'klaenge/niederlage.wav', pegel: 0.45, da: true },
    murmeln: { datei: 'klaenge/murmeln.mp3', proben: 551250, pegel: 0.11, da: true },      // leiser Saal als Schleife (0,11: Musik läuft jetzt im Spiel mit)
  };
  const ERSATZ = { satz: 'klick', einspruch: 'klick', stattgegeben: 'gut', abgelehnt: 'fehler', uebersehen: 'fehler', glaubwuerdig: 'gut', sieg: 'sieg', niederlage: 'fehler' };
  function klang(name) { R_.ton(KLAENGE[name] && KLAENGE[name].da ? name : ERSATZ[name]); }
  const klaengeDa = {};
  Object.keys(KLAENGE).forEach(n => { if (KLAENGE[n].da) klaengeDa[n] = KLAENGE[n]; });

  // ---------- Zustand ----------
  let liste, nr, phase, phaseT, aussage, satz, satzT, dauern, punkte, richtigAnz, fehler, reaktionen, urteil, verlauf,
    wackeln, druck, sprungEnde, titelTon = false, sprungEndeArt = '', gesamtT = 0, vorSatz = -1;

  function neu() {
    if (R_.zustand === 'spiel') zuletztMerken();   // nur beim echten Start (neu() läuft auch beim Anmelden)
    const h = location.hash;
    const m = /zeuge=(\d+)/.exec(h), ab = /ab=(\d+)/.exec(h);
    liste = auswahl(m ? +m[1] : 0);
    nr = ab ? Math.max(0, Math.min(ANZAHL - 1, +ab[1] - 1)) : 0;   // #ab=10: gleich mit dem 10. Zeugen beginnen
    sprungEnde = /ende=([a-z]+)(?:-(\d+))?/.exec(h) || null;
    phase = 'titel'; phaseT = 0; aussage = null; titelTon = false;
    richter.ausdruck = richter.vorher = 'neutral'; richter.wechsel = 1; richter.art = null;
    punkte = 0; richtigAnz = 0; fehler = 0; reaktionen = []; urteil = null; verlauf = []; wackeln = 0; druck = 0; gesamtT = 0;
    anzeigen();
  }
  function anzeigen() {
    if (R_.zustand !== 'spiel') return;
    // schmale Bildschirme: der Rahmen setzt Spielstand und Punkte zweizeilig (Zettel-Stil), daher wieder voll „350 Punkte“
    R_.anzeige(`Zeuge ${Math.min(nr + 1, ANZAHL)}/${ANZAHL}`, zahl(punkte) + ' Punkte');
  }
  function naechsterZeuge() {
    aussage = liste[nr];
    dauern = aussage.saetze.map(s => satzDauer(s));
    satz = -1; vorSatz = -1; satzT = 0; urteil = null;
    phase = 'auftritt'; phaseT = 0;
    anzeigen();
  }
  function satzWeiter() {
    vorSatz = satz; satz++; satzT = 0;
    klang('satz');
  }
  // Ende der Aussage nach dem letzten Satz: ehrlich +1,5s, ✗ als letzter Satz +2,5s
  function nachLetztem() { return aussage.falsch < 0 ? NACH_EHRLICH : aussage.falsch === aussage.saetze.length - 1 ? NACH_LETZTEM : 0; }

  function schritt(dt) {
    phaseT += dt; gesamtT += dt;
    wackeln = Math.max(0, wackeln - dt);
    druck = Math.max(0, druck - dt);
    if (sprungEnde) { beispielEnde(sprungEnde[1], sprungEnde[2]); sprungEnde = null; return; }
    if (phase === 'titel') {
      if (!titelTon) { titelTon = true; klang('satz'); }
      if (phaseT > DAUER.titel) naechsterZeuge();
    } else if (phase === 'auftritt' && phaseT > DAUER.auftritt) { phase = 'vorlauf'; phaseT = 0; }
    else if (phase === 'vorlauf' && phaseT > (aussage.beweis ? DAUER.vorlaufBeweis : DAUER.vorlauf)) { phase = 'rede'; phaseT = 0; satzWeiter(); }
    else if (phase === 'rede') {
      satzT += dt;
      const letzter = satz === aussage.saetze.length - 1;
      const bis = dauern[satz] + (letzter ? nachLetztem() : 0);
      if (satzT >= bis) {
        if (satz === aussage.falsch) entscheiden('uebersehen', 0);        // Fenster vorbei: verpasst
        else if (letzter) entscheiden('glaubwuerdig', 100);              // ehrlicher Zeuge, nicht getippt
        else satzWeiter();
      }
    } else if (phase === 'einspruch' && phaseT > DAUER.einspruch) { phase = 'urteil'; phaseT = 0; urteilKlang(); }
    else if (phase === 'urteil' && phaseT > DAUER[urteil.art]) {
      if (fehler >= MAX_FEHLER) return abbruch();
      phase = 'abgang'; phaseT = 0;
    } else if (phase === 'abgang' && phaseT > DAUER.abgang) { phase = 'pause'; phaseT = 0; }
    else if (phase === 'pause' && phaseT > DAUER.pause) {
      nr++;
      if (nr >= ANZAHL) return geschafft();
      naechsterZeuge();
    }
  }

  // Tipp auf „Einspruch!“ (Knopf oder Leertaste/Eingabetaste)
  function einspruch() {
    if (phase !== 'rede') return false;   // auch in der Lesepause: Tippen zählt nicht (MZ, Player-Test 22.10.2026)
    druck = DRUCK;
    klang('einspruch');
    const w = wertung(aussage, satz, satzT);
    if (w.ergebnis === 'stattgegeben') reaktionen.push(satzT);
    entscheiden(w.ergebnis, w.punkte, true);
    return true;
  }
  function entscheiden(art, p, getippt) {
    punkte += p;
    if (art === 'stattgegeben' || art === 'glaubwuerdig') richtigAnz++;
    else { fehler++; wackeln = 0.4; R_.vibrieren(art === 'abgelehnt' ? 60 : [80, 60, 80]); }
    // angezeigter Satz: übersehen → der ✗-Satz noch einmal hervorgehoben (Lerneffekt); stattgegeben → ✗-Satz markiert
    const zeige = art === 'uebersehen' || art === 'stattgegeben' ? aussage.falsch : satz;   // -1 = noch kein Satz (Lesepause)
    urteil = { art, punkte: p, zeige, markiert: art === 'uebersehen' ? 'schlecht' : art === 'stattgegeben' ? 'gut' : null };
    verlauf.push({ nr: aussage.nr, art: aussage.art, ergebnis: art, satz, zeit: Math.round(satzT * 100) / 100, punkte: p });
    if (getippt) { phase = 'einspruch'; phaseT = 0; }
    else { phase = 'urteil'; phaseT = 0; urteilKlang(); }
    anzeigen();
  }
  function urteilKlang() { klang(urteil.art); richterReaktion(urteil.art); }

  // ---------- Level-Wahl im Startbild (wie Frist-Alarm) ----------
  const SCHLOSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const stil = document.createElement('style');
  stil.textContent = `
    .levelwahl { display: flex; gap: 6px; margin: 0 0 12px; }
    .levelwahl button { flex: 1 1 0; min-width: 0; padding: 6px 4px 5px; border-radius: 8px; border: 2px solid rgba(0,0,0,.15);
      background: rgba(255,255,255,.55); color: inherit; font: inherit; cursor: pointer; line-height: 1.15; }
    .levelwahl button.aktiv { border-color: var(--haupt); background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .levelwahl button:disabled { cursor: default; opacity: .45; filter: grayscale(1); }
    .levelwahl b { display: block; font-size: 14px; font-weight: 900; }
    .levelwahl span { display: block; font-size: 11.5px; font-weight: 600; opacity: .8; line-height: 1.15; white-space: normal; }   /* vollständig, notfalls zweizeilig (QA/MZ) */
    .levelwahl small { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; opacity: .75; }
    .levelwahl svg { width: 12px; height: 12px; vertical-align: -1px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
    @media (max-width: 340px) { .levelwahl button { padding-left: 1px; padding-right: 1px; } .levelwahl span { font-size: 10.5px; } }   /* „Glaubwürdig?“ einzeilig auch bei 320 px */
    /* kleine Handys hochkant (z. B. 320×640): engere Abstände im Startbild, damit „Zum Menü“ ohne Scrollen sichtbar ist –
       Schriftgrößen unverändert, andere Größen nicht betroffen (MZ, 22.10.2026) */
    @media (orientation: portrait) and (max-width: 340px) and (max-height: 700px) {
      .stil-zettel #startSchirm { padding-top: 8px; }
      .stil-zettel #startSchirm .zettel { margin: 18px 0 10px; padding: 24px 22px 14px; }
      .stil-zettel #startSchirm .titel { margin-bottom: 6px; }
      .stil-zettel #startSchirm .unter { margin-bottom: 8px; }
      .stil-zettel #startSchirm .anleitung { margin-bottom: 10px; }
      .levelwahl { margin-bottom: 8px; }
      .stil-zettel #startSchirm .knoepfe { gap: 8px; }
    }
    @media (max-height: 400px) { .levelwahl { margin-bottom: 6px; } .levelwahl button { padding: 3px 3px; } .levelwahl b { font-size: 12.5px; } .levelwahl span { display: none; } }`;
  document.head.append(stil);
  const wahl = document.createElement('div');
  wahl.className = 'levelwahl';
  function wahlAufbauen() {
    wahl.textContent = '';
    LEVEL.forEach(lv => {
      const b = document.createElement('button');
      b.type = 'button';
      const spielbar = lv.nr <= frei();
      b.disabled = !spielbar;
      b.classList.toggle('aktiv', lv === LV);
      const unter = spielbar ? zahl(bestwertVon(lv) || 0) + ' Pkt.' : SCHLOSS + ' nach Level ' + (lv.nr - 1);
      b.innerHTML = `<b>Level ${lv.nr}</b><span>${lv.name}</span><small>${unter}</small>`;
      b.setAttribute('aria-label', 'Level ' + lv.nr + ' – ' + lv.name + (spielbar ? '' : ' (gesperrt)'));
      if (spielbar) b.addEventListener('click', () => { levelWaehlen(lv.nr); R_.ton('klick'); });
      wahl.append(b);
    });
  }
  function levelWaehlen(n) {
    LV = LEVEL[n - 1];
    DEF.id = LV.id;          // eigener Bestwert je Level
    Lschluessel = '';        // Aufteilung neu (Platz für das Beweisstück)
    wahlAufbauen();
    R_.startbildAktualisieren({ anleitung: LV.anleitung });
  }
  R_.startElement(wahl);

  function dach() { return 'Level ' + LV.nr + NBSP + '– ' + LV.name; }
  function zusatz() { return reaktionen.length ? 'Ø ' + sek(reaktionen.reduce((a, b) => a + b, 0) / reaktionen.length) : ''; }
  function geschafft() {
    phase = 'fertig';
    const p = Math.max(1, Math.min(1000, punkte));   // wer alle 10 schafft, bekommt mindestens 1 Punkt
    klang('sieg');
    const naechstes = LEVEL[LV.nr];
    const neuFrei = naechstes && frei() < naechstes.nr;
    if (neuFrei) freischalten(naechstes.nr);
    // „Weiter zu Level N“ nach jedem geschafften Level, sobald N frei ist; Hinweis nur beim ersten Freischalten (MZ, 22.10.2026)
    const weiter = naechstes && frei() >= naechstes.nr;
    R_.ende(p, {
      dach: dach(), ueberschrift: stufe(p), zusatz: zusatz(), zeile: bilanz(null, null, true),
      hinweis: neuFrei ? 'Level ' + naechstes.nr + ' freigeschaltet' : '',
      extraKnopf: weiter ? { text: 'Weiter zu Level ' + naechstes.nr, klick: () => levelWaehlen(naechstes.nr) } : null,
      text: K.spruch || '', bild: endBild('sieg'), verzoegerung: 500,
    });
    wahlAufbauen();
  }
  function abbruch() {
    phase = 'fertig';
    klang('niederlage');
    R_.ende(0, { dach: dach(), ueberschrift: 'Einspruch abgelehnt', wert: bilanz(), bild: endBild('verloren'), text: '', verzoegerung: 300, nochmalZuerst: true });
  }
  // Bilanz, z. B. „8 von 10 Aussagen richtig bewertet – 2 Fehler“; Verlierer mit Zeilenumbruch nach dem Gedankenstrich
  function bilanz(richtig, f, einzeilig) {
    const r = richtig != null ? richtig : richtigAnz, n = f != null ? f : fehler;
    const ft = n === 0 ? 'keine Fehler' : n === 1 ? '1 Fehler' : n + ' Fehler';
    return `${r} von ${ANZAHL} Aussagen richtig bewertet${NBSP}–${einzeilig ? ' ' : '\n'}${ft}`;
  }
  // Beispiel-Endbilder (#ende=sieg-854, #ende=verloren, #ende=frei) – schreiben wie ein echtes Spiel den Bestwert
  function beispielEnde(art, wert) {
    phase = 'fertig';
    if (art === 'verloren') R_.ende(0, { dach: dach(), ueberschrift: 'Einspruch abgelehnt', wert: bilanz(5, 3), bild: endBild('verloren'), text: '', verzoegerung: 0, nochmalZuerst: true });
    else {
      const nx = LV.nr + 1, p = wert ? +wert : 854, f = art === 'frei' && LV.nr < LEVEL.length, w = f || (LV.nr < LEVEL.length && frei() >= nx);
      R_.ende(p, { dach: dach(), ueberschrift: stufe(p), zusatz: 'Ø 1,24s', zeile: bilanz(9, 1, true), text: K.spruch || '', bild: endBild('sieg'), verzoegerung: 0,
        hinweis: f ? 'Level ' + nx + ' freigeschaltet' : '', extraKnopf: w ? { text: 'Weiter zu Level ' + nx, klick: () => levelWaehlen(nx) } : null });
    }
  }

  // ---------- Aufteilung des Bildschirms ----------
  // Hintergrund (Saal) wird gezoomt: Zeugenstand rechts, darüber der Zeuge. Hochformat: oben Beweisstück (Beutel + Etikett),
  // darunter die Sprechblase über dem Kopf des Zeugen, unten der Knopf. Querformat: Zeuge rechts, links Beweisstück und
  // Sprechblase (Spitze nach rechts), Knopf darunter. Der Stempel landet auf der Front des Zeugenstands (nie über dem Text).
  let L = null, Lschluessel = '';
  const begrenzen = (v, a, b) => Math.max(a, Math.min(b, v));
  function aufteilen(B, H) {
    const quer = B > H * 1.05, breit = B >= 560;
    const lebenY = breit ? 24 : 60, oben = breit ? 54 : 76;
    const kh = begrenzen(H * 0.085, 46, 70);
    const ky = H - kh - begrenzen(H * 0.03, 12, 26);
    const ZH = STAND_OBEN - KOPF_OBEN;      // sichtbare Höhe des größten Zeugen über dem Stand (Bildpixel)
    let s, ox, oy, eh, blase, spalte, beweis = null, richterVerdeckt = false;
    if (!quer) {
      s = Math.max(B / SAAL.b, H / SAAL.h, B / 560);
      eh = LV.beweise ? begrenzen(H * 0.14, 74, 120) : 0;
      const bhMin = begrenzen(H * 0.16, 92, 150);
      const kopf = oben + (eh ? eh + 12 : 0) + bhMin + 24;
      const ys = Math.max(kopf + ZH * s, H * 0.55);
      ox = begrenzen(B * 0.64 - ZEUGE.x * s, B - SAAL.b * s, 0);
      oy = begrenzen(ys - STAND_OBEN * s, H - SAAL.h * s, 0);
      const cw = Math.min(B - 24, 620);
      spalte = { x: (B - cw) / 2, w: cw };
      const kopfY = KOPF_OBEN * s + oy, unten = kopfY - 24, obenB = oben + (eh ? eh + 12 : 0);
      const bh = Math.min(unten - obenB, Math.max(bhMin, 170));
      blase = { x: spalte.x, y: unten - bh, w: cw, h: bh, seite: 'unten' };
      // Hochformat: Beutel links, Etikett rechts daneben (gleiche Höhe)
      if (eh) { const bw = eh * 0.62; beweis = { beutel: { x: spalte.x + 4, y: oben, w: bw, h: eh }, etikett: { x: spalte.x + 4 + bw + 12, y: oben, w: cw - 4 - bw - 12, h: eh } }; }
    } else {
      s = Math.max(B / SAAL.b, H / SAAL.h, H * 0.36 / ZH);
      ox = begrenzen(B * 0.77 - ZEUGE.x * s, B - SAAL.b * s, 0);
      const ys = Math.max(oben + 12 + ZH * s, H * 0.62);
      oy = begrenzen(ys - STAND_OBEN * s, H - SAAL.h * s, 0);
      eh = LV.beweise ? begrenzen(H * 0.2, 60, 110) : 0;
      const zeugeLinks = (ZEUGE.x - 80) * s + ox, rechts = zeugeLinks - 26;
      let cw = Math.min(rechts - 16, 620);
      spalte = { x: rechts - cw, w: cw };
      // Querformat mit Beweisstück (QA, MZ 22.10.2026): Beutel groß in einer eigenen Spalte links (ganz sichtbar, nicht
      // unter Etikett oder Haus-Knopf), rechts daneben oben das Etikett, darunter die Sprechblase
      let bx = spalte.x, bwid = cw, gross = false;
      // Große Querformate (QA, MZ 22.10.2026, z. B. 1280×800, 1920×1080): Beutel und – darunter – ein größeres Etikett ganz
      // links oben, links neben der Richterin; die Sprechblase bleibt beim Zeugen und nutzt die volle Spaltenbreite
      const richterL0 = (539 - 45) * s + ox;
      if (eh && B >= 1000) {
        const hbG = begrenzen(H * 0.3, 200, 320), wbG = hbG * 0.55, ewG = Math.min(400, richterL0 - 12 - 16);
        const ehG = begrenzen(H * 0.17, 90, 170);
        // Spalte für Sprechblase und Knopf rückt bei Bedarf nach rechts (bleibt mindestens 360 px breit)
        const spalteMin = 16 + ewG + 12;
        if (ewG >= 260 && oben + hbG + 14 + ehG <= ky - 12 && rechts - Math.max(spalte.x, spalteMin) >= 360) {
          if (spalte.x < spalteMin) { cw = rechts - spalteMin; spalte = { x: spalteMin, w: cw }; }
          bx = spalte.x; bwid = cw;
          beweis = { beutel: { x: 16, y: oben, w: wbG, h: hbG }, etikett: { x: 16, y: oben + hbG + 14, w: ewG, h: ehG, gross: true } };
          gross = true;
        }
      }
      if (eh && !gross) {
        const hb = Math.min(ky - 12 - oben, 250, cw * 0.36 / 0.55), wb = hb * 0.55;
        beweis = { beutel: { x: spalte.x, y: oben, w: wb, h: hb }, etikett: { x: spalte.x + wb + 14, y: oben, w: cw - wb - 14, h: eh } };
        bx = spalte.x + wb + 14; bwid = cw - wb - 14;
      }
      let obenB = oben + (eh && !gross ? eh + 10 : 0);
      const untenB = ky - 12;
      // Richterin auf der Richterbank sichtbar lassen (MZ, 22.10.2026): Sprechblase erst unterhalb der Bankkante, wenn
      // darunter genug Platz bleibt; das Etikett endet links vor ihr, wenn es dann noch breit genug ist
      const bankY = 649 * s + oy, richterL = (539 - 45) * s + ox, richterR = (539 + 45) * s + ox;
      if (bankY + 10 > obenB && untenB - (bankY + 10) >= 100 && richterR > bx && richterL < bx + bwid) obenB = bankY + 10;
      if (beweis && !gross && richterL - 10 - beweis.etikett.x >= 170 && richterL < beweis.etikett.x + beweis.etikett.w) beweis.etikett.w = richterL - 10 - beweis.etikett.x;
      // bleibt das Etikett trotzdem über ihr (kleine Querformate), wird sie bei Aussagen mit Beweisstück ausgeblendet (MZ)
      if (beweis) {
        const e = beweis.etikett, kopfY = (532 + 40) * s + oy;   // Augenhöhe: Etikett darüber stört nicht
        const u = beweis.beutel;   // auch der Beutel darf nicht vor ihrem Gesicht hängen
        richterVerdeckt = (e.x < richterR && e.x + Math.min(e.w, 330) > richterL && e.y < bankY && e.y + e.h > kopfY) ||
          (u.x < richterR && u.x + u.w > richterL && u.y < kopfY + 60 * s && u.y + u.h > kopfY - 40 * s);
      }
      const bh = Math.min(untenB - obenB, 200);
      blase = { x: bx, y: obenB + (untenB - obenB - bh) * 0.3, w: bwid, h: bh, seite: 'rechts' };
    }
    const kw = Math.min(spalte.w, quer ? 300 : 340);
    const knopf = { x: quer ? spalte.x + (spalte.w - kw) / 2 : (B - kw) / 2, y: ky, w: kw, h: kh };
    const P = (x, y) => [x * s + ox, y * s + oy];
    // Stempelfläche: sichtbare Front des Zeugenstands, im Querformat rechts neben der Sprechblase
    let sx0 = Math.max(P(620, 0)[0], 8), sx1 = Math.min(P(985, 0)[0], B - 8);
    if (quer) sx0 = Math.max(sx0, blase.x + blase.w + 8);
    const sy0 = P(0, 765)[1], sy1 = Math.min(P(0, 1000)[1], ky - 8);
    return {
      quer, s, ox, oy, P, lebenY, knopf, blase, spalte, richterVerdeckt,
      beweis,
      stempel: { x: (sx0 + sx1) / 2, y: sy0 + Math.max(0, sy1 - sy0) * 0.4, w: Math.max(80, sx1 - sx0), h: Math.max(40, sy1 - sy0) },
    };
  }

  // Text auf Zeilenbreite umbrechen (lange Wörter dürfen notfalls überstehen)
  function umbrechen(g, text, breite) {
    const zeilen = []; let zeile = '';
    for (const wort of text.split(' ')) {
      const probe = zeile ? zeile + ' ' + wort : wort;
      if (g.measureText(probe).width <= breite || !zeile) zeile = probe;
      else { zeilen.push(zeile); zeile = wort; }
    }
    if (zeile) zeilen.push(zeile);
    return zeilen;
  }

  // ---------- Eingabe ----------
  function runter(x, y) {
    if (!L) return;
    if (phase === 'titel') { phaseT = Math.max(phaseT, DAUER.titel - DAUER.titelAus); return; }   // Tippen überspringt den Titel
    const k = L.knopf, r = 10;
    if (x >= k.x - r && x <= k.x + k.w + r && y >= k.y - r && y <= k.y + k.h + r) einspruch();
  }
  addEventListener('keydown', e => {
    if (R_.zustand !== 'spiel' || e.repeat) return;
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (phase === 'titel') runter(-1, -1); else einspruch(); }
  });

  // ---------- Zeichnen ----------
  const glatt = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const beschl = t => Math.pow(Math.max(0, Math.min(1, t)), 2);

  function zeichne(g, B, H, zustand, dt) {
    const sch = B + 'x' + H + ':' + LV.nr;
    if (sch !== Lschluessel) { L = aufteilen(B, H); Lschluessel = sch; }
    if (zustand === 'ende') { zeichneEndszene(g, B, H); return; }
    zeichneSaal(g, B, H);
    if (zustand !== 'spiel') return;
    const zeigen = aussage && phase !== 'pause' && phase !== 'fertig' && phase !== 'titel';
    zeichneRichterin(g, dt || 0);
    if (zeigen) zeichneZeuge(g, B, H);
    // leichte Abdunklung oben (Anzeige lesbar)
    const v = g.createLinearGradient(0, 0, 0, 90);
    v.addColorStop(0, 'rgba(0,0,0,.35)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, B, 90);
    if (zeigen) {
      if (aussage.beweis && L.beweis) zeichneBeweis(g);
      zeichneBlase(g);
      if (urteil && (phase === 'urteil' || phase === 'abgang')) zeichneUrteil(g, B);
    }
    zeichneLeben(g, B);
    zeichneKnopf(g);
    if (phase === 'titel') zeichneLevelTitel(g, B, H);
  }

  function zeichneSaal(g, B, H) {
    const b = BILD.saal;
    if (!b) { g.fillStyle = '#c9a27a'; g.fillRect(0, 0, B, H); return; }
    g.drawImage(b, L.ox, L.oy, SAAL.b * L.s, SAAL.h * L.s);
  }
  function zeichneEndszene(g, B, H) {
    const b = BILD[fehler >= MAX_FEHLER || sprungEndeArt === 'verloren' ? 'verloren' : 'sieg'];
    if (!b) { zeichneSaal(g, B, H); return; }
    const f = Math.max(B / b.width, H / b.height);
    g.drawImage(b, (B - b.width * f) / 2, (H - b.height * f) / 2, b.width * f, b.height * f);
  }

  // Zeuge hinter dem Zeugenstand: steigt beim Auftritt von unten herein, atmet leicht, wippt bei jedem neuen Satz
  function zeichneZeuge(g, B, H) {
    const img = BILD[aussage.zeuge];
    if (!img) return;
    const s = L.s, k = ZEUGE.faktor * s;
    const w = img.width * k, h = img.height * k;
    let dy = 0, alpha = 1;
    // Auftritt: steigt sanft hinter dem Zeugenstand hoch und blendet ein; Abgang umgekehrt
    if (phase === 'auftritt') { const t = glatt(phaseT / DAUER.auftritt); dy = (1 - t) * h * 0.22; alpha = glatt(phaseT / (DAUER.auftritt * 0.8)); }
    else if (phase === 'abgang') { const t = glatt(phaseT / DAUER.abgang); dy = t * h * 0.18; alpha = 1 - t; }
    if (phase === 'rede' && satzT < 0.3) dy -= Math.sin(satzT / 0.3 * Math.PI) * 1.5;   // nickt kurz beim neuen Satz
    if (RUHIG) dy = 0;
    const atmen = RUHIG ? 1 : 1 + 0.005 * Math.sin(performance.now() / 1000 * 2.1);
    const [cx, unten] = L.P(ZEUGE.x, ZEUGE.unten);
    g.save();
    // alles außer dem Zeugenstand (dieser verdeckt den Zeugen unten)
    g.beginPath(); g.rect(0, 0, B, H);
    STAND.forEach(([x, y], i) => { const [px, py] = L.P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); });
    g.closePath(); g.clip('evenodd');
    g.translate(cx, unten + dy); g.scale(1, atmen);
    // Schlagschatten auf die Holzwand dahinter: Tageslicht von links, also leicht nach rechts (und etwas nach unten) versetzt
    const sch = BILD[aussage.zeuge + ':schatten'];
    if (sch) {
      g.globalAlpha = alpha * 0.28;
      const R = SCHATTEN_RAND * k;
      g.drawImage(sch, -w / 2 - R + w * 0.1, -h - R + h * 0.03, w + 2 * R, h + 2 * R);
    }
    // Zeuge mit Kontaktschatten: zur Pult-Oberkante hin weich dunkler (nur auf dem Zeugen selbst)
    const dpr = g.getTransform().a, tw = Math.max(1, Math.ceil(w * dpr)), th = Math.max(1, Math.ceil(h * dpr));
    if (zeugeLeinwand.width !== tw || zeugeLeinwand.height !== th) { zeugeLeinwand.width = tw; zeugeLeinwand.height = th; }
    else zg.clearRect(0, 0, tw, th);
    zg.globalCompositeOperation = 'source-over';
    zg.drawImage(img, 0, 0, tw, th);
    const kante = (L.P(0, STAND_OBEN)[1] - (unten + dy - h * atmen)) / atmen / h * th;   // Pult-Oberkante im Zeugenbild
    const band = 34 * s / h * th;
    zg.globalCompositeOperation = 'source-atop';
    const v = zg.createLinearGradient(0, kante - band, 0, kante);
    v.addColorStop(0, 'rgba(34,20,8,0)'); v.addColorStop(0.55, 'rgba(34,20,8,.2)'); v.addColorStop(1, 'rgba(34,20,8,.52)');
    zg.fillStyle = v; zg.fillRect(0, kante - band, tw, th - kante + band);
    g.globalAlpha = alpha;
    g.drawImage(zeugeLeinwand, -w / 2, -h, w, h);
    g.restore();
  }

  // Beweisstück oben links: Beutel (leicht schräg) und daneben ein Etikett mit Kopf „Beweisstück“ und Beschriftung
  function zeichneBeweis(g) {
    const r = L.beweis, rb = r.beutel, re = r.etikett, q = BEWEIS[aussage.beweis], img = BILD.beweise;
    let dy = 0, alpha = 1;
    // gleitet beim Auftritt sanft von links herein (leicht gedreht, legt sich gerade), beim Abgang blendet es aus
    let dx = 0, dreh = 0;
    if (phase === 'auftritt') { const t = glatt(phaseT / DAUER.auftritt); dx = -(1 - t) * (rb.x + rb.w + 40); dreh = -(1 - t) * 0.12; alpha = glatt(phaseT / (DAUER.auftritt * 0.7)); }
    else if (phase === 'abgang') { const t = glatt(phaseT / DAUER.abgang); alpha = 1 - t; dy = -t * 10; }
    if (RUHIG) { dx = 0; dy = 0; dreh = 0; }
    // Beutel in sein Feld einpassen (Seitenverhältnis bleibt), etwas Rand für die leichte Drehung
    const f = q ? Math.min(rb.w * 0.94 / q[2], rb.h * 0.97 / q[3]) : 1;
    const bw = q ? q[2] * f : 0, bh = q ? q[3] * f : 0;
    g.save();
    g.globalAlpha = Math.max(0, alpha);
    g.translate(dx, dy); g.rotate(dreh);
    if (img && q) {
      g.save();
      g.translate(rb.x + rb.w / 2, rb.y + bh / 2 + 2); g.rotate(-0.04);
      // Lesepause: Beutel pulsiert sanft (Hinweis „erst das Beweisstück ansehen“)
      if (phase === 'vorlauf' && !RUHIG) { const p = 1 + 0.04 * (0.5 - 0.5 * Math.cos(phaseT * Math.PI * 2 / 1.0)); g.scale(p, p); }
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
      g.drawImage(img, q[0], q[1], q[2], q[3], -bw / 2, -bh / 2, bw, bh);
      g.restore();
    }
    // Etikett
    const ex = re.x, ew = re.gross ? re.w : Math.min(re.w, 330);
    if (ew > 60) {
      const pad = 8, { fs, zeilen, kopfH, zh, eh } = etikettSatz(g, aussage.etikett, re);
      const ey = re.y + (L.quer ? 0 : Math.max(0, (re.h - eh) / 2));
      g.save();
      g.translate(ex, ey); g.rotate(0.012);
      g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
      runderKasten(g, 0, 0, ew, eh, 6); g.fillStyle = '#fbfaf6'; g.fill();
      g.shadowColor = 'transparent';
      g.save(); runderKasten(g, 0, 0, ew, eh, 6); g.clip(); g.fillStyle = BLAUGRAU; g.fillRect(0, 0, ew, kopfH); g.restore();
      g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.font = `800 ${fs * 0.72}px ${SCHRIFT}`;
      if ('letterSpacing' in g) g.letterSpacing = '1px';
      g.fillText('BEWEISSTÜCK', pad, kopfH / 2 + 0.5);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      g.fillStyle = TEXT; g.textBaseline = 'alphabetic'; g.font = `600 ${fs}px ${SCHRIFT}`;
      zeilen.forEach((z, i) => g.fillText(z, pad, kopfH + pad * 0.5 + fs + i * zh));
      g.restore();
    }
    g.restore();
  }

  // Etikett-Text einpassen: Schrift von 16 (groß bis 22) px schrittweise kleiner, bis der Text ins Feld passt (mind. 11 px)
  function etikettSatz(g, text, re) {
    const pad = 8, ew = re.gross ? re.w : Math.min(re.w, 330);
    let fs = re.gross ? begrenzen(re.w / 17, 16, 22) : 16, zeilen, kopfH, zh, eh;
    for (;;) {
      g.font = `600 ${fs}px ${SCHRIFT}`;
      zeilen = umbrechen(g, text, ew - 2 * pad);
      kopfH = fs * 1.35; zh = fs * 1.22; eh = kopfH + pad * 1.2 + zeilen.length * zh;
      if (eh <= re.h || fs <= 11) break;
      fs -= 0.5;
    }
    const breitesteZeile = Math.max(...zeilen.map(z => g.measureText(z).width));
    return { fs, zeilen, kopfH, zh, eh, passt: eh <= re.h + 0.5 && breitesteZeile <= ew - 2 * pad + 0.5 };
  }

  // Sprechblase mit dem aktuellen Satz (jeder neue Satz ersetzt den vorigen), Spitze zum Zeugen
  const textCache = {};
  function blasenText(g, text, w, h) {
    const key = text + '|' + Math.round(w) + 'x' + Math.round(h);
    if (textCache[key]) return textCache[key];
    let fs = begrenzen(Math.min(w * 0.065, h * 0.24), 15, 25), zeilen;
    for (;;) {
      g.font = `600 ${fs}px ${SCHRIFT}`;
      zeilen = umbrechen(g, text, w);
      if (zeilen.length * fs * 1.28 <= h || fs <= 12) break;
      fs -= 0.5;
    }
    return (textCache[key] = { fs, zeilen });
  }
  function zeichneBlase(g) {
    const b = L.blase;
    let alpha = 1, pop = 1;
    if (phase === 'auftritt') alpha = glatt((phaseT - 0.2) / 0.35);
    else if (phase === 'abgang') alpha = 1 - phaseT / DAUER.abgang;
    if (phase === 'rede' && satzT < 0.25 && !RUHIG) pop = 0.985 + 0.015 * glatt(satzT / 0.25);
    if (phase === 'auftritt' && !RUHIG) pop = 0.92 + 0.08 * glatt((phaseT - 0.2) / 0.4);
    if (alpha <= 0) return;
    // Spitze: Richtung Mund des Zeugen
    const img = BILD[aussage.zeuge], zh = img ? img.height * ZEUGE.faktor : 300;
    const [mx, my] = L.P(ZEUGE.x - 18, ZEUGE.unten - zh * 0.82);
    g.save();
    g.globalAlpha = alpha;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    g.translate(cx, cy); g.scale(pop, pop); g.translate(-cx, -cy);
    g.beginPath();
    runderPfad(g, b.x, b.y, b.w, b.h, 16);
    if (b.seite === 'unten') {
      const sx = begrenzen(mx - 34, b.x + 30, b.x + b.w - 50), tipX = begrenzen(mx - 14, b.x + 20, b.x + b.w - 10), tipY = b.y + b.h + Math.min(20, my - b.y - b.h - 6);
      g.moveTo(sx - 13, b.y + b.h - 2); g.lineTo(sx + 15, b.y + b.h - 2); g.lineTo(tipX, Math.max(b.y + b.h + 8, tipY)); g.closePath();
    } else {
      // Querformat: Spitze aus der rechten Kante (nicht in der runden Ecke), Richtung Mund, höchstens 40 px lang
      const zeugeLinks = L.P(ZEUGE.x - 80, 0)[0], lang = begrenzen((zeugeLinks - b.x - b.w) * 0.6, 16, 40);
      const sy = begrenzen(my, b.y + 34, b.y + b.h - 34), tipY = begrenzen(my, b.y + 6, b.y + b.h - 6);
      g.moveTo(b.x + b.w - 2, sy - 14); g.lineTo(b.x + b.w - 2, sy + 14); g.lineTo(b.x + b.w + lang, begrenzen(tipY, sy - lang, sy + lang)); g.closePath();
    }
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 5;
    g.fillStyle = '#ffffff'; g.fill();
    g.restore();
    // Inhalt
    g.save();
    g.globalAlpha = alpha;
    const pad = Math.max(12, Math.min(20, b.w * 0.045)), zaehlerH = 16;
    const iw = b.w - 2 * pad, ih = b.h - 2 * pad - zaehlerH * 0.6;
    if (phase === 'auftritt' || phase === 'vorlauf' || (urteil ? urteil.zeige : satz) < 0) {
      // drei Punkte: der Zeuge holt Luft
      for (let i = 0; i < 3; i++) {
        const a = 0.35 + 0.65 * Math.max(0, Math.sin(performance.now() / 1000 * 6 - i * 0.8));
        g.globalAlpha = alpha * a; g.fillStyle = BLAUGRAU;
        g.beginPath(); g.arc(cx - 16 + i * 16, cy, 4.5, 0, Math.PI * 2); g.fill();
      }
      g.restore();
      return;
    }
    const idx = urteil ? urteil.zeige : satz;
    // Satzwechsel: der vorige Satz blendet kurz aus, der neue ein (gleitet dabei 4 px hoch)
    const wechsel = phase === 'rede' && !urteil && satzT < UEBERBLENDEN;
    if (wechsel && vorSatz >= 0) zeichneSatz(g, aussage.saetze[vorSatz], b, pad, iw, ih, alpha * (1 - glatt(satzT / (UEBERBLENDEN * 0.7))), 0, null);
    const ein = wechsel ? glatt(satzT / UEBERBLENDEN) : 1;
    // übersehen: der ✗-Satz blendet nach dem Stempel noch einmal neu ein (Lerneffekt)
    const neuEin = urteil && urteil.zeige !== satz && phase === 'urteil' ? glatt(phaseT / 0.3) : 1;
    zeichneSatz(g, aussage.saetze[idx], b, pad, iw, ih, alpha * ein * neuEin, RUHIG ? 0 : (1 - ein) * 4, urteil && urteil.markiert);
    // kleiner Zähler „Satz 2/4“
    g.globalAlpha = alpha * 0.55;
    g.font = `700 11px ${SCHRIFT}`; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillStyle = BLAUGRAU;
    g.fillText(`Satz ${idx + 1}/${aussage.saetze.length}`, b.x + b.w - 12, b.y + b.h - 8);
    g.restore();
  }

  function zeichneSatz(g, text, b, pad, iw, ih, a, dy, markiert) {
    if (!text || a <= 0) return;
    const cx = b.x + b.w / 2;
    const { fs, zeilen } = blasenText(g, text, iw, ih);
    const zh = fs * 1.28, y0 = b.y + pad + (ih - zeilen.length * zh) / 2 + dy;
    g.save();
    g.globalAlpha = a;
    g.font = `600 ${fs}px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    // Markierung wie mit dem Textmarker (wird von links aufgezogen): übersehen (Warnfarbe) bzw. stattgegeben (Grün)
    if (markiert) {
      const auf = RUHIG ? 1 : glatt(phaseT / 0.45);
      g.fillStyle = markiert === 'gut' ? 'rgba(95,158,58,.28)' : 'rgba(217,72,59,.24)';
      zeilen.forEach((z, i) => { const zw = g.measureText(z).width; g.fillRect(cx - zw / 2 - 4, y0 + i * zh + zh * 0.08, (zw + 8) * auf, zh * 0.84); });
    }
    g.fillStyle = TEXT;
    zeilen.forEach((z, i) => g.fillText(z, cx, y0 + i * zh + zh / 2 + 1));
    g.restore();
  }

  // Stempel auf der Front des Zeugenstands (schräg, wie in Frist-Alarm), darunter die Punkte
  const STEMPEL = { stattgegeben: ['STATTGEGEBEN'], abgelehnt: ['ABGELEHNT'], uebersehen: ['WIDERSPRUCH', 'ÜBERSEHEN'], glaubwuerdig: ['AUSSAGE', 'GLAUBWÜRDIG'] };
  function zeichneUrteil(g, B) {
    const t = phase === 'urteil' ? phaseT : DAUER[urteil.art] + phaseT;
    const aus = phase === 'abgang' ? 1 - phaseT / DAUER.abgang : 1;
    const gut = urteil.art === 'stattgegeben' || urteil.art === 'glaubwuerdig';
    const farbe = gut ? GUT : WARNUNG, S = L.stempel;
    const woerter = STEMPEL[urteil.art];
    let fs = begrenzen(B * 0.07, 20, 34);
    g.save();
    g.font = `900 ${fs}px ${SCHRIFT}`;
    // einzeilig, wenn es passt; sonst zweizeilig
    let zeilen = [woerter.join(' ')];
    if (woerter.length > 1 && g.measureText(zeilen[0]).width + fs * 0.8 > S.w * 1.1) zeilen = woerter;
    const tw = Math.max(...zeilen.map(z => g.measureText(z).width)), bw = tw + fs * 0.8, bh = fs * (0.6 + zeilen.length * 1.05);
    const k = Math.min(1, (S.w * 1.15) / bw, Math.max(0.55, (S.h * 0.9) / bh));
    // Aufprall: kommt groß von oben (beschleunigt), federt beim Aufsetzen kurz nach
    const sk = RUHIG ? 1 : t < 0.16 ? 1.7 - beschl(t / 0.16) * 0.7 : t < 0.36 ? 1 - Math.sin((t - 0.16) / 0.2 * Math.PI) * 0.06 : 1;
    g.globalAlpha = Math.min(1, t / 0.12) * aus * 0.94;
    const ruck = !RUHIG && t > 0.16 && t < 0.3 ? Math.sin((t - 0.16) / 0.14 * Math.PI * 2) * 1.5 : 0;   // kleines Nachzittern
    g.translate(S.x + ruck, S.y); g.rotate(-0.1); g.scale(sk * k, sk * k);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // helle Unterlage, damit der Stempel auf dem Holz gut lesbar ist
    runderKasten(g, -bw / 2, -bh / 2, bw, bh, fs * 0.2);
    g.fillStyle = 'rgba(255,253,246,.82)'; g.fill();
    g.lineWidth = fs * 0.12; g.strokeStyle = farbe; g.stroke();
    g.fillStyle = farbe;
    zeilen.forEach((z, i) => g.fillText(z, 0, (i - (zeilen.length - 1) / 2) * fs * 1.05 + fs * 0.05));
    g.restore();
    // Punkte unter dem Stempel
    if (urteil.punkte > 0 && t > 0.25) {
      const pf = begrenzen(B * 0.042, 14, 18), text = '+' + urteil.punkte + ' Punkte';
      g.save();
      g.globalAlpha = Math.min(1, (t - 0.25) / 0.2) * aus;
      g.font = `800 ${pf}px ${SCHRIFT}`;
      const pw = g.measureText(text).width + pf * 1.6, ph = pf * 1.9, py = S.y + bh * k / 2 + ph / 2 + 10 - Math.max(0, 0.45 - t) * 30;
      runderKasten(g, S.x - pw / 2, py - ph / 2, pw, ph, ph / 2);
      g.fillStyle = 'rgba(28,37,43,.9)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#5f9e3a'; g.stroke();
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, S.x, py + 1);
      g.restore();
    }
  }

  // Drei Leben oben (Kreise mit Paragrafenzeichen), je Fehler eins rot durchgestrichen
  function zeichneLeben(g, B) {
    const r = 9, y = L.lebenY, x0 = B / 2 - (2 * r + 6);
    for (let i = 0; i < MAX_FEHLER; i++) {
      const weg = i < fehler, x = x0 + i * (2 * r + 6);
      const dx = weg && i === fehler - 1 && wackeln > 0 ? Math.sin(wackeln * 60) * 3 : 0;
      g.save();
      g.translate(x + dx, y);
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.fillStyle = weg ? WARNUNG : 'rgba(255,255,255,.94)'; g.fill();
      g.lineWidth = 1.6; g.strokeStyle = weg ? '#ffffff' : BLAUGRAU; g.stroke();
      if (weg) {
        g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, -4); g.lineTo(4, 4); g.moveTo(4, -4); g.lineTo(-4, 4); g.stroke();
      } else {
        g.fillStyle = BLAUGRAU; g.font = `800 13px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('§', 0, 1);
      }
      g.restore();
    }
  }

  let knopfHell = 0.72, knopfLesen = 0;
  // Großer Knopf „Einspruch!“ in der Markenfarbe; nur während der Aussage aktiv
  function zeichneKnopf(g) {
    const k = L.knopf, aktiv = phase === 'rede';
    // Lesepause beim Beweisstück (MZ, Player-Test 22.10.2026): Knopf ausgegraut mit „Lies das Beweisstück“, weich überblendet
    const lesen = phase === 'vorlauf' && aussage && !!aussage.beweis;
    knopfLesen += ((lesen ? 1 : 0) - knopfLesen) * 0.2;
    // Druck: Knopf geht schnell nach unten (kleiner, Schatten flacher) und federt weich zurück
    const vergangen = DRUCK - druck, tief = druck <= 0 || RUHIG ? 0 : vergangen < 0.06 ? vergangen / 0.06 : 1 - glatt((vergangen - 0.06) / (DRUCK - 0.06));
    const sk = 1 - tief * 0.05;
    g.save();
    g.translate(k.x + k.w / 2, k.y + k.h / 2 + tief * 3); g.scale(sk, sk);
    // aktiv/inaktiv weich überblenden
    knopfHell += ((aktiv || phase === 'einspruch' || lesen ? 1 : 0.72) - knopfHell) * 0.18;
    g.globalAlpha = knopfHell;
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 14 - tief * 8; g.shadowOffsetY = 5 - tief * 3;
    runderKasten(g, -k.w / 2, -k.h / 2, k.w, k.h, Math.min(18, k.h / 2));
    const v = g.createLinearGradient(0, -k.h / 2, 0, k.h / 2);
    v.addColorStop(0, R_.toenen(F.haupt, 0.12)); v.addColorStop(1, R_.toenen(F.haupt, -0.12));
    g.fillStyle = phase === 'einspruch' ? R_.toenen(F.haupt, 0.25) : v; g.fill();
    g.shadowColor = 'transparent';
    if (knopfLesen > 0.01) {   // grauer Überzug in der Lesepause
      const gr = g.createLinearGradient(0, -k.h / 2, 0, k.h / 2);
      gr.addColorStop(0, '#c9ccc8'); gr.addColorStop(1, '#a9ada8');
      g.save(); g.globalAlpha *= knopfLesen; g.fillStyle = gr; g.fill(); g.restore();
    }
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const a0 = g.globalAlpha;
    if (knopfLesen < 0.99) {
      g.globalAlpha = a0 * (1 - knopfLesen);
      g.fillStyle = F.hauptText || R_.textFarbe(F.haupt);
      g.font = `900 ${Math.round(k.h * 0.42)}px ${SCHRIFT}`;
      if ('letterSpacing' in g) g.letterSpacing = '0.5px';
      g.fillText('Einspruch!', 0, 1);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }
    if (knopfLesen > 0.01) {
      g.globalAlpha = a0 * knopfLesen;
      g.fillStyle = '#3d4447';
      g.font = `800 ${Math.round(Math.min(k.h * 0.3, k.w / 11))}px ${SCHRIFT}`;
      g.fillText('Lies das Beweisstück', 0, 1, k.w - 20);
    }
    g.restore();
  }

  // Level-Titel vor dem Spiel (wie Frist-Alarm): Notizzettel mit Klebestreifen, „Level 2“ in Titelfarbe, darunter der Name
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
  // Adresse: #level=2 (Level wählen, auch wenn gesperrt), #zeuge=17 (Aussage Nr. 17 kommt zuerst), #ab=10 (mit dem
  //          10. Zeugen beginnen), #ende=sieg-854 / #ende=verloren / #ende=frei (Beispiel-Endbild nach „Los geht's“).
  // window.__test: Rechenfunktionen und Zustand, z. B. __test.wertung(__test.AUSSAGEN1[0], 2, 0.8), __test.tippe(),
  //                __test.level(2), __test.freischaltungZuruecksetzen(), __test.knopf (Mitte des Knopfs zum echten Tippen).
  window.__test = {
    AUSSAGEN1, AUSSAGEN2, AUSSAGEN3, LEVEL, PUNKTE, ANZAHL, MAX_FEHLER, DAUER, NACH_LETZTEM, NACH_EHRLICH,
    satzDauer, fenster, punkteFuer, wertung, stufe, auswahl, bilanz, frei,
    tippe: () => einspruch(),
    etikettenPruefen: () => {
      if (!L || !L.beweis) return null;
      const g = document.getElementById('feld').getContext('2d'), re = L.beweis.etikett, alle = AUSSAGEN1.concat(AUSSAGEN3).filter(a => a.etikett);
      return alle.map(a => { const r = etikettSatz(g, a.etikett, re); return { nr: a.nr, level: AUSSAGEN1.includes(a) ? 1 : 3, fs: r.fs, zeilen: r.zeilen.length, passt: r.passt }; });
    },
    richterReaktion: a => richterReaktion(a), get richter() { return Object.assign({}, richter); },
    level: n => levelWaehlen(n),
    freischaltungZuruecksetzen: () => { try { localStorage.removeItem(FREI_KEY); } catch (e) { /* privat */ } wahlAufbauen(); },
    endbild: (art, wert) => { sprungEndeArt = art; beispielEnde(art, wert); },
    get knopf() { return L ? { x: L.knopf.x + L.knopf.w / 2, y: L.knopf.y + L.knopf.h / 2 } : null; },
    get layout() { return L && { richterVerdeckt: L.richterVerdeckt, blase: L.blase, beweis: L.beweis, knopf: L.knopf, stempel: L.stempel, s: L.s, ox: L.ox, oy: L.oy, zeuge: L.P(ZEUGE.x, ZEUGE.unten) }; },
    get zustand() {
      return { level: LV.nr, phase, phaseT, nr, satz, satzT, punkte, richtig: richtigAnz, fehler, verlauf, reaktionen,
        aussage: aussage && { nr: aussage.nr, art: aussage.art, zeuge: aussage.zeuge, beweis: aussage.beweis, falsch: aussage.falsch, saetze: aussage.saetze.length },
        dauern, urteil, liste: liste && liste.map(a => a.nr) };
    },
  };
  if (/ende=verloren/.test(location.hash)) sprungEndeArt = 'verloren';

  const DEF = {
    id: LV.id,
    wertung: 'hoch',
    format: p => zahl(p) + ' Punkte',
    hoechst: 1000,
    texte: {
      titel: 'Einspruch!',
      untertitel: 'Hörst du, wenn der Zeuge sich widerspricht?',
      anleitung: LV.anleitung,
    },
    klaenge: klaengeDa,
    schleife: 'murmeln',
    // Musik der Sammlung (wie Frist-Alarm): läuft im Startbild und endet mit „Los geht's“
    // läuft auch im Spiel weiter, dort auf 45 % abgesenkt, im Endbild wieder voll (MZ, 22.10.2026; Rahmen-Option imSpiel)
    startMusik: { datei: '../klaenge/musik.mp3', proben: 1281969, pegel: 0.22, imSpiel: 0.45 },
    neu, schritt, zeichne, runter,
  };
  R_.spiel(DEF);
  const lvHash = /level=(\d)/.exec(location.hash);
  // Level: aus der Adresse (Test), sonst das zuletzt gespielte, wenn es (noch) frei und spielbar ist, sonst Level 1
  const zl = zuletzt(), zlOk = zl >= 1 && zl <= LEVEL.length && zl <= frei() && LEVEL[zl - 1].spielbar !== false;
  levelWaehlen(lvHash ? Math.max(1, Math.min(3, +lvHash[1])) : zlOk ? zl : 1);
})();
