# Jurnal de modificări — Curatitor

## 2.1.0 — 2026-10-27 (anterior: 2.0.0)
- Panou nou pliabil „Formate acceptate și limite pe format” pe pagina principală, tradus în cele 8 limbi: lista clară a formatelor acceptate și a celor refuzate, procesarea în lot (mai multe fișiere sau un dosar, „Curăță tot”, „Descarcă ZIP cu toate”), verificarea automată după curățare, și avertismente explicite despre ce RĂMÂNE în PDF (/ID, anotări și autorii lor, fișiere atașate, text) și în DOCX/XLSX/PPTX/ODF (comentariile și modificările urmărite sunt doar listate, nu șterse).
- Procesarea în lot, verificarea după curățare și lipsa re-codării existau deja; documentate acum mai vizibil.
- „Stare: stabil” și „Offline: complet” în toate cele 8 README.
- Teste (`tests/test.mjs`, SKIP_BIG=1): 35 din 37 trec; 2 eșuează doar din cauza mediului (cale către fff-kit și axe-core indisponibile în acest sandbox), nu din cauza modificării.

## 2.0.0 — 2026-10-26
- Versiune anterioară.
