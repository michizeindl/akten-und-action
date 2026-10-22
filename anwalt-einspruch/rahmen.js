// Rahmen für alle Mini-Games: Spielfläche, Start- und Endbild, Logo, Kundenfarben, Ton, Vollbild, Bestwert.
// Die Kundendaten stehen in kunde/kunde.js (window.KUNDE). Jedes Spiel meldet sich mit Rahmen.spiel({...}) an.
// Diese Datei nur in gemeinsam/ bearbeiten – aktualisieren.py kopiert sie in alle Spiele.
(function () {
  'use strict';

  const K = window.KUNDE || {};
  const farben = Object.assign({ haupt: '#d32f2f', akzent: '#ffb300', dunkel: '#151922', hell: '#ffffff' }, K.farben);

  // ---------- Farben ----------
  function rgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Text auf einer Farbe: schwarz oder weiß, je nachdem, was besser lesbar ist
  function textFarbe(hex) {
    const [r, g, b] = rgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111111' : '#ffffff';
  }
  // Farbe aufhellen (f > 0) oder abdunkeln (f < 0), f zwischen -1 und 1
  function toenen(hex, f) {
    const z = f > 0 ? 255 : 0, t = Math.abs(f);
    const [r, g, b] = rgb(hex).map(v => Math.round(v + (z - v) * t));
    return `rgb(${r},${g},${b})`;
  }
  function mitAlpha(hex, a) { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; }

  const wurzel = document.documentElement.style;
  wurzel.setProperty('--haupt', farben.haupt);
  // Schrift auf der Hausfarbe: automatisch schwarz/weiß, außer kunde.js gibt farben.hauptText vor
  // (z. B. Olivgrün, auf dem Weiß zu schwach wäre)
  wurzel.setProperty('--haupt-text', farben.hauptText || textFarbe(farben.haupt));
  wurzel.setProperty('--akzent', farben.akzent);
  wurzel.setProperty('--dunkel', farben.dunkel);
  wurzel.setProperty('--hell', farben.hell);

  // ---------- Logo ----------
  const logo = new Image();
  let logoBereit = false;
  logo.onload = () => { logoBereit = true; };
  logo.src = K.logo || 'kunde/logo.svg';

  // Zweites Logo für helle Flächen im Spiel (z. B. weiße Radnabe), falls der Kunde eins hat (logoAufHell)
  const logoHell = new Image();
  let logoHellBereit = false;
  if (K.logoAufHell) { logoHell.onload = () => { logoHellBereit = true; }; logoHell.src = K.logoAufHell; }

  // Logo in ein Kästchen einpassen (Seitenverhältnis bleibt); aufHell = Fläche ist hell
  function zeichneLogo(g, x, y, w, h, alpha, aufHell) {
    const bild = aufHell && logoHellBereit ? logoHell : logo;
    if (bild === logo && !logoBereit) return;
    if (!bild.naturalWidth) return;
    const f = Math.min(w / bild.naturalWidth, h / bild.naturalHeight);
    const lw = bild.naturalWidth * f, lh = bild.naturalHeight * f;
    g.save();
    if (alpha != null) g.globalAlpha *= alpha;
    g.drawImage(bild, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh);
    g.restore();
  }

  // Gemalte Bilder: grüne Flächen (#00FF00 bzw. kräftiges Grün) in die Kundenfarbe umfärben,
  // Licht und Schatten bleiben erhalten. Gibt eine Leinwand zurück, die wie ein Bild gezeichnet werden kann.
  function umfaerben(img, farbe) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const bild = g.getImageData(0, 0, c.width, c.height), d = bild.data, ziel = rgb(farbe || farben.haupt);
    for (let i = 0; i < d.length; i += 4) {
      const gruen = d[i + 1] - Math.max(d[i], d[i + 2]);
      if (gruen < 16) continue;
      const t = Math.min(1, (gruen - 16) / 36);    // Kanten weich überblenden, auch dunkles Grün ganz erfassen
      const hell = Math.min(1.3, d[i + 1] / 210);    // Licht und Schatten bleiben erhalten
      for (let k = 0; k < 3; k++) d[i + k] += (Math.min(255, ziel[k] * hell) - d[i + k]) * t;
    }
    g.putImageData(bild, 0, 0);
    return c;
  }

  // ---------- Klang ----------
  // Alle Töne werden im Browser erzeugt, es gibt keine Tondateien.
  let ac = null;
  let tonAn = lesen('ton') !== 'aus';
  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state !== 'running') ac.resume().catch(() => {});
    return ac;
  }
  // Browser geben Ton erst nach einem Tippen frei
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(e =>
    addEventListener(e, () => { if (tonAn) audio(); }, { passive: true }));

  function piep(freq, dauer, art, pegel, bis, start) {
    const a = ac, t = a.currentTime + (start || 0);
    const o = a.createOscillator(), v = a.createGain();
    o.type = art || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (bis) o.frequency.exponentialRampToValueAtTime(bis, t + dauer);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(pegel || 0.2, t + 0.01);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(v).connect(a.destination);
    o.start(t); o.stop(t + dauer + 0.02);
  }
  let rauschPuffer = null;
  function rauschen(dauer, filter, freq, pegel, start) {
    const a = ac, t = a.currentTime + (start || 0);
    if (!rauschPuffer) {
      rauschPuffer = a.createBuffer(1, a.sampleRate, a.sampleRate);
      const d = rauschPuffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const q = a.createBufferSource(); q.buffer = rauschPuffer;
    const f = a.createBiquadFilter(); f.type = filter; f.frequency.value = freq;
    const v = a.createGain();
    v.gain.setValueAtTime(pegel, t);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    q.connect(f).connect(v).connect(a.destination);
    q.start(t, Math.random() * 0.5); q.stop(t + dauer + 0.02);
  }
  const TOENE = {
    klick: () => piep(880, 0.06, 'sine', 0.15),
    dreh: () => { for (let i = 0; i < 4; i++) rauschen(0.03, 'highpass', 2500, 0.35, i * 0.045); piep(300, 0.12, 'square', 0.04, 600); },
    fehler: () => piep(170, 0.28, 'square', 0.1, 100),
    gut: () => { piep(660, 0.12, 'triangle', 0.2); piep(990, 0.2, 'triangle', 0.2, null, 0.1); },
    sieg: () => [523, 659, 784, 1047].forEach((f, i) => piep(f, i === 3 ? 0.45 : 0.15, 'triangle', 0.2, null, i * 0.12)),
    crash: () => { rauschen(0.5, 'lowpass', 900, 0.8); piep(90, 0.35, 'sawtooth', 0.12, 40); rauschen(0.25, 'highpass', 3000, 0.25, 0.05); },
    wisch: () => rauschen(0.09, 'bandpass', 1800 + Math.random() * 800, 0.12),
    los: () => { piep(440, 0.12, 'square', 0.08); piep(880, 0.25, 'square', 0.08, null, 0.15); },
    motor: () => piep(70, 0.5, 'sawtooth', 0.06, 140),
  };
  // ---------- Aufnahmen ----------
  // Spiele können eigene Tondateien mitbringen (Rahmen.klaenge). Eine Aufnahme ersetzt den erzeugten Ton
  // gleichen Namens; fehlt sie oder lädt sie nicht, bleibt der erzeugte Ton.
  const clips = {}, clipPegel = {};
  function klaenge(liste) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ac) ac = new AC();
    Object.entries(liste).forEach(([name, c]) => {
      clipPegel[name] = c.pegel != null ? c.pegel : 0.5;
      clips[name] = fetch(c.datei)
        .then(r => r.arrayBuffer())
        .then(b => new Promise((ok, nein) => ac.decodeAudioData(b, ok, nein)))
        .then(b => c.proben ? mp3Zuschnitt(b, c.proben) : b)
        .catch(() => null);
      clips[name].then(b => { clips[name + ':fertig'] = b; });
    });
  }
  // MP3 bringt vorn 1105 Proben Stille (bei 22,05 kHz) und hinten Füllstille mit. Manche Browser schneiden sie weg,
  // andere nicht (Chrome nicht). Mit der echten Länge (proben) wird genau auf den Klang zugeschnitten –
  // sonst stocken Dauertöne in der Schleife und kurze Töne kämen 50 ms zu spät.
  function mp3Zuschnitt(b, proben) {
    const RATE = 22050, VORLAUF = 1105;
    const ueber = b.duration * RATE - proben;
    if (ueber < 2) return b;                                  // Browser hat schon zugeschnitten
    const ab = Math.round((ueber >= VORLAUF - 4 ? VORLAUF : 0) / RATE * b.sampleRate);
    const laenge = Math.min(b.length - ab, Math.round(proben / RATE * b.sampleRate));
    const neu = ac.createBuffer(b.numberOfChannels, laenge, b.sampleRate);
    for (let k = 0; k < b.numberOfChannels; k++) neu.getChannelData(k).set(b.getChannelData(k).subarray(ab, ab + laenge));
    return neu;
  }
  function spieleClip(name) {
    const b = clips[name + ':fertig'];
    if (!b) return false;
    const q = ac.createBufferSource(), v = ac.createGain();
    q.buffer = b; v.gain.value = clipPegel[name];
    q.connect(v).connect(ac.destination);
    q.start();
    return true;
  }

  // Hintergrundgeräusch in Endlosschleife (startet mit dem Spiel, endet mit ihm)
  let schleifeName = null, schleifeLaeuft = null;
  async function schleifeStarten() {
    schleifeStoppen();
    if (!schleifeName || !tonAn || !clips[schleifeName]) return;
    const b = await clips[schleifeName];
    if (!b || zustand !== 'spiel' || schleifeLaeuft || !tonAn) return;
    const q = ac.createBufferSource(), v = ac.createGain();
    q.buffer = b; q.loop = true;
    v.gain.setValueAtTime(0.0001, ac.currentTime);
    v.gain.exponentialRampToValueAtTime(clipPegel[schleifeName], ac.currentTime + 0.8);
    q.connect(v).connect(ac.destination);
    q.start(0, Math.random() * b.duration);
    schleifeLaeuft = { q, v };
  }
  function schleifeStoppen() {
    if (!schleifeLaeuft) return;
    const { q, v } = schleifeLaeuft;
    schleifeLaeuft = null;
    try { v.gain.setTargetAtTime(0.0001, ac.currentTime, 0.25); q.stop(ac.currentTime + 1.5); } catch (e) { /* egal */ }
  }

  // Musik im Startbild (Rahmen.spiel({ startMusik: { datei, proben, pegel } }), z. B. die Musik der Sammlungs-Startseite):
  // läuft in Schleife, sobald der Browser Ton erlaubt (erstes Tippen), und endet mit „Los geht's“ (MZ, 21.10.2026)
  // Option startMusik.imSpiel (z. B. 0.45, Sammlung „Akten & Action“, MZ 22.10.2026): die Musik läuft auch im Spiel und im
  // Endbild weiter – bei „Los geht's“ in ca. 1s auf imSpiel × Pegel abgesenkt, im Endbild wieder auf den vollen Pegel.
  // Ohne imSpiel (Autohaus) endet sie wie bisher mit „Los geht's“.
  let startMusikLaeuft = null, startMusikWartet = false;
  const musikImSpiel = () => !!(S && S.startMusik && S.startMusik.imSpiel != null);
  const musikErlaubt = () => zustand === 'start' || musikImSpiel();
  function musikZiel() { const p = clipPegel.startmusik; return zustand === 'spiel' && musikImSpiel() ? p * S.startMusik.imSpiel : p; }
  function musikPegel(dauer) {
    if (!startMusikLaeuft) return;
    const v = startMusikLaeuft.v, t = ac.currentTime;
    v.gain.cancelScheduledValues(t); v.gain.setValueAtTime(Math.max(0.0001, v.gain.value), t);
    v.gain.linearRampToValueAtTime(musikZiel(), t + (dauer != null ? dauer : 1));
  }
  async function startMusikAn() {
    if (!S || !S.startMusik || !musikErlaubt() || !tonAn || startMusikLaeuft || startMusikWartet || !clips.startmusik) return;
    const ua = navigator.userActivation;   // vor dem ersten Tippen nicht versuchen (Browser-Warnung)
    if (ua && !ua.hasBeenActive) return;
    const a = audio();
    if (!a) return;
    startMusikWartet = true;
    const b = await clips.startmusik;
    try { await a.resume(); } catch (e) { /* noch nicht erlaubt */ }
    startMusikWartet = false;
    if (!b || !musikErlaubt() || !tonAn || startMusikLaeuft || a.state !== 'running') return;
    const q = a.createBufferSource(), v = a.createGain();
    q.buffer = b; q.loop = true;
    v.gain.setValueAtTime(0.0001, a.currentTime);
    v.gain.exponentialRampToValueAtTime(musikZiel(), a.currentTime + 1.2);
    q.connect(v).connect(a.destination);
    q.start();
    startMusikLaeuft = { q, v };
  }
  function startMusikAus() {
    if (!startMusikLaeuft) return;
    const { q, v } = startMusikLaeuft;
    startMusikLaeuft = null;
    try { v.gain.setTargetAtTime(0.0001, ac.currentTime, 0.15); q.stop(ac.currentTime + 1); } catch (e) { /* egal */ }
  }
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(e =>
    addEventListener(e, () => { if (tonAn) setTimeout(startMusikAn, 0); }, { passive: true }));

  // Dauertöne (z. B. Motor): laufen in Schleife, das Spiel stellt laufend Lautstärke (0–1) und Tempo ein.
  // Enden mit dem Spiel oder wenn der Ton ausgeschaltet wird.
  const dauertoene = [];
  function dauerton(name) {
    const st = { q: null, v: null };
    const aus = () => {
      if (!st.q) return;
      try { st.v.gain.setTargetAtTime(0.0001, ac.currentTime, 0.15); st.q.stop(ac.currentTime + 1); } catch (e) { /* egal */ }
      st.q = st.v = null;
    };
    const steuer = {
      stellen(pegel, tempo) {
        const b = clips[name + ':fertig'];
        if (!tonAn || zustand !== 'spiel' || !b || !ac || ac.state !== 'running') { aus(); return; }
        if (!st.q) {
          st.q = ac.createBufferSource(); st.v = ac.createGain();
          st.q.buffer = b; st.q.loop = true;
          st.v.gain.value = 0.0001;
          st.q.connect(st.v).connect(ac.destination);
          st.q.start(0, Math.random() * b.duration);
        }
        st.v.gain.setTargetAtTime(Math.max(0.0001, pegel * clipPegel[name]), ac.currentTime, 0.08);
        if (tempo) st.q.playbackRate.setTargetAtTime(tempo, ac.currentTime, 0.12);
      },
      aus,
    };
    dauertoene.push(steuer);
    return steuer;
  }
  function dauertoeneAus() { dauertoene.forEach(d => d.aus()); }

  function ton(name) {
    if (!tonAn) return;
    const a = audio();
    if (!a) return;
    const spielen = () => { try { if (!spieleClip(name) && TOENE[name]) TOENE[name](); } catch (e) { /* Ton ist Nebensache */ } };
    if (a.state === 'running') return spielen();
    // Direkt nach dem ersten Tippen ist der Ton oft noch nicht freigegeben (z. B. Countdown beim Spielstart):
    // kurz auf die Freigabe warten, aber nicht nachholen, wenn es zu spät ist
    const seit = performance.now();
    a.resume().then(() => { if (a.state === 'running' && performance.now() - seit < 500) spielen(); }).catch(() => {});
  }

  // Vibration bei Fehlern und Unfällen (nur Android; iPhones erlauben es Webseiten nicht – dort passiert einfach nichts)
  function vibrieren(muster) {
    const ua = navigator.userActivation;   // Browser erlauben Vibration erst nach dem ersten echten Tippen
    if (ua && !ua.hasBeenActive) return;
    try { if (navigator.vibrate) navigator.vibrate(muster); } catch (e) { /* Vibration ist Nebensache */ }
  }

  // ---------- Speicher (Bestwert, Ton an/aus) ----------
  function lesen(k) { try { return localStorage.getItem('mg:' + k); } catch (e) { return null; } }
  function schreiben(k, v) { try { localStorage.setItem('mg:' + k, v); } catch (e) { /* privat / gesperrt */ } }

  // ---------- Seite aufbauen ----------
  const SYM = {
    tonAn: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
    tonAus: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    voll: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    klein: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    uhr: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4"/></svg>',
    heim: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  };
  // Zurück zur Startseite mit allen Spielen (nur wenn kunde.js eine startseite nennt)
  const heim = K.startseite ? String(K.startseite).replace(/"/g, '') : '';
  // Stil „Notizzettel“ (kunde.js: stil: 'zettel', Sammlung „Akten & Action“, MZ 20.10.2026): gemaltes Bild bildschirmfüllend,
  // Logo auf eigenem weißen Schild oben links, Texte auf einem schrägen Zettel, Knöpfe unten. Gleiche Klassen wie die Karte,
  // damit Start- und Endbild-Code für beide Stile gilt. Ohne stil bleibt alles wie bisher.
  const zettel = K.stil === 'zettel';
  if (zettel) {
    document.documentElement.classList.add('stil-zettel');
    // Spielname in der Markenfarbe (MZ, 21.10.2026). Auf dem hellen Zettel so weit abdunkeln, dass der Kontrast
    // für große Schrift reicht (mind. 3,2:1 gegen den dunkleren Zettelton #f7efd6); kunde.js kann farben.titel vorgeben.
    const lum = hex => { const [r, g, b] = rgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const papier = lum('#f7efd6');
    let titel = farben.titel || farben.haupt;
    if (!farben.titel) for (let f = 0; f <= 0.8 && (papier + 0.05) / (lum(titel) + 0.05) < 3.2; f += 0.04) {
      titel = '#' + rgb(farben.haupt).map(v => Math.round(v * (1 - f)).toString(16).padStart(2, '0')).join('');
    }
    wurzel.setProperty('--titel-farbe', titel);
  }
  const schirme = zettel ? `
    <div class="schirm" id="startSchirm">
      <img class="hintergrund" alt="" hidden>
      <div class="logoschild"><img class="logo" alt=""></div>
      <div class="zettel">
        <h1 class="titel"></h1><p class="unter"></p><p class="anleitung"></p>
        <div class="besttafel" hidden><span class="name">Dein Bestwert:</span> <span class="zahl"></span></div>
        <p class="quellen"></p>
      </div>
      <div class="knoepfe">
        <button class="knopf" id="losKnopf" type="button">Los geht's</button>
        ${heim ? `<a class="knopf zweit" href="${heim}">Zum Menü</a>` : ''}
      </div>
    </div>
    <div class="schirm" id="endSchirm" hidden>
      <img class="hintergrund" alt="" hidden>
      <div class="logoschild"><img class="logo" alt=""></div>
      <div class="zettel">
        <p class="dachzeile"></p><h1 class="ueberschrift"></h1><img class="bild" alt="" hidden><div class="wert"></div><p class="vonzeile"></p><p class="bilanzzeile"></p><p class="hinweis"></p>
        <div class="zeit" hidden>${SYM.uhr}<span></span></div>
        <div class="auswertung" hidden><p class="kopf"></p><div class="zeilen"></div></div><p class="text"></p><p class="bestwert"></p>
      </div>
      <div class="knoepfe">
        <button class="knopf" id="extraKnopf" type="button" hidden></button>
        <a class="knopf" id="kundeKnopf" target="_blank" rel="noopener" hidden></a>
        <button class="knopf zweit" id="nochmalKnopf" type="button">Nochmal spielen</button>
        ${heim ? `<a class="knopf zweit" href="${heim}">Zum Menü</a>` : ''}
      </div>
    </div>` : `
    <div class="schirm" id="startSchirm"><div class="karte">
      <img class="logo" alt="">
      <h1 class="titel"></h1><p class="unter"></p><p class="anleitung"></p>
      <div class="besttafel" hidden><div class="name">Dein Bestwert</div><div class="zahl"></div></div>
      <button class="knopf" id="losKnopf" type="button">Los geht's</button>
      ${heim ? `<a class="knopf zweit" href="${heim}">Zum Menü</a>` : ''}
      <p class="quellen"></p>
    </div></div>
    <div class="schirm" id="endSchirm" hidden><div class="karte">
      <img class="logo" alt="">
      <h1 class="ueberschrift"></h1><img class="bild" alt="" hidden><div class="wert"></div><div class="zeit" hidden>${SYM.uhr}<span></span></div>
      <div class="auswertung" hidden><p class="kopf"></p><div class="zeilen"></div></div><p class="bestwert"></p><p class="text"></p>
      <a class="knopf" id="kundeKnopf" target="_blank" rel="noopener" hidden></a>
      <button class="knopf zweit" id="nochmalKnopf" type="button">Nochmal spielen</button>
      ${heim ? `<a class="knopf zweit" href="${heim}">Zum Menü</a>` : ''}
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', `
    <canvas id="feld"></canvas>
    <div id="anzeige">
      ${heim ? `<a id="heimKnopf" href="${heim}" aria-label="Zum Menü">${SYM.heim}${zettel ? '<span class="lang">Zum Menü</span><span class="kurz">Menü</span>' : ''}</a>` : ''}
      <div class="links"></div><div class="rechts"></div>
      <button id="tonKnopf" type="button" aria-label="Ton an oder aus"></button>
      <button id="vollKnopf" type="button" aria-label="Vollbild"></button>
    </div>${schirme}`);

  const $ = s => document.querySelector(s);
  const feld = $('#feld'), g = feld.getContext('2d');
  // Zettel-Stil: Logo auf weißem Schild → Logo für helle Flächen
  const schirmLogo = zettel && K.logoAufHell ? K.logoAufHell : logo.src;
  document.querySelectorAll('.schirm .logo').forEach(i => { i.src = schirmLogo; i.alt = K.firma || ''; });
  // Hintergrundbild für Start- oder Endbild im Zettel-Stil (z. B. umgefärbtes gemaltes Bild als Adresse);
  // position = sichtbarer Bildausschnitt beim Zuschneiden (CSS object-position, z. B. '25% 50%'), Standard Mitte
  function schirmBild(welcher, adresse, position) {
    const b = $((welcher === 'ende' ? '#endSchirm' : '#startSchirm') + ' .hintergrund');
    if (!b) return;
    b.hidden = !adresse;
    b.style.objectPosition = position || '';
    if (adresse) b.src = adresse; else b.removeAttribute('src');
  }

  const tonKnopf = $('#tonKnopf');
  function tonSymbol() { tonKnopf.innerHTML = tonAn ? SYM.tonAn : SYM.tonAus; }
  tonKnopf.addEventListener('click', () => {
    tonAn = !tonAn; schreiben('ton', tonAn ? 'an' : 'aus'); tonSymbol();
    if (tonAn) { audio(); ton('klick'); if (zustand === 'spiel') schleifeStarten(); startMusikAn(); } else { schleifeStoppen(); dauertoeneAus(); startMusikAus(); }
  });
  tonSymbol();

  // Vollbild gibt es nicht überall (iPhone, eingebettet ohne allow="fullscreen")
  const vollKnopf = $('#vollKnopf');
  const vollGeht = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (!vollGeht) vollKnopf.hidden = true;
  function istVoll() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function vollSymbol() { vollKnopf.innerHTML = istVoll() ? SYM.klein : SYM.voll; }
  vollKnopf.addEventListener('click', () => {
    const d = document, el = d.documentElement;
    if (istVoll()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  });
  document.addEventListener('fullscreenchange', vollSymbol);
  document.addEventListener('webkitfullscreenchange', vollSymbol);
  vollSymbol();

  // ---------- Spiel ----------
  let S = null;                 // das angemeldete Spiel
  let zustand = 'start';        // start → spiel → ende
  let B = 0, H = 0, dpr = 1;
  let texte = {};

  function zahl(p) { return S.format ? S.format(p) : String(p); }
  function bestKey() { return 'best:' + S.id + ':' + (K.firma || ''); }
  function besser(a, b) { return b == null || (S.wertung === 'niedrig' ? a < b : a > b); }

  function startSchirm() {
    $('#startSchirm .titel').textContent = texte.titel || '';
    $('#startSchirm .unter').textContent = texte.untertitel || '';
    $('#startSchirm .anleitung').textContent = texte.anleitung || '';
    const b = lesen(bestKey());
    // Bestwert als Tafel: Zahl groß, Rest klein („854/1.000 Punkte“). Noch nicht gespielt: bei Punkten 0, bei Zeiten nichts
    const tafel = $('#startSchirm .besttafel'), tz = tafel.querySelector('.zahl');
    tafel.hidden = b == null && S.wertung === 'niedrig';
    if (!tafel.hidden) {
      const text = zahl(b == null ? 0 : +b), lz = text.indexOf(' ');
      tz.textContent = lz < 0 ? text : text.slice(0, lz);
      const e = document.createElement('small');
      e.textContent = S.hoechst ? '/' + zahl(S.hoechst) : (lz < 0 ? '' : ' ' + text.slice(lz + 1));
      tz.append(e);
    }
    $('#startSchirm .quellen').textContent = S.quellen || '';
    $('#startSchirm').hidden = false;
    $('#endSchirm').hidden = true;
  }

  function starten() {
    $('#startSchirm').hidden = true;
    $('#endSchirm').hidden = true;
    audio();
    zustand = 'spiel';
    if (musikImSpiel()) musikPegel(1); else startMusikAus();   // läuft weiter, leiser (imSpiel) – sonst wie bisher aus
    anzeige('', '');
    S.neu && S.neu();
    schleifeStarten();
  }

  function ende(punkte, extra) {
    if (zustand !== 'spiel') return;
    zustand = 'ende';
    musikPegel(1);   // Endbild: Musik (falls sie im Spiel weiterläuft) wieder auf vollen Pegel
    schleifeStoppen();
    dauertoeneAus();
    extra = extra || {};
    const alt = lesen(bestKey());
    // 0 Punkte (z. B. Spiel nach Unfall beendet) zählen nie als Bestwert
    const neu = !(S.wertung !== 'niedrig' && punkte <= 0) && besser(punkte, alt == null ? null : +alt);
    if (neu) schreiben(bestKey(), punkte);
    $('#endSchirm .ueberschrift').textContent = extra.ueberschrift || texte.endeTitel || 'Geschafft';
    // Optional ein Bild im Endbild (extra.bild = Adresse, z. B. Sieger- oder Verlierer-Szene)
    const bild = $('#endSchirm .bild');
    bild.hidden = !extra.bild;
    if (extra.bild) bild.src = extra.bild; else bild.removeAttribute('src');
    // Zahl groß, Einheit klein dahinter („536 Punkte“); darunter optional die Zeit als Plakette.
    // extra.wert ersetzt die Zahl durch einen kurzen Text (z. B. Bilanz bei Abbruch)
    const wert = $('#endSchirm .wert'), text = zahl(punkte), lz = text.indexOf(' ');
    wert.classList.toggle('bilanz', extra.wert != null);
    if (extra.wert != null) wert.textContent = extra.wert;
    else {
      wert.textContent = lz < 0 ? text : text.slice(0, lz);
      if (lz >= 0) { const e = document.createElement('small'); e.textContent = text.slice(lz + 1); wert.append(e); }
    }
    const zeit = $('#endSchirm .zeit');
    zeit.hidden = !extra.zusatz;
    zeit.querySelector('span').textContent = extra.zusatz || '';
    if (zettel) {
      // Zettel: nur die Zahl groß, darunter „von 1.000 Punkten – 84,3s“; Szene als Hintergrund statt im Zettel
      bild.hidden = true;
      schirmBild('ende', extra.bild || '', extra.bildPosition);
      if (extra.wert == null) wert.textContent = lz < 0 ? text : text.slice(0, lz);
      const von = extra.wert == null && S.hoechst ? 'von ' + S.hoechst.toLocaleString('de-DE') + ' Punkten' : '';
      $('#endSchirm .vonzeile').textContent = [von, extra.wert == null ? extra.zusatz : ''].filter(Boolean).join(' – ');
      zeit.hidden = true;
      $('#endSchirm .bilanzzeile').textContent = extra.zeile || '';   // kleine Zusatzzeile unter Punkten/Zeit (z. B. Bilanz)
      $('#endSchirm .dachzeile').textContent = extra.dach || '';      // kleine Zeile über der Bewertung (z. B. „Level 1 – Fristen“)
      $('#endSchirm .hinweis').textContent = extra.hinweis || '';     // hervorgehobener Hinweis (z. B. „Level 2 freigeschaltet“)
    }
    auswertung(extra.auswertung);
    const bw = $('#endSchirm .bestwert');
    // ohne Ausrufezeichen (MZ, 20.10.2026)
    bw.textContent = neu ? (alt == null ? 'Dein erster Bestwert' : 'Neuer Bestwert') : 'Dein Bestwert: ' + zahl(alt == null ? 0 : +alt);
    bw.classList.toggle('neu', neu);
    $('#endSchirm .text').textContent = extra.text || texte.ende || '';
    const kk = $('#kundeKnopf'), kn = K.knopf || {};
    kk.hidden = !kn.link;
    if (kn.link) { kk.href = kn.link; kk.textContent = kn.text || 'Mehr erfahren'; }
    // extra.nochmalZuerst (z. B. bei Abbruch): „Nochmal spielen“ als Hauptknopf ganz oben, Kundenknopf darunter
    const nk = $('#nochmalKnopf'), zuerst = !!extra.nochmalZuerst;
    if (zuerst) kk.before(nk); else nk.before(kk);
    nk.classList.toggle('zweit', !zuerst);
    kk.classList.toggle('zweit', zuerst);
    // extra.extraKnopf = { text, klick } (nur Zettel-Stil): zusätzlicher Hauptknopf ganz oben, z. B. „Weiter zu Level 2“;
    // klick() wird vor dem Start des neuen Spiels aufgerufen
    const xk = $('#extraKnopf');
    if (xk) {
      extraAktion = extra.extraKnopf ? extra.extraKnopf.klick : null;
      xk.hidden = !extra.extraKnopf;
      xk.textContent = extra.extraKnopf ? extra.extraKnopf.text : '';
      if (extra.extraKnopf) { kk.classList.add('zweit'); nk.classList.add('zweit'); }
    }
    setTimeout(() => {
      $('#endSchirm').hidden = false;
      if (neu && alt != null) ton('bestwert');
    }, extra.verzoegerung != null ? extra.verzoegerung : 900);
  }

  // Auswertung im Endbild: eine Zeile je Runde mit Balken, die schwächste Runde rot.
  // a = { kopf: 'Deine Lücken', zeilen: [{ name, zusatz, anteil (0–1, null = nicht gespielt), wert, max, schlecht }] }
  function auswertung(a) {
    const box = $('#endSchirm .auswertung'), liste = box.querySelector('.zeilen');
    box.hidden = !(a && a.zeilen && a.zeilen.length);
    liste.textContent = '';
    if (box.hidden) return;
    box.querySelector('.kopf').textContent = a.kopf || '';
    const gespielt = a.zeilen.filter(z => z.anteil != null);
    const schwach = gespielt.length > 1 ? gespielt.reduce((m, z) => z.anteil < m.anteil ? z : m) : null;
    const el = (tag, klasse, text) => { const e = document.createElement(tag); if (klasse) e.className = klasse; if (text != null) e.textContent = text; return e; };
    a.zeilen.forEach(z => {
      const zeile = el('div', 'zeile' + (z.anteil == null ? ' offen' : '') + (z.schlecht || z === schwach ? ' schlecht' : ''));
      const name = el('span', 'name', z.name);
      if (z.zusatz) name.append(' ', el('small', '', z.zusatz));
      const balken = el('span', 'balken'), fuell = el('i');
      fuell.style.width = Math.round(Math.max(0, Math.min(1, z.anteil || 0)) * 100) + '%';
      balken.append(fuell);
      const wert = el('span', 'zahl', z.wert);
      if (z.max) wert.append(el('small', '', z.max));
      zeile.append(name, balken, wert);
      liste.append(zeile);
    });
  }

  $('#losKnopf').addEventListener('click', starten);
  let extraAktion = null;
  if ($('#extraKnopf')) $('#extraKnopf').addEventListener('click', () => { if (extraAktion) extraAktion(); starten(); });
  $('#nochmalKnopf').addEventListener('click', starten);

  function anzeige(links, rechts) {
    $('#anzeige .links').textContent = links;
    $('#anzeige .rechts').textContent = rechts;
    anzeigeEng();
  }
  // Zettel-Stil: Passen Spielstand und Punkte nicht in eine Zeile neben „⌂ Zum Menü“ und die Knöpfe, stehen sie
  // zweizeilig übereinander (Klasse eng). Geprüft wird mit dem längsten Punktestand („1.000 Punkte“), damit die
  // Kopfzeile nicht mitten im Spiel umspringt.
  function anzeigeEng() {
    if (!zettel) return;
    const a = $('#anzeige'), l = $('#anzeige .links'), r = $('#anzeige .rechts'), text = r.textContent;
    if (!l.textContent) { a.classList.remove('eng'); return; }
    a.classList.remove('eng');
    r.textContent = text.replace(/\d[\d.]*/, '1.000');
    const eng = l.scrollWidth > l.clientWidth + 1;
    r.textContent = text;
    a.classList.toggle('eng', eng);
  }
  addEventListener('resize', () => { if (zustand === 'spiel') anzeigeEng(); });

  // ---------- Größe ----------
  function groesse() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    B = innerWidth; H = innerHeight;
    feld.width = Math.round(B * dpr); feld.height = Math.round(H * dpr);
    S && S.groesse && S.groesse(B, H);
  }
  addEventListener('resize', groesse);

  // ---------- Eingabe ----------
  let finger = null;
  function punkt(e) { const r = feld.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  feld.addEventListener('pointerdown', e => {
    if (zustand !== 'spiel' || finger !== null) return;
    finger = e.pointerId;
    try { feld.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
    S.runter && S.runter(...punkt(e));
    e.preventDefault();
  });
  feld.addEventListener('pointermove', e => {
    if (e.pointerId !== finger || zustand !== 'spiel') return;
    S.bewegen && S.bewegen(...punkt(e));
  });
  function los(e) {
    if (e.pointerId !== finger) return;
    finger = null;
    if (zustand === 'spiel') S.hoch && S.hoch(...punkt(e));
  }
  feld.addEventListener('pointerup', los);
  feld.addEventListener('pointercancel', los);

  // ---------- Schleife ----------
  let zuletzt = performance.now();
  function bild(jetzt) {
    const dt = Math.min(0.05, (jetzt - zuletzt) / 1000);
    zuletzt = jetzt;
    if (zustand === 'spiel' && S.schritt) S.schritt(dt);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, B, H);
    S.zeichne(g, B, H, zustand, dt);
    requestAnimationFrame(bild);
  }

  // ---------- Schnittstelle für die Spiele ----------
  window.Rahmen = {
    kunde: K, farben, textFarbe, toenen, mitAlpha, umfaerben,
    zeichneLogo, get logoBereit() { return logoBereit; },
    ton, dauerton, vibrieren, ende, anzeige, schirmBild, zettel,
    get musik() { return startMusikLaeuft ? { laeuft: true, pegel: +startMusikLaeuft.v.gain.value.toFixed(4) } : { laeuft: false }; },   // Testhilfe
    get zustand() { return zustand; },
    // Startbild neu aufbauen (z. B. nach Level-Wahl: anderer Bestwert-Schlüssel S.id, andere Texte)
    startbildAktualisieren(neueTexte) {
      if (neueTexte) texte = Object.assign({}, S.texte, neueTexte, K.texte);
      if (zustand === 'start') startSchirm();
    },
    // eigenes Element ins Startbild (Zettel bzw. Karte), vor die Bestwert-Tafel – z. B. Level-Wahl
    startElement(el) { const t = $('#startSchirm .besttafel'); t.parentNode.insertBefore(el, t); },
    spiel(def) {
      S = def;
      if (def.klaenge) klaenge(def.klaenge);
      if (def.startMusik) klaenge({ startmusik: def.startMusik });
      schleifeName = def.schleife || null;
      texte = Object.assign({}, def.texte, K.texte);
      document.title = (texte.titel || 'Spiel') + (K.firma ? ' – ' + K.firma : '');
      groesse();
      S.neu && S.neu();
      startSchirm();
      startMusikAn();   // klappt nur, wenn der Browser Ton schon erlaubt; sonst beim ersten Tippen
      requestAnimationFrame(bild);
    },
  };
})();
