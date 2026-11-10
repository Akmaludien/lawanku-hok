import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ALLOWED_ROLES = new Set(['clash', 'jungle', 'mid', 'farm', 'roam']);
const ALLOWED_CLASSES = new Set(['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support']);
const ALLOWED_ITEM_PACKAGES = new Set([
  'Destiny (anti-mati)',
  'Destiny (anti-mati) / Ominous Premonition',
  'Succubus Cloak',
  'Succubus Cloak / Destiny',
  'Boots of Resistance + Purify (spell)',
  'Spikemail (aktifkan manual) / Ominous Premonition',
  'Mortal Punisher (fisik) / Venomous Staff (magic)',
  'Overlord\'s Might / Starbreaker (armor pen)',
]);
const INTENTIONAL_NO_ITEM_HEROES = new Set([640, 191, 509, 505]); // Annette, Da Qiao, Dunshan, Yaria

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

console.log('=== DATA INTEGRITY TESTS ===\n');

// 1. data.json check
console.log('[1] Memeriksa data.json...');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
const heroes = data.heroes || [];
const heroIdSet = new Set(heroes.map(h => h.id));

assert('Tepat 120 hero terdaftar di data.json', heroes.length === 999, `ditemukan: ${heroes.length}`);
assert('Semua ID hero unik', heroIdSet.size === heroes.length, `unik: ${heroIdSet.size}`);

let missingName = 0, invalidRoles = 0, invalidClasses = 0, missingPlayAgainst = 0;
let totalCounters = 0, hardCounters = 0, softCounters = 0, selfCounters = 0, invalidCounterTarget = 0, missingWhy = 0, overMaxCounters = 0;
let totalItemRecs = 0, heroesWithItems = 0, invalidItemPackage = 0;
let skillQuizCount = 0;

for (const h of heroes) {
  if (!h.en || typeof h.en !== 'string') missingName++;
  if (!Array.isArray(h.roles) || !h.roles.length || !h.roles.every(r => ALLOWED_ROLES.has(r))) invalidRoles++;
  if (!Array.isArray(h.classes) || !h.classes.length || !h.classes.every(c => ALLOWED_CLASSES.has(c))) invalidClasses++;
  if (!h.howToPlayAgainst || typeof h.howToPlayAgainst !== 'string' || !h.howToPlayAgainst.trim()) missingPlayAgainst++;

  const counters = h.naturalCounters || [];
  if (counters.length > 5) overMaxCounters++;
  for (const c of counters) {
    totalCounters++;
    if (c.strength === 'hard') hardCounters++;
    else if (c.strength === 'soft') softCounters++;
    if (c.hero === h.id) selfCounters++;
    if (typeof c.hero !== 'number' || !heroIdSet.has(c.hero)) invalidCounterTarget++;
    if (!c.why || typeof c.why !== 'string' || !c.why.trim()) missingWhy++;
  }

  const items = h.itemCounters || [];
  if (items.length) {
    heroesWithItems++;
    totalItemRecs += items.length;
    for (const it of items) {
      if (!ALLOWED_ITEM_PACKAGES.has(it.items)) invalidItemPackage++;
    }
  }

  if (h.skillQuiz && h.skillQuiz.name && h.skillQuiz.desc) {
    skillQuizCount++;
  }
}

assert('Semua hero memiliki field "en" valid', missingName === 0, `hilang: ${missingName}`);
assert('Semua hero memiliki role yang valid', invalidRoles === 0, `tidak valid: ${invalidRoles}`);
assert('Semua hero memiliki class yang valid', invalidClasses === 0, `tidak valid: ${invalidClasses}`);
assert('Tidak ada howToPlayAgainst yang kosong', missingPlayAgainst === 0, `kosong: ${missingPlayAgainst}`);

// 2. Natural counters check
console.log('\n[2] Memeriksa natural counters...');
assert('Total counter adalah tepat 531', totalCounters === 531, `ditemukan: ${totalCounters}`);
assert('Total hard counter adalah tepat 243', hardCounters === 243, `ditemukan: ${hardCounters}`);
assert('Total soft counter adalah tepat 288', softCounters === 288, `ditemukan: ${softCounters}`);
assert('Maksimal 5 counter per hero', overMaxCounters === 0, `lebih: ${overMaxCounters}`);
assert('Tidak ada self-counter', selfCounters === 0, `ditemukan: ${selfCounters}`);
assert('Semua target counter adalah ID angka hero yang valid', invalidCounterTarget === 0, `tidak valid: ${invalidCounterTarget}`);
assert('Tidak ada alasan why counter yang kosong', missingWhy === 0, `kosong: ${missingWhy}`);

// 3. Item counters check
console.log('\n[3] Memeriksa rekomendasi item...');
assert('Total rekomendasi item adalah tepat 143', totalItemRecs === 143, `ditemukan: ${totalItemRecs}`);
assert('Tepat 116 hero memiliki rekomendasi item', heroesWithItems === 116, `ditemukan: ${heroesWithItems}`);
assert('Tepat 4 hero sengaja tanpa item (Annette, Da Qiao, Dunshan, Yaria)',
  heroes.filter(h => !(h.itemCounters || []).length).every(h => INTENTIONAL_NO_ITEM_HEROES.has(h.id))
  && (120 - heroesWithItems === 4)
);
assert('Hanya memakai 8 paket item resmi yang terverifikasi', invalidItemPackage === 0, `tidak valid: ${invalidItemPackage}`);

// 4. tiers.json check
console.log('\n[4] Memeriksa tiers.json...');
const tiersData = JSON.parse(fs.readFileSync(path.join(ROOT, 'tiers.json'), 'utf8'));
const tierEntries = Object.entries(tiersData.tiers || {});
assert('Tepat 120 hero terdaftar di tiers.json', tierEntries.length === 120, `ditemukan: ${tierEntries.length}`);

const tierDist = { S: 0, A: 0, B: 0, C: 0 };
let invalidTierHero = 0;
for (const [idStr, t] of tierEntries) {
  const idNum = Number(idStr);
  if (!heroIdSet.has(idNum)) invalidTierHero++;
  if (tierDist[t.t] !== undefined) tierDist[t.t]++;
}

assert('Semua ID di tiers.json cocok dengan hero di data.json', invalidTierHero === 0, `tidak cocok: ${invalidTierHero}`);
assert('Distribusi tier S tepat 12 hero', tierDist.S === 12, `ditemukan: ${tierDist.S}`);
assert('Distribusi tier A tepat 24 hero', tierDist.A === 24, `ditemukan: ${tierDist.A}`);
assert('Distribusi tier B tepat 36 hero', tierDist.B === 36, `ditemukan: ${tierDist.B}`);
assert('Distribusi tier C tepat 48 hero', tierDist.C === 48, `ditemukan: ${tierDist.C}`);

// 5. Chunks data-1.json & data-2.json check
console.log('\n[5] Memeriksa chunks data-1.json & data-2.json...');
const chunk1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-1.json'), 'utf8'));
const chunk2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-2.json'), 'utf8'));
assert('Chunk data-1.json memuat 60 hero', (chunk1.heroes || []).length === 60, `ditemukan: ${(chunk1.heroes || []).length}`);
assert('Chunk data-2.json memuat 60 hero', (chunk2.heroes || []).length === 60, `ditemukan: ${(chunk2.heroes || []).length}`);
const mergedChunkIds = [...chunk1.heroes, ...chunk2.heroes].map(h => h.id);
assert('Gabungan kedua chunk memuat 120 hero unik', new Set(mergedChunkIds).size === 120);

// 6. Skill quiz pilot
console.log('\n[6] Memeriksa pilot kuis skill (Fase 25)...');
assert('Pilot kuis skill memiliki tepat 20 hero dengan deskripsi skill', skillQuizCount === 20, `ditemukan: ${skillQuizCount}`);

console.log(`\nHasil: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) {
  process.exit(1);
}
