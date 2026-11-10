// tests/prerender-test.mjs
// Pengujian QA Fase 28: SEO Prerender 120 Halaman Hero & Sitemap

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 61666;

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slug(name) {
  return name
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/'/g, "-").replace(/&/g, " ")
    .replace(/[()]/g, " ").replace(/\./g, "-")
    .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    const filePath = path.join(ROOT, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

async function run() {
  console.log('=== PRERENDER & SEO TESTS (FASE 28) ===\n');
  let pass = 0;
  let fail = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✓ ${name}`);
      pass++;
    } else {
      console.error(`  ✗ ${name} ${extra ? '(' + extra + ')' : ''}`);
      fail++;
    }
  }

  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
  const heroes = data.heroes;
  const heroDir = path.join(ROOT, 'hero');

  // [1] Cek jumlah file
  console.log('[1] Memeriksa keberadaan 120 halaman hero...');
  assert('Folder hero/ ada di root repo', fs.existsSync(heroDir));

  let missingFiles = 0;
  for (const h of heroes) {
    const s = slug(h.en);
    const p = path.join(heroDir, s, 'index.html');
    if (!fs.existsSync(p)) missingFiles++;
  }
  assert('Tepat 120 file hero/<slug>/index.html ditemukan', missingFiles === 0, `${missingFiles} file hilang`);

  // [2] Cek integritas data tiap file
  console.log('\n[2] Memeriksa konten dan integritas data 120 file hero...');
  let invalidContentCount = 0;
  let forbiddenWordsCount = 0;
  const forbiddenPatterns = [/win rate/i, /pick rate/i, /ban rate/i, /pertandingan/i, /ai advisor/i];

  for (const h of heroes) {
    const s = slug(h.en);
    const p = path.join(heroDir, s, 'index.html');
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');

    // Title & Name check
    if (!content.includes(`<title>Counter `) || (!content.includes(h.en) && !content.includes(escapeHtml(h.en)))) {
      invalidContentCount++;
    }
    // howToPlayAgainst check (jika ada)
    if (h.howToPlayAgainst) {
      const excerpt = h.howToPlayAgainst.slice(0, 30);
      if (!content.includes(excerpt) && !content.includes(escapeHtml(excerpt))) {
        invalidContentCount++;
      }
    }
    // Counter minimal 1 jika ada
    if (h.naturalCounters && h.naturalCounters.length > 0) {
      const firstCounter = heroes.find(x => x.id === h.naturalCounters[0].hero);
      if (firstCounter && !content.includes(firstCounter.en) && !content.includes(escapeHtml(firstCounter.en))) {
        invalidContentCount++;
      }
    }
    // Cek kata terlarang (angka statistik/AI advisor)
    for (const pat of forbiddenPatterns) {
      if (pat.test(content)) {
        forbiddenWordsCount++;
        console.error(`    Pola terlarang "${pat}" ditemukan di hero/${s}/index.html`);
      }
    }
  }

  assert('Semua 120 file memuat nama hero, cara melawan, dan counter yang valid', invalidContentCount === 0);
  assert('Nol pola teks statistik/angka terlarang di seluruh 120 halaman', forbiddenWordsCount === 0);

  // [3] Cek sitemap.xml
  console.log('\n[3] Memeriksa validitas sitemap.xml...');
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  assert('sitemap.xml ada di root repo', fs.existsSync(sitemapPath));
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');

  const urlMatches = sitemapXml.match(/<url>/g) || [];
  assert('sitemap.xml berisi tepat 121 URL (1 root + 120 hero)', urlMatches.length === 121, `Ditemukan ${urlMatches.length} URL`);
  assert('sitemap.xml tidak memuat fragmen URL "#"', !sitemapXml.includes('#'));
  assert('Root URL priority 1.0 ada di sitemap', sitemapXml.includes('<loc>https://lawanku.vercel.app/</loc>') && sitemapXml.includes('<priority>1.0</priority>'));
  assert('Tanggal lastmod memakai 2026-11-09 (tanggal data)', sitemapXml.includes('<lastmod>2026-11-09</lastmod>'));

  // [4] Headless Browser Test (JavaScript Dinonaktifkan)
  console.log('\n[4] Pengujian Headless Browser dengan JavaScript dinonaktifkan...');
  const server = await startServer();
  let browser = null;

  try {
    const launchOptions = { headless: true };
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    } else if (process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
      launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      javaScriptEnabled: false, // WAJIB: Verifikasi bahwa konten tampil tanpa JavaScript!
      viewport: { width: 390, height: 844 }, // Mobile 390px
    });
    const page = await context.newPage();

    for (const testHeroName of ['Angela', 'Arli', 'Donghuang']) {
      const testSlug = slug(testHeroName);
      await page.goto(`http://localhost:${PORT}/hero/${testSlug}/`, { waitUntil: 'domcontentloaded' });

      // Verifikasi H1
      const h1Text = await page.$eval('h1', el => el.textContent.trim());
      assert(`[${testHeroName}] H1 tampil tanpa JS: "${h1Text}"`, h1Text === testHeroName);

      // Verifikasi tombol CTA
      const ctaHref = await page.$eval('.btn-open-app', el => el.getAttribute('href'));
      assert(`[${testHeroName}] Tombol CTA mengarah ke /#/hero/${testSlug}`, ctaHref === `/#/hero/${testSlug}`);

      // Verifikasi section counter alami
      const hasCounters = await page.$$eval('.counter-row-prerender', rows => rows.length > 0);
      assert(`[${testHeroName}] Daftar counter alami ter-render`, hasCounters);
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log(`\nHasil Akhir: ${pass} PASS, ${fail} FAIL`);
  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error di prerender-test:', err);
  process.exit(1);
});
