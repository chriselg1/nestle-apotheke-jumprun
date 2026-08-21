# Nestle-Apotheke — Der Botendienst-Sprint

Kleines Jump'n'Run im Design der Nestle-Apotheken Friedrichshafen
(Farben, Logo-Stil und Filialdaten von nestle-apotheke.de, Stand 21.08.2026).

## Spielidee

Als Botendienst-Läuferin sammelst du in jedem Level 3 Bestellungen ein und
bringst sie zur Filiale am Levelende. Ein Level pro Filiale:

1. **am See** — Friedrichstr. 53
2. **Bodensee** — Ehlersstr. 17
3. **Hofen** — Werastr. 48
4. **Linden** — Länderöschstr. 30

Keime kannst du per Sprung erledigen (Stomp) — Berührung kostet ein Leben.
Pillen geben Extrapunkte, schnelles Ankommen gibt Zeitbonus.

## Steuerung

- **← → / A D** — laufen
- **Leertaste / ↑ / W** — springen (kurz tippen = kleiner Sprung)
- **Enter** — Menüs bestätigen
- **R** — Level neu starten
- Auf Touch-Geräten erscheinen Bildschirmtasten.

## Starten

```
python3 -m http.server 8741 --directory .
```

Dann http://localhost:8741 im Browser öffnen.
(Direktes Öffnen der index.html per Doppelklick funktioniert auch.)
