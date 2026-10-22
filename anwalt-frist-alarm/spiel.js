// Frist-Alarm („Akten & Action“): Akten fliegen auf den Schreibtisch, der Spieler tippt den Korb an, in den die Akte
// gehört – bevor die Uhr an der Akte abläuft. Level 1: nach Frist sortieren, Level 2: nach Rechtsgebiet. 10 Akten pro Spiel,
// drei versäumte Fristen = Abbruch.
// Ablauf, Körbe, Aktentexte, Tempo und Punkte: Auftrag des Supervisors vom 20.10.2026 (von MZ freigegeben).
(function () {
  'use strict';
  const R_ = Rahmen, F = R_.farben, K = R_.kunde;
  const SCHRIFT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const BLAUGRAU = F.blaugrau || '#475e6c';     // zweite Hausfarbe: Korbschilder, Kopf des Aktenschilds
  const WARNUNG = '#d9483b';                     // Uhr kurz vor Ablauf, falscher Korb, Stempel
  const GUT = '#5f9e3a';                         // Haken bei richtigem Korb
  const RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches;   // weniger Bewegung (Erklärungs-Zettel)

  // ---------- Inhalte ----------
  // Körbe von links nach rechts. ­ = Trennstelle, falls ein Wort auf schmalen Handys nicht in eine Zeile passt.
  const KOERBE = ['Heute', 'Morgen', 'Diese Woche', 'Erfordert Rück­sprache', 'Hat Zeit'];
  const HEUTE = 0, MORGEN = 1, WOCHE = 2, RUECK = 3, ZEIT = 4;
  // Wortgetreu aus Anwalt-Game/Material/Texte/frist-alarm-akten-entwurf.md (Nr. 1–36 freigegeben 20.10.2026, Nr. 37–100 am 21.10.2026).
  // Die Spalte „Begründung“ wird nicht angezeigt. Vor dem Gedankenstrich steht im Spiel ein geschütztes Leerzeichen.
  const AKTEN = [
    // Teil A – Frist steht auf der Akte
    [1, 'A', 'Arbeitsrecht', 'Kündigungsschutzklage – Frist: heute', HEUTE],
    [2, 'A', 'Mietrecht', 'Widerspruch gegen Eigenbedarfskündigung – Frist: in 5 Wochen', ZEIT],
    [3, 'A', 'Verkehrsrecht', 'Einspruch gegen Bußgeldbescheid – Frist: morgen', MORGEN],
    [4, 'A', 'Strafrecht', 'Einspruch gegen Strafbefehl – Frist: in 4 Tagen', WOCHE],
    [5, 'A', 'Zivilrecht', 'Widerspruch gegen Mahnbescheid – Frist: heute', HEUTE],
    [6, 'A', 'Vertragsrecht', 'Widerruf eines Online-Vertrags – Frist: in 3 Tagen', WOCHE],
    [7, 'A', 'Einv. Scheidung', 'Unterlagen zum Versorgungsausgleich ans Gericht – Frist: in 3 Wochen', ZEIT],
    [8, 'A', 'Arbeitsrecht', 'Klage gegen Befristung – Frist: morgen', MORGEN],
    [9, 'A', 'Mietrecht', 'Zustimmung zur Mieterhöhung – Frist: in 6 Tagen', WOCHE],
    [10, 'A', 'Zivilrecht', 'Berufung einlegen – Frist: in 2 Wochen', ZEIT],
    [11, 'A', 'Strafrecht', 'Revision einlegen – Frist: heute', HEUTE],
    [12, 'A', 'Verkehrsrecht', 'Unfallschaden der Versicherung melden – Frist: morgen', MORGEN],
    [13, 'A', 'Wohnungseigentum', 'Klage gegen Beschluss der Eigentümer – Frist: in 2 Tagen', WOCHE],
    [14, 'A', 'Vertragsrecht', 'Stellungnahme an die Gegenseite – Frist: in 10 Tagen', ZEIT],
    [15, 'A', 'Zivilrecht', 'Klageerwiderung – Frist: morgen', MORGEN],
    [16, 'A', 'Arbeitsrecht', 'Lohn schriftlich einfordern (Ausschlussfrist) – Frist: heute', HEUTE],
    [17, 'A', 'Verkehrsrecht', 'Einspruch gegen Bußgeldbescheid – Zustelldatum fehlt', RUECK],
    [18, 'A', 'Mietrecht', 'Kündigung der Wohnung – Mandant weiß nicht, wann der Brief kam', RUECK],
    // Teil B – Frist selbst erkennen
    [19, 'B', 'Arbeitsrecht', 'Kündigung erhalten vor 20 Tagen – Klage gewünscht', MORGEN],
    [20, 'B', 'Arbeitsrecht', 'Kündigung erhalten vor 21 Tagen – Klage gewünscht', HEUTE],
    [21, 'B', 'Verkehrsrecht', 'Bußgeldbescheid zugestellt vor 14 Tagen', HEUTE],
    [22, 'B', 'Verkehrsrecht', 'Bußgeldbescheid zugestellt vor 3 Tagen', ZEIT],
    [23, 'B', 'Strafrecht', 'Strafbefehl zugestellt vor 10 Tagen', WOCHE],
    [24, 'B', 'Strafrecht', 'Urteil gestern verkündet – Revision gewünscht', WOCHE],
    [25, 'B', 'Strafrecht', 'Urteil vor 6 Tagen verkündet – Berufung gewünscht', MORGEN],
    [26, 'B', 'Zivilrecht', 'Mahnbescheid zugestellt vor 13 Tagen', MORGEN],
    [27, 'B', 'Zivilrecht', 'Urteil zugestellt vor 5 Tagen – Berufung gewünscht', ZEIT],
    [28, 'B', 'Vertragsrecht', 'Online bestellt, Ware vor 13 Tagen erhalten – Widerruf gewünscht', MORGEN],
    [29, 'B', 'Wohnungseigentum', 'Eigentümerversammlung vor 10 Tagen – Beschluss anfechten', ZEIT],
    [30, 'B', 'Einv. Scheidung', 'Seit 5 Monaten getrennt – beide wollen die Scheidung', ZEIT],
    [31, 'B', 'Mietrecht', 'Mieterhöhung Anfang dieses Monats erhalten', ZEIT],
    [32, 'B', 'Arbeitsrecht', 'Kündigung erhalten – Mandant nennt kein Datum', RUECK],
    [33, 'B', 'Zivilrecht', 'Mahnbescheid – Umschlag mit Zustelldatum fehlt', RUECK],
    [34, 'B', 'Einv. Scheidung', 'Ehepartner nennen unterschiedliche Trennungsdaten', RUECK],
    [35, 'B', 'Strafrecht', 'Strafbefehl „irgendwann letzte Woche“ erhalten', RUECK],
    [36, 'B', 'Vertragsrecht', 'Widerruf gewünscht – unklar, ob online oder im Laden gekauft', RUECK],
    // Teil C (Nr. 37–68, zählt zu Teil A) und Teil D (Nr. 69–100, zählt zu Teil B) – Erweiterung, von MZ freigegeben 21.10.2026
    [37, 'A', 'Arbeitsrecht', 'Klage auf Berichtigung des Arbeitszeugnisses – Frist: in 3 Wochen', ZEIT],
    [38, 'A', 'Arbeitsrecht', 'Gegendarstellung zur Abmahnung – Frist: morgen', MORGEN],
    [39, 'A', 'Arbeitsrecht', 'Stellungnahme an den Arbeitgeber – Frist: heute', HEUTE],
    [40, 'A', 'Arbeitsrecht', 'Aufhebungsvertrag prüfen – Frist: in 4 Tagen', WOCHE],
    [41, 'A', 'Mietrecht', 'Einwände gegen die Nebenkostenabrechnung – Frist: in 2 Monaten', ZEIT],
    [42, 'A', 'Mietrecht', 'Mängelanzeige an den Vermieter – Frist: morgen', MORGEN],
    [43, 'A', 'Mietrecht', 'Erwiderung auf die Räumungsklage – Frist: heute', HEUTE],
    [44, 'A', 'Wohnungseigentum', 'Begründung der Klage gegen den Beschluss – Frist: in 5 Tagen', WOCHE],
    [45, 'A', 'Verkehrsrecht', 'Akteneinsicht im Bußgeldverfahren beantragen – Frist: in 6 Tagen', WOCHE],
    [46, 'A', 'Verkehrsrecht', 'Gutachten an die Versicherung schicken – Frist: in 2 Wochen', ZEIT],
    [47, 'A', 'Verkehrsrecht', 'Einspruch gegen Bußgeldbescheid – Frist: heute', HEUTE],
    [48, 'A', 'Verkehrsrecht', 'Antwort auf den Anhörungsbogen – Frist: in 3 Tagen', WOCHE],
    [49, 'A', 'Einv. Scheidung', 'Unterlagen für den Scheidungsantrag – Frist: in 2 Wochen', ZEIT],
    [50, 'A', 'Einv. Scheidung', 'Fragebogen zum Versorgungsausgleich – Frist: morgen', MORGEN],
    [51, 'A', 'Einv. Scheidung', 'Vereinbarung zum Unterhalt prüfen – Frist: in 5 Tagen', WOCHE],
    [52, 'A', 'Vertragsrecht', 'Mängelrüge an den Handwerker – Frist: heute', HEUTE],
    [53, 'A', 'Vertragsrecht', 'Kündigung des Fitnessstudio-Vertrags – Frist: morgen', MORGEN],
    [54, 'A', 'Vertragsrecht', 'Rücktritt vom Kaufvertrag erklären – Frist: in 4 Wochen', ZEIT],
    [55, 'A', 'Vertragsrecht', 'Nachfrist für die Lieferung setzen – Frist: in 2 Tagen', WOCHE],
    [56, 'A', 'Zivilrecht', 'Verteidigungsanzeige ans Gericht – Frist: morgen', MORGEN],
    [57, 'A', 'Zivilrecht', 'Einspruch gegen Versäumnisurteil – Frist: heute', HEUTE],
    [58, 'A', 'Zivilrecht', 'Berufungsbegründung – Frist: in 6 Wochen', ZEIT],
    [59, 'A', 'Zivilrecht', 'Einspruch gegen Vollstreckungsbescheid – Frist: in 3 Tagen', WOCHE],
    [60, 'A', 'Strafrecht', 'Berufung einlegen – Frist: morgen', MORGEN],
    [61, 'A', 'Strafrecht', 'Stellungnahme zur Anklageschrift – Frist: in 10 Tagen', ZEIT],
    [62, 'A', 'Strafrecht', 'Stellungnahme an die Staatsanwaltschaft – Frist: heute', HEUTE],
    [63, 'A', 'Strafrecht', 'Revisionsbegründung – Frist: in 3 Wochen', ZEIT],
    [64, 'A', 'Arbeitsrecht', 'Kündigungsschutzklage – Datum auf der Kündigung unleserlich', RUECK],
    [65, 'A', 'Vertragsrecht', 'Widerruf gewünscht – Mandant findet den Vertrag nicht', RUECK],
    [66, 'A', 'Zivilrecht', 'Gerichtsbrief nur abfotografiert – Datum nicht zu sehen', RUECK],
    [67, 'A', 'Verkehrsrecht', 'Anhörungsbogen – unklar, wer gefahren ist', RUECK],
    [68, 'A', 'Mietrecht', 'Mieterhöhung – unklar, ob Mandant schon zugestimmt hat', RUECK],
    // Teil D – Frist selbst erkennen (zählt zu Teil B)
    [69, 'B', 'Arbeitsrecht', 'Kündigung erhalten vor 5 Tagen – Klage gewünscht', ZEIT],
    [70, 'B', 'Arbeitsrecht', 'Kündigung erhalten vor 16 Tagen – Klage gewünscht', WOCHE],
    [71, 'B', 'Arbeitsrecht', 'Befristeter Vertrag endete vor 15 Tagen – Klage gewünscht', WOCHE],
    [72, 'B', 'Arbeitsrecht', 'Kündigung vor 13 Tagen erhalten – Mandantin ist schwanger, der Arbeitgeber weiß es nicht', MORGEN],
    [73, 'B', 'Verkehrsrecht', 'Bußgeldbescheid zugestellt vor 13 Tagen', MORGEN],
    [74, 'B', 'Verkehrsrecht', 'Bußgeldbescheid zugestellt vor 9 Tagen', WOCHE],
    [75, 'B', 'Verkehrsrecht', 'Unfall vor 6 Tagen – noch nicht der eigenen Versicherung gemeldet', MORGEN],
    [76, 'B', 'Verkehrsrecht', 'Fahrverbot seit einer Woche rechtskräftig – Mandant will den Antritt planen', ZEIT],
    [77, 'B', 'Strafrecht', 'Urteil heute verkündet – Berufung gewünscht', WOCHE],
    [78, 'B', 'Strafrecht', 'Urteil vor 7 Tagen verkündet – Revision gewünscht', HEUTE],
    [79, 'B', 'Strafrecht', 'Strafbefehl zugestellt vor 14 Tagen', HEUTE],
    [80, 'B', 'Strafrecht', 'Strafbefehl zugestellt vor 2 Tagen', ZEIT],
    [81, 'B', 'Zivilrecht', 'Versäumnisurteil zugestellt vor 12 Tagen', WOCHE],
    [82, 'B', 'Zivilrecht', 'Vollstreckungsbescheid zugestellt vor 14 Tagen', HEUTE],
    [83, 'B', 'Zivilrecht', 'Klage zugestellt vor 13 Tagen – Gericht fordert Verteidigungsanzeige', MORGEN],
    [84, 'B', 'Zivilrecht', 'Mahnbescheid zugestellt vor 4 Tagen', ZEIT],
    [85, 'B', 'Zivilrecht', 'Berufung eingelegt, Urteil vor 5 Wochen zugestellt – Begründung fehlt noch', ZEIT],
    [86, 'B', 'Vertragsrecht', 'Online bestellt, Ware vor 14 Tagen erhalten – Widerruf gewünscht', HEUTE],
    [87, 'B', 'Vertragsrecht', 'Online bestellt, Ware vor 10 Tagen erhalten – Widerruf gewünscht', WOCHE],
    [88, 'B', 'Vertragsrecht', 'Neuwagen hat einen Mangel – gekauft vor 6 Monaten', ZEIT],
    [89, 'B', 'Vertragsrecht', 'Firma bekam heute Ware mit Mängeln – will sie rügen', HEUTE],
    [90, 'B', 'Mietrecht', 'Nebenkostenabrechnung vor 3 Monaten erhalten – Einwände gewünscht', ZEIT],
    [91, 'B', 'Mietrecht', 'Räumungsklage wegen Mietschulden vor 7 Wochen zugestellt – Mandant will alles nachzahlen', ZEIT],
    [92, 'B', 'Mietrecht', 'Fristlose Kündigung – Mandant weiß nicht, ob die Miete überwiesen ist', RUECK],
    [93, 'B', 'Wohnungseigentum', 'Eigentümerversammlung gestern – Beschluss anfechten', ZEIT],
    [94, 'B', 'Einv. Scheidung', 'Scheidungsbeschluss vor 4 Tagen zugestellt – Beschwerde gewünscht', ZEIT],
    [95, 'B', 'Einv. Scheidung', 'Gericht will Gehaltsnachweise binnen 2 Wochen – Schreiben kam vor 12 Tagen', WOCHE],
    [96, 'B', 'Verkehrsrecht', 'Bußgeldbescheid lag „ein paar Tage“ beim Nachbarn', RUECK],
    [97, 'B', 'Arbeitsrecht', 'Kündigung nur als Handyfoto erhalten – Datum des Originals unklar', RUECK],
    [98, 'B', 'Zivilrecht', 'Urteil erhalten – unklar, ob förmlich zugestellt', RUECK],
    [99, 'B', 'Strafrecht', 'Mandant weiß nicht, ob das Urteil verkündet oder der Termin vertagt wurde', RUECK],
    [100, 'B', 'Einv. Scheidung', 'Unklar, ob wirklich beide Ehepartner die Scheidung wollen', RUECK],
  ].map(([nr, teil, bereich, text, korb]) => ({ nr, teil, bereich, text: text.replace(/ – /g, ' – '), korb }));

  // ---------- Level 2 „Welches Rechtsgebiet?“ ----------
  // Körbe (MZ, 21.10.2026); Trennstellen für schmale Handys
  const KOERBE2 = ['Arbeits­recht', 'Miet­recht', 'Verkehrs­recht', 'Schei­dung', 'Vertrags­recht', 'Zivil­recht', 'Straf­recht'];
  // Wortgetreu aus Anwalt-Game/Material/Texte/frist-alarm-level2-entwurf.md (Nr. 1–140, Entwurf 21.10.2026, MZ prüft noch).
  // [Nr., leicht (L), Text, Korb 0–6]. Auf der Akte steht kein Fachbereich, sondern „Neuer Fall“.
  const AKTEN2 = [
    [1, true, 'Chef hat fristlos gekündigt – Mandant will sich wehren', 0],
    [2, true, 'Arbeitszeugnis enthält versteckte Kritik', 0],
    [3, true, 'Überstunden werden seit Monaten nicht bezahlt', 0],
    [4, true, 'Abmahnung wegen Zuspätkommens erhalten', 0],
    [5, true, 'Aufhebungsvertrag mit Abfindung angeboten', 0],
    [6, false, 'Urlaub wurde ohne Grund gestrichen', 0],
    [7, false, 'Befristeter Vertrag soll nicht verlängert werden', 0],
    [8, false, 'Nach der Elternzeit soll die Mandantin eine schlechtere Stelle bekommen', 0],
    [9, false, 'Betriebsrat wurde vor der Kündigung nicht angehört', 0],
    [10, false, 'Lohn kam zwei Monate zu spät', 0],
    [11, false, 'Kündigung in der Probezeit am letzten Tag erhalten', 0],
    [12, false, 'Chef verlangt die Fortbildungskosten zurück', 0],
    [13, false, 'Versetzung in eine 200 km entfernte Filiale angeordnet', 0],
    [14, false, 'Krankgeschrieben – Arbeitgeber zahlt kein Gehalt mehr', 0],
    [15, false, 'Wettbewerbsverbot im Arbeitsvertrag – neuer Job bei der Konkurrenz', 0],
    [16, true, 'Vermieter kündigt wegen Eigenbedarf', 1],
    [17, true, 'Schimmel im Schlafzimmer – Vermieter reagiert nicht', 1],
    [18, true, 'Nebenkostenabrechnung viel zu hoch', 1],
    [19, true, 'Kaution wird nach dem Auszug nicht zurückgezahlt', 1],
    [20, true, 'Miete soll um 15 Prozent steigen', 1],
    [21, false, 'Heizung fällt im Winter wochenlang aus', 1],
    [22, false, 'Miteigentümer baut ohne Zustimmung einen Wintergarten', 1],
    [23, false, 'Eigentümerversammlung beschließt eine teure Dachsanierung', 1],
    [24, false, 'Vermieter will die Wohnung ohne Termin betreten', 1],
    [25, false, 'Mieter hat zwei Monatsmieten nicht bezahlt', 1],
    [26, false, 'Untervermietung an einen Freund – Vermieter droht mit Kündigung', 1],
    [27, false, 'Hausverwaltung legt keine Jahresabrechnung vor', 1],
    [28, false, 'Baulärm im Haus – Mieterin will die Miete mindern', 1],
    [29, false, 'Haustiere laut Vertrag verboten – Mieterin hat eine Katze', 1],
    [30, true, 'Bußgeldbescheid: 30 km/h zu schnell', 2],
    [31, true, 'Auffahrunfall – Versicherung des Gegners zahlt nicht', 2],
    [32, true, 'Fahrverbot droht wegen Rotlichtverstoß', 2],
    [33, true, 'Geblitzt – Mandant war gar nicht der Fahrer', 2],
    [34, true, 'Punkte in Flensburg – Führerschein in Gefahr', 2],
    [35, false, 'Parkschaden – Unfallgegner bestreitet die Schuld', 2],
    [36, false, 'Handy am Steuer – Bußgeld und ein Punkt', 2],
    [37, false, 'Mietwagenkosten nach dem Unfall werden gekürzt', 2],
    [38, false, 'Wertminderung des Autos nach dem Unfall verlangt', 2],
    [39, false, 'Abstand zu gering – Messung angeblich fehlerhaft', 2],
    [40, false, 'Führerschein auf Probe – Aufbauseminar angeordnet', 2],
    [41, false, 'Radfahrer von einem Auto angefahren – Versicherung soll zahlen', 2],
    [42, false, 'Wildunfall – Kaskoversicherung verweigert die Zahlung', 2],
    [43, false, 'Auto nach dem Unfall drei Wochen in der Werkstatt – Nutzungsausfall', 2],
    [44, true, 'Ehepaar will sich nach einem Jahr Trennung scheiden lassen', 3],
    [45, true, 'Beide wollen die Scheidung – möglichst günstig', 3],
    [46, true, 'Wer bekommt nach der Trennung die gemeinsame Wohnung?', 3],
    [47, true, 'Rentenansprüche aus der Ehe sollen aufgeteilt werden', 3],
    [48, true, 'Unterhalt für die Ehefrau nach der Scheidung?', 3],
    [49, false, 'Trennungsjahr – Ehepaar lebt noch unter einem Dach', 3],
    [50, false, 'Vereinbarung über die Scheidungsfolgen soll aufgesetzt werden', 3],
    [51, false, 'Ehevertrag mit Gütertrennung – was gilt bei der Scheidung?', 3],
    [52, false, 'Gemeinsames Haus – einer der Ehepartner will es behalten', 3],
    [53, false, 'Kinder bleiben bei der Mutter – Umgang für den Vater regeln', 3],
    [54, false, 'Seit drei Jahren getrennt – nun soll die Scheidung kommen', 3],
    [55, false, 'Nur einer stellt den Antrag, der andere stimmt zu', 3],
    [56, false, 'Heirat im Ausland – Scheidung in Deutschland möglich?', 3],
    [57, false, 'Wer hat in der Ehe mehr Vermögen aufgebaut?', 3],
    [58, true, 'Online gekaufter Fernseher kam kaputt an', 4],
    [59, true, 'Handyvertrag verlängert sich automatisch – Kündigung gewünscht', 4],
    [60, true, 'Handwerker hat schlecht gearbeitet – Rechnung trotzdem voll?', 4],
    [61, true, 'Fitnessstudio will die Kündigung nicht annehmen', 4],
    [62, true, 'Vertreter an der Haustür – Vertrag soll widerrufen werden', 4],
    [63, false, 'Lieferant liefert seit Wochen nicht – Rücktritt gewünscht', 4],
    [64, false, 'Kleingedrucktes im Vertrag – ist die Klausel gültig?', 4],
    [65, false, 'Gebrauchtwagen vom Händler hat einen versteckten Mangel', 4],
    [66, false, 'Reise mangelhaft – Hotel ganz anders als gebucht', 4],
    [67, false, 'Küche falsch eingebaut – Schreiner soll nachbessern', 4],
    [68, false, 'Abo-Falle im Internet – Rechnung für ein ungewolltes Abo', 4],
    [69, false, 'Kaufvertrag über eine Einbauküche soll aufgelöst werden', 4],
    [70, false, 'Vertragsstrafe im Bauvertrag – viel zu hoch?', 4],
    [71, false, 'Waschmaschine nach 18 Monaten defekt – Gewährleistung?', 4],
    [72, true, 'Baum des Nachbarn wirft Äste aufs Grundstück', 5],
    [73, true, 'Hund des Nachbarn hat die Mandantin gebissen – Schmerzensgeld', 5],
    [74, true, 'Mahnbescheid über eine unbekannte Forderung erhalten', 5],
    [75, true, 'Ball schießt Fensterscheibe ein – Eltern sollen zahlen', 5],
    [76, true, 'Sturz auf nicht gestreutem Gehweg – Schadensersatz', 5],
    [77, false, 'Nachbar grillt jedes Wochenende – Rauch zieht ins Haus', 5],
    [78, false, 'Gerichtsvollzieher steht vor der Tür', 5],
    [79, false, 'Grenzstreit – Zaun steht einen Meter zu weit drüben', 5],
    [80, false, 'Foto ohne Erlaubnis im Internet veröffentlicht', 5],
    [81, false, 'Zahnarzt hat den falschen Zahn gezogen – Schmerzensgeld', 5],
    [82, false, 'Skiunfall – anderer Skifahrer hat den Mandanten umgefahren', 5],
    [83, false, 'Klage über 3.000 Euro vom Amtsgericht zugestellt', 5],
    [84, false, 'Reiterin stürzt – Pferdebesitzer soll haften', 5],
    [85, false, 'Vollstreckung aus einem alten Urteil droht', 5],
    [86, false, 'Drohne des Nachbarn filmt über dem Garten', 5],
    [87, true, 'Vorladung als Beschuldigter bei der Polizei', 6],
    [88, true, 'Anzeige wegen Diebstahls im Kaufhaus', 6],
    [89, true, 'Strafbefehl wegen Beleidigung erhalten', 6],
    [90, true, 'Schlägerei vor der Disco – Ermittlungsverfahren', 6],
    [91, true, 'Hausdurchsuchung am frühen Morgen', 6],
    [92, false, 'Vorwurf: Betrug beim Online-Verkauf', 6],
    [93, false, 'Anklage wegen Graffiti an einer Schule', 6],
    [94, false, 'Untersuchungshaft – Angehörige rufen an', 6],
    [95, false, 'Mandant soll als Zeuge aussagen – ist er selbst verdächtig?', 6],
    [96, false, 'Steuerhinterziehung beim Nebenjob vorgeworfen', 6],
    [97, false, 'Bedrohung per Nachricht angezeigt', 6],
    [98, false, 'Gekauftes Handy war gestohlen – Vorwurf Hehlerei', 6],
    [99, false, 'Hausfriedensbruch nach Streit mit dem Ex', 6],
    [100, false, 'Pflichtverteidiger bestellt – Mandant will wechseln', 6],
    [101, false, 'Mandant soll Minusstunden nacharbeiten', 0],
    [102, false, 'Arbeitgeber liest private E-Mails mit', 0],
    [103, false, 'Kündigung nach langer Krankheit', 0],
    [104, false, 'Mindestlohn wird nicht gezahlt', 0],
    [105, false, 'Mandantin wird im Team gemobbt', 0],
    [106, false, 'Vermieter verlangt beim Auszug neue Tapeten', 1],
    [107, false, 'Wohnung ist 10 m² kleiner als im Mietvertrag', 1],
    [108, false, 'Wasserrohrbruch – Vermieter lässt nicht reparieren', 1],
    [109, false, 'Staffelmiete im Vertrag – ist das erlaubt?', 1],
    [110, false, 'Eigentümergemeinschaft streitet über die Hausordnung', 1],
    [111, false, 'Haus verkauft – neuer Vermieter will den Mietvertrag ändern', 1],
    [112, false, 'Blitzerfoto unscharf – Gesicht kaum zu erkennen', 2],
    [113, false, 'Unfall beim Spurwechsel auf der Autobahn – wer haftet?', 2],
    [114, false, 'Überholverbot missachtet – Bußgeld und Punkt', 2],
    [115, false, 'Gutachter der Versicherung schätzt den Unfallschaden zu niedrig', 2],
    [116, false, 'MPU angeordnet – Führerschein weg', 2],
    [117, false, 'Steinschlag durch einen Lkw – Halter will nicht zahlen', 2],
    [118, false, 'Ehepartner verschweigt Vermögen bei der Trennung', 3],
    [119, false, 'Wer zahlt die Kosten der Scheidung?', 3],
    [120, false, 'Gemeinsame Schulden aus der Ehe – wer muss zahlen?', 3],
    [121, false, 'Nach der Scheidung – wer bekommt den gemeinsamen Hund?', 3],
    [122, false, 'Mandantin will nach der Scheidung ihren alten Namen zurück', 3],
    [123, false, 'Termin beim Familiengericht – braucht jeder einen Anwalt?', 3],
    [124, false, 'Online-Shop liefert falsche Farbe – Umtausch verweigert', 4],
    [125, false, 'Maler verlangt mehr als im Angebot stand', 4],
    [126, false, 'Gebrauchtes Handy von privat gekauft – Akku defekt', 4],
    [127, false, 'Zeitschriften-Abo am Telefon untergeschoben', 4],
    [128, false, 'Architekt hält den Fertigstellungstermin nicht ein', 4],
    [129, false, 'Internetanbieter liefert nur halbe Geschwindigkeit', 4],
    [130, false, 'Bauarbeiten nebenan – Risse in der eigenen Hauswand', 5],
    [131, false, 'Falscher Schufa-Eintrag – Löschung gewünscht', 5],
    [132, false, 'Falsche Behauptungen auf einem Bewertungsportal – Löschung gewünscht', 5],
    [133, false, 'Nachbar will dauerhaft über das Grundstück fahren', 5],
    [134, false, 'Dachlawine beschädigt geparktes Auto – Hausbesitzer soll zahlen', 5],
    [135, false, 'Schwarzfahren in der Bahn – Strafanzeige', 6],
    [136, false, 'Mandant soll Drogen verkauft haben', 6],
    [137, false, 'Vorwurf: gefälschtes Arztattest', 6],
    [138, false, 'Körperverletzung beim Fußballspiel angezeigt', 6],
    [139, false, 'Haftbefehl wegen nicht bezahlter Geldstrafe', 6],
    [140, false, 'Vorwurf: Betrug mit fremder Bankkarte', 6],
  ].map(([nr, leicht, text, korb]) => ({ nr, leicht, teil: 'A', bereich: 'Neuer Fall', text: text.replace(/ – /g, '\u00A0– '), korb }));

  // ---------- Level 3 „Vorgehen“ (MZ, 22.10.2026; vorher „Was ist zu tun?“) ----------
  // Körbe (MZ, 22.10.2026); Trennstellen für schmale Handys (z. B. „Kein Hand-/lungsbedarf“)
  const KOERBE3 = ['Einspruch', 'Wider­spruch', 'Klage', 'Rück­sprache', 'Kein Hand­lungs­bedarf'];
  // Wortgetreu aus Anwalt-Game/Material/Texte/frist-alarm-level3-entwurf.md (Nr. 1–100, Entwurf, MZ prüft noch).
  // [Nr., leicht (L), Fachbereich, Text, Korb 0–4]. Der Fachbereich steht als Kopf auf der Akte (verrät die Lösung nicht).
  const AKTEN3 = [
    [1, true, 'Verkehrsrecht', 'Bußgeldbescheid: 25 km/h zu schnell – Mandant war nicht der Fahrer', 0],
    [2, true, 'Verkehrsrecht', 'Bußgeldbescheid – Messgerät war nicht geeicht', 0],
    [3, false, 'Verkehrsrecht', 'Bußgeldbescheid mit Fahrverbot – Mandant braucht das Auto beruflich', 0],
    [4, false, 'Verkehrsrecht', 'Bußgeldbescheid wegen Rotlicht – Ampel war noch gelb', 0],
    [5, false, 'Verkehrsrecht', 'Bußgeldbescheid – falsches Kennzeichen notiert', 0],
    [6, false, 'Verkehrsrecht', 'Bußgeldbescheid wegen Abstand – Messung auf dem Video unklar', 0],
    [7, true, 'Strafrecht', 'Strafbefehl wegen Beleidigung – Mandant bestreitet die Äußerung', 0],
    [8, false, 'Strafrecht', 'Strafbefehl wegen Diebstahls – Tagessatz viel zu hoch', 0],
    [9, true, 'Strafrecht', 'Strafbefehl wegen Körperverletzung – es war Notwehr', 0],
    [10, false, 'Strafrecht', 'Strafbefehl wegen Betrugs – Mandant hat die Ware geliefert', 0],
    [11, false, 'Strafrecht', 'Strafbefehl wegen Sachbeschädigung – Mandant war im Urlaub', 0],
    [12, true, 'Zivilrecht', 'Versäumnisurteil – Mandant hat den Gerichtstermin verpasst', 0],
    [13, false, 'Zivilrecht', 'Versäumnisurteil über 2.400 Euro – Forderung war bezahlt', 0],
    [14, false, 'Zivilrecht', 'Vollstreckungsbescheid über eine fremde Forderung erhalten', 0],
    [15, false, 'Zivilrecht', 'Vollstreckungsbescheid – der Mahnbescheid kam nie an', 0],
    [16, false, 'Arbeitsrecht', 'Versäumnisurteil des Arbeitsgerichts – Mandant war am Termin krank', 0],
    [17, false, 'Mietrecht', 'Versäumnisurteil auf Räumung – Ladung kam nie an', 0],
    [18, false, 'Vertragsrecht', 'Vollstreckungsbescheid vom Inkassobüro – Vertrag war widerrufen', 0],
    [19, false, 'Verkehrsrecht', 'Bußgeldbescheid – Mandant war zur Tatzeit im Ausland', 0],
    [20, false, 'Strafrecht', 'Strafbefehl wegen Hausfriedensbruchs – Mandant hatte einen Schlüssel', 0],
    [21, false, 'Zivilrecht', 'Versäumnisurteil – Klage ging an die alte Adresse', 0],
    [22, false, 'Verkehrsrecht', 'Bußgeldbescheid wegen Parkens – Parkschein lag gut sichtbar aus', 0],
    [23, true, 'Zivilrecht', 'Mahnbescheid über eine Rechnung, die es nie gab', 1],
    [24, true, 'Zivilrecht', 'Mahnbescheid über 800 Euro – Ware wurde nie geliefert', 1],
    [25, true, 'Vertragsrecht', 'Mahnbescheid vom Fitnessstudio – Vertrag war gekündigt', 1],
    [26, false, 'Vertragsrecht', 'Mahnbescheid für ein Handy-Abo, das nie abgeschlossen wurde', 1],
    [27, false, 'Mietrecht', 'Mahnbescheid des Vermieters – Miete wurde bezahlt', 1],
    [28, false, 'Zivilrecht', 'Mahnbescheid – Forderung ist schon verjährt', 1],
    [29, false, 'Arbeitsrecht', 'Mahnbescheid des früheren Arbeitgebers wegen angeblicher Schäden', 1],
    [30, false, 'Verkehrsrecht', 'Mahnbescheid über Reparaturkosten – Unfall war nicht Mandants Schuld', 1],
    [31, true, 'Mietrecht', 'Kündigung wegen Eigenbedarf – Mieterin ist 85 und schwer krank', 1],
    [32, false, 'Mietrecht', 'Kündigung der Wohnung – Familie mit Kleinkind findet keine Ersatzwohnung', 1],
    [33, false, 'Mietrecht', 'Kündigung nach 40 Jahren Mietzeit – Mieter ist pflegebedürftig', 1],
    [34, false, 'Vertragsrecht', 'Mahnbescheid vom Inkassobüro – Betrag wird doppelt verlangt', 1],
    [35, false, 'Zivilrecht', 'Mahnbescheid – Mandant kennt den Absender nicht', 1],
    [36, false, 'Einv. Scheidung', 'Mahnbescheid des Ex-Partners über angebliche Schulden', 1],
    [37, false, 'Vertragsrecht', 'Mahnbescheid für Handwerkerarbeit – Arbeit war mangelhaft', 1],
    [38, false, 'Zivilrecht', 'Mahnbescheid über Schadensersatz – Mandant hat den Schaden nicht verursacht', 1],
    [39, true, 'Arbeitsrecht', 'Kündigung vor einer Woche erhalten – Mandant will den Job behalten', 2],
    [40, false, 'Arbeitsrecht', 'Dritte Befristung in Folge ohne Grund – Mandant will unbefristet bleiben', 2],
    [41, true, 'Arbeitsrecht', 'Lohn für drei Monate trotz Mahnung nicht gezahlt', 2],
    [42, false, 'Arbeitsrecht', 'Arbeitgeber weigert sich, ein Zeugnis auszustellen', 2],
    [43, false, 'Arbeitsrecht', 'Überstunden trotz Aufforderung nicht bezahlt', 2],
    [44, true, 'Mietrecht', 'Mieter zahlt seit drei Monaten nicht – Vermieter will die Wohnung zurück', 2],
    [45, false, 'Mietrecht', 'Kaution seit einem Jahr trotz Aufforderung nicht zurückgezahlt', 2],
    [46, false, 'Mietrecht', 'Mieter stimmt der berechtigten Mieterhöhung nicht zu', 2],
    [47, false, 'Wohnungseigentum', 'Eigentümer beschließen etwas Rechtswidriges – Mandant will es kippen', 2],
    [48, false, 'Verkehrsrecht', 'Versicherung des Unfallgegners lehnt die Zahlung endgültig ab', 2],
    [49, false, 'Verkehrsrecht', 'Schmerzensgeld nach Unfall – Versicherung zahlt nur die Hälfte', 2],
    [50, false, 'Vertragsrecht', 'Handwerker gibt die Anzahlung trotz Rücktritt nicht zurück', 2],
    [51, false, 'Vertragsrecht', 'Händler nimmt das defekte Auto trotz Rücktritt nicht zurück', 2],
    [52, false, 'Vertragsrecht', 'Kunde zahlt trotz Mahnungen nicht – Mahnverfahren ist gescheitert', 2],
    [53, false, 'Zivilrecht', 'Nachbar schneidet den überhängenden Baum trotz Aufforderung nicht', 2],
    [54, false, 'Zivilrecht', 'Hundehalter zahlt das Schmerzensgeld trotz Aufforderung nicht', 2],
    [55, false, 'Zivilrecht', 'Schuldner hat dem Mahnbescheid widersprochen – Mandant will weiter sein Geld', 2],
    [56, false, 'Zivilrecht', 'Falsche Bewertung im Internet – Verfasser löscht sie trotz Abmahnung nicht', 2],
    [57, false, 'Zivilrecht', 'Freund zahlt geliehene 5.000 Euro trotz Mahnung nicht zurück', 2],
    [58, false, 'Arbeitsrecht', 'Arbeitgeber zahlt die vereinbarte Abfindung nicht', 2],
    [59, false, 'Mietrecht', 'Vermieter beseitigt den Schimmel trotz Frist nicht', 2],
    [60, false, 'Vertragsrecht', 'Werkstatt gibt das bezahlte Auto nicht heraus', 2],
    [61, true, 'Arbeitsrecht', 'Kündigung wegen der Schwangerschaft erhalten', 2],
    [62, false, 'Zivilrecht', 'Baufirma zahlt keinen Schadensersatz für Risse im Nachbarhaus', 2],
    [63, false, 'Vertragsrecht', 'Reiseveranstalter erstattet die abgesagte Reise nicht', 2],
    [64, false, 'Arbeitsrecht', 'Nach 15 Jahren ohne Abmahnung gekündigt – Mandant will bleiben', 2],
    [65, true, 'Verkehrsrecht', 'Bußgeldbescheid – Mandant weiß nicht mehr, wer gefahren ist', 3],
    [66, false, 'Strafrecht', 'Strafbefehl erhalten – Mandant will erst wissen, was ein Einspruch kostet', 3],
    [67, false, 'Arbeitsrecht', 'Kündigung erhalten – unklar, wie viele Mitarbeiter der Betrieb hat', 3],
    [68, true, 'Mietrecht', 'Kündigung der Wohnung – Mandant findet den Mietvertrag nicht', 3],
    [69, true, 'Zivilrecht', 'Mahnbescheid – Mandant weiß nicht, ob er schon bezahlt hat', 3],
    [70, false, 'Vertragsrecht', 'Widerruf gewünscht – unklar, ob online oder im Laden gekauft', 3],
    [71, false, 'Einv. Scheidung', 'Ehepartner sind sich nicht einig, ob sie sich scheiden lassen', 3],
    [72, true, 'Einv. Scheidung', 'Unklar, seit wann das Paar getrennt lebt', 3],
    [73, false, 'Verkehrsrecht', 'Unfall – keine Fotos, keine Zeugen, Hergang unklar', 3],
    [74, true, 'Strafrecht', 'Polizei hat angerufen – als Zeuge oder als Beschuldigter?', 3],
    [75, false, 'Arbeitsrecht', 'Aufhebungsvertrag angeboten – Mandant weiß nicht, ob er gehen will', 3],
    [76, false, 'Mietrecht', 'Mieterhöhung erhalten – Mandant kennt seine bisherige Miete nicht genau', 3],
    [77, false, 'Vertragsrecht', 'Handwerkerrechnung – Mandant weiß nicht mehr, was vereinbart war', 3],
    [78, false, 'Zivilrecht', 'Brief vom Gericht – Mandant hat ihn weggeworfen', 3],
    [79, false, 'Verkehrsrecht', 'Anhörungsbogen – drei Familienmitglieder fahren das Auto', 3],
    [80, false, 'Strafrecht', 'Mandant soll gestanden haben – er erinnert sich nicht', 3],
    [81, false, 'Einv. Scheidung', 'Gibt es einen Ehevertrag? Mandant ist sich nicht sicher', 3],
    [82, false, 'Arbeitsrecht', 'Abmahnung erhalten – Mandant weiß nicht, wofür', 3],
    [83, true, 'Verkehrsrecht', 'Verwarnungsgeld 20 Euro – Mandant war zu schnell und will zahlen', 4],
    [84, true, 'Mietrecht', 'Nebenkostenabrechnung geprüft – alle Posten korrekt', 4],
    [85, true, 'Arbeitsrecht', 'Arbeitszeugnis „sehr gut“ – Mandant ist zufrieden', 4],
    [86, false, 'Zivilrecht', 'Mahnung erledigt – Gläubiger bestätigt die Zahlung', 4],
    [87, true, 'Vertragsrecht', 'Widerruf vom Shop bestätigt – Geld ist zurück', 4],
    [88, true, 'Strafrecht', 'Staatsanwaltschaft hat das Verfahren eingestellt', 4],
    [89, false, 'Einv. Scheidung', 'Scheidung rechtskräftig – alles geregelt', 4],
    [90, false, 'Mietrecht', 'Kaution vollständig zurückgezahlt', 4],
    [91, false, 'Verkehrsrecht', 'Gegnerische Versicherung hat den Schaden voll bezahlt', 4],
    [92, false, 'Arbeitsrecht', 'Arbeitgeber hat die Abmahnung zurückgenommen', 4],
    [93, false, 'Zivilrecht', 'Nachbar hat den Baum wie vereinbart zurückgeschnitten', 4],
    [94, false, 'Vertragsrecht', 'Handyvertrag gekündigt – Kündigung ist bestätigt', 4],
    [95, false, 'Strafrecht', 'Freispruch ist rechtskräftig', 4],
    [96, false, 'Mietrecht', 'Vermieter hat den Schimmel fachgerecht beseitigt', 4],
    [97, false, 'Verkehrsrecht', 'Punkte in Flensburg sind gelöscht', 4],
    [98, false, 'Zivilrecht', 'Gegner hat die Klage zurückgenommen', 4],
    [99, false, 'Arbeitsrecht', 'Kündigung zurückgenommen – Mandant arbeitet weiter', 4],
    [100, false, 'Einv. Scheidung', 'Rentenausgleich vom Gericht geregelt – Mandantin ist einverstanden', 4],
  ].map(([nr, leicht, bereich, text, korb]) => ({ nr, leicht, teil: 'A', bereich, text: text.replace(/ – /g, '\u00A0– '), korb }));

  // ---------- Level (MZ, 21.10.2026) ----------
  // Je Level 10 Akten, höchstens 1.000 Punkte, eigener Bestwert (id). Level nacheinander freischalten:
  // Level 2 erst, wenn Level 1 einmal geschafft ist, Level 3 erst nach Level 2.
  const LEVEL = [
    { nr: 1, name: 'Fristen', id: 'frist-alarm', koerbe: KOERBE, akten: AKTEN,
      tempo: { anfang: 8, ende: 5, teilB: 2 },          // erste Akte 8s, letzte 5s; Teil B +2s Lesezeit
      anleitung: 'Akten landen auf deinem Schreibtisch. Ab Akte 6 musst du bei manchen Akten die Frist selbst erkennen. Tippe den Korb an, in den die Akte gehört – bevor ihre Uhr abläuft. Je schneller, desto mehr Punkte. Nach drei versäumten Fristen ist das Spiel vorbei. Ab 5 richtigen Akten wird Level 2 freigeschaltet.' },
    { nr: 2, name: 'Rechtsgebiete', id: 'frist-alarm-2', koerbe: KOERBE2, akten: AKTEN2,
      tempo: { anfang: 7, ende: 5, teilB: 0 },          // Richtwert 7s → 5s (Lesen + 7 Körbe)
      anleitung: 'Tippe das Rechtsgebiet an, zu dem der Fall gehört – bevor die Uhr abläuft. Je schneller, desto mehr Punkte. Nach drei versäumten Fristen ist das Spiel vorbei. Ab 5 richtigen Akten wird Level 3 freigeschaltet.' },
    { nr: 3, name: 'Vorgehen', id: 'frist-alarm-3', koerbe: KOERBE3, akten: AKTEN3,
      tempo: { anfang: 8, ende: 6, teilB: 0 },          // Richtwert 8s → 6s (Lesen + Nachdenken)
      anleitung: 'Tippe an, was zu tun ist\u00A0– bevor die Uhr abläuft. Je schneller, desto mehr Punkte. Nach drei versäumten Fristen ist das Spiel vorbei.' },
  ];
  let LV = LEVEL[0];
  const korbName = i => LV.koerbe[i].replace(/­/g, '');
  // Freischaltung: höchstes spielbares Level, nur im Browser des Spielers (localStorage, Präfix mg:)
  const FREI_KEY = 'mg:frei:frist-alarm:' + (K.firma || '');
  function frei() { let f = 1; try { f = +localStorage.getItem(FREI_KEY) || 1; } catch (e) { /* privat */ } return Math.max(1, f); }
  function freischalten(n) { if (n > frei()) try { localStorage.setItem(FREI_KEY, String(n)); } catch (e) { /* privat */ } }
  const ZULETZT_KEY = 'mg:zuletzt:frist-alarm:' + (K.firma || '');
  function zuletztMerken() { try { localStorage.setItem(ZULETZT_KEY, String(LV.nr)); } catch (e) { /* privat */ } }
  function zuletzt() { let n = 1; try { n = +localStorage.getItem(ZULETZT_KEY) || 1; } catch (e) { /* privat */ } return n; }
  function bestwertVon(lv) { try { const b = localStorage.getItem('mg:best:' + lv.id + ':' + (K.firma || '')); return b == null ? null : +b; } catch (e) { return null; } }

  // ---------- Regeln ----------
  const ANZAHL = 10;            // Akten pro Spiel (alle Level): 5 leichte, dann 5 gemischt
  const FREI_AB = 5;            // nächstes Level erst ab 5 richtig abgelegten Akten (MZ, Player-Test 22.10.2026)
  const VORN = 5;
  const MAX_VERSAEUMT = 3;      // dritte versäumte Frist = Abbruch mit 0 Punkten
  // Punkte je Akte (höchstens 100 × 10 = 1.000): volle 100 in den ersten 2,5s (MZ, 22.10.2026; vorher 1,0s), danach linear bis 40 bei Ablauf.
  // Falscher Korb = 0 Punkte (keine versäumte Frist). Abgelaufen = 0 Punkte und versäumte Frist.
  const PUNKTE = { voll: 100, letzt: 40, vollBis: 2.5 };
  // Ablauf in Sekunden: Akte fliegt herein, in den Korb, Stempel bei versäumter Frist, Pause bis zur nächsten Akte
  const DAUER = { titel: 2.5, titelAus: 0.4, erst: 0.4, rein: 0.42, raus: 0.32, pause: 0.3, stempel: 1.05, fallen: 0.4, schild: 1.2, falsch: 1.5 };

  function zeitFuer(i, teil, lv) {
    const tp = (lv || LV).tempo;
    const t = tp.anfang + (tp.ende - tp.anfang) * i / (ANZAHL - 1) + (teil === 'B' ? tp.teilB : 0);
    return Math.round(t * 10) / 10;
  }
  function punkteFuer(richtig, t, T) {
    if (!richtig) return 0;
    const grenze = Math.min(PUNKTE.vollBis, T);
    if (t <= grenze) return PUNKTE.voll;
    const a = Math.min(1, (t - grenze) / (T - grenze));
    return Math.round(PUNKTE.voll + (PUNKTE.letzt - PUNKTE.voll) * a);
  }
  function stufe(p) {   // gemeinsame Grenzen 900/800/700/550
    return p >= 900 ? 'Fristen-Profi' : p >= 800 ? 'Sauber sortiert' : p >= 700 ? 'Solide Kanzleiarbeit' : p >= 550 ? 'Knapp vor Ablauf' : 'Die Akten stapeln sich';
  }
  function sek(t) { return t.toFixed(1).replace('.', ',') + 's'; }   // „84,3s“ – ohne Leerzeichen (Nutzerwunsch)
  function zahl(p) { return p.toLocaleString('de-DE'); }

  function mischen(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // 10 Akten ziehen, ohne Wiederholung. Level 1: die ersten 5 nur aus Teil A (Frist steht drauf), dann 5 aus den übrigen
  // (Teil A und B). Level 2 und 3: die ersten 5 aus den leichten (L), dann 5 aus allen übrigen.
  // erste = Nummer einer Akte, die zuerst kommen soll (Testhilfe #akte=N)
  function auswahl(erste, lv) {
    lv = lv || LV;
    const leicht = a => lv.nr === 1 ? a.teil === 'A' : a.leicht;
    const fest = erste ? lv.akten.find(a => a.nr === erste) : null;
    let liste = null;
    for (let v = 0; v < 5000; v++) {
      const a = mischen(lv.akten.filter(x => leicht(x) && x !== fest));
      const n = fest ? VORN - 1 : VORN;
      const vorn = (fest ? [fest] : []).concat(a.slice(0, n));
      const rest = mischen(a.slice(n).concat(lv.akten.filter(x => !leicht(x) && x !== fest))).slice(0, ANZAHL - VORN);
      liste = vorn.concat(rest);
      if (passt(liste, lv)) return liste;
    }
    return liste;
  }
  // Level 1: jeder der 5 Körbe mindestens 1×. Level 2: mindestens 6 der 7 Körbe, keiner öfter als 2×. Level 3: jeder 1–3×.
  // Beide: nie 3× derselbe Korb hintereinander.
  function passt(liste, lv) {
    lv = lv || LV;
    const n = lv.koerbe.map(() => 0);
    liste.forEach(a => { n[a.korb]++; });
    if (lv.nr === 2) { if (n.filter(x => x > 0).length < 6 || n.some(x => x > 2)) return false; }
    else if (lv.nr === 3) { if (n.some(x => x < 1 || x > 3)) return false; }   // Level 3: jeder Korb 1–3×
    else if (n.some(x => x < 1)) return false;
    for (let i = 2; i < liste.length; i++) if (liste[i].korb === liste[i - 1].korb && liste[i].korb === liste[i - 2].korb) return false;
    return true;
  }

  // ---------- Bilder ----------
  // akte.webp 484×720 (geschlossene Akte, Deckel #00FF00 → Kundenfarbe), rechts ragen ~6% Blätter heraus.
  // korb.webp 320×475 (weiße Ablage von oben), Boden innen etwa x 12–90%, y 8–86%.
  // schreibtisch.webp 1100×1100 (Eichenplatte). ende-sieg/ende-chaos.webp 833×941 bzw. 834×941 (Hälften von frist-alarm-ende.png).
  // start.webp 1024×1536 (frist-alarm-start.png, Hintergrund des Startbilds im Zettel-Stil, Aktenstapel #00FF00).
  const BILD = {};
  function laden(name, datei, faerben, fertig) {
    const img = new Image();
    img.onload = () => { BILD[name] = faerben ? R_.umfaerben(img) : img; if (fertig) fertig(BILD[name]); };
    img.src = datei;
  }
  // Startbild-Hintergrund zuerst (nur im Zettel-Stil der Sammlung sichtbar; index.html lädt es schon vorab).
  // Ausschnitt '25% 50%' hält den Aktenstapel (links, Bildmitte) im Bild.
  if (R_.zettel) laden('start', 'bilder/start.webp', true, c => R_.schirmBild('start', c.toDataURL('image/jpeg', 0.86), '25% 50%'));
  laden('akte', 'bilder/akte.webp', true);
  laden('korb', 'bilder/korb.webp', false);
  laden('tisch', 'bilder/schreibtisch.webp', false);
  laden('sieg', 'bilder/ende-sieg.webp', true);
  laden('chaos', 'bilder/ende-chaos.webp', true);
  // ---------- Messing-Waage (Gimmick oben links auf dem Tisch, MZ 22.10.2026) ----------
  // Bild frist-alarm-waage-oben.png (steilere Draufsicht, MZ 22.10.2026) zerlegt in Säule, Balken, Schale, an der kompletten
  // Waage ausgerichtet, Messing minimal wärmer. Maße in Pixeln der WebP-Dateien: Säule 156×302 (Drehpunkt 76,8/60,7,
  // Fußmitte unten 76,8/300,5), Balken 255×43 (Mitte 124,8/21,5, Ringe bei ±114), Schale 127×199 (Aufhängering 65/12,5).
  // Gesamtmaß der Waage ≈ 339 breit × 300 hoch (Einheiten). Schatten: Kontaktschatten unter dem Fuß + weicher Schlagschatten. Balken dreht um den Drehpunkt, Schalen hängen senkrecht und pendeln nach.
  laden('wSaeule', 'bilder/waage-saeule.webp', false);
  laden('wBalken', 'bilder/waage-balken.webp', false);
  laden('wSchale', 'bilder/waage-schale.webp', false);
  const WAAGE = { groesse: 339, drehpunkt: [76.8, 60.7], fuss: [76.8, 300.5], balkenMitte: [124.8, 21.5], arm: 114.0, ring: [65, 12.5], schaleLaenge: 170 };
  const waage = {
    w: 0, v: 0,              // Balkenwinkel (Bogenmaß, + = rechts tiefer) und Winkelgeschwindigkeit
    ziel: 0, zielBis: 0,     // gekippt halten bis (Sekunden), danach langsam zurück
    feder: 14, daempf: 5,    // Feder/Dämpfung des Balkens (ruhig einpendeln)
    pend: [0, 0], pendV: [0, 0], ringX: null, ringV: [0, 0],
    zeit: 0,
    richtig() { this.ziel = 0; this.feder = 14; this.daempf = 4.2; this.v += (Math.random() < 0.5 ? -1 : 1) * 0.55; },   // kleines Wippen ±3°
    falsch() {
      const seite = Math.random() < 0.5 ? -1 : 1;
      this.ziel = seite * 0.3; this.zielBis = this.zeit + 0.55;   // ca. 17° kippen
      this.feder = 22; this.daempf = 6.5; this.v += seite * 1.6;
    },
    schritt(dt) {
      if (!dt) return;
      this.zeit += dt;
      if (this.ziel && this.zeit > this.zielBis) { this.ziel = 0; this.feder = 6; this.daempf = 4.6; }   // langsam zurück (~1,5s)
      const atmen = 0.008 * Math.sin(this.zeit * 0.9);                                                 // kaum sichtbares Atmen
      const a = -this.feder * (this.w - this.ziel - atmen) - this.daempf * this.v;
      this.v += a * dt; this.w += this.v * dt;
      // Schalen: Pendel, angetrieben von der seitlichen Beschleunigung der Aufhängepunkte
      const rx = [-1, 1].map(s => s * WAAGE.arm * Math.cos(this.w));
      if (this.ringX) for (let i = 0; i < 2; i++) {
        const vNeu = (rx[i] - this.ringX[i]) / dt, acc = (vNeu - this.ringV[i]) / dt;
        this.ringV[i] = vNeu;
        const pa = -18 * Math.sin(this.pend[i]) - 2.2 * this.pendV[i] - acc / WAAGE.schaleLaenge;
        this.pendV[i] += pa * dt; this.pend[i] += this.pendV[i] * dt;
      }
      this.ringX = rx;
    },
  };
  // Platz oben links: über der Akte (Hochformat) oder links daneben (Querformat); zu klein → nicht zeigen
  function waageFeld(B) {
    const A = L.akte, oben = 50, links = 8;
    const fristenLinks = L.fristenY < 40 ? B / 2 - 40 : B / 2 - 36;
    const akteOben = A.cy - A.h / 2 - 6, akteLinks = A.cx - A.w / 2 - 10;
    const f1 = Math.min(fristenLinks - links, akteOben - oben);        // über der Akte, links von den Fristen-Uhren
    const f2 = Math.min(akteLinks - links, L.ruckY - 22 - oben);         // links neben der Akte, über dem Rückmeldeschild
    const s = Math.min(L.quer ? 120 : 100, Math.max(f1, f2));   // Hochformat ca. 90–100 px (MZ, 22.10.2026)
    return s >= 46 ? { x: links, y: oben, s } : null;
  }
  // Schatten auf der Tischplatte (Licht von oben im Bild): weicher, dunkler Kontaktschatten unter dem Fuß und ein
  // dezenter Schlagschatten aller Teile nach unten rechts (kippt mit Balken und Schalen mit).
  function waageSchatten(g, px, unten, k, s) {
    const dpr = g.getTransform().a;                // Schattenversatz gilt in Gerätepixeln
    const fb = 150 * k;
    g.save();
    g.translate(px + s * 0.02, unten - 3 * k); g.scale(fb * 0.62, fb * 0.15);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    rg.addColorStop(0, 'rgba(38,22,8,.55)'); rg.addColorStop(0.6, 'rgba(38,22,8,.25)'); rg.addColorStop(1, 'rgba(38,22,8,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
    g.restore();
    g.shadowColor = 'rgba(45,26,10,.38)'; g.shadowBlur = s * 0.035 * dpr;
    g.shadowOffsetX = s * 0.03 * dpr; g.shadowOffsetY = s * 0.045 * dpr;
  }
  function zeichneWaage(g, B, dt) {
    if (!BILD.wSaeule || !BILD.wBalken || !BILD.wSchale) return;
    const feld = waageFeld(B);
    if (!feld) return;
    waage.schritt(Math.min(dt || 0, 0.05));
    const k = feld.s / WAAGE.groesse, cx = feld.x + feld.s / 2, unten = feld.y + feld.s;
    const px = cx, py = unten - (WAAGE.fuss[1] - WAAGE.drehpunkt[1]) * k;      // Drehpunkt auf dem Bildschirm
    g.save();
    waageSchatten(g, px, unten, k, feld.s);
    // Schalen (hinter dem Balken), hängen an den Balkenenden
    [-1, 1].forEach((s, i) => {
      const rx = px + s * WAAGE.arm * k * Math.cos(waage.w), ry = py + s * WAAGE.arm * k * Math.sin(waage.w);
      g.save(); g.translate(rx, ry); g.rotate(waage.pend[i]);
      g.drawImage(BILD.wSchale, -WAAGE.ring[0] * k, -WAAGE.ring[1] * k, BILD.wSchale.width * k, BILD.wSchale.height * k);
      g.restore();
    });
    // Säule, dann Balken um den Drehpunkt
    g.drawImage(BILD.wSaeule, px - WAAGE.fuss[0] * k, unten - WAAGE.fuss[1] * k, BILD.wSaeule.width * k, BILD.wSaeule.height * k);
    g.save(); g.translate(px, py); g.rotate(waage.w);
    g.drawImage(BILD.wBalken, -WAAGE.balkenMitte[0] * k, -WAAGE.balkenMitte[1] * k, BILD.wBalken.width * k, BILD.wBalken.height * k);
    g.restore();
    g.restore();
  }

  const AKTE_SEITE = 484 / 720, KORB_SEITE = 320 / 475;
  const DECKEL_ANTEIL = 0.94;   // Anteil der Aktenbreite ohne herausragende Blätter
  const endBildAdresse = {};
  function endBild(name) {   // umgefärbtes Bild als Adresse für das Endbild (einmal erzeugt)
    if (!endBildAdresse[name] && BILD[name]) endBildAdresse[name] = BILD[name].toDataURL('image/jpeg', 0.86);
    return endBildAdresse[name];
  }

  // ---------- Klänge ----------
  // Auswahl des Sound Artists (Anwalt-Game/Material/Texte/frist-alarm-klaenge.md, 20.10.2026), Quellen in
  // Material/Sounds/quellen.txt. Alle unter 60 KB, daher WAV (ohne proben). Fehlt eine Datei (da: false),
  // spielt der erzeugte Ersatzton des Rahmens.
  const KLAENGE = {
    herein: { datei: 'klaenge/herein.wav', pegel: 0.3, da: true },       // Papier-Rascheln beim Hereinfliegen, leiser als ablegen
    ablegen: { datei: 'klaenge/ablegen.wav', pegel: 0.4, da: true },
    falsch: { datei: 'klaenge/falsch.wav', pegel: 0.4, da: true },
    versaeumt: { datei: 'klaenge/versaeumt.wav', pegel: 0.4, da: true },
    ticken: { datei: 'klaenge/ticken.wav', pegel: 0.6, da: true },        // Einzel-Tick, deutlich lauter
    sieg: { datei: 'klaenge/sieg.wav', pegel: 0.45, da: true },           // Stempel + Chime gemischt
    niederlage: { datei: 'klaenge/niederlage.wav', pegel: 0.45, da: true },
  };
  const ERSATZ = { herein: 'wisch', ablegen: 'wisch', falsch: 'fehler', versaeumt: 'fehler', ticken: 'klick', sieg: 'sieg', niederlage: 'fehler' };
  function klang(name) { R_.ton(KLAENGE[name] && KLAENGE[name].da ? name : ERSATZ[name]); }
  const klaengeDa = {};
  Object.keys(KLAENGE).forEach(n => { if (KLAENGE[n].da) klaengeDa[n] = KLAENGE[n]; });

  // ---------- Zustand ----------
  let akten, nr, phase, phaseT, akte, rest, T, bedenk, punkte, richtigAnz, versaeumt, gesamtZeit, inKorb, schild, gewaehlt, tick, wackeln, flug, verlauf, endeGeplant, sprungEnde, vorgemerkt = null, stempelText = '';
  // Erklärung nach „Falsch abgelegt“/„Frist versäumt“ (MZ, 22.10.2026): Zettel mit „Richtig wäre: …“ und kurzem Grund aus
  // erklaerungen.js (Entwurf, MZ prüft), weiter erst mit „Weiter“. Die Akten-Uhr steht so lange; Punkte und Gesamtzeit
  // (bedenk bzw. T) sind bis dahin schon verbucht und werden nicht verfälscht.
  const ERKL = window.FRIST_ERKLAERUNGEN || {};
  const ZETTEL = { ab: 0.5, weiterAb: 0.85, aus: 0.25 };
  let erkl = null;
  function erklStarten(kopf) {
    const grund = (ERKL[LV.nr] || {})[akte.nr] || '';
    erkl = { kopf, richtig: 'Richtig wäre: ' + korbName(akte.korb), grund, weiterBei: null, druck: 0 };
  }
  function erklZu() { return erkl && erkl.weiterBei != null && phaseT >= erkl.weiterBei + (RUHIG ? 0 : ZETTEL.aus); }
  function weiter() {
    if (!erkl || erkl.weiterBei != null || (phase !== 'falsch' && phase !== 'stempel') || phaseT < ZETTEL.weiterAb) return false;
    erkl.weiterBei = phaseT; erkl.druck = 0.24;
    R_.ton('klick');
    return true;
  }

  function neu() {
    if (R_.zustand === 'spiel') zuletztMerken();   // nur beim echten Start (neu() läuft auch beim Anmelden)
    const h = location.hash;
    const m = /akte=(\d+)/.exec(h), ab = /ab=(\d+)/.exec(h);
    akten = auswahl(m ? +m[1] : 0);
    nr = ab ? Math.max(0, Math.min(ANZAHL - 1, +ab[1] - 1)) : 0;   // #ab=9: gleich mit der 9. Akte beginnen
    sprungEnde = (/ende=([a-z]+)(?:-(\d+))?/.exec(h) || null);
    phase = 'titel'; phaseT = 0; akte = null; titelTon = false;   // zuerst der Level-Titel (MZ, 22.10.2026)
    punkte = 0; richtigAnz = 0; versaeumt = 0; gesamtZeit = 0;
    inKorb = LV.koerbe.map(() => 0); schild = null; gewaehlt = null; wackeln = 0; flug = null; verlauf = []; endeGeplant = null; erkl = null;
    anzeigen();
  }

  function anzeigen() {
    if (R_.zustand !== 'spiel') return;
    R_.anzeige(`Akte ${Math.min(nr + 1, ANZAHL)}/${ANZAHL}`, zahl(punkte) + ' Punkte');
  }

  function naechsteAkte() {
    akte = akten[nr];
    T = zeitFuer(nr, akte.teil);
    rest = T; bedenk = 0; tick = T / 3;   // nächster Tick (Restzeit in Sekunden)
    phase = 'rein'; phaseT = 0; gewaehlt = null; vorgemerkt = null; stempelText = '';
    flug = { dreh: (Math.random() - 0.5) * 0.5, ziel: (Math.random() - 0.5) * 0.06, von: Math.random() < 0.5 ? -1 : 1 };
    klang('herein');
    anzeigen();
  }

  function schritt(dt) {
    phaseT += dt;
    wackeln = Math.max(0, wackeln - dt);
    if (schild) { schild.t += dt; if (schild.t > schild.dauer) schild = null; }
    if (sprungEnde) { beispielEnde(sprungEnde[1], sprungEnde[2]); sprungEnde = null; return; }

    if (phase === 'titel') {
      if (!titelTon) { titelTon = true; klang('herein'); }
      if (phaseT > DAUER.titel) { phase = 'erst'; phaseT = 0; }
    }
    else if (phase === 'erst' && phaseT > DAUER.erst) naechsteAkte();
    else if (phase === 'rein' || phase === 'warten') {
      if (phase === 'rein' && phaseT > DAUER.rein) { phase = 'warten'; phaseT = 0; if (vorgemerkt != null) { const k = vorgemerkt; vorgemerkt = null; ablegen(k); return; } }
      // Die Uhr läuft ab dem Moment, in dem die Akte auf dem Tisch liegt
      if (phase === 'warten') {
        rest -= dt; bedenk += dt;
        // Ticken im letzten Drittel der Restzeit: beim Eintritt und danach einmal pro Sekunde
        if (rest <= tick && tick > 0.05) { klang('ticken'); tick -= 1; }
        if (rest <= 0) fristVersaeumt();
      }
    }
    else if (phase === 'falsch' && (erkl ? erklZu() : phaseT > DAUER.falsch)) {   // dann in den richtigen Korb
      erkl = null; if (schild) schild.dauer = schild.t + DAUER.raus + 0.5;
      phase = 'raus'; phaseT = 0;
    }
    else if (phase === 'raus' && phaseT > DAUER.raus) {
      inKorb[gewaehlt]++;
      phase = 'pause'; phaseT = 0;
    }
    else if (phase === 'stempel' && (erkl ? erklZu() : phaseT > DAUER.stempel)) {
      erkl = null; if (schild) schild.dauer = schild.t + DAUER.fallen + 0.4;
      phase = 'fallen'; phaseT = 0;
    }
    else if (phase === 'fallen' && phaseT > DAUER.fallen) {
      if (versaeumt >= MAX_VERSAEUMT) return abbruch();
      phase = 'pause'; phaseT = 0;
    }
    else if (phase === 'pause' && phaseT > DAUER.pause) {
      nr++;
      if (nr >= ANZAHL) return geschafft();
      naechsteAkte();
    }
  }

  // Tippen auf einen Korb: die Akte fliegt hinein, richtig/falsch wird angezeigt
  function ablegen(k) {
    if (phase === 'rein') { vorgemerkt = k; return true; }   // während die Akte hereinfliegt: beim Ankommen ablegen
    if (phase !== 'warten') return false;
    const richtig = k === akte.korb;
    const p = punkteFuer(richtig, bedenk, T);
    punkte += p; gesamtZeit += bedenk;
    if (richtig) richtigAnz++;
    verlauf.push({ nr: akte.nr, korb: k, richtig, zeit: Math.round(bedenk * 100) / 100, T, punkte: p });
    if (richtig) {
      gewaehlt = k;
      phase = 'raus'; phaseT = 0;
      klang('ablegen');
      waage.richtig();
      schild = { text: 'Richtig +' + p, gut: true, korb: k, t: 0, dauer: DAUER.schild };
    } else {
      // Falscher Korb (MZ, 21.10.2026): Akte bleibt liegen, Uhr steht, Stempel „FALSCH ABGELEGT“,
      // nach DAUER.falsch fliegt sie in den richtigen Korb (ohne Ablege-Klang, damit „falsch“ deutlich bleibt)
      gewaehlt = akte.korb;
      phase = 'falsch'; phaseT = 0; wackeln = 0;
      stempelText = 'FALSCH ABGELEGT';
      klang('falsch');
      waage.falsch();
      R_.vibrieren(60);
      // Schild bleibt (Kreuz/Haken an den Körben), der Text steht jetzt auf dem Zettel; Dauer setzt „Weiter“
      schild = { dauer: Infinity, text: 'Falsch – richtig wäre: ' + korbName(akte.korb), gut: false, korb: k, richtigKorb: akte.korb, t: 0, zettel: true };
      erklStarten('Falsch abgelegt');
    }
    anzeigen();
    return true;
  }

  function fristVersaeumt() {
    versaeumt++;
    gesamtZeit += T;
    verlauf.push({ nr: akte.nr, korb: null, richtig: false, zeit: T, T, punkte: 0 });
    rest = 0; wackeln = 0.4;
    phase = 'stempel'; phaseT = 0;
    stempelText = 'FRIST VERSÄUMT';
    klang('versaeumt');
    waage.falsch();
    R_.vibrieren([80, 60, 80]);
    schild = { text: 'Richtig wäre: ' + korbName(akte.korb), gut: false, richtigKorb: akte.korb, t: 0, dauer: Infinity, zettel: true };
    erklStarten('Frist versäumt');
  }

  // ---------- Level-Wahl im Startbild (auf dem Notizzettel) ----------
  // Drei Reiter: Level 1 – Fristen, Level 2 – Rechtsgebiete, Level 3 – Vorgehen. Gesperrte Level grau mit Schloss;
  // Level 2 vor der Freischaltung mit kurzem Hinweis „nach Level 1“ (kein „demnächst“, MZ 21.10.2026).
  const SCHLOSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const stil = document.createElement('style');
  stil.textContent = `
    .levelwahl { display: flex; gap: 6px; margin: 0 0 12px; }
    .levelwahl button { flex: 1 1 0; min-width: 0; padding: 6px 4px 5px; border-radius: 8px; border: 2px solid rgba(0,0,0,.15);
      background: rgba(255,255,255,.55); color: inherit; font: inherit; cursor: pointer; line-height: 1.15; }
    .levelwahl button.aktiv { border-color: var(--haupt); background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .levelwahl button:disabled { cursor: default; opacity: .45; filter: grayscale(1); }
    .levelwahl b { display: block; font-size: 14px; font-weight: 900; }
    .levelwahl span { display: block; font-size: 11.5px; font-weight: 600; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .levelwahl small { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; opacity: .75; }
    .levelwahl svg { width: 12px; height: 12px; vertical-align: -1px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
    @media (max-height: 400px) { .levelwahl { margin-bottom: 6px; } .levelwahl button { padding: 3px 3px; } .levelwahl b { font-size: 12.5px; } .levelwahl span { display: none; } }`;
  document.head.append(stil);
  const wahl = document.createElement('div');
  wahl.className = 'levelwahl';
  function wahlAufbauen() {
    wahl.textContent = '';
    LEVEL.forEach(lv => {
      const b = document.createElement('button');
      b.type = 'button';
      const spielbar = lv.spielbar !== false && lv.nr <= frei();
      b.disabled = !spielbar;
      b.classList.toggle('aktiv', lv === LV);
      let unter = '';
      if (lv.spielbar === false) unter = '';                                   // nicht spielbares Level: nur grau, ohne Text
      else if (!spielbar) unter = SCHLOSS + ' nach Level ' + (lv.nr - 1);
      else { const bw = bestwertVon(lv); unter = zahl(bw || 0) + ' Pkt.'; }
      b.innerHTML = `<b>${lv.spielbar === false ? SCHLOSS + ' ' : ''}Level ${lv.nr}</b>` + (lv.name ? `<span>${lv.name}</span>` : '<span>&nbsp;</span>') + `<small>${unter || '&nbsp;'}</small>`;
      b.setAttribute('aria-label', 'Level ' + lv.nr + (lv.name ? ' – ' + lv.name : '') + (spielbar ? '' : ' (gesperrt)'));
      if (spielbar) b.addEventListener('click', () => { levelWaehlen(lv.nr); R_.ton('klick'); });
      wahl.append(b);
    });
  }
  function levelWaehlen(n) {
    LV = LEVEL[n - 1];
    DEF.id = LV.id;                       // eigener Bestwert je Level
    Lschluessel = '';                     // Körbe neu aufteilen
    inKorb = LV.koerbe.map(() => 0);
    wahlAufbauen();
    R_.startbildAktualisieren({ anleitung: LV.anleitung });
  }
  R_.startElement(wahl);

  function geschafft() {
    phase = 'fertig';
    const p = Math.max(1, Math.min(1000, punkte));   // wer alle 10 schafft, bekommt mindestens 1 Punkt
    klang('sieg');
    const naechstes = LEVEL[LV.nr];
    const spielbar = naechstes && naechstes.spielbar !== false;
    const genug = richtigAnz >= FREI_AB;
    const neuFrei = spielbar && genug && frei() < naechstes.nr;
    if (neuFrei) freischalten(naechstes.nr);
    // noch nicht frei und zu wenig richtig: Hinweis, was fehlt (bereits freigeschaltete Level bleiben frei)
    const fehlt = spielbar && !genug && frei() < naechstes.nr;
    // „Weiter zu Level N“ nach jedem geschafften Level, sobald N frei ist; Hinweis nur beim ersten Freischalten (MZ, 22.10.2026)
    const weiter = spielbar && frei() >= naechstes.nr;
    R_.ende(p, {
      dach: 'Level ' + LV.nr + ' – ' + LV.name, ueberschrift: stufe(p), zusatz: sek(gesamtZeit), zeile: bilanz(null, null, true),
      hinweis: neuFrei ? 'Level ' + naechstes.nr + ' freigeschaltet' : fehlt ? 'Für Level ' + naechstes.nr + ' brauchst du mindestens ' + FREI_AB + ' richtige Akten.' : '',
      extraKnopf: weiter ? { text: 'Weiter zu Level ' + naechstes.nr, klick: () => levelWaehlen(naechstes.nr) } : null,
      text: K.spruch || '', bild: endBild('sieg'), verzoegerung: 500,
    });
    wahlAufbauen();
  }
  function abbruch() {
    phase = 'fertig';
    klang('niederlage');
    R_.ende(0, { dach: 'Level ' + LV.nr + ' – ' + LV.name, ueberschrift: 'Frist versäumt', wert: bilanz(), bild: endBild('chaos'), text: '', verzoegerung: 300, nochmalZuerst: true });
  }
  // Fristen-Bilanz: Verlierer groß mit Zeilenumbruch nach dem Gedankenstrich (white-space: pre-line),
  // Sieger als kleine Zeile (einzeilig = true), z. B. „9 von 10 Akten richtig abgelegt – keine Frist versäumt“
  function bilanz(richtig, fristen, einzeilig) {
    const r = richtig != null ? richtig : richtigAnz, f = fristen != null ? fristen : versaeumt;
    const fr = f === 0 ? 'keine Frist' : f === 1 ? '1 Frist' : f + ' Fristen';
    return `${r} von ${ANZAHL} Akten richtig abgelegt –${einzeilig ? ' ' : '\n'}${fr} versäumt`;
  }
  // Beispiel-Endbilder zum Ansehen (#ende=sieg-854, #ende=chaos, #ende=frei) – schreiben wie ein echtes Spiel den Bestwert
  function beispielEnde(art, wert) {
    phase = 'fertig';
    const dach = 'Level ' + LV.nr + ' – ' + LV.name;
    if (art === 'knapp' && LV.nr < LEVEL.length) {
      const nx = LV.nr + 1;
      R_.ende(310, { dach, ueberschrift: stufe(310), zusatz: sek(41.2), zeile: bilanz(4, 2, true), text: K.spruch || '', bild: endBild('sieg'), verzoegerung: 0,
        hinweis: frei() < nx ? 'Für Level ' + nx + ' brauchst du mindestens ' + FREI_AB + ' richtige Akten.' : '',
        extraKnopf: frei() >= nx ? { text: 'Weiter zu Level ' + nx, klick: () => levelWaehlen(nx) } : null });
      return;
    }
    if (art === 'chaos') R_.ende(0, { dach, ueberschrift: 'Frist versäumt', wert: bilanz(6, 3), bild: endBild('chaos'), text: '', verzoegerung: 0, nochmalZuerst: true });
    else {
      const nx = LV.nr + 1, p = wert ? +wert : 854, f = art === 'frei' && LV.nr < LEVEL.length, w = f || (LV.nr < LEVEL.length && frei() >= nx);
      R_.ende(p, { dach, ueberschrift: stufe(p), zusatz: sek(32.4), zeile: bilanz(9, 0, true), text: K.spruch || '', bild: endBild('sieg'), verzoegerung: 0,
        hinweis: f ? 'Level ' + nx + ' freigeschaltet' : '', extraKnopf: w ? { text: 'Weiter zu Level ' + nx, klick: () => levelWaehlen(nx) } : null });
    }
  }

  // ---------- Aufteilung des Bildschirms ----------
  // Körbe unten: 5 (Level 1) in einer Reihe; 7 (Level 2) im Hochformat in zwei Reihen 4 + 3 (zweite Reihe mittig),
  // im Querformat in einer Reihe.
  let L = null, Lschluessel = '';
  function aufteilen(g, B, H) {
    const quer = B > H * 1.05;
    const koerbe = LV.koerbe, n = koerbe.length;
    // Hochformat: Level 2 (7 Körbe) in zwei Reihen 4 + 3, Level 3 (lange Beschriftungen) in zwei Reihen 3 + 2 (QA, MZ 22.10.2026)
    const reihen = quer ? [n] : n > 5 ? [4, n - 4] : LV.nr === 3 ? [3, 2] : [n];
    const proReihe = Math.max(...reihen);
    const rand = 4, luecke = quer ? (n > 5 ? 6 : 10) : 3;
    const slotW = Math.min(190, (B - 2 * rand - (proReihe - 1) * luecke) / proReihe);
    // Schrift der Korbschilder: so groß wie möglich, gleiche Größe für alle; erst ohne, dann mit Silbentrennung
    const innen = slotW - 4;
    let fs = 0, zeilen = null;
    const maxFs = Math.min(reihen.length > 1 ? 15 : 17, quer ? 16 : slotW * 0.21);   // zwei Reihen: etwas kleiner, spart Höhe
    const maxFsMehr = quer && H < 500 ? Math.min(maxFs, 13) : maxFs;               // flaches Querformat: mehrzeilig klein halten
    // Querformat: möglichst einzeilig (spart Höhe), sonst wie hochkant. Hochkant: alle Varianten (2 oder 3 Zeilen, mit oder
    // ohne Silbentrennung) durchprobieren und die mit der größten Schrift nehmen; bei gleicher Größe die erste.
    const versuche = quer ? [[1, false], [3, false], [3, true]] : reihen.length > 1 ? [[2, false], [2, true], [3, false], [3, true]] : [[3, false], [3, true]];
    for (const [maxZ, trennen] of versuche) {
      for (let f = maxZ === 1 ? maxFs : maxFsMehr; f >= (quer && maxZ === 1 ? 12 : 9) && f > fs; f -= 0.5) {   // einzeilig nur, wenn noch gut lesbar
        g.font = `800 ${f}px ${SCHRIFT}`;
        const z = koerbe.map(k => umbrechen(g, k, innen, trennen));
        if (z.every(zl => zl && zl.length <= maxZ)) { fs = f; zeilen = z; break; }
      }
      if (quer && zeilen && maxZ === 1) break;   // einzeilig passt: fertig
    }
    if (!zeilen) { fs = 9; zeilen = koerbe.map(k => k.replace(/­/g, '').split(' ')); }   // Notlösung für winzige Fenster
    const nZeilen = Math.max(...zeilen.map(z => z.length));
    const schildH = nZeilen * fs * 1.12 + 10;
    // Ablage: hochkant zeichnen, im Querformat quer (spart Höhe); bei zwei Reihen flacher
    let korbW, korbH;
    const hoehe = reihen.length > 1 ? 0.1 : 0.17;
    if (quer) { korbH = Math.min(H * 0.15, slotW * 0.8 * KORB_SEITE); korbW = korbH / KORB_SEITE; }
    else { korbW = Math.min(slotW * 0.9, H * hoehe * KORB_SEITE); korbH = korbW / KORB_SEITE; }
    const ueber = korbH * 0.12, reiheH = korbH - ueber + schildH, abstand = 8;
    const slots = [];
    let unten = H - rand - 4;
    // von unten nach oben: letzte Reihe zuerst
    const reihenStart = []; let k0 = 0;
    reihen.forEach(r => { reihenStart.push(k0); k0 += r; });
    for (let ri = reihen.length - 1; ri >= 0; ri--) {
      const anz = reihen[ri];
      const links = (B - (slotW * anz + luecke * (anz - 1))) / 2;
      const schildY = unten - schildH, korbY = schildY + ueber - korbH;
      for (let j = 0; j < anz; j++) {
        const i = reihenStart[ri] + j, x = links + j * (slotW + luecke);
        slots[i] = { x, w: slotW, korbX: x + slotW / 2, korbY: korbY + korbH / 2, korbTop: korbY, schildY, schildH,
          oben: korbY - 8, unten: ri === reihen.length - 1 ? H : schildY + schildH + abstand / 2, zeilen: zeilen[i] };
      }
      unten = korbY - abstand;
    }
    const korbTop = Math.min(...slots.map(s => s.korbTop));
    // Bereich für die Akte: zwischen Anzeige (+ Reihe mit den Fristen) und Körben, Platz für das Rückmeldeschild
    // Die drei Fristen-Uhren: bei breitem Bildschirm mittig in der Anzeigezeile, sonst darunter
    const fristenOben = B >= 560;
    let oben = fristenOben ? 52 : 48 + 26;
    const schildRaum = quer ? 34 : 40, aW = B - 24;
    let aH = korbTop - schildRaum - oben;
    const drehen = aW / aH > 1;     // breiter Bereich: Akte quer legen
    const seite = drehen ? 1 / AKTE_SEITE : AKTE_SEITE;
    const breite = hoch => Math.min(aW * 0.94, hoch * 0.86 * seite, drehen ? 620 : 420);
    let w = breite(aH);
    // Hochformat (MZ, 22.10.2026): Akte bis 15 % kleiner, damit oben links die Waage ca. 90–100 px groß wird
    if (!quer && !drehen) {
      const w0 = w;
      for (let wz = 100; wz >= 46; wz -= 2) {
        const o2 = 50 + wz + 6, a2 = korbTop - schildRaum - o2;
        if (breite(a2) >= w0 * 0.85) { oben = Math.max(oben, o2); aH = korbTop - schildRaum - oben; w = breite(aH); break; }
      }
    }
    const h = w / seite;
    const uhrR = Math.max(20, Math.min(40, Math.min(w, h) * 0.12));
    // Erklärungs-Zettel (MZ, 22.10.2026): rechts neben der Akte, wenn dort Platz ist (Querformat); sonst unten bündig über den
    // Körben (deckt den unteren Teil der Akte mit dem Stempel – der Zettel nennt das Urteil selbst; der Aktentext bleibt oben frei)
    const akteRechts = B / 2 + w / 2, aCy = oben + uhrR * 0.3 + (aH - uhrR * 0.3) / 2;
    const zw = Math.min(B - 24, 420);
    const erklBereich = B - akteRechts - 24 >= 240
      ? { x: akteRechts + 12, w: Math.min(400, B - akteRechts - 24), top: 52, unten: korbTop - 8, mitte: aCy }
      : { x: (B - zw) / 2, w: zw, top: Math.max(52, aCy - h * 0.1), unten: korbTop - 8, mitte: null, topMin: 52, hoehe: H };
    return {
      erkl: erklBereich,
      quer, slots, fs, korbW, korbH, korbTop, ruckY: korbTop - schildRaum / 2 - 2,
      akte: { cx: B / 2, cy: oben + uhrR * 0.3 + (aH - uhrR * 0.3) / 2, w, h, drehen, uhrR },
      fristenY: fristenOben ? 24 : 48 + 12,
    };
  }
  // Text auf Zeilenbreite umbrechen; trennen = Wörter an ­ mit Bindestrich teilen, wenn sie nicht passen
  function umbrechen(g, text, breite, trennen) {
    const woerter = text.split(' '), zeilen = [];
    let zeile = '';
    const passt = s => g.measureText(s.replace(/­/g, '')).width <= breite;
    for (const wort of woerter) {
      const probe = zeile ? zeile + ' ' + wort : wort;
      if (passt(probe)) { zeile = probe; continue; }
      if (zeile) { zeilen.push(zeile); zeile = ''; }
      if (passt(wort)) { zeile = wort; continue; }
      if (!trennen || wort.indexOf('­') < 0) return null;
      const teile = wort.split('­');
      let stueck = '';
      for (let i = 0; i < teile.length; i++) {
        const p = stueck + teile[i];
        if (passt(p)) { stueck = p; continue; }
        if (!stueck || !passt(stueck + '-')) return null;
        zeilen.push(stueck + '-'); stueck = teile[i];
      }
      zeile = stueck;
      if (!passt(zeile)) return null;
    }
    if (zeile) zeilen.push(zeile);
    return zeilen.map(z => z.replace(/­/g, ''));
  }
  // Fließtext umbrechen (ohne Trennung, lange Wörter dürfen notfalls überstehen)
  function umbrechenFrei(g, text, breite) {
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
    const zm = erklMasse();
    if (zm) { const k = zm.weiter; if (x >= k.x - 8 && x <= k.x + k.w + 8 && y >= k.y - 8 && y <= k.y + k.h + 8) weiter(); return; }
    const s = L.slots.find(s => x >= s.x - 2 && x <= s.x + s.w + 2 && y >= s.oben - 16 && y <= s.unten);
    if (s) ablegen(L.slots.indexOf(s));
  }

  // Tastatur: Leertaste/Eingabetaste = „Weiter“ auf dem Erklärungs-Zettel
  addEventListener('keydown', e => {
    if (R_.zustand !== 'spiel' || e.repeat || !erkl) return;
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); weiter(); }
  });

  // ---------- Zeichnen ----------
  const glatt = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);   // bremst am Ende
  const beschl = t => Math.pow(Math.max(0, Math.min(1, t)), 2);           // beschleunigt

  function zeichne(g, B, H, zustand, dt) {
    const sch = B + 'x' + H;
    if (sch !== Lschluessel) { L = aufteilen(g, B, H); Lschluessel = sch; }
    if (zustand === 'ende') { zeichneEndszene(g, B, H); return; }
    zeichneTisch(g, B, H);
    if (zustand === 'spiel') zeichneWaage(g, B, dt);
    zeichneKoerbe(g);
    if (zustand === 'spiel') {
      zeichneFristen(g, B);
      if (akte && phase !== 'erst' && phase !== 'pause' && phase !== 'fertig') zeichneFliegendeAkte(g, B, H);
      zeichneRueckmeldung(g, B);
      zeichneErklaerung(g, dt || 0);
      if (phase === 'titel') zeichneLevelTitel(g, B, H);
    }
  }

  // Level-Titel vor dem Spiel (MZ, 22.10.2026): Notizzettel mit Klebestreifen springt auf den Tisch, groß „Level 2“
  // (Markenfarbe wie „Frist-Alarm“), darunter der Name; nach ca. 2,5s gleitet er weg, Tippen überspringt.
  // Die Zeit der ersten Akte läuft erst danach.
  let titelTon = false;
  function zeichneLevelTitel(g, B, H) {
    const t = phaseT, aus = Math.max(0, (t - (DAUER.titel - DAUER.titelAus)) / DAUER.titelAus);
    const rein = glatt(t / 0.45);
    const w = Math.min(B * 0.8, 380), h = w * 0.56;
    const titelFarbe = getComputedStyle(document.documentElement).getPropertyValue('--titel-farbe').trim() || F.haupt;
    g.save();
    g.globalAlpha = Math.min(1, t / 0.15) * (1 - aus);
    g.translate(B / 2, H * 0.42 - (1 - rein) * 40 - beschl(aus) * H * 0.55);
    g.rotate((-3 - (1 - rein) * 7) * Math.PI / 180);
    g.scale(1.25 - 0.25 * rein, 1.25 - 0.25 * rein);
    // Zettel
    g.save();
    g.shadowColor = 'rgba(0,0,0,.38)'; g.shadowBlur = 24; g.shadowOffsetY = 12;
    const pap = g.createLinearGradient(0, -h / 2, 0, h / 2);
    pap.addColorStop(0, '#fffdf4'); pap.addColorStop(1, '#f7efd6');
    g.fillStyle = pap; g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
    // Klebestreifen (erscheint kurz nach dem Aufkleben), Enden gezackt
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
    // Schrift
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = titelFarbe;
    g.font = `italic 700 ${w * 0.2}px Georgia, "Times New Roman", Times, serif`;
    g.fillText('Level ' + LV.nr, 0, -h * 0.1);
    g.fillStyle = F.dunkel || '#1f2a31';
    g.font = `800 ${w * 0.085}px ${SCHRIFT}`;
    g.fillText(LV.name, 0, h * 0.22, w * 0.9);
    g.restore();
  }

  function zeichneTisch(g, B, H) {
    const t = BILD.tisch;
    if (t) {
      const f = Math.max(B / t.width, H / t.height);
      g.drawImage(t, (B - t.width * f) / 2, (H - t.height * f) / 2, t.width * f, t.height * f);
    } else { g.fillStyle = '#b98a55'; g.fillRect(0, 0, B, H); }
    // leichte Abdunklung oben (Anzeige lesbar) und an den Rändern
    const v = g.createLinearGradient(0, 0, 0, 90);
    v.addColorStop(0, 'rgba(0,0,0,.35)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, B, 90);
  }

  function zeichneEndszene(g, B, H) {
    const b = BILD[versaeumt >= MAX_VERSAEUMT || (sprungEndeArt === 'chaos') ? 'chaos' : 'sieg'];
    if (!b) { zeichneTisch(g, B, H); return; }
    const f = Math.max(B / b.width, H / b.height);
    g.drawImage(b, (B - b.width * f) / 2, (H - b.height * f) / 2, b.width * f, b.height * f);
  }
  let sprungEndeArt = '';

  function zeichneKoerbe(g) {
    const kb = BILD.korb, ak = BILD.akte;
    L.slots.forEach((s, i) => {
      // Ablage mit den bisher abgelegten Akten
      g.save();
      g.translate(s.korbX, s.korbY);
      const hervor = schild && (schild.richtigKorb === i) && Math.sin(schild.t * 12) > -0.3;
      if (L.quer) g.rotate(Math.PI / 2);
      const kw = L.quer ? L.korbH : L.korbW, kh = L.quer ? L.korbW : L.korbH;   // Maße des hochkant gezeichneten Bilds
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetY = L.quer ? -3 : 3;
      if (kb) g.drawImage(kb, -kw / 2, -kh / 2, kw, kh);
      else { g.fillStyle = '#f2f2f2'; g.fillRect(-kw / 2, -kh / 2, kw, kh); }
      g.shadowColor = 'transparent';
      const n = Math.min(inKorb[i], 4);
      if (ak) for (let k = 0; k < n; k++) {
        const aw = kw * 0.66, ah = aw / AKTE_SEITE;
        const sh = Math.min(1, (kh * 0.74) / ah);
        g.save();
        g.translate(kw * 0.01 + (k % 2 ? 1.5 : -1.5), -kh * 0.04 - k * 2);
        g.rotate(((k * 37) % 7 - 3) * 0.02);
        g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3; g.shadowOffsetY = 1;
        g.drawImage(ak, -aw * sh / 2, -ah * sh / 2, aw * sh, ah * sh);
        g.restore();
      }
      g.restore();
      // Schild mit der Aufschrift
      const druck = gewaehlt === i && phase === 'raus' ? 1 - Math.sin(Math.min(1, phaseT / DAUER.raus) * Math.PI) * 0.06 : 1;
      g.save();
      g.translate(s.x + s.w / 2, s.schildY + s.schildH / 2);
      g.scale(druck, druck);
      runderKasten(g, -s.w / 2, -s.schildH / 2, s.w, s.schildH, 8);
      g.fillStyle = BLAUGRAU; g.fill();
      if (hervor) { g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.stroke(); }
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${L.fs}px ${SCHRIFT}`;
      const zh = L.fs * 1.12, z0 = -(s.zeilen.length - 1) * zh / 2;
      s.zeilen.forEach((z, k) => g.fillText(z, 0, z0 + k * zh + 0.5));
      g.restore();
      // Haken oder Kreuz am angetippten Korb
      if (schild && schild.korb === i && schild.t < schild.dauer) zeichneZeichen(g, s.korbX, s.korbTop + 4, schild.gut, schild.t);
      if (schild && !schild.gut && schild.richtigKorb === i && schild.t > 0.15) zeichneZeichen(g, s.korbX, s.korbTop + 4, true, schild.t - 0.15);
    });
  }

  function zeichneZeichen(g, x, y, gut, t) {
    const r = Math.max(13, Math.min(20, L.korbW * 0.24)) * (t < 0.15 ? 0.5 + t / 0.3 : 1);
    g.save();
    g.translate(x, y);
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
    g.fillStyle = gut ? GUT : WARNUNG; g.fill();
    g.lineWidth = 2.5; g.strokeStyle = '#ffffff'; g.stroke();
    g.lineWidth = r * 0.22; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    if (gut) { g.moveTo(-r * 0.42, 0); g.lineTo(-r * 0.1, r * 0.32); g.lineTo(r * 0.45, -r * 0.35); }
    else { g.moveTo(-r * 0.35, -r * 0.35); g.lineTo(r * 0.35, r * 0.35); g.moveTo(r * 0.35, -r * 0.35); g.lineTo(-r * 0.35, r * 0.35); }
    g.stroke();
    g.restore();
  }

  // Drei kleine Uhren oben: je versäumter Frist eine durchgestrichen
  function zeichneFristen(g, B) {
    const r = 8, y = L.fristenY, x0 = B / 2 - 2 * (2 * r + 6) / 2;
    for (let i = 0; i < MAX_VERSAEUMT; i++) {
      const weg = i < versaeumt, x = x0 + i * (2 * r + 6);
      const dx = weg && i === versaeumt - 1 && wackeln > 0 ? Math.sin(wackeln * 60) * 3 : 0;
      g.save();
      g.translate(x + dx, y);
      g.globalAlpha = weg ? 0.95 : 0.9;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.fillStyle = weg ? WARNUNG : 'rgba(255,255,255,.92)'; g.fill();
      g.strokeStyle = weg ? '#ffffff' : BLAUGRAU; g.lineWidth = 1.6; g.lineCap = 'round';
      g.beginPath();
      if (weg) { g.moveTo(-4, -4); g.lineTo(4, 4); g.moveTo(4, -4); g.lineTo(-4, 4); }
      else { g.moveTo(0, 0); g.lineTo(0, -5); g.moveTo(0, 0); g.lineTo(3.5, 1.5); }
      g.stroke();
      g.restore();
    }
  }

  function zeichneFliegendeAkte(g, B, H) {
    const A = L.akte;
    let x = A.cx, y = A.cy, dreh = flug.ziel, s = 1, alpha = 1;
    if (phase === 'rein') {
      const t = glatt(phaseT / DAUER.rein);
      y = A.cy + (-(A.h + 80) - (A.cy)) * (1 - t);
      x = A.cx + flug.von * B * 0.25 * (1 - t);
      dreh = flug.ziel + flug.dreh * (1 - t);
    } else if (phase === 'raus') {
      const t = beschl(phaseT / DAUER.raus), z = L.slots[gewaehlt];
      x = A.cx + (z.korbX - A.cx) * t;
      y = A.cy + (z.korbY - A.cy) * t;
      s = 1 + (Math.min(L.korbW, L.korbH) * 0.9 / Math.min(A.w, A.h) - 1) * t;
      alpha = 1 - Math.max(0, t - 0.8) * 4;
    } else if (phase === 'stempel' || phase === 'falsch') {
      if (phaseT < 0.35) x += Math.sin(phaseT * 70) * 5 * (1 - phaseT / 0.35);
    } else if (phase === 'fallen') {
      const t = beschl(phaseT / DAUER.fallen);
      y = A.cy + (H - A.cy + A.h) * t;
      dreh = flug.ziel + t * 0.5;
      alpha = 1 - t * 0.6;
    }
    g.save();
    g.globalAlpha = Math.max(0, alpha);
    g.translate(x, y);
    g.rotate(dreh);
    g.scale(s, s);
    zeichneAkte(g, A, phase === 'raus' && phaseT / DAUER.raus > 0.45);
    if (phase === 'stempel' || phase === 'falsch') zeichneStempel(g, A, phaseT, stempelText);
    else if (phase === 'fallen' || (phase === 'raus' && stempelText && phaseT / DAUER.raus <= 0.45)) zeichneStempel(g, A, 1, stempelText);
    g.restore();
  }

  // Akte um (0,0): Deckel in Kundenfarbe, Schild mit Fachbereich und Text, Uhr mit Restzeit
  function zeichneAkte(g, A, ohneText) {
    const w = A.w, h = A.h, img = BILD.akte;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
    if (A.drehen) {
      g.save(); g.rotate(-Math.PI / 2);
      if (img) g.drawImage(img, -h / 2, -w / 2, h, w); else { g.fillStyle = F.haupt; g.fillRect(-h / 2, -w / 2, h, w); }
      g.restore();
    } else if (img) g.drawImage(img, -w / 2, -h / 2, w, h);
    else { g.fillStyle = F.haupt; g.fillRect(-w / 2, -h / 2, w, h); }
    g.restore();
    if (ohneText) return;
    // Deckelfläche ohne herausragende Blätter (hochkant rechts, quer oben)
    const dx = A.drehen ? 0 : -w * (1 - DECKEL_ANTEIL) / 2, dy = A.drehen ? h * (1 - DECKEL_ANTEIL) / 2 : 0;
    const dw = A.drehen ? w : w * DECKEL_ANTEIL, dh = A.drehen ? h * DECKEL_ANTEIL : h;
    zeichneSchild(g, dx, dy, dw, dh, A);
    zeichneUhr(g, w / 2 - A.uhrR * 0.35, -h / 2 + A.uhrR * 0.35, A.uhrR);
  }

  function zeichneSchild(g, cx, cy, dw, dh, A) {
    const sw = dw * (A.drehen ? 0.8 : 0.82);
    const pad = Math.max(8, sw * 0.06);
    let fs = Math.max(13, Math.min(A.drehen ? 22 : 24, sw / 11.5));
    const maxH = dh * (A.drehen ? 0.66 : 0.7);   // quer: Platz für den Stempel darunter lassen
    // Text in Abschnitte am Gedankenstrich: erster Abschnitt normal, weitere fett, jeder beginnt eine neue Zeile
    const teile = akte.text.split(' – ');
    let zeilen, kopfH, zh;
    for (;;) {
      zh = fs * 1.22; kopfH = fs * 0.78 * 1.9;
      zeilen = [];
      teile.forEach((t, i) => {
        g.font = `${i ? 800 : 600} ${fs}px ${SCHRIFT}`;
        umbrechenFrei(g, t + (i < teile.length - 1 ? ' –' : ''), sw - 2 * pad).forEach(z => zeilen.push({ z, fett: i > 0 }));
      });
      const hoehe = kopfH + pad * 1.2 + zeilen.length * zh;
      if (hoehe <= maxH || fs <= 12) break;
      fs -= 0.5;
    }
    const sh = kopfH + pad * 1.4 + zeilen.length * zh;
    // Schild etwas über der Mitte, damit unten auf dem Deckel Platz für den Stempel bleibt
    const x = cx - sw / 2, y = Math.max(cy - dh / 2 + dh * 0.06, cy - sh / 2 - dh * 0.1);
    schildUnten = y + sh;   // für den Stempel darunter
    // Papierschild mit Kopf in Blaugrau
    g.save();
    g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 4; g.shadowOffsetY = 1.5;
    runderKasten(g, x, y, sw, sh, 6); g.fillStyle = '#fbfaf6'; g.fill();
    g.restore();
    g.save();
    runderKasten(g, x, y, sw, sh, 6); g.clip();
    g.fillStyle = BLAUGRAU; g.fillRect(x, y, sw, kopfH);
    g.restore();
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `800 ${fs * 0.78}px ${SCHRIFT}`;
    if ('letterSpacing' in g) g.letterSpacing = '1px';
    g.fillText(akte.bereich.toUpperCase(), x + pad, y + kopfH / 2 + 0.5);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.fillStyle = '#1c252b';
    g.textBaseline = 'alphabetic';
    let yy = y + kopfH + pad * 0.7 + fs;
    zeilen.forEach(({ z, fett }) => {
      g.font = `${fett ? 800 : 600} ${fs}px ${SCHRIFT}`;
      g.fillText(z, x + pad, yy);
      yy += zh;
    });
  }

  function zeichneUhr(g, x, y, r) {
    const anteil = phase === 'rein' ? 1 : Math.max(0, rest / T);
    // falsch abgelegt (MZ, 22.10.2026): die Uhr ist erledigt – grau statt rot, kein Pulsieren
    const grau = stempelText === 'FALSCH ABGELEGT' && (phase === 'falsch' || phase === 'raus');
    const knapp = anteil < 0.35 && phase !== 'raus' && !grau;
    const puls = knapp ? 1 + Math.max(0, Math.sin(performance.now() / 1000 * 10)) * 0.07 : 1;
    g.save();
    g.translate(x, y); g.scale(puls, puls);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
    g.shadowColor = 'transparent';
    g.beginPath(); g.arc(0, 0, r * 0.8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * anteil);
    g.lineWidth = r * 0.26; g.lineCap = 'butt';
    g.strokeStyle = grau ? '#b3b9bc' : knapp ? WARNUNG : F.haupt; g.stroke();
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = BLAUGRAU; g.stroke();
    g.fillStyle = grau ? '#8a9398' : knapp ? WARNUNG : '#1c252b';
    g.font = `800 ${r * 0.72}px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(Math.max(0, Math.ceil(phase === 'rein' ? T : rest))), 0, r * 0.04);
    g.restore();
  }

  // Stempel unterhalb des Textschilds auf dem Aktendeckel (QA/MZ 22.10.2026: Aktentext bleibt lesbar);
  // wird kleiner, wenn unter dem Schild wenig Platz ist (lange Texte, Akte quer)
  let schildUnten = 0;
  function zeichneStempel(g, A, t, text) {
    const s = t < 0.18 ? 1.8 - (t / 0.18) * 0.8 : 1;
    const a = Math.min(1, t / 0.12);
    const fs = Math.max(18, Math.min(44, Math.max(A.w, A.h) * 0.075));
    const DREH = -0.1;
    g.save();
    g.font = `900 ${fs}px ${SCHRIFT}`;
    const tw = g.measureText(text).width, bw = tw + fs * 0.8, bh = fs * 1.6;
    const deckelUnten = A.h / 2 - A.h * 0.035, oben = schildUnten + 4, platz = Math.max(0, deckelUnten - oben);
    const dx = A.drehen ? 0 : -A.w * (1 - DECKEL_ANTEIL) / 2, breite = (A.drehen ? A.w : A.w * DECKEL_ANTEIL) * 0.92;
    const hoehe = bw * Math.sin(-DREH) + bh * Math.cos(DREH), weite = bw * Math.cos(DREH) + bh * Math.sin(-DREH);
    const k = Math.max(0.6, Math.min(1, platz / hoehe, breite / weite));
    const my = platz >= hoehe * k ? oben + platz / 2 : oben + hoehe * k / 2;   // knapp: direkt unter das Schild, darf über den Deckelrand ragen
    g.globalAlpha *= a * 0.92;
    g.translate(dx, my);
    g.rotate(DREH); g.scale(s * k, s * k);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = fs * 0.12; g.strokeStyle = WARNUNG;
    runderKasten(g, -bw / 2, -bh / 2, bw, bh, fs * 0.2); g.stroke();
    g.fillStyle = WARNUNG; g.fillText(text, 0, fs * 0.05);
    g.restore();
  }

  // Rückmeldung als Schild über den Körben
  function zeichneRueckmeldung(g, B) {
    if (!schild || schild.zettel) return;   // Fehler: Text steht auf dem Erklärungs-Zettel
    const t = schild.t, a = Math.min(1, t / 0.12) * Math.min(1, (schild.dauer - t) / 0.25);
    if (a <= 0) return;
    const fs = Math.max(14, Math.min(18, B * 0.042));
    g.save();
    g.globalAlpha = a;
    g.font = `800 ${fs}px ${SCHRIFT}`;
    const tw = Math.min(B - 20, g.measureText(schild.text).width + fs * 1.6), th = fs * 1.9;
    const y = L.ruckY - (t < 0.15 ? (0.15 - t) * 60 : 0);
    runderKasten(g, B / 2 - tw / 2, y - th / 2, tw, th, th / 2);
    g.fillStyle = schild.gut ? 'rgba(28,37,43,.9)' : 'rgba(28,37,43,.94)'; g.fill();
    g.lineWidth = 2; g.strokeStyle = schild.gut ? GUT : WARNUNG; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(schild.text, B / 2, y + 1, B - 30);
    g.restore();
  }

  // ---------- Erklärungs-Zettel nach einem Fehler (MZ, 22.10.2026) ----------
  // heller Zettel mit Klebestreifen: Kopf „Falsch abgelegt“/„Frist versäumt“ in Warnfarbe, groß „Richtig wäre: …“,
  // darunter der Grund (nie unter 13 px), unten „Weiter“ in der Markenfarbe
  const messG = document.createElement('canvas').getContext('2d');
  let erklM = null, erklML = null, erklMFuer = null;
  function erklMasse() {
    if (!erkl || !L || (phase !== 'falsch' && phase !== 'stempel')) return null;
    if (erklM && erklML === L && erklMFuer === erkl) return erklM;
    const r = L.erkl, g = messG, w = r.w, pad = w < 300 ? 12 : 16, innen = w - 2 * pad;
    const hMax = r.unten - (r.topMin != null ? r.topMin : r.top);
    let fs = Math.max(14, Math.min(19, w * 0.05)), m;
    for (;;) {
      const fk = fs * 0.95, fr = Math.max(14, fs * 1.08), ft = Math.max(13, fs * 0.95), kh = Math.max(38, Math.min(48, fs * 2.5));
      g.font = `800 ${fr}px ${SCHRIFT}`; const richtigZ = umbrechenFrei(g, erkl.richtig, innen);
      g.font = `700 ${ft}px ${SCHRIFT}`; const grundZ = erkl.grund ? umbrechenFrei(g, erkl.grund, innen - 11) : [];
      const o = {}; let y = pad;
      o.kopf = y + fk; y += fk * 1.4;
      o.richtig = y; y += richtigZ.length * fr * 1.25;
      if (grundZ.length) { y += 6; o.grund = y; y += grundZ.length * ft * 1.3; }
      y += 14; o.weiter = y; y += kh;
      m = { w, h: y + pad, fs, fk, fr, ft, kh, pad, innen, richtigZ, grundZ, o };
      if (m.h <= hMax || fs <= 12) break;
      fs -= 0.5;
    }
    m.x = r.x;
    if (r.mitte != null) m.y = Math.max(r.top, Math.min(r.mitte - m.h / 2, r.unten - m.h));
    else {
      // unten bündig über den Körben; würde das den Aktentext verdecken, rutscht der Zettel tiefer über die Körbe
      // (die sind während der Erklärung ohnehin gesperrt) – der Text der Akte bleibt lesbar
      const textUnten = L.akte.cy + schildUnten + 10;
      m.y = Math.max(r.topMin != null ? r.topMin : r.top, r.unten - m.h);
      if (schildUnten && m.y < textUnten) m.y = Math.min(textUnten, r.hoehe - 8 - m.h);
    }
    m.weiter = { x: m.x + pad, y: m.y + m.o.weiter, w: innen, h: m.kh };
    erklM = m; erklML = L; erklMFuer = erkl;
    return m;
  }
  function zeichneErklaerung(g, dt) {
    const m = erklMasse();
    if (!m) return;
    const t = phaseT - ZETTEL.ab;
    if (t <= 0) return;
    if (erkl.druck) erkl.druck = Math.max(0, erkl.druck - dt);
    const rein = RUHIG ? 1 : glatt(t / 0.3);
    const aus = erkl.weiterBei == null ? 0 : RUHIG ? 1 : beschl((phaseT - erkl.weiterBei) / ZETTEL.aus);
    const sicht = Math.min(RUHIG ? Math.min(1, t / 0.2) : rein, 1 - aus);
    if (sicht <= 0) return;
    g.save();
    g.globalAlpha = sicht;
    g.translate(m.x + m.w / 2, m.y + m.h / 2 + (1 - rein) * 18); g.rotate(-0.012);
    const x0 = -m.w / 2, y0 = -m.h / 2, p = m.pad, o = m.o;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
    const pap = g.createLinearGradient(0, y0, 0, -y0);
    pap.addColorStop(0, '#fffdf4'); pap.addColorStop(1, '#f4ecd3');
    g.fillStyle = pap; g.fillRect(x0, y0, m.w, m.h);
    g.restore();
    const kw = Math.min(90, m.w * 0.3);   // Klebestreifen
    g.save(); g.translate(0, y0); g.rotate(0.05);
    g.fillStyle = 'rgba(248,242,212,.92)'; g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 3; g.shadowOffsetY = 1;
    g.fillRect(-kw / 2, -8, kw, 16);
    g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(110,98,62,.35)'; g.lineWidth = 1; g.strokeRect(-kw / 2, -8, kw, 16);
    g.restore();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = WARNUNG; g.font = `900 ${m.fk}px ${SCHRIFT}`;
    if ('letterSpacing' in g) g.letterSpacing = '0.5px';
    g.fillText(erkl.kopf.toUpperCase(), x0 + p, y0 + o.kopf, m.innen);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.fillStyle = '#1c252b'; g.font = `800 ${m.fr}px ${SCHRIFT}`;
    m.richtigZ.forEach((z, i) => g.fillText(z, x0 + p, y0 + o.richtig + (i + 1) * m.fr * 1.25 - m.fr * 0.25));
    if (m.grundZ.length) {
      g.fillStyle = WARNUNG; g.fillRect(x0 + p, y0 + o.grund + 1, 3, m.grundZ.length * m.ft * 1.3 - 2);
      g.fillStyle = BLAUGRAU; g.font = `700 ${m.ft}px ${SCHRIFT}`;
      m.grundZ.forEach((z, i) => g.fillText(z, x0 + p + 11, y0 + o.grund + (i + 1) * m.ft * 1.3 - m.ft * 0.3));
    }
    const k = { x: x0 + p, y: y0 + o.weiter, w: m.innen, h: m.kh };
    const hell = RUHIG ? (phaseT >= ZETTEL.weiterAb ? 1 : 0.5) : 0.5 + 0.5 * glatt((phaseT - ZETTEL.weiterAb + 0.2) / 0.2);
    const d = erkl.druck || 0, tief = d > 0 && !RUHIG ? Math.sin(d / 0.24 * Math.PI) : 0;
    g.save();
    g.globalAlpha *= hell;
    g.translate(k.x + k.w / 2, k.y + k.h / 2 + tief * 2); g.scale(1 - tief * 0.04, 1 - tief * 0.04);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
    runderKasten(g, -k.w / 2, -k.h / 2, k.w, k.h, Math.min(16, k.h / 2));
    const v = g.createLinearGradient(0, -k.h / 2, 0, k.h / 2);
    v.addColorStop(0, R_.toenen(F.haupt, 0.12)); v.addColorStop(1, R_.toenen(F.haupt, -0.12));
    g.fillStyle = v; g.fill();
    g.shadowColor = 'transparent'; g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
    g.fillStyle = F.hauptText || R_.textFarbe(F.haupt); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${Math.round(Math.min(k.h * 0.42, 22))}px ${SCHRIFT}`;
    g.fillText('Weiter', 0, 1);
    g.restore();
    g.restore();
  }

  function runderKasten(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // ---------- Testhilfen (für Spieler unsichtbar) ----------
  // Adresse: #level=2 (Level wählen, auch wenn gesperrt), #akte=17 (diese Akte kommt zuerst), #ab=9 (mit der 9. Akte beginnen),
  //          #ende=sieg-854 / #ende=chaos / #ende=frei (Beispiel-Endbild nach „Los geht's“; schreibt wie ein echtes Spiel den Bestwert).
  // window.__test: Rechenfunktionen und Zustand, z. B. __test.punkteFuer(true, 3.1, 7), __test.tippe(2), __test.level(2),
  //                __test.freischaltungZuruecksetzen().
  window.__test = {
    AKTEN, AKTEN2, AKTEN3, LEVEL, PUNKTE, ANZAHL, MAX_VERSAEUMT, FREI_AB,
    get KOERBE() { return LV.koerbe.map((_, i) => korbName(i)); },
    zeitFuer, punkteFuer, stufe, auswahl, passt, bilanz, frei,
    pruefen: (akteNr, korb, lv) => LEVEL[(lv || LV.nr) - 1].akten.find(a => a.nr === akteNr).korb === korb,
    tippe: k => ablegen(k),
    weiter: () => weiter(),
    get erklaerung() {
      const m = erklMasse();
      return erkl && { kopf: erkl.kopf, richtig: erkl.richtig, grund: erkl.grund, weiterBei: erkl.weiterBei,
        masse: m && { x: m.x, y: m.y, w: m.w, h: m.h, ft: m.ft }, weiter: m && { x: m.weiter.x + m.weiter.w / 2, y: m.weiter.y + m.weiter.h / 2 } };
    },
    level: n => levelWaehlen(n),
    freischaltungZuruecksetzen: () => { try { localStorage.removeItem(FREI_KEY); } catch (e) { /* privat */ } wahlAufbauen(); },
    // Mitte jedes Korbs (zum echten Antippen per Zeiger)
    get waage() { return { winkelGrad: +(waage.w * 180 / Math.PI).toFixed(1), feld: L && waageFeld(innerWidth) }; },
    korbSchrift: () => L && L.fs,   // Schriftgröße der Korbschilder in px
    get koerbe() { return L ? L.slots.map(s => ({ x: s.x + s.w / 2, y: s.schildY + s.schildH / 2 })) : null; },
    endbild: (art, wert) => { sprungEndeArt = art; beispielEnde(art, wert); },
    get zustand() {
      return { level: LV.nr, phase, nr, akte: akte && { nr: akte.nr, teil: akte.teil, korb: akte.korb, text: akte.text }, rest, T, bedenk, punkte, richtig: richtigAnz, versaeumt, gesamtZeit, verlauf, liste: akten && akten.map(a => a.nr) };
    },
  };
  if (/ende=chaos/.test(location.hash)) sprungEndeArt = 'chaos';

  const DEF = {
    id: LV.id,
    wertung: 'hoch',
    format: p => zahl(p) + ' Punkte',
    hoechst: 1000,
    texte: {
      titel: 'Frist-Alarm',
      untertitel: 'Schaffst du alle Fristen, bevor sie ablaufen?',
      anleitung: LV.anleitung,
    },
    klaenge: klaengeDa,
    // Musik der Sammlung (eine Datei für Startseite und Startbild, liegt in Anwalt-Game/klaenge/): Pixabay „Upbeat Business“
    // von AtlasAudio (seit 22.10.2026), Schleife 20,65–78,79s; läuft im Startbild und endet mit „Los geht's“ (MZ, 21.10.2026)
    // läuft auch im Spiel weiter, dort auf 45 % abgesenkt, im Endbild wieder voll (MZ, 22.10.2026; Rahmen-Option imSpiel)
    startMusik: { datei: '../klaenge/musik.mp3', proben: 1281969, pegel: 0.22, imSpiel: 0.45 },
    neu, schritt, zeichne, runter,
  };
  R_.spiel(DEF);
  // Level aus der Adresse (Test) oder das zuletzt freigeschaltete … bleibt bei Level 1; Testhilfe #level=2
  const lvHash = /level=(\d)/.exec(location.hash);
  // Level: aus der Adresse (Test), sonst das zuletzt gespielte, wenn es (noch) frei und spielbar ist, sonst Level 1
  const zl = zuletzt(), zlOk = zl >= 1 && zl <= LEVEL.length && zl <= frei() && LEVEL[zl - 1].spielbar !== false;
  levelWaehlen(lvHash ? Math.max(1, Math.min(3, +lvHash[1])) : zlOk ? zl : 1);
})();
