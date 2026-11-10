# Lawanku — Counter Hero Honor of Kings

Lawanku: cari lawan yang tepat — counter hero, item lawan, saran draft, dan quiz
Honor of Kings (120 hero). SPA statis (HTML/CSS/JS polos, tanpa framework),
berawal dari clone fungsional hok.kurohiko.id, lalu di-rebrand total jadi merek
sendiri (Fase 4, 9 Nov 2026): nama, logo, warna, dan layout baru; semua jejak
Kurohiko dihapus dari situs.

## Isi

| File | Keterangan |
|---|---|
| `index.html` | Shell aplikasi (header sticky + topnav desktop, footer, dock bawah mobile, ikon SVG) |
| `styles.css` | Semua styling (tema "arena": ungu tinta + amber, layout desktop/mobile) |
| `app.js` | Router hash + semua halaman & logika |
| `data.json` | Dataset: 120 hero, 531 counter alami, counter item, cara melawan (sumber kanonis; aplikasi memuat chunk di bawah) |
| `data-1.json`, `data-2.json` | Dataset dipecah 60+60 hero — dihasilkan dari `data.json` via `_split_data.py` (Vercel MCP tidak menerima satu argumen >~128 KB); aplikasi memuat keduanya dan menggabungkan. Jalankan ulang skrip tiap kali `data.json` berubah. |
| `tiers.json` | Tier resmi HoK Camp (Global) per 6 Nov 2026: 120 hero, tier + win/pick/ban — di-fetch terpisah seperti `items.json`, di-precache SW; dibangun dari hub-game + HoKStats via `_research/fase24_build_tiers.py` (Fase 24). |
| `logo.svg` | Logo Lawanku (perisai amber + tebasan) — dipakai juga sebagai favicon |
| `sw.js` | Service worker cache-first — situs jalan offline (Fase 3) |
| `sitemap.xml`, `robots.txt` | SEO |
| `icons/hero/*.webp` | Ikon 120 hero (372 KB) |
| `icons/role/*.png` | Ikon 5 role (Clash/Jungle/Mid/Farm/Roam) |
| `manifest.webmanifest`, `app-192.png`, `app-512.png`, `og.png` | PWA & preview (logo Lawanku) |
| `slugs.json` | Peta nama hero → slug URL |
| `_research/` | Referensi & skrip kurasi lama (bukan bagian situs, tidak di-deploy) |

## Halaman (hash routing)

- `#/` — Home: "Lawan siapa?", **search + filter role di halaman** (di atas grid,
  tampil di desktop & HP — sebelumnya cuma ada di dock bawah yang tersembunyi
  di desktop), grid 120 hero **kartu vertikal** (gambar di atas,
  nama di bawah, badge role di pojok gambar), baris statistik (120 hero · 531 counter
  alami · 143 rekomendasi item), cari fuzzy (toleran typo, mis. `augrn` → Augran),
  filter role, Enter lompat ke hasil pertama, bintang ★ untuk hero favorit.
- `#/hero/<slug>` — Detail hero: **header profil rata tengah** (avatar 96px di atas
  nama + role · class + tombol favorit), counter alami (hard/soft + alasan) di kolom
  kiri; counter item (badge hijau "terkurasi" kalau sudah dikurasi, "belum dikurasi"
  kalau belum), cara melawan, dan tombol usulan/laporan di kolom kanan. Di desktop,
  counter alami & counter item tampil berdampingan dua kolom.
- `#/draft` — Papan draft: Tim kamu (5) / Musuh (5) / Ban (6) — slot tim terisi
  menampilkan nama + role/class hero (mis. "Clash / Fighter"), **ban berupa tile
  kecil 64px berisi avatar saja** (dulu kotak lebar yang mostly kosong); lalu
  **baris kontrol picker di halaman** (mode Pick kamu / Pick musuh / Ban +
  undo/reset + tombol amber **"Pilih hero"** yang membuka **panel picker
  mengambang** — modal dengan cari + filter role + "Terakhir dipakai" + grid
  kartu vertikal), saran pick otomatis (hard +2, soft +1 per musuh, top 5),
  undo & reset. Tersimpan di localStorage.

## Reskin "Obsidian Aegis" (Fase 8, 9 Nov 2026)

Tema baru dari hasil redesain Stitch (`_research/stitch-review-2026-11-09.md`) —
**hanya kulitnya, bukan angka karangannya** (semua win rate / jumlah match /
tier / leaderboard palsu dari mockup DITOLAK, tidak ada yang masuk situs).
Token: obsidian `#0f131c` (abyss `#090d16`), emas `#f59e0b` (hover `#fbbf24`,
deep `#d97706`), cyan `#06b6d4`/`#38bdf8`, teks `#dfe2ef`, muted `#94a3b8`,
kartu slate `#0f172a`, chip `#1c1f29`, dock `#0a0e17`; warna lane
(Clash `#ef4444`, Jungle `#a855f7`, Mid `#3b82f6`, Farm `#f59e0b`,
Roam `#10b981`); hard `#ef4444`, soft `#10b981`; sudut tajam (kontainer 4px,
kartu aksi/avatar 8px, pil 12px); panel kaca blur 16px; CTA emas gradasi
dengan glow; focus cyan. Font **self-hosted** di `fonts/` (Outfit 700/800
judul + Inter 400/600/700 isi, latin woff2, terverifikasi bobotnya via
fontTools; total ±108 KB; masuk precache SW) — situs tetap jalan offline.
Nav desktop dilabel ulang gaya Stitch (Counter Matrix, Draft Simulator,
Favorit, Quiz Counter, Item & Equipment, More) + badge **S16** di samping
logo (jujur: data memang patch S16); label tab mobile tetap pendek
(Counter, Draft, Favorit, Quiz, Item, More). `theme-color` & manifest ikut
`#0f131c`. Verifikasi: tes headless 25/25 (`_test11.html`, sudah dihapus) —
warna/font/nav/radius/role/seg/draft/quiz/items/hero + mobile; screenshot
home + draft + mobile dicek visual.
Deploy ulang `dpl_CtM6eGdoLW5aYZcDoGPF9mkcXGgD` (index.html + styles.css +
sw.js + manifest.webmanifest + 5 font baru, cache `lawanku-v7`; manifest
144 file).

## Bedah Counter di home (Fase 9, 9 Nov 2026)

Panel spotlight di home yang muncul saat pengguna mengetik nama hero di
pencarian (≥2 huruf, kecocokan fuzzy ≥ subsequence) — tanpa angka karangan,
semua dari data asli: foto + nama + role/kelas + chip hitung (N counter
alami, N hard · N soft, N rekomendasi item) + "Cara melawan" + **Counter
alami** (maks 5, hard dulu, badge + alasan, klik → halaman hero) +
**Counter item** (tag terkurasi/belum dikurasi + alasan) + **Jangan pick**
(hero-hero yang dikounter hero ini, lookup balik, maks 5 + "…dan N lagi") +
link "Buka halaman hero". Hero tanpa item / tanpa reverse menampilkan
"Belum ada data." — jujur, bukan diisi karangan. Tombol × menutup panel
sampai query berubah; hapus query menyembunyikan panel; Enter tetap
navigasi ke hero pertama. Layout 2 kolom di desktop, menumpuk di mobile
(avatar 64px).
**Bug lama yang ketangkap tes ini:** `ctl.addEventListener("submit", …)` di
`renderHome` merujuk variabel `ctl` yang tidak ada di scope itu (sisa
Fase 6 — variabelnya `tools`) — `renderHome` throw ReferenceError, sehingga
handler Enter + `applyFilter()` awal + `applyFavStars()` tidak pernah jalan
sejak Fase 6. Baris itu dihapus (div bukan form, tidak ada submit yang
dicegah). Verifikasi: tes headless 23/23 (`_test12.html`, sudah dihapus) —
muncul/sembunyi, Daji (5 counter + 2 item + 8 reverse), Charlotte (0 item,
0 reverse), dismiss, Enter, klik baris, mobile; screenshot home + mobile
dicek visual.
Deploy ulang `dpl_F8ejEj2NSBe4AzWzUy4gtua53Kah` (app.js + styles.css + sw.js,
cache `lawanku-v8`).
  Slot bisa diklik jadi target aktif (border hijau); tiap slot terisi punya tombol ×;
  tap hero lain mengganti isi slot aktif. Tap slot membuka popup grid hero (bottom sheet)
  berisi cari + filter role + baris "Terakhir dipakai" (maks 8, localStorage `hok-recent`).
  Keyboard: ketik = cari, Enter = pick hasil pertama, `/` buka popup saat di halaman draft,
  Enter di search dock = pick strip pertama.
  **Fase 2 — draft pintar:** saran ban otomatis (hero yang paling meng-counter tim kamu,
  hard +2 / soft +1 — tap saran langsung masuk slot ban), cek komposisi tim
  (Farm/Mid/Jungle/Roam/Clash ✓/✗ + peringatan kalau belum ada frontline Tank/Fighter),
  salin link draft (`#/draft?a=..&e=..&b=..`, dibuka langsung jadi draft),
  simpan beberapa draft bernama (localStorage `hok-drafts`, maks 12) dengan muat/hapus.
- `#/quiz` — Quiz 20 soal per ronde: "Tebak Counter" (siapa counter terkuat hero ini?)
  dan "Tebak Hero" (tebak dari ikonnya — foto cuma di soal, opsi cuma nama biar bukan contekan).
  Skor terbaik tiap mode tersimpan di localStorage (`hok-quiz-best`).
- `#/items` — Database Item: 143 rekomendasi item lawan hero, dikelompokkan per kategori
  (Anti-Burst 48, Anti-CC 29, Anti-Auto Attack 23, Anti-Heal 26, Anti-Tank 17),
  cari (item/kategori/hero) + toggle "Hanya yang terkurasi".
- `#/favorit` — Hero favorit (localStorage) + "Awas counter-nya" (3 counter teratas tiap favorit).
  Pool pilih hero memakai kartu vertikal yang sama seperti home.
- `#/more` — Link Database Item + Tentang Lawanku.

## Kurasi item (Fase 1, 9 Nov 2026)

Entri counter item asli situs sebagian besar template generik (147 entri, semua
`needsReview: true`). Dikurasi ulang berdasarkan teks "Cara melawan" + alasan counter
alami di data asli dan riset patch Season 16 (`~/workspace/hok/research-2026-11-05.md`):
hanya entri yang alasannya didukung sumber yang ditandai terkurasi. Hasil:
147 → 113 entri (53 template yang jelas tidak cocok dihapus), **102 terkurasi**,
11 masih "belum dikurasi", 17 hero yang tadinya tanpa item ditambah entri terkurasi
(mis. Angela, Kaizer, Shouyue, Ziya), 6 hero tanpa entri item (Lady Sun, Lam, Menki,
Pei, Yango, Yaria). Aturan penting: Purify tidak mempan lawan suppress — entri anti-cc
Purify dihapus dari Donghuang, Liang, dan Zhuangzi (dia yang membersihkan control).
Skrip kurasi diarsipkan di `_research/_curate-fase1.py`; data asli tersimpan di
`_research/data.json.orig`.

## Kurasi counter alami (Fase 3a, 9 Nov 2026)

513 counter alami: **70 alasan kosong diisi** (berdasar teks "Cara melawan" kedua hero),
**94 alasan berlabel "Artikel lama, bisa berubah karena patch" dibersihkan** (mekaniknya
masih berlaku) + perbaikan nama lokal (Ying Zheng→Garuda, Gongsun Li→Arli,
Zhang Liang→Liang, Thorns→Spikemail) dan 2 alasan "kata guide" ditulis ulang
dengan mekanik. **9 pasangan dibiarkan tanpa alasan** karena kit hero counter-nya
tidak ada di sumber (Dyadia, Dolia, Wang Wei, Luara, Devara, Flowborn Roamer,
Agudo vs Sakeer) — kosong jujur lebih baik daripada mengarang. 4 alasan terlalu
pendek diperluas. 4 hero tetap tanpa counter sama sekali (Annette, Butterfly,
Florentino, Lorion) — terisi di Fase 16. Skrip di `_research/_curate2.py`; `data.json` versi
`lawanku-2026-11-09`.

## Offline + SEO + Database Item (Fase 3b, 9 Nov 2026)

- `sw.js` cache-first (cache `lawanku-v1`): shell + data chunk di-cache saat install,
  ikon di-cache saat pertama diminta; situs jalan offline setelah kunjungan pertama.
- `sitemap.xml` + `robots.txt` + meta Open Graph/Twitter + canonical.
- Halaman `#/items` (lihat di atas).

## Rebrand Lawanku (Fase 4, 9 Nov 2026)

- Nama baru **Lawanku** ("Cari lawan yang tepat"), logo perisai amber + tebasan
  (`logo.svg`, ikon app & OG diregenerasi dari logo ini).
- Semua jejak Kurohiko dihapus dari situs: link Support/Top Up/Kitab + Discord
  di halaman More, teks "by Kurohiko" di OG image, dan semua string di kode.
  (Folder `_research/` internal tetap menyimpan referensi lama; tidak di-deploy.)
- Tema baru "arena": latar ungu tinta `#12101d`, aksen amber `#ffb224` (sebelumnya
  hitam + lime), radius 16px, tipografi lebih besar.
- Layout desktop: lebar konten 1200px, header sticky dengan topnav (Counter/Draft/
  Favorit/Quiz/Item/More), dock bawah disembunyikan; halaman hero dua kolom,
  database item dua kolom, popup pilih hero jadi modal tengah.
  Layout mobile: dock bawah 6 tab, tim draft menumpuk 1 kolom, ban 3 kolom.

## Rombak UI (Fase 5, 9 Nov 2026)

- **Kartu hero vertikal** (`.hcard`, komponen `heroCard()` di `app.js`): gambar di atas,
  nama di bawah (maks 2 baris), badge role melingkar di pojok kanan bawah gambar.
  Dipakai di home, grid picker draft (inline + popup), dan pool favorit — ganti semua
  chip horizontal lama. Grid rapat: desktop 10 kolom, mobile 4 kolom.
- **Draft dirombak:** picker pindah dari strip di dock ke grid inline di halaman
  (tepat setelah Ban, sebelum Saran) — filter role + grid langsung terlihat, tanpa
  tombol "Semua" lagi; dock tinggal cari + mode + undo/reset. Popup pilih hero
  (klik slot) tetap ada dan memakai kartu vertikal yang sama.
- **Button:** filter role aktif berwarna per-role (Clash merah, Jungle hijau,
  Mid biru, Farm kuning, Roam ungu); segmented control mode draft berbentuk pil
  (Pick kamu = amber, Pick musuh = biru, Ban = merah); tombol utama amber dengan
  bayangan + efek tekan; tombol kecil (mini) berbentuk pil; tab aktif ditebalkan;
  slot target aktif diberi glow amber; saran pick beraksen garis amber.
- **Layout:** lebar konten 1040 → 1200px; seksi dipisah garis (`.lbl` dengan
  garis pemisah); halaman hero rata tengah (avatar 96px di atas nama, tombol favorit
  di tengah) dan kolom kanan diisi counter item + cara melawan + tombol usulan
  (mengurangi ruang kosong); baris statistik di home.
- **Anti-plagiasi:** tampilan akhir jelas beda dari situs asli — tema ungu tinta +
  amber (bukan hitam + lime), kartu vertikal ber-badge role, tombol mode berwarna
  per-mode, topnav desktop + dock mobile, statistik home, header hero rata tengah.
- Verifikasi: tes headless 26/26 (`_test5.html`, sudah dihapus) + perbaikan dari
  cek visual (picker naik ke atas, isi kolom kanan hero, seg mode quiz tidak wrap,
  kartu mobile 4 kolom); screenshot semua halaman desktop + mobile dicek satu per satu.
  Deploy ulang: `dpl_H1rmL9UJW2SFpvp1uVwdmbVjZvhb` (READY, production) — file berubah
  cuma `app.js` + `styles.css`; lalu `dpl_5B2ppoejgn1C2mDLJJdLbSUFSX1e` untuk `sw.js`
  (cache service worker naik `lawanku-v1` → `v2`, supaya pengunjung lama tidak
  terus disajikan `app.js`/`styles.css` lama dari cache); alias bersih https://hok-counter.vercel.app
  terverifikasi menyajikan kode baru (ukuran `app.js` 57.760 B).
- **Perbaikan ukuran kartu picker (Fase 5b, 9 Nov 2026, dari screenshot Akmal):**
  kartu di popup draft terlalu besar (6 kolom) dibanding aslinya (10 kolom kartu
  kecil). Grid picker (inline + popup) dikecilkan: desktop 64px (16 kolom inline,
  ~9 kolom popup), mobile 56px (5 kolom); badge role + font nama ikut diperkecil.
  **Lanjutan (Fase 5c):** grid Counter/home + Favorit ikut dikecilkan ke ukuran
  yang sama (desktop 64px / 16 kolom, mobile 56px / 5 kolom) — ukuran ringkas
  sekarang jadi default semua `.hcard`. Tes headless 12/12 lalu 9/10 (1 gagal
  semu: ukuran badge diukur clientWidth termasuk border). Deploy ulang
  `dpl_9mhF1G1AviyTKnJytSzBVhJ7VCU2` (styles.css + sw.js, cache `lawanku-v3`),
  lalu `dpl_ApAGLVnh6gw5EN8Byenb1M98Ha53` (cache `lawanku-v4`).

## Nav baru + kontrol di halaman + draft padat (Fase 6, 9 Nov 2026)

- **Nav atas dirombak** (dari feedback "masih copas"): bukan lagi bar teks polos
  seperti situs acuan — sekarang **bar pil bersegmen** (wadah chip membulat +
  ikon tiap menu) dan halaman aktif berupa **pil amber penuh dengan teks gelap**,
  selaras dengan sistem button (role "Semua" aktif, `.btn-acc`). Ikon: pedang
  (Counter), draft, bintang, quiz, item, titik-titik (More).
- **Search + filter pindah ke halaman:** di home (Counter) dan draft, kontrol
  cari/filter/mode sebelumnya tinggal di dock bawah — yang di desktop
  tersembunyi (`display: none`), jadi di desktop tidak bisa cari/filter sama
  sekali. Sekarang search + filter lane ada di halaman home (di atas grid) dan
  search + seg mode ada di halaman draft (baris `pickctl` di atas grid picker).
  Dock mobile sekarang cuma berisi tab navigasi.
- **Draft dipadatkan:** ban dari 6 kotak lebar yang mostly kosong jadi 6 tile
  64×64 berisi avatar; slot tim terisi menampilkan nama + role/class
  (mis. "Clash / Fighter") sehingga bar slot tidak kosong di tengah.
- Verifikasi: tes headless 20/20 (`_test9.html`, sudah dihapus) — nav pil amber
  + ikon, search/filter di halaman (fuzzy `augrn` → Augran, filter Clash),
  pickctl + mode biru, ban tile 64px, slot berisi info role, quiz tetap jalan,
  mobile search/pickctl tampil; screenshot home + draft dicek visual.
  Deploy ulang `dpl_6EECGESgc2nwrnhdXG5fjcvEfwgu` (index.html + app.js +
  styles.css + sw.js, cache `lawanku-v5`).

## Picker mengambang (Fase 7, 9 Nov 2026)

- **Grid "Pilih hero" inline dihapus dari alur halaman** — grid 120 kartu yang
  setinggi ~900px itu mendorong Saran pick jauh ke bawah. Sekarang urutan halaman
  draft: tim → ban → baris kontrol → **Saran pick langsung di bawah Ban**.
- **Picker jadi panel mengambang** (modal, pakai dialog yang sudah ada): dibuka
  lewat tombol amber **"Pilih hero"** di bawah Ban, lewat tap slot, atau tombol
  `/` di keyboard. Isinya sama: cari + filter role + "Terakhir dipakai" + grid
  kartu vertikal.
- **Mode mengambang tetap buka setelah pick** (rapid pick: buka sekali, isi 5
  slot berurutan — judul panel ikut pindah ke slot berikut); **mode slot-klik
  tetap tutup setelah pick** seperti dulu.
- Verifikasi: tes headless 19/19 (`_test10.html`, sudah dihapus) — tidak ada
  grid inline, Saran pick tepat di bawah Ban, panel tetap buka 2x pick
  berurutan + judul pindah, slot-klik tutup setelah pick, home & quiz regresi,
  mobile tombol + panel jalan; screenshot draft dicek visual.
  Deploy ulang `dpl_FmHcNqDT5rF1VKMhkfcjhMHYPtDq` (app.js + styles.css + sw.js,
  cache `lawanku-v6`). Catatan: `/tmp` terhapus saat VM restart (server lokal
  8902 ikut mati + manifest deploy hilang) — manifest 139 file dibangun ulang
  dari folder proyek dan disimpan di `_research/deploy-files.json` supaya tidak
  bergantung ke `/tmp` lagi.

## Jalanin lokal

```bash
cd hok-clone
python3 -m http.server 8000
# buka http://localhost:8000/
```

Harus lewat HTTP (fetch data chunk tidak jalan dari `file://`).

## Deploy (Vercel, statis)

Proyek `hok-counter` — LIVE di https://hok-counter.vercel.app (deploy 9 Nov 2026,
target production, tanpa build step). Deploy via Vercel MCP: file di-upload dulu
satu per satu (`upload_file`, karena satu argumen tool maks ~128 KB), lalu
`create_deployment` dengan refs `{file, sha, size}` + `projectSettings: {"framework": null}`.
File yang di-deploy: 139 (situs saja — `_research/`, skrip kurasi, dan file tes
tidak ikut). Alias terverifikasi bersih via `list_aliases`:
`hok-counter.vercel.app` (bagikan yang ini) + `hok-counter-akmaludien.vercel.app`
(jangan dibagikan). Perhatian: nama proyek Vercel masih `hok-counter`; kalau mau
ganti nama proyek, perlu `create_project` baru + pindah domain — belum dilakukan.

## Bedanya dengan situs asli

- Routing pakai hash (`#/hero/augran`) karena ini satu file SPA, bukan multi-halaman Astro.
  URL lama `/hero/augran` tidak berlaku; slug-nya sama persis.
- Form "Usulkan / laporkan" tidak terkirim ke server (tidak ada backend):
  usulan tersimpan di `localStorage` (`hok-usulan`) dan bisa dilihat di DevTools.
  Tidak ada Turnstile/captcha.
- Favorit & draft memakai key localStorage yang sama seperti aslinya
  (`hok-fav`, `hok-draft`) — tapi karena domain beda, favorit di situs asli tidak kebawa.
- Footer: "Lawanku — alat fan-made Honor of Kings. Bukan afiliasi resmi Tencent,
  TiMi, atau Level Infinite."

## Verifikasi (9 Nov 2026)

- v1: render 5 rute dicek pakai Chromium headless; tes interaksi 11/11.
- Fase 1: tes headless 32/32 (`_test.html`, sudah dihapus).
- Fase 2: tes headless 24/24 (`_test2.html`, sudah dihapus).
- Quiz 20 soal + opsi tanpa ikon: tes headless 7/7 (`_test3.html`, sudah dihapus).
- Fase 3 + 4: tes headless 24/24 (`_test4.html`, sudah dihapus): brand Lawanku,
  topnav desktop tampil + dock tersembunyi, hero 2 kolom, alasan terisi, items
  5 kategori / 113 baris / cari / toggle terkurasi, More tanpa Kurohiko,
  quiz tetap 20 soal, service worker terdaftar, mobile (390px): topnav tersembunyi,
  dock 6 tab, tim draft 1 kolom. File statis sitemap/robots/sw/logo/manifest 200;
  grep "kurohiko" di semua file yang di-serve: bersih.
- Fase 5: tes headless 26/26 (lalu 19/20 + perbaikan visual, lalu verifikasi ulang):
  kartu vertikal 120 di home/draft/popup/favorit, statistik home, hero rata tengah,
  picker inline di atas Saran, filter role, quiz 20 soal, items 5 kategori,
  mobile 4 kolom + dock tampil; semua halaman di-screenshot & dicek visual.
- Fase 6: tes headless 20/20: nav pil amber + ikon, search/filter di halaman,
  pickctl + mode biru, ban tile 64px, slot berisi info role, quiz tetap jalan,
  mobile search/pickctl tampil; screenshot home + draft dicek visual.
- Fase 7: tes headless 19/19: picker mengambang, Saran pick di bawah Ban,
  rapid pick 2x panel tetap buka; screenshot draft dicek visual.
- Fase 8 (reskin Obsidian Aegis): tes headless 25/25: warna/font/nav/radius/
  role/seg/draft/quiz/items/hero + mobile; screenshot home + draft + mobile
  dicek visual.
- Fase 9 (Bedah Counter): tes headless 23/23: muncul/sembunyi, Daji &
  Charlotte, dismiss, Enter, klik baris, mobile; screenshot home + mobile
  dicek visual.
- Fase 10 (Kuis Skenario): tes headless 37/37: mode ketiga di Quiz, 5 skenario
  per ronde dari 58 hero yang memenuhi syarat (hard+soft+item+reverse), Bagian A
  pilih hard counter (+150, pengecoh: soft counter, jebakan hero yang dikounter
  musuh + peringatan "Hati-hati", netral), Bagian B pilih item pertama dari
  8 nilai item unik (+100), timer 30 dtk per skenario (auto-kunci saat habis,
  berhenti saat pindah mode/halaman), skor maks 1250, breakdown A/B, best score
  di hok-quiz-best.skenario; screenshot desktop + mobile dicek visual.
- Fase 11 (Item Wiki): tes headless 38/38 (gabungan Fase 11–13): 8 kartu wiki
  item (urut jumlah hero), chip kategori + cari + toggle kurasi, strip avatar,
  detail hero & alasan bisa dibuka; tanpa harga/stat (belum terverifikasi).
- Fase 12 (Arena Draft): grid 3 kolom desktop (Tim kamu / advisor tengah /
  Musuh, Ban selebar arena di bawah), mobile menumpuk urutan lama (tim, musuh,
  ban, advisor); slot/picker/saran/undo/reset tetap jalan.
- Fase 13 (Tier List): halaman #/tier (link dari More), rumus transparan
  +2 hard / +1 soft diberi, −2 hard / −1 soft diterima; S ≥+10 (12), A +5–+9
  (11), B 0–+4 (18), C −4–−1 (44), D ≤−5 (31); 4 hero tanpa data tidak dinilai
  (distribusi baru sejak Fase 16: S 13, A 11, B 17, C 45, D 34 — semua 120 hero
  dinilai, 0 tanpa data; teratas Gao Changgong +30, terbawah Butterfly −9;
  sejak Fase 20: S 12, A 12, Donghuang +28, Di Renjie +8);
  cari + filter lane; disclaimer bukan win rate/meta resmi. (Sejak Fase 24:
  tier resmi HoK Camp + Win/Pick/Ban — lihat Fase 24 di bawah.)
- Logo crest (dari ZIP Stitch ke-2): perisai heksagonal + huruf L emas + bilah
  cyan + berlian + garis samping; ganti symbol #i-logo di index.html + logo.svg.
  ZIP ke-2 cuma berisi UI kit (token sama dengan Obsidian Aegis, sudah dipakai)
  + logo crest + DESIGN.md yang identik dengan ZIP pertama — tidak ada layar baru.
- Fase 12b (Ban pindah ke tengah, 9 Nov 2026): Ban tidak lagi selebar arena di
  bawah — pindah ke kolom tengah, tepat di bawah kontrol pick; 6 tile fleksibel
  sebaris (56px, avatar 32px), muat di semua lebar; mobile tetap menumpuk
  (tim, musuh, advisor incl. ban). Tes headless 14/14.
- Fase 14 (9 Nov 2026): nav baru **Tier Hero** (`#/tier`, beda dari "Meta Tier
  List" referensi) + **Tentang** ganti More (`#/tentang`, `#/more` jadi alias);
  kartu donasi Sawermaz https://sawermaz.com/jembodfiraun; Saran ban pindah ke
  atas (tepat setelah slot Ban, sebelum Saran pick); Draft jadi tombol ke-3
  (Counter Hero, Favorit, Draft Pick, Quiz Counter, Item & Equipment, Tier
  Hero, Tentang); header diperbaiki (brand sempat terpotong di 1024–1280px —
  penyebab: `.hleft { min-width: 0 }` + padding nav; diperbaiki dengan hapus
  min-width + padding nav 10px). **Tombol kembali sempat ditambah lalu
  DIHAPUS lagi atas permintaan Akmal (14:12 WIB).** Tes 27/27 + 11/11 + 7/7.
- Rename label (9 Nov 2026): "Counter Matrix" → **Counter Hero**, "Draft
  Simulator" → **Draft Pick** (judul `<title>` situs memang sudah "Counter
  Hero" sejak awal); h1 halaman draft jadi "Draft Pick". Masih label turunan
  referensi: "Quiz Counter", "Item & Equipment" — rekomendasi: "Kuis Counter",
  "Item Counter" (menunggu acc Akmal).
- **Domain (9 Nov 2026): proyek Vercel diganti nama `hok-counter` →
  `lawanku` (id proyek tetap `prj_647bQkWhJLXNiA1tMbCqOpyuaAtM`); alias
  bersih baru https://lawanku.vercel.app. Alias lama hok-counter.vercel.app
  masih aktif & mengikuti deploy terbaru.**
- Rename label lanjutan (9 Nov 2026): "Quiz Counter" → **Kuis Counter**,
  "Item & Equipment" → **Item Counter** (judul halaman, h1, daftar fitur, dan
  label dock "Quiz" → "Kuis"); tidak ada lagi label turunan referensi di nav.
  Deploy `dpl_BsLKmm1pVtJQ4qVPbt9rMqwvQ9Af`, cache `lawanku-v16`. Tes 8/8.
- Parafrase Tentang (9 Nov 2026): SEMUA kalimat di halaman Tentang + footer
  ditulis ulang dengan kata-kata sendiri (intro, 5 deskripsi fitur, "Cara data
  dibuat", donasi, disclaimer, footer) — angka/fakta tetap sama (513/232/281,
  116, 86). Deploy `dpl_Ggpz9hK1euTVcsrf6bG68kynNhFW`, cache `lawanku-v17`.
  Tes 4/4.
- Fase 15 — perbaikan kekurangan (9 Nov 2026): tanggal 'Terakhir diperbarui
  9 Nov 2026' di Tentang + footer; skrip deploy sekali jalan `deploy.sh`
  (upload + tunggu READY + pindah alias + verifikasi live — JALAN di percobaan
  pertama); **9 alasan counter kosong TERISI semua** (riset kit 15 hero, 3 agen
  + cek silang, spot-check wiki Dyadia; 2 pasangan Dolia diakui soft tidak
  langsung, Garuda←Luara paling tipis — tetap soft, jangan dilebih-lebihkan).
  Sisa why kosong: 0. Deploy `dpl_3aH83Vmv7Qu81wzXogoQqWRZmzKx`, cache
  `lawanku-v18`. Tes 11/11.
- Fase 16 — 4 hero tanpa counter terisi (9 Nov 2026): riset kit 4 hero oleh
  koordinator + 4 agen + cek silang + spot-check sendiri (panduan Annette
  GamingOnPhone: ult 4 dtk, stun 1,25 dtk, CC immunity — cocok; tabel
  counternya nyebut Lanling/Lu Bu/Ake = 3 hard counter yang dipakai).
  Annette 4 counter (Gao Changgong, Arke, Lu Bu hard; Sima Yi soft),
  Butterfly 5 (Donghuang, Mozi, Mulan, Lu Bu hard; Han Xin soft),
  Florentino 4 (Donghuang, Liang hard; Lu Bu, Gao Changgong soft),
  Lorion 5 (Gao Changgong, Arke hard; Kongming, Sima Yi, Liang soft) +
  "Cara melawan" keempatnya + 3 item baru (Destiny Butterfly, anti-heal
  Florentino, Succubus Cloak Lorion; Annette tanpa item — shield-nya
  dilawan pakai true damage, bukan item). Total 531 counter (243 hard,
  288 soft), 116 item; hero tanpa counter: 0. Yang dicoret koordinator:
  Sun Ce (Annette) & Mi Yue (Florentino) — paling goyah; yang ditandai
  meragukan tapi tetap soft: Han Xin (Butterfly), Liang (Lorion). Dua angka
  hard-coded di app.js diperbaiki: metodologi Tentang 513→531 (243 hard,
  288 soft) + "Urutan 116 hero"→120. Jebakan: entri counter menyimpan
  `hero` sebagai **id angka**, bukan nama — skrip apply sempat menulis nama
  dan ketangkap assertion sebelum deploy. Deploy
  `dpl_2SPy5g2SJq5GXfLoBgW2SCAqx2CV`, cache `lawanku-v19`. Tes 23/23.
- Fase 17 — draft mobile (9 Nov 2026, dari screenshot Akmal): arena di
  ≤900px jadi 2 kolom — Tim kamu kiri, Musuh kanan; advisor (kontrol pick,
  Ban 6 tile horizontal, saran) selebar halaman di bawahnya. Ketangkap bug:
  draft terisi bikin halaman geser horizontal (scrollWidth 474 di layar
  390 — nama hero nowrap di slot memaksa track grid melebar); diperbaiki
  dengan `min-width: 0` di kolom tim & musuh (sudah ada di kolom advisor).
  Tes headless 10/10 (geometri: tim & musuh sebaris, ban di bawah keduanya,
  6 tile sebaris, tanpa overflow) + screenshot mobile dicek visual.
  Deploy `dpl_6VpW86R2uJKaopPAnakUQcTnvcuf`, cache `lawanku-v20`.
- Fase 18 — dock bawah ikon saja (9 Nov 2026, dari keluhan Akmal "button di
  bawah numpuk", diklarifikasi: tab Counter–Tentang): di ≤560px label tab
  disembunyikan (`font-size: 0` — teks tetap ada buat screen reader),
  tinggi tab 56→48px, padding atas dock 12→8px; tinggi dock ~68→57px.
  Tes headless 8/8 (7 tab, ikon 22px tampil, href utuh, tanpa overflow) +
  screenshot mobile dicek visual. Deploy
  `dpl_ACgdvcpQwr8fBA4Qs87tM42wfPpo`, cache `lawanku-v21`.
- Fase 19 — lubang data terakhir ditutup (9 Nov 2026): riset koordinator +
  6 agen + cek silang. **19 "Cara melawan" terisi** (Alessio, Allain,
  Ao'yin, Augran, Chano, Chicha, Dolia, Dyadia, 5 varian Flowborn, Haya,
  Heino, Luara, Mayene, Umbrosa, Wang Wei) — sisa hero tanpa howto: 0.
  **27 rekomendasi item baru** (total 143: Anti-Burst 48, Anti-CC 29,
  Anti-Auto Attack 23, Anti-Heal 26, Anti-Tank 17) — 5 dari 6 hero yang
  dibiarkan tanpa item di Fase 1 kini terisi (Lady Sun, Lam, Menki, Pei,
  Yango). **3 hero diputuskan TIDAK ADA item** (Da Qiao — tidak ada paket
  yang melawan teleport; Dunshan — shield ≠ armor, anti-tank ditolak;
  Yaria — ult shield serap true damage + untargetable); Annette tetap
  tanpa item (keputusan Fase 16). Sisa hero tanpa item: 4 (Annette,
  Da Qiao, Dunshan, Yaria — semuanya sengaja). Yang ditandai meragukan
  tapi tetap dipakai: Menki anti-tank, Garo anti-autoattack, Flowborn
  (Roamer) anti-heal, Devara Succubus Cloak (data early-patch S15).
  Deploy `dpl_FMmeUowY5JMV9sRqgK67XiBg2jHU`, cache `lawanku-v22`.
  Tes 12/12. Lanjutan 9 Nov: checklist update patch ditulis di
  `_research/patch-update-checklist.md` (proses tiap patch baru, biar data
  tidak beku); snippet Vercel Analytics dipasang di `index.html` (deploy
  `dpl_G5zXUcFB3jaGGhsEb4D1eBoRaSyU`, cache `lawanku-v23`) dan Web
  Analytics diaktifkan di dashboard (paket Hobby gratis: 50k events/bln,
  riwayat 30 hari, tanpa Custom Events) — dasbor di
  vercel.com/akmaludien/lawanku/analytics.
- Fase 20 — tukar counter Arli (9 Nov 2026): verifikasi HoKStats (koordinator
  + 4 agen + cek silang). **Arli: Di Renjie → Donghuang (hard)** — suppress
  ult Donghuang mematikan total dash/teleport payung Arli; Di Renjie diganti
  karena alasannya paling lemah (anekdot KPL tanpa mekanik). Daji terverifikasi
  soft tapi slot sama — ditahan sebagai cadangan. Da Qiao ← Arke & Han Xin
  GAGAL (tidak menyentuh teleport; halaman counter HoKStats buat Da Qiao
  terbukti template salah). Efek samping: Donghuang +26→+28, Di Renjie
  +10→+8 (turun S→A); distribusi tier jadi S 12, A 12, B 17, C 45, D 34.
  Item terverifikasi silang (hub-game): Ominous Premonition 2020, Starbreaker
  2080, Boots of Resistance 700; Venomous Staff MA +230 (bukan +240 HoKStats
  yang masih S15); Purify CD 120 dtk, bersihkan semua CC kecuali suppress,
  imun 1,5 dtk, tanpa MS (tidak ditemukan di HoKStats).
  Deploy `dpl_E3u4RKPrJEBgxgt6kn3Tt8hDXeSL`, cache `lawanku-v24`.
  Tes 7/7 (termasuk Bedah Di Renjie: "Jangan pick" tanpa Arli).
- Fase 21 — harga + stat item tampil (9 Nov 2026): `itemDetails` di
  data.json (kanonis) — 8 paket → 10 komponen, semua terverifikasi S16
  (HoKStats disilang hub-game; Destiny 2060 PA +75/AS +15%/HP +500,
  Mortal Punisher 2080 PA +100/AS +20%/Lifesteal +20% + Revive; Venomous
  Staff MA +230, bukan +240). **Item Wiki**: tiap kartu paket menampilkan
  detail per komponen (nama, harga, stat, pasif); intro diperbaiki "86
  hero" → "116 hero". **Halaman hero**: baris harga di bawah tiap paket
  item (Purify tampil sebagai spell + CD 120 dtk, tanpa harga). Kalimat
  "harga belum ditampilkan" di Item Wiki + Tentang diperbarui.
  **Pelajaran deploy:** `upload_file` maks ~128 KB per argumen — itemDetails
  di kedua chunk bikin data-1.json 98 KB (base64 ~131 KB) dan deploy gagal
  di tengah jalan; solusinya itemDetails dipisah ke `items.json` (3,3 KB,
  di-fetch terpisah, di-precache SW, masuk manifest deploy), chunk kembali
  heroes-only (~95 KB, base64 ~127 KB). Skrip perbaikan
  `_research/fase21_fix.py`.
  Deploy `dpl_HCUC6js2kQupye3RY41KF4YRJb2r`, cache `lawanku-v25`.
  Tes 12/12.
- Fase 22 — saran pick per role + saran item draft (9 Nov 2026): di Arena
  Draft, kolom advisor bertambah 3 seksi (setelah Saran pick, sebelum
  Komposisi tim). **Role kamu**: tombol 5 role (+ Semua), tersimpan di
  localStorage `hok-role`. **Saran pick buat role kamu**: `draftSuggestions`
  difilter role (top 3, hard +2/soft +1 lawan tim musuh), tap langsung isi
  slot tim kamu. **Saran item lawan tim musuh**: agregasi itemCounter semua
  hero musuh — paket yang melawan hero terbanyak naik ke atas (top 3),
  lengkap harga (dari `itemPriceLine`), tag terkurasi/sebagian belum
  dikurasi, dan daftar hero musuh yang dilawan; link ke Item Wiki. Update
  live tiap pick musuh berubah (via `sync()`). Saran item tidak dibedakan
  per role (varian fisik/magic tampil dua-duanya).
  Deploy `dpl_A8KgzttV1FwrgPcu6zr67XE9yaqB`, cache `lawanku-v26`.
  Tes 16/16 (musuh Arli+Donghuang: Farm → Huang Zhong/Marco Polo/Lady Sun,
  Xiao Qiao terfilter; item Spikemail + Mortal/Venomous; role tersimpan
  setelah reload).
- Fase 23 — layout desktop Draft satu layar (9 Nov 2026): advisor di arena
  tinggal kontrol pick + Ban; seksi pindah ke 2 baris penuh di bawah arena.
  Baris 1 (4 kolom): Saran ban | Saran pick | Role kamu + Saran pick buat
  role kamu (satu kolom) | Saran item lawan tim musuh. Baris 2 (2 kolom):
  Komposisi tim | Bagikan & simpan. Baris saran dibuat ringkas di desktop
  (avatar 32px, catatan skor disembunyikan); slot tim 42px; header/main
  sedikit dirapatkan — isi draft muat penuh di 1440×1000 tanpa scroll.
  Di HP (≤900px) tetap tersusun vertikal seperti sebelumnya.
  Deploy `dpl_Hbc4v2fKq68GvoXxVetMJTBTtE62`, cache `lawanku-v27`.
  Tes 25/25 (14 desktop + 11 mobile).
- Fase 24 — Tier List resmi HoK Camp (10 Nov 2026): tier proxy (hitung dari
  data counter) DIGANTI tier resmi HoK Camp (Global), snapshot 6 Nov 2026 —
  rating resmi di dalam game. Data: `tiers.json` (baru, 5,1 KB, di-fetch
  terpisah seperti `items.json`, di-precache SW, masuk manifest deploy) —
  120 hero, tier + win + pick + ban. Tier dari 6 halaman role hub-game
  (tier + win rate 2 desimal); pick/ban dari tabel
  hokstats.gg/official-popularity (snapshot sama); verifikasi silang: band
  HoKStats == tier hub-game untuk semua 120 hero, win rate cocok
  (toleransi 0,06). Distribusi S 12, A 24, B 36, C 48. Halaman `#/tier`:
  tiap kartu menampilkan Win + Pick/Ban (koma desimal Indonesia, angka
  bulat tanpa ,0), urut win rate di tiap tier; intro menjelaskan tier
  mengikuti pick+ban, bukan win rate (contoh: Lapulapu 54,8% tapi tier C,
  Dunshan 45,5% tapi tier S) + sumber & tanggal; cari + filter lane tetap
  jalan; fungsi proxy lama (`tierStats`/`tierOf`/`TIER_RANGES`) dihapus —
  skor proxy tidak tampil di mana pun lagi. Tentang diperbarui (tanggal
  10 Nov 2026, deskripsi tier, "86 hero" → "116 hero" di fitur Item
  Counter). Skrip bangun data: `_research/fase24_build_tiers.py`. Tes
  headless 35/35 desktop + 4/4 mobile. **Deploy (10 Nov): Vercel MCP 403
  "Not authorized: scope akmaludien" (token OAuth kehilangan grant tim,
  2x reconnect tidak mempan, tool authorize_team_access tidak ada di MCP
  server ini) — deploy dialihkan ke Vercel CLI asli + token yang dibuat
  Akmal (dipakai transient, TIDAK disimpan; `.env.local` dari CLI sudah
  dihapus). `vercel link` + `vercel deploy --prod`: deployment
  `lawanku-rjrg4fmbi-akmaludien.vercel.app`, cache `lawanku-v28`, alias
  lawanku.vercel.app dipindah manual (`vercel alias set`) lalu domainnya
  ditambahkan ke proyek (`vercel domains add`) supaya deploy produksi
  berikutnya otomatis mengikuti — tidak perlu pindah alias manual lagi.
  File deploy dibatasi `.vercelignore` (mirip manifest MCP: tanpa
  data.json, _research, deploy.sh, README.md, slugs.json,
  _split_data.py).** Repo GitHub https://github.com/Akmaludien/lawanku-hok
  (masih kosong; zip 211 file sudah dikirim) — sambung ke Vercel nanti
  kalau Akmal mau auto-deploy tiap push.
