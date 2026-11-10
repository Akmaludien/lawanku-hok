// tests/sync-test.mjs
// Pengujian Integrasi Fase 27: Lawanku API Sync & Suggestion

import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 61665;

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
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

async function run() {
  console.log("=== FASE 27 SYNC & API INTEGRATION TESTS ===");
  const server = await startServer();
  console.log(`Server aktif di http://localhost:${PORT}`);

  const launchOptions = { headless: true };
  if (process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH;
  } else if (process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  let failCount = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`  ✗ FAIL: ${message}`);
      failCount++;
    } else {
      console.log(`  ✓ ${message}`);
    }
  }

  try {
    await page.goto(`http://localhost:${PORT}/#/favorit`);
    await page.waitForSelector("#main h1");

    // [1] Cek tombol sinkronisasi di Favorit
    console.log("\n[1] Memeriksa Tombol Sinkronisasi di Favorit...");
    const syncFavBtn = await page.$("#syncfavbtn");
    assert(syncFavBtn !== null, "Tombol #syncfavbtn tersedia di header Favorit");

    // [2] Buka dialog sinkronisasi
    console.log("\n[2] Membuka Dialog Sinkronisasi (#sync-dlg)...");
    await syncFavBtn.click();
    await page.waitForSelector("#sync-dlg[open]");
    const isOpen = await page.evaluate(() => {
      const dlg = document.querySelector("#sync-dlg");
      return dlg && dlg.open;
    });
    assert(isOpen, "Dialog #sync-dlg terbuka dengan atribut open");

    // Cek konten State 1 (Belum Terhubung)
    const hasPairBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("#sync-dlg button")).find(b => b.textContent.includes("Minta Kode Pairing"));
      return !!btn;
    });
    assert(hasPairBtn, "Terdapat tombol 'Minta Kode Pairing'");

    const hasClaimInput = await page.evaluate(() => {
      return !!document.querySelector("#sync-dlg input[maxlength='6']");
    });
    assert(hasClaimInput, "Terdapat input kode pairing 6 digit");

    // Tutup dialog
    const closeBtn = await page.$("#sync-dlg .x");
    await closeBtn.click();
    const isClosed = await page.evaluate(() => {
      const dlg = document.querySelector("#sync-dlg");
      return !dlg || !dlg.open;
    });
    assert(isClosed, "Dialog #sync-dlg berhasil ditutup");

    // [3] Cek tombol sinkronisasi di Draft Pick (#/draft)
    console.log("\n[3] Memeriksa Tombol Sinkronisasi di Arena Draft (#/draft)...");
    await page.goto(`http://localhost:${PORT}/#/draft`);
    await page.waitForSelector("#syncdraftbtn");
    const syncDraftBtn = await page.$("#syncdraftbtn");
    assert(syncDraftBtn !== null, "Tombol #syncdraftbtn tersedia di baris bagikan/simpan draft");

    // [4] Cek seksi sinkronisasi di Tentang (#/tentang)
    console.log("\n[4] Memeriksa Seksi Sinkronisasi di Tentang (#/tentang)...");
    await page.goto(`http://localhost:${PORT}/#/tentang`);
    await page.waitForSelector("#main h1");
    const hasSyncSection = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("#main .card"));
      return cards.some(c => c.textContent.includes("Sinkronisasi Antar-Perangkat"));
    });
    assert(hasSyncSection, "Seksi 'Sinkronisasi Antar-Perangkat' terpasang di halaman Tentang");

    // [5] Cek integrasi Form Usulan di Halaman Hero (#/hero/daji)
    console.log("\n[5] Memeriksa Form Usulan Hero (#/hero/daji)...");
    await page.goto(`http://localhost:${PORT}/#/hero/daji`);
    await page.waitForSelector("#usulbtn");
    const usulBtn = await page.$("#usulbtn");
    assert(usulBtn !== null, "Tombol #usulbtn tersedia di halaman hero");

    await usulBtn.click();
    await page.waitForSelector("#usul[open]");
    const isUsulOpen = await page.evaluate(() => {
      const d = document.querySelector("#usul");
      return d && d.open;
    });
    assert(isUsulOpen, "Dialog usulan #usul terbuka");

    // Cek localStorage device ID
    const deviceId = await page.evaluate(() => localStorage.getItem("hok-device-id"));
    assert(deviceId && deviceId.length >= 8, `Device ID dihasilkan secara otomatis: ${deviceId}`);

    console.log(`\nHasil Akhir: ${failCount === 0 ? "SEMUA TES LOLOS" : `${failCount} GAGAL`}`);
  } finally {
    await browser.close();
    server.close();
  }

  if (failCount > 0) process.exit(1);
}

run().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
