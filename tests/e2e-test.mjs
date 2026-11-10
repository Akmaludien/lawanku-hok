import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log('  [404 NOT FOUND]', req.url, '->', filePath);
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

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

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`\n=== E2E BROWSER TESTS (Playwright) ===`);
  console.log(`Server aktif di ${baseUrl}\n`);

  let browser = null;
  const jsErrors = [];

  try {
    const launchOptions = { headless: true };
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    } else if (process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
      launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    page.on('pageerror', err => {
      console.error('  [PageError]', err.stack || err.message);
      jsErrors.push(err.message);
    });
    page.on('console', msg => {
      console.log('  [CONSOLE]', msg.text());
    });

    // 1. Home Page & 120 Hero Cards
    console.log('[1] Menguji Halaman Utama & Grid Hero...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hcard', { timeout: 10000 });

    const heroCardsCount = await page.locator('.hcard').count();
    assert('Halaman utama merender tepat 120 kartu hero', heroCardsCount === 120, `ditemukan: ${heroCardsCount}`);

    // Test Search & Bedah Counter
    const searchInput = page.locator('#q');
    await searchInput.fill('daji');
    await page.waitForSelector('.bedah', { timeout: 5000 });
    const bedahText = await page.locator('.bedah').textContent();
    assert('Bedah counter muncul saat pencarian hero (Daji)', bedahText.includes('Daji'));
    await searchInput.fill('');

    // 2. Draft Pick Page (#/draft)
    console.log('\n[2] Menguji Arena Draft (#/draft)...');
    await page.goto(`${baseUrl}/#/draft`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.arena', { timeout: 10000 });
    const allySlotsCount = await page.locator('.slot[data-team="ally"]').count();
    const enemySlotsCount = await page.locator('.slot[data-team="enemy"]').count();
    assert('Arena draft memiliki 5 slot ally dan 5 slot enemy', allySlotsCount === 5 && enemySlotsCount === 5);

    // Test Share Card
    const shareBtn = page.locator('#shareimgbtn');
    await shareBtn.scrollIntoViewIfNeeded();
    await shareBtn.click({ force: true });
    await page.waitForSelector('#sharecard-dlg[open]', { timeout: 5000 });
    await page.waitForSelector('#sharecard-preview canvas', { timeout: 10000 });
    const canvasIs1200 = await page.evaluate(() => {
      const c = document.querySelector('#sharecard-preview canvas');
      return c && c.width === 1200 && c.height === 675;
    });
    assert('Share card draft merender canvas beresolusi 1200x675', canvasIs1200);
    await page.click('#sharecard-dlg .x');
    await page.waitForTimeout(200);

    // 3. Head-to-Head Page (#/h2h)
    console.log('\n[3] Menguji Head-to-Head (#/h2h)...');
    await page.goto(`${baseUrl}/#/h2h`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.h2h-slot', { timeout: 10000 });
    const slotsCount = await page.locator('.h2h-slot').count();
    assert('Halaman H2H memiliki 2 slot pemilih hero', slotsCount === 2);

    // Buka picker slot A dan pilih hero (Arli id 199)
    await page.locator('.h2h-slot').first().click();
    await page.waitForSelector('#h2hdlg[open]', { timeout: 5000 });
    await page.click('#h2hdlg .pickhero[data-id="199"]');
    await page.waitForTimeout(200);

    // Buka picker slot B dan pilih hero (Donghuang id 187)
    await page.locator('.h2h-slot').last().click();
    await page.waitForSelector('#h2hdlg[open]', { timeout: 5000 });
    await page.click('#h2hdlg .pickhero[data-id="187"]');
    await page.waitForTimeout(200);

    const h2hContent = await page.locator('#main').textContent();
    assert('Analisis H2H merender hubungan counter Arli vs Donghuang', h2hContent.includes('Donghuang') && h2hContent.includes('Arli'));

    // 4. Kuis Page (#/quiz)
    console.log('\n[4] Menguji Kuis (#/quiz)...');
    await page.goto(`${baseUrl}/#/quiz`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.seg .m', { timeout: 10000 });
    const quizModesCount = await page.locator('.seg .m').count();
    assert('Terdapat 4 mode kuis pada tab kuis', quizModesCount === 4);

    // Klik mode Tebak Skill
    await page.click('.seg .m[data-mode="skill"]');
    await page.waitForSelector('#qprog', { timeout: 5000 });
    const progText = await page.locator('#qprog').textContent();
    assert('Mode Tebak Skill aktif dan menampilkan progress Soal 1/10', progText.includes('Soal 1/10'));

    // 5. Tier List Page (#/tier)
    console.log('\n[5] Menguji Tier List (#/tier)...');
    await page.goto(`${baseUrl}/#/tier`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.tiersec', { timeout: 10000 });
    const tierSections = await page.locator('.tiersec').count();
    assert('Tier list memuat 4 seksi tier (S, A, B, C)', tierSections === 4);

    // 6. Item Wiki Page (#/items)
    console.log('\n[6] Menguji Item Wiki (#/items)...');
    await page.goto(`${baseUrl}/#/items`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.wikicard', { timeout: 10000 });
    const itemCardsCount = await page.locator('.wikicard').count();
    assert('Item wiki merender tepat 8 paket item counter', itemCardsCount === 8);

    // 7. Error check
    console.log('\n[7] Memeriksa Exception & Error JavaScript...');
    assert('Nol error JavaScript selama seluruh navigasi dan interaksi', jsErrors.length === 0, jsErrors.join('; '));

  } catch (err) {
    console.error('Fatal test error:', err);
    fail++;
  } finally {
    if (browser) await browser.close();
    server.close(() => {
      console.log(`\nHasil Akhir: ${pass} PASS, ${fail} FAIL`);
      process.exit(fail > 0 ? 1 : 0);
    });
  }
});
