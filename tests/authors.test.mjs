// Teste Curatitor 2.2: neutralizare opțională a /ID PDF, a autorului anotărilor (/T) și a autorilor/datelor din comentarii și modificări urmărite (Office/ODF).
// Rulare: node tests/authors.test.mjs   (Playwright; PW_ROOT/CHROMIUM_PATH opționale). Verificările pe ZIP folosesc `python3 -I` (modulul zipfile, independent de aplicație).
import { createRequire } from 'module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(process.env.PW_ROOT || import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_FILE = path.resolve(HERE, '../index.html');
const W = fs.mkdtempSync(path.join(os.tmpdir(), 'curatitor-authors-'));
let fail = 0;
const ok = (name, cond, extra) => { console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond ? '' : '  ' + (extra || ''))); if (!cond) fail++; };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ serviceWorkers: 'block' });
const netReqs = [], errs = [];
await ctx.route(/^https?:/, (r) => {
  const u = r.request().url();
  if (u.startsWith('https://curatitor.test/index.html')) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(APP_FILE) });
  netReqs.push(u); r.abort();
});
const page = await ctx.newPage();
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('https://curatitor.test/index.html');
await page.waitForSelector('#list', { state: 'attached' });

/* ---- fixtures ---- */
const pdfBytes = () => {
  const objs = [null,
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Annots [4 0 R 5 0 R] >>',
    '<< /Type /Annot /Subtype /Text /Rect [10 10 30 30] /T (Autor-Anot-Secret) /Contents (Textul notei ramane) >>',
    '<< /Type /Annot /Subtype /Highlight /Rect [10 40 30 60] /T <004100750074006F0072005F00320053006500630072006500740> /Contents (Alta) >>'];
  let out = Buffer.from('%PDF-1.4\n', 'latin1'); const offs = [];
  for (let i = 1; i < objs.length; i++) { offs[i] = out.length; out = Buffer.concat([out, Buffer.from(i + ' 0 obj\n' + objs[i] + '\nendobj\n', 'latin1')]); }
  const xr = out.length; let x = 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n'; for (let i = 1; i < objs.length; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  x += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R /ID [<A1B2C3D4E5F60718293A4B5C6D7E8F90> (ID-literal-secret!)] >>\nstartxref\n' + xr + '\n%%EOF\n';
  return Buffer.concat([out, Buffer.from(x, 'latin1')]);
};
// ZIP-uri construite în pagină cu zipStore al aplicației (metoda „stored”)
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const zipIn = async (files) => Buffer.from(await page.evaluate(([files]) => { const A = CURATITOR_ENGINE(); const enc = new TextEncoder(); return Array.from(A.zipStore(files.map(f => ({ name: f.name, bytes: enc.encode(f.text) })))); }, [files]));
const docx = await zipIn([
  { name: '[Content_Types].xml', text: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>' },
  { name: '_rels/.rels', text: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
  { name: 'word/document.xml', text: X + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:ins w:id="1" w:author="Ion Popescu Secret" w:date="2026-03-14T09:30:00Z"><w:r><w:t>Text inserat ramane</w:t></w:r></w:ins><w:del w:id="2" w:author="Maria Ionescu Secret" w:date="2026-03-15T10:00:00Z"><w:r><w:delText>sters</w:delText></w:r></w:del><w:commentRangeStart w:id="0"/><w:r><w:t>cu comentariu</w:t></w:r><w:commentRangeEnd w:id="0"/></w:p></w:body></w:document>' },
  { name: 'word/comments.xml', text: X + '<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:comment w:id="0" w:author="Ion Popescu Secret" w:date="2026-03-14T09:31:00Z" w:initials="IPS"><w:p><w:r><w:t>Textul comentariului ramane</w:t></w:r></w:p></w:comment></w:comments>' },
  { name: 'word/people.xml', text: X + '<w15:people xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"><w15:person w15:author="Ion Popescu Secret"><w15:presenceInfo w15:providerId="AD" w15:userId="S-1-5-21-secret"/></w15:person></w15:people>' },
]);
const xlsx = await zipIn([
  { name: '[Content_Types].xml', text: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>' },
  { name: 'xl/workbook.xml', text: X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="F1" sheetId="1"/></sheets></workbook>' },
  { name: 'xl/comments1.xml', text: X + '<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><authors><author>Autor Excel Secret</author></authors><commentList><comment ref="A1" authorId="0"><text><r><t>Nota ramane</t></r></text></comment></commentList></comments>' },
]);
const odt = await zipIn([
  { name: 'mimetype', text: 'application/vnd.oasis.opendocument.text' },
  { name: 'content.xml', text: X + '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"><office:body><office:text><text:p>Paragraf <office:annotation><dc:creator>Autor ODF Secret</dc:creator><dc:date>2026-03-14T09:30:00</dc:date><meta:creator-initials>AOS</meta:creator-initials><text:p>Nota ODF ramane</text:p></office:annotation></text:p></office:text></office:body></office:document-content>' },
  { name: 'meta.xml', text: X + '<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"><office:meta><meta:initial-creator>Creator Meta Secret</meta:initial-creator></office:meta></office:document-meta>' },
  { name: 'META-INF/manifest.xml', text: X + '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/></manifest:manifest>' },
]);
const run = (bytes, name, profile) => page.evaluate(async ([bytes, name, profile]) => {
  const A = CURATITOR_ENGINE(); const pol = A.PROFILES[profile] ? A.PROFILES[profile] : profile;
  const r = await A.processFile(new Uint8Array(bytes), name, pol, 'clean');
  return { ok: r.ok, out: r.out ? Array.from(r.out) : null, removed: r.removed, checks: r.checks, before: r.before.entries.map(e => [e.g, e.k, e.v, e.c, e.rm]), after: r.after ? r.after.entries.map(e => [e.g, e.k, e.v, e.c, e.rm]) : null, refuse: r.refuse || null };
}, [Array.from(bytes), name, profile]);
const zipText = (buf, name) => { const f = path.join(W, 'x' + Math.random().toString(36).slice(2) + '.zip'); fs.writeFileSync(f, buf); return execFileSync('python3', ['-I', '-c', 'import zipfile,sys\nz=zipfile.ZipFile(sys.argv[1]);print(z.read(sys.argv[2]).decode("utf8"))', f, name], { encoding: 'utf8' }); };

/* ---- PDF ---- */
console.log('Curatitor — teste autori/ID (' + W + ')');
{
  const src = pdfBytes();
  const mx = await run(src, 'a.pdf', 'max');
  const out = Buffer.from(mx.out);
  ok('PDF max: lungime identică, verificări OK', out.length === src.length && mx.ok === true, JSON.stringify(mx.checks));
  const t = out.toString('latin1');
  ok('PDF max: /ID zerouri (hex și literal), fără valorile vechi', !/A1B2C3D4/.test(t) && !/ID-literal-secret/.test(t) && /\/ID \[<0{32}> \(0{18}\)\]/.test(t), t.slice(t.indexOf('/ID') - 5, t.indexOf('/ID') + 70));
  ok('PDF max: /T anotări golite (literal + hex)', !/Autor-Anot-Secret/.test(t) && /\/T \( {17}\)/.test(t) && /\/T <\s+>/.test(t), t.match(/\/T [^/]*/g));
  ok('PDF max: textul anotărilor (/Contents) rămâne', /Textul notei ramane/.test(t) && /\(Alta\)/.test(t));
  // diferențe doar în regiunile așteptate: număr de octeți modificați = lungimea celor 2 ID + 2 /T
  let diff = 0; for (let i = 0; i < src.length; i++) if (src[i] !== out[i]) diff++;
  ok('PDF max: modificări doar în ID și /T (≤ 32+18+17+53 octeți = lungimea celor 4 șiruri)', diff > 0 && diff <= 32 + 18 + 17 + 53, String(diff));
  ok('PDF max: nu mai rămân rânduri ID/anotări marcate pentru ștergere', !mx.after.some(e => e[4] && (e[3] === 'pdfid' || e[3] === 'annot')));
  const kp = await run(src, 'a.pdf', 'keep');
  ok('PDF keep (implicit): fișierul rămâne octet cu octet identic (nicio schimbare de comportament)', Buffer.from(kp.out).equals(src));
  const cu = await run(src, 'a.pdf', Object.assign({}, { keepOrientation: true, keepIcc: true, keepDensity: true, keepTitleDesc: true, trailing: true, zeroTimes: true, pdfInfo: true, pdfXmp: true, office: true, officeMedia: true, target: 1, pdfId: true, pdfAnnot: false, officeAuthors: false }));
  const ct = Buffer.from(cu.out).toString('latin1');
  ok('PDF personalizat: doar /ID neutralizat, /T rămâne', !/A1B2C3D4/.test(ct) && /Autor-Anot-Secret/.test(ct));
}

/* ---- DOCX ---- */
{
  const mx = await run(docx, 'a.docx', 'max'); const out = Buffer.from(mx.out);
  ok('DOCX max: verificări OK', mx.ok === true, JSON.stringify(mx.checks));
  const d = zipText(out, 'word/document.xml'), c = zipText(out, 'word/comments.xml'), p = zipText(out, 'word/people.xml');
  ok('DOCX max: autorii din modificări/comentarii/persoane înlocuiți', !/Secret/.test(d + c + p) && /w:author="Author"/.test(d) && /w:initials="A"/.test(c) && /w15:userId="anonymous"/.test(p), d + c + p);
  ok('DOCX max: datele înlocuite cu valoare fixă', !/2026-03-1\d/.test(d + c) && /w:date="2000-01-01T00:00:00Z"/.test(d));
  ok('DOCX max: textul modificărilor și al comentariilor rămâne', /Text inserat ramane/.test(d) && /sters/.test(d) && /Textul comentariului ramane/.test(c));
  ok('DOCX max: XML-ul rămâne bine format (python xml.dom)', execFileSync('python3', ['-I', '-c', 'import sys,xml.dom.minidom as m\nfor s in sys.argv[1:]: m.parseString(s.encode())\nprint("ok")', d, c, p], { encoding: 'utf8' }).trim() === 'ok');
  ok('DOCX max: rândurile cu autori nu mai rămân marcate', !mx.after.some(e => e[4] && e[1] === 'author'));
  const kp = await run(docx, 'a.docx', 'keep'); const kd = zipText(Buffer.from(kp.out), 'word/document.xml');
  ok('DOCX keep (implicit): autorii rămân (listate, nemodificate)', /Ion Popescu Secret/.test(kd) && kp.ok === true);
  ok('DOCX înainte: autorii din comentarii și persoane sunt listați', mx.before.filter(e => e[1] === 'author').map(e => e[2]).includes('Ion Popescu Secret') && mx.before.filter(e => e[1] === 'author').length >= 2);
}
/* ---- XLSX ---- */
{
  const mx = await run(xlsx, 'a.xlsx', 'journalism'); const out = Buffer.from(mx.out);
  const c = zipText(out, 'xl/comments1.xml');
  ok('XLSX journalism: autorul comentariului înlocuit, nota rămâne', /<author>Author<\/author>/.test(c) && /Nota ramane/.test(c) && !/Secret/.test(c) && mx.ok === true, c);
}
/* ---- ODT ---- */
{
  const mx = await run(odt, 'a.odt', 'max'); const out = Buffer.from(mx.out);
  const c = zipText(out, 'content.xml');
  ok('ODT max: dc:creator/dc:date/inițiale din adnotări înlocuite, nota rămâne', /<dc:creator>Author<\/dc:creator>/.test(c) && /<dc:date>2000-01-01T00:00:00<\/dc:date>/.test(c) && /<meta:creator-initials>A</.test(c) && /Nota ODF ramane/.test(c) && !/Secret/.test(c) && mx.ok === true, c);
  const kp = await run(odt, 'a.odt', 'keep');
  ok('ODT keep (implicit): adnotările rămân neschimbate', /Autor ODF Secret/.test(zipText(Buffer.from(kp.out), 'content.xml')));
}
/* ---- profile ---- */
const prof = await page.evaluate(() => { const P = CURATITOR_ENGINE().PROFILES; return Object.fromEntries(Object.entries(P).map(([k, v]) => [k, [v.pdfId, v.pdfAnnot, v.officeAuthors]])); });
ok('profiluri: activ în Maxim și Jurnalism, oprit în celelalte', JSON.stringify(prof) === JSON.stringify({ max: [true, true, true], keep: [false, false, false], publish: [false, false, false], journalism: [true, true, true], official: [false, false, false] }), JSON.stringify(prof));
ok('0 erori de pagină, 0 cereri de rețea', errs.length === 0 && netReqs.length === 0, JSON.stringify([errs, netReqs]));
await browser.close(); fs.rmSync(W, { recursive: true, force: true });
console.log(fail ? '\n' + fail + ' EȘECURI' : '\nToate testele au trecut.'); process.exit(fail ? 1 : 0);
