// tests/i18n-test.mjs
// Pengujian Otomatis Fase 30: Internasionalisasi UI (i18n) & Saklar Bahasa

import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { STRINGS, t, getLang, setLang } = require("../i18n.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function startServer() {
  const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT, req.url.split("?")[0]);
    if (filePath.endsWith(path.sep) || req.url === "/") filePath = path.join(ROOT, "index.html");
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(content);
      }
    });
  });
  return new Promise(resolve => server.listen(0, () => resolve(server)));
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

async function run() {
  console.log("=== FASE 30 I18N & LANGUAGE SWITCHER TESTS ===\n");

  // ----------------------------------------------------
  // BAGIAN 1: Validasi Kamus & Helper i18n.js (Unit/Static)
  // ----------------------------------------------------
  console.log("[1] Memeriksa Paritas Kamus i18n (STRINGS.id vs STRINGS.en)...");
  const idKeys = Object.keys(STRINGS.id);
  const enKeys = Object.keys(STRINGS.en);

  assert(idKeys.length > 0, `Kamus ID terisi (${idKeys.length} keys)`);
  assert(enKeys.length > 0, `Kamus EN terisi (${enKeys.length} keys)`);
  assert(idKeys.length === enKeys.length, `Jumlah key ID dan EN sama persis (${idKeys.length} keys)`);

  const missingInEn = idKeys.filter(k => !(k in STRINGS.en));
  const missingInId = enKeys.filter(k => !(k in STRINGS.id));
  assert(missingInEn.length === 0, `Nol key hilang di EN (ditemukan: ${missingInEn.join(", ") || "0"})`);
  assert(missingInId.length === 0, `Nol key hilang di ID (ditemukan: ${missingInId.join(", ") || "0"})`);

  // Pastikan tidak ada string kosong
  let emptyCount = 0;
  for (const k of idKeys) {
    if (typeof STRINGS.id[k] !== "string" || !STRINGS.id[k].trim()) emptyCount++;
    if (typeof STRINGS.en[k] !== "string" || !STRINGS.en[k].trim()) emptyCount++;
  }
  assert(emptyCount === 0, "Semua nilai kamus memiliki teks terisi (bukan string kosong)");

  // Pastikan placeholder variabel {var} simetris antara ID dan EN
  let placeholderMismatches = 0;
  const phRegex = /\{([a-zA-Z0-9_]+)\}/g;
  for (const k of idKeys) {
    const idMatches = (STRINGS.id[k].match(phRegex) || []).sort();
    const enMatches = (STRINGS.en[k].match(phRegex) || []).sort();
    if (idMatches.join(",") !== enMatches.join(",")) {
      placeholderMismatches++;
      console.error(`    Placeholder mismatch pada key "${k}": ID [${idMatches}] vs EN [${enMatches}]`);
    }
  }
  assert(placeholderMismatches === 0, "Semua placeholder variabel simetris antara ID dan EN");

  // Uji fungsi interpolasi t()
  console.log("\n[2] Menguji Helper Interpolasi t()...");
  const testSubst = t("h2h.counters", { heroA: "Arli", heroB: "Donghuang" });
  assert(testSubst.includes("Arli") && testSubst.includes("Donghuang"), `Interpolasi {heroA} & {heroB} berfungsi: "${testSubst}"`);

  // ----------------------------------------------------
  // BAGIAN 2: Pengecekan Statis app.js (Chrome Hardcode Check)
  // ----------------------------------------------------
  console.log("\n[3] Memeriksa Tidak Adanya String UI Hardcode di Jalur Render app.js...");
  const appJsContent = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  const forbiddenPhrases = [
    '"Pilih hero"',
    '"Cara data dibuat"',
    '"Hanya yang terkurasi"',
    '"Bandingkan dua hero"',
    '"Terakhir dipakai"',
    '"Tidak ada hero yang cocok."',
    '"Simpan racikan"',
    '"Semua role"',
    '"Lihat hero & alasan"',
  ];

  let forbiddenFound = 0;
  for (const phrase of forbiddenPhrases) {
    if (appJsContent.includes(phrase)) {
      forbiddenFound++;
      console.error(`    Ditemukan hardcode string: ${phrase}`);
    }
  }
  assert(forbiddenFound === 0, "Jalur render UI tidak lagi memuat string antarmuka bahasa Indonesia hardcode");

  // ----------------------------------------------------
  // BAGIAN 3: Pengujian Browser Interaktif (Playwright E2E)
  // ----------------------------------------------------
  console.log("\n[4] Menjalankan Pengujian Browser E2E (Playwright)...");
  const server = await startServer();
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const launchOptions = { headless: true };
  if (process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH;
  } else if (process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  const jsErrors = [];
  page.on("pageerror", err => {
    jsErrors.push(err.message);
  });

  try {
    // 4.1 Buka halaman default (Harus Bahasa Indonesia)
    console.log("  -> Memuat halaman utama default...");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hcard", { timeout: 10000 });

    const htmlLangInitial = await page.evaluate(() => document.documentElement.lang);
    assert(htmlLangInitial === "id", `Bahasa awal dokumen adalah "id" (ditemukan: "${htmlLangInitial}")`);

    const idBtnActive = await page.evaluate(() => {
      const b = document.querySelector('.lang-btn[data-lang="id"]');
      return b && b.classList.contains("on");
    });
    assert(idBtnActive, "Tombol saklar bahasa ID aktif secara default");

    const navCounterText = await page.locator('.topnav a[href="#/"] .nav-lbl').textContent();
    assert(navCounterText === "Counter Hero", `Topnav tab 1 bernilai "Counter Hero" (ditemukan: "${navCounterText}")`);

    // 4.2 Klik saklar bahasa ke EN
    console.log("  -> Mengklik saklar bahasa EN di header...");
    await page.click('.lang-btn[data-lang="en"]');
    await page.waitForTimeout(300);

    const htmlLangEn = await page.evaluate(() => document.documentElement.lang);
    assert(htmlLangEn === "en", `Atribut lang pada <html> berganti ke "en" (ditemukan: "${htmlLangEn}")`);

    const enBtnActive = await page.evaluate(() => {
      const b = document.querySelector('.lang-btn[data-lang="en"]');
      return b && b.classList.contains("on");
    });
    assert(enBtnActive, "Tombol saklar bahasa EN sekarang memiliki kelas .on");

    const navCounterTextEn = await page.locator('.topnav a[href="#/"] .nav-lbl').textContent();
    assert(navCounterTextEn === "Hero Counters", `Topnav tab 1 berganti ke bahasa Inggris: "${navCounterTextEn}"`);

    const searchInput = page.locator("#q");
    const searchPlaceholder = await searchInput.getAttribute("placeholder");
    assert(searchPlaceholder.includes("hero"), `Placeholder pencarian beradaptasi: "${searchPlaceholder}"`);

    // Uji Bedah Spotlight dalam Bahasa Inggris
    await searchInput.fill("arli");
    await page.waitForSelector(".bedah", { timeout: 5000 });
    const bedahText = await page.locator(".bedah").textContent();
    assert(bedahText.includes("Natural counters") || bedahText.includes("Don't pick"), "Bedah counter menampilkan label bahasa Inggris");
    await searchInput.fill("");

    // 4.3 Navigasi ke Halaman Tentang (#/tentang) & Saklar Bahasa Lokal
    console.log("  -> Menguji saklar bahasa di halaman Tentang (#/tentang)...");
    await page.goto(`${baseUrl}/#/tentang`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".stats", { timeout: 5000 });

    const aboutHeading = await page.locator("h1").textContent();
    assert(aboutHeading.includes("About"), `Judul halaman Tentang berbahasa Inggris: "${aboutHeading}"`);

    // Klik tombol ID di dalam halaman Tentang
    await page.click('.lang-switch-wrap .lang-btn[data-lang="id"]');
    await page.waitForTimeout(300);

    const aboutHeadingId = await page.locator("h1").textContent();
    assert(aboutHeadingId.includes("Tentang"), `Halaman berganti kembali ke bahasa Indonesia: "${aboutHeadingId}"`);

    // 4.4 Uji Persistensi Penyimpanan (localStorage)
    console.log("  -> Menguji persistensi bahasa saat reload...");
    await page.click('.lang-btn[data-lang="en"]');
    await page.waitForTimeout(200);

    const savedLang = await page.evaluate(() => localStorage.getItem("hok-lang"));
    assert(savedLang === "en", `Pilihan bahasa tersimpan di localStorage["hok-lang"] = "${savedLang}"`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".stats", { timeout: 5000 });

    const reloadedLang = await page.evaluate(() => document.documentElement.lang);
    assert(reloadedLang === "en", `Setelah reload, dokumen tetap bahasa Inggris (lang="${reloadedLang}")`);

    // 4.5 Kunjungan ke Seluruh Route dengan Bahasa Inggris (Zero Error)
    console.log("  -> Memeriksa route lain dalam mode EN (Draft, Quiz, Items, Tier, H2H)...");
    for (const hash of ["#/draft", "#/quiz", "#/items", "#/tier", "#/h2h", "#/favorit"]) {
      await page.goto(`${baseUrl}/${hash}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(150);
    }
    assert(jsErrors.length === 0, `Nol error JavaScript selama seluruh navigasi (ditemukan: ${jsErrors.length})`);

    // Kembalikan ke ID
    await page.click('.lang-btn[data-lang="id"]');
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nHasil Akhir: ${passCount} PASS, ${failCount} FAIL`);
  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
