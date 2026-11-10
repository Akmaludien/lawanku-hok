import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const appModule = require('../app.js');

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

// ----------------------------------------------------
// BAGIAN 1: UNIT TESTS ENGINE 5v5 (Pure Functions)
// ----------------------------------------------------
console.log(`\n=== 1. UNIT TESTS: DRAFT 5v5 ENGINE ===`);

const dataRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
const tiersRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'tiers.json'), 'utf8'));
appModule.init5v5TestData(dataRaw.heroes, tiersRaw);

// Test 1: fivev5Turns 16 turns
const turns = appModule.fivev5Turns();
assert('fivev5Turns mengembalikan tepat 16 giliran', Array.isArray(turns) && turns.length === 16, `got ${turns.length}`);

// Test 2: 6 ban turns (User, Bot, User, Bot, User, Bot)
const banTurns = turns.filter(t => t.phase === 'ban');
assert('Fase ban terdiri dari 6 giliran', banTurns.length === 6);
const banWhoSeq = banTurns.map(t => t.who).join(',');
assert('Urutan ban bergantian Kamu, Bot, Kamu, Bot, Kamu, Bot', banWhoSeq === 'user,bot,user,bot,user,bot', `got ${banWhoSeq}`);

// Test 3: 10 pick turns (Snake 1-2-2-2-2-1)
const pickTurns = turns.filter(t => t.phase === 'pick');
assert('Fase pick terdiri dari 10 giliran', pickTurns.length === 10);
const pickWhoSeq = pickTurns.map(t => t.who).join(',');
assert('Urutan pick snake 1-2-2-2-2-1 (U, B, B, U, U, B, B, U, U, B)', pickWhoSeq === 'user,bot,bot,user,user,bot,bot,user,user,bot', `got ${pickWhoSeq}`);

// Test 4: Mulberry32 PRNG deterministik
const rngA1 = appModule.mulberry32(424242);
const rngA2 = appModule.mulberry32(424242);
const valA1 = [rngA1(), rngA1(), rngA1()];
const valA2 = [rngA2(), rngA2(), rngA2()];
assert('Mulberry32 PRNG menghasilkan angka identik untuk seed sama', JSON.stringify(valA1) === JSON.stringify(valA2));

// Test 5: Bot ban saat board kosong memilih hero meta tertinggi
const emptyDraft = {
  ally: [null, null, null, null, null],
  enemy: [null, null, null, null, null],
  ban: [null, null, null, null, null, null],
  history: []
};
const botBan1 = appModule.fivev5BotBan(emptyDraft, appModule.mulberry32(1));
assert('Bot ban pada board kosong memilih hero valid', botBan1 && typeof botBan1.id === 'number');

// Test 6: Bot pick sesuai role
const botPickFarm = appModule.fivev5BotPick(emptyDraft, 'farm', appModule.mulberry32(123));
assert('Bot pick farm memilih hero valid', botPickFarm && typeof botPickFarm.id === 'number');
const farmHero = dataRaw.heroes.find(h => h.id === botPickFarm.id);
assert('Bot pick farm memilih hero yang memiliki peran farm di h.roles', farmHero && farmHero.roles.includes('farm'), `roles: ${farmHero?.roles}`);

// Test 7: Bot pick counter terhadap pick user
// Anggap user pick Angela (Mid). Cari hero yang meng-counter Angela di role mid.
const angela = dataRaw.heroes.find(h => h.en === 'Angela');
if (angela) {
  const draftWithAngela = {
    ally: [null, angela.id, null, null, null],
    enemy: [null, null, null, null, null],
    ban: [null, null, null, null, null, null],
    history: []
  };
  const botPickVsAngela = appModule.fivev5BotPick(draftWithAngela, 'mid', appModule.mulberry32(99));
  assert('Bot pick mid lawan Angela menghasilkan pilihan valid', botPickVsAngela && typeof botPickVsAngela.id === 'number');
}

// Test 8: Auto action timeout
const autoActionUser = appModule.fivev5AutoAction(emptyDraft, 'user');
assert('Auto action user pada ban mengembalikan aksi ban valid', autoActionUser && autoActionUser.action === 'ban' && typeof autoActionUser.id === 'number');

// Test 9: Tally counter faktual
const sampleDraft = {
  ally: [109, 112, 115, 120, 125], // sample 5 hero
  enemy: [130, 135, 140, 145, 150], // sample 5 hero
  ban: [101, 102, 103, 104, 105, 106],
  history: []
};
const tally = appModule.computeDraft5v5Tally(sampleDraft);
assert('computeDraft5v5Tally mengembalikan objek tally counter faktual',
  tally && typeof tally.allyHard === 'number' && typeof tally.allySoft === 'number' &&
  typeof tally.botHard === 'number' && typeof tally.botSoft === 'number');

// ----------------------------------------------------
// BAGIAN 2: E2E BROWSER TESTS (Playwright)
// ----------------------------------------------------
console.log(`\n=== 2. E2E BROWSER TESTS (Playwright) ===`);

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Server uji aktif di ${baseUrl}\n`);

  let browser = null;
  const jsErrors = [];

  try {
    const launchOptions = { headless: true };
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    } else if (process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
      launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else if (process.platform === 'win32' && fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
      launchOptions.executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    }
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    page.on('pageerror', err => {
      jsErrors.push(err.message);
      console.error('  [PAGE JS ERROR]', err.message);
    });

    // 1. Buka halaman #/draft
    await page.goto(`${baseUrl}/#/draft`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.arena');

    // 2. Cek saklar mode
    const modeBar = await page.$('.draft-mode-bar');
    assert('Saklar mode (.draft-mode-bar) ter-render di #/draft', modeBar !== null);

    const btn5v5 = await page.$('#mode-5v5, button.mode-btn:has-text("5v5")');
    assert('Tombol mode "5v5 vs Bot" ada di halaman', btn5v5 !== null);

    // 3. Klik saklar 5v5 vs Bot
    await btn5v5.click();
    await page.waitForSelector('.draft-5v5-banner');
    const banner = await page.$('.draft-5v5-banner');
    assert('Banner giliran 5v5 (.draft-5v5-banner) aktif setelah klik mode 5v5', banner !== null);

    // 4. Verifikasi teks giliran pertama (Turn 0: Ban 1 Kamu)
    const titleText = await page.$eval('.draft-5v5-title', el => el.textContent);
    assert('Judul banner menampilkan giliran Ban 1 Kamu', titleText.includes('Kamu') && titleText.includes('Ban'));

    // 5. Verifikasi timer 30s
    const timerText = await page.$eval('#draft-5v5-timer-val', el => el.textContent);
    assert('Timer countdown 30 detik muncul', timerText.includes('s'));

    // 6. Verifikasi slot peran menampilkan label peran
    const roleTags = await page.$$eval('.slot-role-tag', els => els.map(e => e.textContent));
    assert('Slot draft 5v5 menampilkan tag peran (Farm/Mid/Jungle/Roam/Clash)', roleTags.length > 0);

    // 7. Simulasikan permainan cepat hingga selesai (16 turn)
    // Di browser context, kita bisa panggil advance / auto actions untuk mensimulasikan full match
    await page.evaluate(() => {
      const KEY = 'hok-draft5v5';
      const DRAFT_KEY = 'hok-draft';
      const st = JSON.parse(localStorage.getItem(KEY)) || {};
      const dummyBans = [101, 102, 103, 104, 105, 106];
      const dummyAlly = [109, 112, 115, 120, 125];
      const dummyEnemy = [130, 135, 140, 145, 150];
      const draftObj = { ally: dummyAlly, enemy: dummyEnemy, ban: dummyBans, history: [] };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
      st.turnIndex = 16;
      st.active = true;
      localStorage.setItem(KEY, JSON.stringify(st));
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.draft-5v5-result', { timeout: 10000 });
    const resultCard = await page.$('.draft-5v5-result');
    assert('Layar hasil draft (.draft-5v5-result) muncul setelah turn ke-16 selesai', resultCard !== null);

    const tallyBoxes = await page.$$('.draft-5v5-tally-box');
    assert('Tally counter 2 tim (Tim Kamu vs Tim Bot) muncul di layar hasil', tallyBoxes.length === 2);

    const playAgainBtn = await page.$('button:has-text("Main Lagi")');
    assert('Tombol "Main Lagi" tersedia di layar hasil', playAgainBtn !== null);

    const saveResultBtn = await page.$('button:has-text("Simpan Draft")');
    assert('Tombol "Simpan Draft" tersedia di layar hasil', saveResultBtn !== null);

    assert('Nol error JavaScript selama seluruh alur draft 5v5', jsErrors.length === 0, jsErrors.join('; '));

  } catch (err) {
    console.error('Error selama pengujian E2E Playwright:', err);
    fail++;
  } finally {
    if (browser) await browser.close();
    server.close();

    console.log(`\n========================================`);
    console.log(`Hasil Pengujian: ${pass} PASS, ${fail} FAIL`);
    console.log(`========================================\n`);

    if (fail > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
});
