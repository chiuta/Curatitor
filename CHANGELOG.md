# Jurnal de modificări — Curatitor

## 2.2.0 — 2026-10-27 (anterior: 2.1.0)
- NOU, opțional (3 opțiuni în „Setări avansate”/Personalizat; active în profilurile Maxim și Jurnalism, oprite în Păstrează, Publicare și Dosar oficial, deci comportamentul implicit NU se schimbă):
  - PDF: **neutralizarea /ID** (zerouri, aceeași lungime) în toate trailerele; **golirea autorului anotărilor (/T)** (șiruri directe din obiecte necomprimate; textul anotării rămâne).
  - Office/ODF: **anonimizarea autorilor și a datelor** din comentarii, modificări urmărite și liste de persoane (DOCX: `w:author`, `w:initials`, `w:date`, `w15:userId`; XLSX: `<author>`, comentarii în fir; PPTX: autori de comentarii; ODF: `dc:creator`, `dc:date`, inițiale). Textul comentariilor și al modificărilor rămâne.
- Rândurile de autor din panoul „Înainte/După” includ acum și autorii din comentarii/persoane, nu doar din revizii. Avertismentele pe fișier și textele „Limite” țin cont de opțiuni (8 limbi; traducerile noi sunt automate, neverificate de vorbitori nativi).
- Teste noi: `tests/authors.test.mjs` (PDF cu /ID și anotări; DOCX/XLSX/ODT; profiluri; neschimbat la politica implicită; XML rămas bine format, verificat cu Python). Existente: `tests/test.mjs` 35/37 și `tests/risk.mjs` 9/10 — singurele eșecuri sunt de mediu (axe-core și fff-kit lipsesc din sandbox).
- Rămâne nefăcut: ștergerea textului comentariilor/modificărilor (schimbare de conținut), /T indirect sau în fluxuri comprimate (ObjStm), numele scrise în text.

## 2.1.0 — 2026-10-27 (anterior: 2.0.0)
- Panou nou pliabil „Formate acceptate și limite pe format” pe pagina principală, tradus în cele 8 limbi: lista clară a formatelor acceptate și a celor refuzate, procesarea în lot (mai multe fișiere sau un dosar, „Curăță tot”, „Descarcă ZIP cu toate”), verificarea automată după curățare, și avertismente explicite despre ce RĂMÂNE în PDF (/ID, anotări și autorii lor, fișiere atașate, text) și în DOCX/XLSX/PPTX/ODF (comentariile și modificările urmărite sunt doar listate, nu șterse).
- Procesarea în lot, verificarea după curățare și lipsa re-codării existau deja; documentate acum mai vizibil.
- „Stare: stabil” și „Offline: complet” în toate cele 8 README.
- Teste (`tests/test.mjs`, SKIP_BIG=1): 35 din 37 trec; 2 eșuează doar din cauza mediului (cale către fff-kit și axe-core indisponibile în acest sandbox), nu din cauza modificării.

## 2.0.0 — 2026-10-26
- Versiune anterioară.
