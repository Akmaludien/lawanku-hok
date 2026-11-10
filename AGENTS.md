# Lawanku — Handover Lengkap untuk Antigravity

> Dokumen ini adalah satu-satunya konteks yang dibutuhkan agen untuk melanjutkan
> pengembangan Lawanku tanpa bertanya ulang. Baca seluruh file ini dulu sebelum
> menyentuh kode. Semua fakta di sini sudah terverifikasi dari pengerjaan
> 9–10 November 2026. Kalau ada yang bertentangan dengan ingatan agen, file ini
> yang menang.
>
> Cara pakai: taruh file ini di root repo sebagai `AGENTS.md` (Antigravity
> membacanya otomatis) atau lampirkan sebagai konteks tiap tugas baru.

## 1. Ringkasan proyek

**Lawanku** adalah alat bantu draft pick, counter hero, item, dan meta untuk
game **Honor of Kings (HoK)** — fan-made, bukan afiliasi Tencent/HoK resmi.

- **Live:** https://lawanku.vercel.app (v28, Tier List resmi)
- **Repo:** https://github.com/Akmaludien/lawanku-hok (branch `main`)
- **Proyek Vercel:** `lawanku`, tim "Akmal Hobby" (akun ramadhanakmaludien@gmail.com)
- **Stack:** SPA statis murni — HTML + CSS + JavaScript vanilla. **Tanpa
  framework, tanpa build step, tanpa backend.** Routing pakai hash
  (`#/hero/<slug>`, `#/tier`, `#/tentang`, `#/draft`, `#/quiz`, `#/items`,
  `#/favorit`). State (draft, favorit, histori) di `localStorage`.
- **Status:** Fase 0–24 selesai. v28 LIVE (10 Nov 2026). Repo GitHub
  sudah tersambung ke proyek Vercel (10 Nov 2026) — tiap push ke `main`
  auto-deploy. Push pertama ke `main` adalah pembuktian auto-deploy
  (penyambungan tidak memicu deployment awal).

## 2. Menjalankan lokal

```bash
cd <folder-repo>
python3 -m http.server 8902
# buka http://localhost:8902
```

Tidak ada `npm install`, tidak ada build. Edit file → refresh browser.
Service worker memakai cache-first: kalau mengubah `app.js`/`styles.css`/
`index.html`, **wajib naikkan versi cache di `sw.js`** (saat ini
`lawanku-v28`) — kalau tidak, pengunjung lama tetap dapat versi lama.

## 3. Struktur file

| File | Keterangan |
|---|---|
| `index.html` | Shell SPA: nav, logo, footer, badge S16, snippet Vercel Analytics |
| `styles.css` | Semua gaya (tema "Obsidian Aegis", lihat §6) |
| `app.js` | Seluruh logika aplikasi |
| `data.json` | **Dataset kanonis — TIDAK di-deploy.** Sumber untuk regenerasi chunk. Field nama hero = `en`, BUKAN `name` |
| `data-1.json`, `data-2.json` | Chunk 60+60 hero yang dimuat aplikasi (diregenerasi dari `data.json`, ada key `version`) |
| `items.json` | `{"version", "itemDetails"}` — detail harga/stat 10 komponen item, di-fetch terpisah |
| `tiers.json` | Tier resmi HoK Camp, `{"version": "hokcamp-2026-11-06", "source": "HoK Camp", "asOf": "2026-11-06", "tiers": {"<id>": {"t", "w", "p", "b"}}}` |
| `sw.js` | Service worker, precache shell (termasuk `items.json` + `tiers.json`) |
| `logo.svg`, `app-192.png`, `app-512.png`, `og.png` | Logo & ikon PWA |
| `icons/hero/<id>.webp` | 120 ikon hero (nama file = id angka hero) |
| `icons/role/*.png` | 5 ikon role (clash, jungle, mid, farm, roam) |
| `fonts/*.woff2` | Outfit 700/800 + Inter 400/600/700 (self-hosted, tanpa CDN) |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest` | SEO/PWA; canonical & og mengarah ke lawanku.vercel.app |
| `.vercelignore` | File yang TIDAK ikut deploy: `_research`, `data.json`, `deploy.sh`, `README.md`, `slugs.json`, `_split_data.py`, `.vercel`, `AGENTS.md` |
| `deploy.sh` | **LEGACY — jangan pakai.** Skrip deploy lama via Vercel MCP, sekarang rusak (403 tanpa scope tim). Deploy lewat git push atau Vercel CLI (lihat §8) |
| `_research/` | Riset, skrip kurasi fase, backup `app.js.fase*.bak`, checklist patch. TIDAK di-deploy |

Key `localStorage`: `hok-draft`, `hok-fav`, `hok-recent` (maks 8),
`hok-drafts` (maks 12), `hok-quiz-best`, `hok-role`, `hok-usulan`
(form usulan hanya tersimpan lokal, tanpa backend).

## 4. Model data (jangan diubah sembarangan)

- **120 hero.** ID hero adalah **angka** (mis. Daji 109, Arli 199, Donghuang 187).
- **531 counter alami: 243 hard, 288 soft. Maks 5 counter per hero.**
  Entri counter: `{hero: <ID ANGKA>, strength: 'hard'|'soft', why: <string>}`.
  `hero` adalah id angka, BUKAN nama. Tidak ada self-counter.
- **143 rekomendasi item** (hero dengan item: 116). Bentuknya
  `{tag, items, why, needsReview}` — `needsReview: false` = "terkurasi",
  `true` = "belum dikurasi". **Hanya ada 8 string paket `items` yang boleh
  dipakai, harus persis:**
  - anti-burst: `Destiny (anti-mati)`
  - anti-burst: `Destiny (anti-mati) / Ominous Premonition`
  - anti-burst: `Succubus Cloak`
  - anti-burst: `Succubus Cloak / Destiny`
  - anti-cc: `Boots of Resistance + Purify (spell)`
  - anti-autoattack: `Spikemail (aktifkan manual) / Ominous Premonition`
  - anti-heal: `Mortal Punisher (fisik) / Venomous Staff (magic)`
  - anti-tank: `Overlord's Might / Starbreaker (armor pen)`
- **4 hero SENGAJA tanpa item:** Annette (shield dilawan true damage hero),
  Da Qiao (tidak ada paket yang melawan teleport), Dunshan (shield ≠ armor),
  Yaria (ult shield serap true damage + untargetable). Jangan "memperbaiki"
  ini dengan mengarang paket.
- **Hero tanpa counter: 0. `howToPlayAgainst` kosong: 0. Alasan `why`
  kosong: 0.**

### Stat item terverifikasi (ke-10 komponen — JANGAN ubah tanpa sumber resmi)

| Item | Harga | Stat & pasif (ringkas) |
|---|---|---|
| Destiny | 2060G | PA +75, AS +15%, HP +500. Dark Curtain: kena damage fatal jadi kebal + 15% AS/MS 1 dtk (0,75 dtk ranged), CD 120 dtk |
| Ominous Premonition | 2020G | PD +300, HP +1200. Cold Steel: terima damage → kurangi AS penyerang 20–40% & MS 7,5–15% 2,5 dtk, CD 3 dtk/target |
| Succubus Cloak | 2020G | MD +300, HP +1100. Mist Veil: perisai sihir 400–800 (+7% extra HP) tiap 15 dtk |
| Boots of Resistance | 700G | PD +50, MD +100, MS +50. Tough +25% Resistance. Ganti gratis ke sepatu lain, CD 5 mnt |
| Purify (spell) | — | Hapus semua debuff + semua CC kecuali suppress; imun CC 1,5 dtk; TANPA bonus movement speed. CD 120 dtk |
| Spikemail | 2020G | PA +45, PD +300, HP +700. **AKTIF** Countersiege: pantulkan 35% damage sebagai true damage 3 dtk, CD 75 dtk |
| Mortal Punisher | 2080G | PA +100, AS +20%, Physical Lifesteal +20%. Revive: pulih 375–750 HP 5 dtk saat HP <30% (CD 20 dtk) + Imperil 35%/2,5 dtk |
| Venomous Staff | 2040G | **MA +230 (BUKAN +240 — patch S16 resmi: 240→230)**, CDR +7,5%, MS +7,5%. Imperil 35%/2,5 dtk |
| Overlord's Might | 2540G | PA +150, CDR +5%. Pasif **Siege Breaker** (+30% damage ke musuh HP <50%) — "Siege Breaker" adalah NAMA PASIF, bukan nama item |
| Starbreaker | 2080G | PA +90, HP +700, MS +7,5%. Sunder +30% Physical Pierce |

### Tier resmi (Fase 24 — menggantikan rumus proxy lama)

- Sumber: **HoK Camp resmi di dalam game**, via hub-game.com (snapshot
  **6 Nov 2026**), dicek silang dengan HoKStats official-popularity
  (snapshot sama — cocok persis, mis. Gao Changgong Win 50,2 / Pick 0,8 /
  Ban 1,5). Distribusi: **S 12, A 24, B 36, C 48** (tanpa tier D).
- Tier resmi **BUKAN urutan win rate** — bukti: Dunshan tier S dengan WR
  45,53%; Lapulapu tier C dengan WR 54,77%.
- Contoh: Donghuang S (48,1 / 0,9 / 2,9), Gao Changgong A (50,2 / 0,8 /
  1,5), Lu Bu B (48,4), Nuwa B (53,8), Butterfly C (50,0 / 0,4 / 0,1).
- Cara pakai yang benar: salin ANGKA saja (tier + Win/Pick/Ban) + atribusi
  "Sumber: HoK Camp" + tanggal snapshot. JANGAN salin komentar hub-game.
  Tidak ada API; tidak ada izin tertulis — kalau Tencent minta takedown,
  patuh.
- Rumus proxy lama (skor 2·hard+soft−2·hardDiterima−softDiterima,
  S12/A12/B17/C45/D34) **sudah dihapus dari kode**. Jangan dibangkitkan lagi.

## 5. Fitur yang sudah ada (Fase 0–24, ringkas)

- **Home:** cari fuzzy (toleran typo), filter role, favorit ★, **Bedah
  Counter** saat mengetik (query ≥2 huruf): avatar + role/kelas + chip +
  "Cara melawan" + Counter alami (maks 5, hard dulu) + Counter item +
  **"Jangan pick" (reverse lookup, maks 5 + "…dan N lagi")** + link halaman
  hero. "Jangan pick" HANYA ada di Bedah, bukan di halaman hero.
- **Halaman hero:** Counter alami, Counter item (lengkap harga), Cara
  melawan, tombol Usulkan/laporkan. Tanpa "Jangan pick".
- **Draft Pick (Arena Draft):** slot fleksibel (klik slot = target aktif, ×
  per slot, popup grid hero + cari + filter role + "Terakhir dipakai" +
  keyboard `/`, tetap terbuka setelah pick untuk rapid pick); saran ban
  (hard +2/soft +1); saran pick per role (top 3, role tersimpan di
  `hok-role`); saran item lawan tim musuh (agregat, top 3, lengkap harga);
  cek komposisi tim; salin link draft; draft bernama (maks 12). Layout
  desktop satu layar: arena 3 kolom (Tim / advisor tengah / Musuh) +
  baris 4 kolom (Saran ban | Saran pick | Role + saran pick role | Saran
  item) + baris bawah (Komposisi | Bagikan & simpan). Mobile: Tim &
  Musuh berdampingan, advisor selebar halaman di bawah.
- **Kuis Counter:** 20 soal per ronde; 3 mode — Tebak Counter, Tebak Hero
  (foto HANYA di soal, bukan di opsi — foto di opsi = contekan),
  Kuis Skenario (5 skenario, timer 30 dtk, skor maks 1250).
- **Item Wiki (`#/items`):** 8 kartu paket (judul = string items, chip tag,
  badge jumlah hero, strip avatar, detail harga/stat per komponen); filter
  cari + chip kategori + toggle "Hanya yang terkurasi".
- **Tier Hero (`#/tier`):** tier resmi HoK Camp + Win/Pick/Ban tiap hero,
  urut win rate desc per tier; cari + filter lane.
- **Tentang (`#/tentang`, alias `#/more`):** deskripsi fitur, "Cara data
  dibuat", donasi **Sawermaz** https://sawermaz.com/jembodfiraun,
  "Terakhir diperbarui 10 Nov 2026", badge patch **S16**.
- **Nav (desktop & dock sama):** Counter Hero, Favorit, Draft Pick, Kuis
  Counter, Item Counter, Tier Hero, Tentang (7 tab; dock mobile ikon saja
  ≤560px, tanpa label). **Tombol kembali pernah ada lalu DIHAPUS atas
  permintaan eksplisit pemilik — jangan pasang lagi tanpa diminta.**
- **Lainnya:** PWA offline-first (service worker cache-first), sitemap/
  robots/OG, Vercel Web Analytics (paket Hobby gratis, aktif sejak 9 Nov
  2026 — hasilnya belum pernah dicek).

## 6. Desain — tema "Obsidian Aegis" (jangan diubah tanpa arahan)

- Warna: bg `#0f131c`, abyss `#090d16`, teks `#dfe2ef`, muted `#94a3b8`,
  card `#0f172a`, chip `#1c1f29`, dock `#0a0e17`; emas `#f59e0b` (hover
  `#fbbf24`, deep `#d97706`); cyan `#06b6d4`/`#38bdf8`.
- Lane: Clash `#ef4444`, Jungle `#a855f7`, Mid `#3b82f6`, Farm `#f59e0b`,
  Roam `#10b981`. Counter: hard `#ef4444`, soft `#10b981`.
- Font self-hosted: Outfit 700/800 + Inter 400/600/700. Tanpa Google Fonts
  CDN (offline-first).
- Logo crest: perisai heksagonal + huruf L emas + bilah cyan + berlian
  (symbol `#i-logo` di `index.html` dan `logo.svg`).
- Kartu hero ringkas: grid desktop `minmax(64px, 1fr)`, mobile
  `minmax(56px, 1fr)`. Pemilik sudah 2× komplain kartu kebesaran — jangan
  buat kartu besar lagi.

## 7. Aturan kerja pemilik (WAJIB dipatuhi agen)

- **Rencana dulu, tunggu acc/gas eksplisit** sebelum eksekusi build/produksi.
  "Coba" atau "seadanya aja" BUKAN acc. Acc pada konten BUKAN izin spend
  atau kuota.
- **Jangan pernah mengarang angka.** Data kosong/palsu harus di-flag
  SEBELUM tayang, bukan sesudah. Kalau sumber tidak bisa diverifikasi,
  tulis "belum terverifikasi" — jangan isi dengan perkiraan.
- **Scope: gameplay saja** — draft pick, counter hero, item, meta. Jangan
  samakan/bandingkan situs ini dengan HoKStats yang lebih lengkap (Arcana,
  panduan, kode penukaran, lore, aplikasi, dll).
- **Domain publik tidak memakai nama pemilik.** Selalu bagikan alias
  bersih (`lawanku.vercel.app`) dan verifikasi alias aktual sebelum
  membagikan.
- Komunikasi: Bahasa Indonesia santai, ringkas dan to-the-point. Kritik
  blak-blakan dari pemilik adalah suhu normal — iterasi cepat, jangan
  defensif, jangan menjelaskan ulang hal yang sudah dipahami.
- Deliverable dikirim persis yang diminta — tanpa bagian, catatan, atau
  analisis tambahan.

## 8. Deploy

- **Cara utama (sejak 10 Nov 2026): git push ke `main` → auto-deploy.**
  Repo sudah tersambung ke proyek Vercel `lawanku` (production branch
  `main`, root `./`, Framework Preset "Other", tanpa build command, tanpa
  env var). Domain `lawanku.vercel.app` sudah ditambahkan ke proyek,
  sehingga otomatis mengikuti deployment produksi terbaru.
- **Catatan:** penyambungan repo TIDAK memicu deployment awal — deployment
  produksi saat itu tetap yang dari CLI. **Push pertama ke `main` adalah
  pembuktian auto-deploy**: setelah push, cek daftar Deployments di
  dashboard dan verifikasi live (`curl https://lawanku.vercel.app/sw.js`
  harus `lawanku-v28`, `tiers.json` harus 200).
- **Fallback (kalau git integration bermasalah): Vercel CLI + token.**
  Token dibuat pemilik di vercel.com/account/tokens, dipakai transient
  (JANGAN disimpan di file/repo/chat), lalu:
  `npx vercel link --project lawanku --scope akmaludien --yes` lalu
  `npx vercel deploy --prod --yes`. Hapus `.env.local` yang dibuat CLI
  setelah selesai.
- **JANGAN pakai deploy via Vercel MCP / `deploy.sh`.** Token OAuth MCP
  kehilangan grant tim (403 "Not authorized: scope akmaludien"), reconnect
  2× tidak mempan, dan tool `authorize_team_access` tidak ada di server
  MCP ini. Jalur itu buntu.
- Setiap deploy yang mengubah `app.js`/`styles.css`/`index.html`: naikkan
  versi cache di `sw.js`.

## 9. Pengujian

- Server lokal: `python3 -m http.server 8902` di folder repo.
- Tes headless: Chromium headless shell di
  `~/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`
  + harness iframe (`_testN.html`, hapus setelah jalan). Browser headless
  di VM ini **tidak punya internet eksternal** — verifikasi live hanya via
  `curl`.
- **Quirk yang sudah terbukti:** `innerText` headless MELEWATKAN isi di
  bawah fold — cek konten pakai `textContent` / query DOM, BUKAN
  `innerText`. Setelah `location.reload()` pada iframe, tunggu sampai
  `contentDocument` berganti dokumen baru sebelum mengukur (race).
- Selalu `node --check app.js` setelah edit JS. Tes per fase selama ini:
  7–35 kasus per fase, semua harus PASS sebelum deploy.
- Verifikasi live pasca-deploy: `/` 200, `sw.js` berisi versi cache yang
  benar, `tiers.json` 200.

## 10. Sumber data & update patch

- **Sumber yang terverifikasi:** hub-game.com (transkrip patch notes resmi
  + database item + tier/Win/Pick/Ban dari HoK Camp); HoKStats halaman
  "Popularitas resmi" (snapshot sama, terverifikasi silang). `camp.honorofkings.com`
  tidak bisa dibaca langsung (shell JS).
- **JANGAN jadikan sumber:** tier list HoKStats (estimasi editorial, tanpa
  angka); halaman counter HoKStats (hanya 2 counter per hero, tanpa
  hard/soft, ada halaman template yang salah — mis. Da Qiao digambarkan
  burst assassin); patch notes HoKStats (mandek 23 Sep 2026); artikel
  berbingkai leaks.
- **Checklist update patch:** `_research/patch-update-checklist.md`
  (kapan dicek, sumber, yang dicek, yang diedit, verifikasi, log).
  Season saat ini **S16 "Flow As One"**, patch terbaru **5 Nov 2026**.
  **Watch list permanen: rework Butterfly** (Experience Server, belum
  live — kalau rilis dengan true damage, counter tank melemah).
- Aturan edit data: string `items` harus persis sama di semua entri;
  `hero` counter = id angka; tanggal "Terakhir diperbarui" ada di 2
  tempat (`app.js` renderTentang + footer `index.html`).

### Prerender SEO & Sitemap (Fase 28)

- **120 halaman hero statis** di `hero/<slug>/index.html` dan `sitemap.xml` di-generate otomatis oleh `scripts/prerender.mjs` (Node vanilla, tanpa dependensi).
- **Aturan CI Sinkronisasi:** CI GitHub Actions menjalankan `node scripts/prerender.mjs` lalu `git diff --exit-code hero/ sitemap.xml`. Jika ada agen yang mengedit `data.json` atau `tiers.json` tanpa menjalankan `node scripts/prerender.mjs`, **CI otomatis GAGAL**.
- **Checklist agen Data & Riset saat update data:**
  1. Edit `data.json` / `tiers.json`.
  2. Jalankan `python3 _split_data.py` (untuk update chunk `data-1.json` & `data-2.json`).
  3. Jalankan `node scripts/prerender.mjs` (untuk regenerasi 120 halaman `hero/` & `sitemap.xml`).
  4. Jalankan `node tests/prerender-test.mjs`.
  5. Baru commit & push.

## 11. Backlog (urut prioritas)

- **Kecil:** head-to-head 2 hero; filter counter per role di halaman
  hero/Bedah; kuis mode baru (tebak hero dari skill); cek analitik
  (sudah ada kunjungan atau belum); kembalikan label dock mobile
  (Fase 18 — belum diputuskan pemilik).
- **Sedang:** share card (gambar kartu draft/counter); patch watcher
  otomatis.
- **Besar:** draft 5v5 pick-ban bergiliran; versi Inggris; backend
  Supabase (sinkronisasi draft & favorit antar perangkat — saat ini
  hanya di perangkat sendiri); SEO prerender 120 halaman (saat ini
  routing hash); domain `lawanku.id` (belum dibeli — perlu keputusan
  pemilik + biaya tahunan).

## 12. Setup Antigravity — model & pembagian tugas

### Model (per Nov 2026, dari dokumentasi Google)

| Kebutuhan | Model | Alasan |
|---|---|---|
| **Default harian (gratis)** | **Gemini 3.8 Flash** (semua paket, termasuk gratis) | Cepat, cukup untuk edit HTML/CSS/JS vanilla, edit JSON data, dan tugas rutin. Ini pilihan utama kalau tidak berlangganan |
| Tugas penalaran berat (verifikasi counter, desain tes, arsitektur) | **Gemini 4 Argon** (Google AI Pro/Ultra; di app/CLI/ekstensi, bukan di IDE) atau **Claude Sonnet 5.5** (AI Pro non-trial/Ultra) | Penalaran lebih kuat untuk keputusan yang salahnya mahal (data counter, logika tier) |
| Verifikasi paling kritis saja | Claude Opus 5.5 (AI Pro/Ultra) | Dipakai hemat — hanya untuk cek silang akhir, bukan edit rutin |
| Jangan dipakai rutin | Model lama Claude 4.6 / GPT-OSS | Dihapus dari menu (per Nov 2026) |

- **Biaya:** Google AI Pro ±$19,99/bulan (±Rp330rb) — hampir menyentuh
  batas kas pemilik (Rp450rb). **Jangan berlangganan hanya untuk proyek
  ini** kalau paket gratis masih cukup; Flash gratis sudah memadai untuk
  sebagian besar tugas Lawanku.
- **Catatan perangkat:** laptop pemilik (Asus X441BA, AMD A9 dual-core,
  8GB RAM) akan berat menjalankan Antigravity 2.0 + IDE + beberapa agen
  paralel. **Maks 2 agen paralel, idealnya 1 berat + 1 ringan.** Kalau
  lemot, jalankan agen berurutan, bukan paralel.

### Pembagian tugas (3 agen, satu agen = satu wilayah file)

| Agen | Wilayah file | Tugas |
|---|---|---|
| **1. Data & Riset** | `data.json`, `tiers.json`, `_research/` | Kurasi counter/item, cek patch baru, verifikasi angka ke hub-game/HoKStats. TIDAK menyentuh `app.js`/CSS. Satu-satunya agen yang boleh mengubah data |
| **2. Fitur & UI** | `app.js`, `styles.css`, `index.html` | Bangun fitur satu fase per tugas, ikut tema Obsidian Aegis. TIDAK mengubah data. Wajib `node --check` + tes headless sebelum selesai |
| **3. QA & Tes** | harness `_test*.html` (sementara), verifikasi live via `curl` | Menulis & menjalankan tes, memverifikasi hitungan (120 hero, 531 counter, distribusi tier), cek live pasca-deploy. TIDAK mengubah fitur/data |

- **Aturan koordinasi:** satu agen tidak boleh mengedit file yang sedang
  dipegang agen lain (Antigravity mengisolasi tiap agen di workspace/
  branch sendiri — manfaatkan itu, jangan dilawan). Urutan kerja untuk
  fitur yang bergantung pada data: **Data → UI → QA** (berurutan).
  Paralel hanya untuk modul yang tidak saling bergantung.
- Pemilik mereview & merge tiap hasil agen. Satu fase = satu tugas =
  satu gas.
- File ini (`AGENTS.md`) di root repo dibaca otomatis oleh Antigravity —
  taruh di repo supaya setiap agen baru langsung punya konteks yang sama.

## 13. Jebakan yang sudah terbukti (jangan ulangi)

- Entri counter `hero` = **id angka**, bukan nama. Field nama hero di
  `data.json` = **`en`**, bukan `name`.
- `data.json` tidak di-deploy; yang di-deploy hanya chunk + `items.json` +
  `tiers.json`.
- Ubah shell (`app.js`/`styles.css`/`index.html`) tanpa menaikkan versi
  cache `sw.js` = pengguna lama tidak dapat update.
- "Siege Breaker" adalah **pasif** Overlord's Might, bukan nama item.
  Venomous Staff MA **230**, bukan 240. Purify **tanpa** movement speed.
  Boots of Resistance **700G**.
- "Jangan pick" HANYA di Bedah Counter, bukan di halaman hero.
- Ada hero bernama persis **"Gao"** (Mid/Mage), berbeda dari Gao Changgong
  — query "gao" cocok ke "Gao"; untuk Gao Changgong pakai "gao ch".
- `innerText` headless melewatkan isi di bawah fold (pakai `textContent`).
- Deploy via Vercel MCP **buntu** (403 tanpa scope tim) — pakai git push
  atau CLI + token.
- Analitik aktif tapi hasilnya belum pernah dicek.
- Jangan samakan situs ini dengan HoKStats; jangan pakai daftar counter
  HoKStats tanpa verifikasi mekanik per pasangan.
