// scripts/prerender.mjs
// Generator SEO Prerender: 120 Halaman Hero Statis + Sitemap XML
// Bagian dari Fase 28 Lawanku — Tanpa dependensi eksternal

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 1. Replikasi fungsi slug() persis dari app.js baris 17
function slug(name) {
  return name
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/'/g, "-").replace(/&/g, " ")
    .replace(/[()]/g, " ").replace(/\./g, "-")
    .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// 2. Escape HTML untuk keamanan dan sintaks valid (mis. Ao'yin, Gan & Mo)
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 3. Format nama role (seperti roleName di app.js)
function roleName(r) {
  if (!r) return '';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

// 4. Meta description dari howToPlayAgainst (potong <= 160 karakter)
function makeMetaDescription(text, heroName) {
  if (!text) {
    return `Panduan cara melawan dan counter alami untuk ${heroName} di Honor of Kings (HoK).`;
  }
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 160) return clean;
  const cut = clean.slice(0, 157);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + '...';
}

// Muat dataset kanonis
const dataRaw = fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8');
const data = JSON.parse(dataRaw);
const heroes = data.heroes;

const tiersRaw = fs.readFileSync(path.join(ROOT, 'tiers.json'), 'utf8');
const tiersData = JSON.parse(tiersRaw);
const tiersMap = (tiersData && tiersData.tiers) || {};

const byId = new Map();
for (const h of heroes) {
  byId.set(h.id, h);
}

console.log(`Memuat ${heroes.length} hero dari data.json...`);

// Generator Halaman Hero
function generateHeroHtml(hero) {
  const heroSlug = slug(hero.en);
  const canonicalUrl = `https://lawanku.vercel.app/hero/${heroSlug}/`;
  const metaDesc = makeMetaDescription(hero.howToPlayAgainst, hero.en);
  const ogImageUrl = `https://lawanku.vercel.app/icons/hero/${hero.id}.webp`;

  // Ambil huruf tier dari tiers.json
  const tierEntry = tiersMap[String(hero.id)];
  const tierLetter = tierEntry && tierEntry.t ? tierEntry.t.toUpperCase() : null;

  // Counter alami (maks 5, hard dulu)
  const naturalCounters = [...(hero.naturalCounters || [])]
    .sort((a, b) => (a.strength === 'hard' ? 0 : 1) - (b.strength === 'hard' ? 0 : 1))
    .slice(0, 5);

  // Reverse lookup: Jangan pick (hero yang di-counter oleh hero ini)
  const revCounters = [];
  for (const other of heroes) {
    if (other.id === hero.id) continue;
    for (const c of (other.naturalCounters || [])) {
      if (c.hero === hero.id) {
        revCounters.push({ hero: other, c });
        break;
      }
    }
  }
  revCounters.sort((a, b) => (a.c.strength === 'hard' ? 0 : 1) - (b.c.strength === 'hard' ? 0 : 1));
  const topRev = revCounters.slice(0, 5);
  const remainingRevCount = revCounters.length > 5 ? revCounters.length - 5 : 0;

  // Role & Kelas line
  const rolesClassesLine = hero.roles.map(roleName).join(' / ') + ' · ' + hero.classes.join(', ');

  // Structured Data JSON-LD (WebPage + BreadcrumbList)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": `Counter ${hero.en} — Lawanku`,
        "description": metaDesc,
        "inLanguage": "id"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Beranda",
            "item": "https://lawanku.vercel.app/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Counter Hero",
            "item": "https://lawanku.vercel.app/#/"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": hero.en,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };

  // Render HTML
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Counter ${escapeHtml(hero.en)} — Lawanku</title>
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="../../logo.svg" type="image/svg+xml">
  <meta name="theme-color" content="#0f131c">

  <!-- Open Graph -->
  <meta property="og:title" content="Counter ${escapeHtml(hero.en)} — Lawanku">
  <meta property="og:description" content="${escapeHtml(metaDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImageUrl}">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="stylesheet" href="../../styles.css">
  <style>
    .prerender-wrap { max-width: 720px; margin: 0 auto; padding: var(--s3); box-sizing: border-box; }
    .crumb-nav { font-size: 13px; margin-bottom: var(--s2); color: var(--mut); }
    .crumb-nav a { color: var(--mut); text-decoration: none; }
    .crumb-nav a:hover { color: var(--fg); text-decoration: underline; }
    .crumb-nav span { color: var(--fg); font-weight: 600; }
    .hero-head-prerender { display: flex; gap: var(--s3); align-items: center; margin-bottom: var(--s3); }
    .hero-avatar-prerender { width: 72px; height: 72px; border-radius: 10px; background: var(--chip); object-fit: cover; flex-shrink: 0; border: 1px solid var(--line); }
    .hero-title-group h1 { margin: 0 0 4px; font-size: 26px; color: var(--fg); font-family: var(--font-title); }
    .hero-subtitle { margin: 0; color: var(--mut); font-size: 14px; }
    .tier-chip { display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-top: 6px; }
    .btn-open-app { display: block; width: 100%; box-sizing: border-box; text-align: center; background: var(--acc); color: #0f131c; font-weight: 800; font-size: 16px; padding: 14px 20px; border-radius: 8px; text-decoration: none; margin: var(--s3) 0 var(--s4); box-shadow: 0 4px 14px rgba(245, 158, 11, .3); transition: opacity .15s ease; }
    .btn-open-app:hover { opacity: 0.9; }
    .prerender-card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: var(--s3); margin-bottom: var(--s3); }
    .prerender-card h2 { font-size: 17px; margin: 0 0 var(--s2); color: var(--acc); border-bottom: 1px solid var(--line); padding-bottom: 6px; }
    .counter-row-prerender { display: flex; gap: var(--s2); align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .counter-row-prerender:last-child { border-bottom: none; }
    .counter-avatar { width: 44px; height: 44px; border-radius: 6px; background: var(--chip); object-fit: cover; flex-shrink: 0; }
    .counter-body { flex: 1; min-width: 0; }
    .counter-head-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .counter-name-link { font-weight: 700; color: var(--fg); text-decoration: none; }
    .counter-name-link:hover { color: var(--acc); text-decoration: underline; }
    .counter-why-text { margin: 0; font-size: 14px; color: var(--mut); line-height: 1.4; }
    .item-entry { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .item-entry:last-child { border-bottom: none; }
    .item-title-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
    .item-name-str { font-weight: 700; color: var(--fg); }
    .footer-prerender { text-align: center; margin-top: var(--s4); padding-top: var(--s3); border-top: 1px solid var(--line); font-size: 13px; color: var(--mut); }
    .footer-prerender a { color: var(--acc); text-decoration: none; }
    .footer-prerender a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main class="prerender-wrap">
    <nav aria-label="Breadcrumb" class="crumb-nav">
      <a href="/">Beranda</a> &rsaquo;
      <a href="/#/">Counter Hero</a> &rsaquo;
      <span>${escapeHtml(hero.en)}</span>
    </nav>

    <header class="hero-head-prerender">
      <img src="../../icons/hero/${hero.id}.webp" alt="${escapeHtml(hero.en)}" class="hero-avatar-prerender" width="72" height="72">
      <div class="hero-title-group">
        <h1>${escapeHtml(hero.en)}</h1>
        <p class="hero-subtitle">${escapeHtml(rolesClassesLine)}</p>
        ${tierLetter ? `<span class="tier-chip tierbadge t${tierLetter.toLowerCase()}">Tier ${escapeHtml(tierLetter)}</span>` : ''}
      </div>
    </header>

    <a href="/#/hero/${heroSlug}" class="btn-open-app">⚡ Buka di Lawanku</a>

    ${hero.howToPlayAgainst ? `
    <section class="prerender-card">
      <h2>Cara Melawan ${escapeHtml(hero.en)}</h2>
      <p style="margin: 0; line-height: 1.5; color: var(--fg);">${escapeHtml(hero.howToPlayAgainst)}</p>
    </section>` : ''}

    <section class="prerender-card">
      <h2>Counter Alami ${escapeHtml(hero.en)}</h2>
      ${naturalCounters.length === 0 ? '<p class="mut">Belum ada counter alami terdaftar.</p>' : ''}
      ${naturalCounters.map(c => {
        const ch = byId.get(c.hero);
        if (!ch) return '';
        const chSlug = slug(ch.en);
        return `
      <div class="counter-row-prerender">
        <img src="../../icons/hero/${ch.id}.webp" alt="${escapeHtml(ch.en)}" class="counter-avatar" width="44" height="44" loading="lazy">
        <div class="counter-body">
          <div class="counter-head-line">
            <a href="/hero/${chSlug}/" class="counter-name-link">${escapeHtml(ch.en)}</a>
            <span class="badge ${c.strength}">${escapeHtml(c.strength)}</span>
          </div>
          ${c.why ? `<p class="counter-why-text">${escapeHtml(c.why)}</p>` : ''}
        </div>
      </div>`;
      }).join('')}
    </section>

    ${(hero.itemCounters && hero.itemCounters.length > 0) ? `
    <section class="prerender-card">
      <h2>Rekomendasi Item Lawan ${escapeHtml(hero.en)}</h2>
      ${hero.itemCounters.map(c => `
      <div class="item-entry">
        <div class="item-title-row">
          <span class="item-name-str">${escapeHtml(c.items)}</span>
          <span class="tag ${c.needsReview ? '' : 'ok'}">${c.needsReview ? 'belum dikurasi' : 'terkurasi'}</span>
        </div>
        ${c.why ? `<p class="counter-why-text">${escapeHtml(c.why)}</p>` : ''}
      </div>`).join('')}
    </section>` : ''}

    <section class="prerender-card">
      <h2>Jangan Pick Melawan ${escapeHtml(hero.en)}</h2>
      ${topRev.length === 0 ? '<p class="mut">Belum ada data counter lawan.</p>' : ''}
      ${topRev.map(({ hero: ch, c }) => {
        const chSlug = slug(ch.en);
        return `
      <div class="counter-row-prerender">
        <img src="../../icons/hero/${ch.id}.webp" alt="${escapeHtml(ch.en)}" class="counter-avatar" width="44" height="44" loading="lazy">
        <div class="counter-body">
          <div class="counter-head-line">
            <a href="/hero/${chSlug}/" class="counter-name-link">${escapeHtml(ch.en)}</a>
            <span class="badge ${c.strength}">${escapeHtml(c.strength)}</span>
          </div>
          ${c.why ? `<p class="counter-why-text">${escapeHtml(c.why)}</p>` : ''}
        </div>
      </div>`;
      }).join('')}
      ${remainingRevCount > 0 ? `<p class="mut" style="margin: 8px 0 0; font-size: 13px;">…dan ${remainingRevCount} hero lagi.</p>` : ''}
    </section>

    <footer class="footer-prerender">
      <p style="margin: 0 0 8px;">Lawanku — data patch S16, snapshot 6 Nov 2026. Alat bantu draft pick &amp; counter hero Honor of Kings.</p>
      <a href="/">← Kembali ke Beranda Lawanku</a>
    </footer>
  </main>
</body>
</html>`;
}

// 5. Fungsi generate semua halaman hero
export function generateHeroPages() {
  const heroBaseDir = path.join(ROOT, 'hero');
  if (!fs.existsSync(heroBaseDir)) {
    fs.mkdirSync(heroBaseDir, { recursive: true });
  }

  let count = 0;
  for (const hero of heroes) {
    const heroSlug = slug(hero.en);
    const heroDir = path.join(heroBaseDir, heroSlug);
    if (!fs.existsSync(heroDir)) {
      fs.mkdirSync(heroDir, { recursive: true });
    }
    const html = generateHeroHtml(hero);
    fs.writeFileSync(path.join(heroDir, 'index.html'), html, 'utf8');
    count++;
  }
  console.log(`Berhasil membuat ${count} halaman hero statis di hero/<slug>/index.html.`);
  return count;
}

// 6. Fungsi generate sitemap.xml
export function generateSitemap() {
  const urls = [
    {
      loc: 'https://lawanku.vercel.app/',
      lastmod: '2026-11-09',
      changefreq: 'daily',
      priority: '1.0'
    }
  ];

  for (const hero of heroes) {
    const heroSlug = slug(hero.en);
    urls.push({
      loc: `https://lawanku.vercel.app/hero/${heroSlug}/`,
      lastmod: '2026-11-09',
      changefreq: 'weekly',
      priority: '0.8'
    });
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`Berhasil membuat sitemap.xml dengan ${urls.length} URL.`);
  return urls.length;
}

// Jalankan jika dieksekusi langsung
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/prerender.mjs')) {
  generateHeroPages();
  generateSitemap();
}
