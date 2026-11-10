# Checklist Update Patch — Lawanku

Dipakai tiap kali ada patch/season baru Honor of Kings (atau hotfix yang
mengubah kit/item). Tujuannya: data tidak beku di patch lama tanpa ada yang
sadar. Dibuat 9 Nov 2026 (Fase 19). Data saat ini: **patch S16**.

## 1. Kapan dicek

- Season baru rilis (S17 dst.) — cek patch notes dalam 1–2 hari pertama.
- Hotfix/balance patch tengah season — cek hanya kalau ada hero/item yang
  berubah dari daftar di bawah.
- Watch list permanen: **Butterfly rework** (sempat terlihat di Experience
  Server, belum live per 9 Nov 2026) — kalau rilis, counter tank-nya
  melemah (true damage) dan harus ditulis ulang.

## 2. Sumber (urutkan dari yang paling tepercaya)

1. Patch notes resmi HoK global (in-game / situs resmi).
2. HoKStats (hokstats.gg) — kit + counter per hero.
3. Wiki Fandom Honor of Kings — detail skill.
4. GamingOnPhone / hokbuild — panduan counter eksplisit.
5. Experience Server / preview season — HANYA untuk watch list, jangan
   dijadikan data live sebelum rilis global.

## 3. Yang dicek per patch

- [ ] Hero baru → tambah entri lengkap (counter alami 5, item, howto).
- [ ] Rework / perubahan skill → perbarui `why` counter yang menyinggung
      mekanik lama, dan `howToPlayAgainst` yang bersangkutan.
- [ ] Perubahan item → cek 8 paket yang dipakai situs; kalau nama/pasif
      item berubah (contoh: Spikemail pasif → aktif di S16), perbarui
      string `items` di SEMUA hero yang memakainya (string harus persis
      sama di semua entri).
- [ ] Perubahan meta counter → tambah/ubah pasangan counter bila ada
      bukti kuat (riset kit + panduan counter, bukan feeling).
- [ ] Angka: JANGAN mengarang damage/cooldown/persen. Kalau tidak
      terverifikasi, buang dari teks.

## 4. Yang diedit di repo

- `data.json` (kanonis) — lalu regenerasi `data-1.json` + `data-2.json`
  (chunk 60+60, `version` tidak berubah kecuali format data berubah).
- Tanggal + label patch di 2 tempat:
  - `app.js:1877` (Tentang): `Data patch S16 · Terakhir diperbarui 9 Nov 2026.`
  - `index.html:53` (footer): `...patch Season 16 (diperbarui 9 Nov 2026).`
  - Badge `S16` di logo (`index.html:47`, class `s16`) ikut diganti kalau season berganti.
- JANGAN edit manual: statistik home/Tentang (dihitung dinamis dari data)
  dan Tier List (rumus otomatis dari counter). Waspada angka hard-coded
  baru — terakhir ada 2, diperbaiki di Fase 16.

## 5. Verifikasi sebelum deploy

- [ ] `python3` cek: total counter, total item, hero tanpa counter = 0,
      hero tanpa howto = 0, hero tanpa item = hanya yang sengaja
      (per 9 Nov: Annette, Da Qiao, Dunshan, Yaria), tidak ada `why` kosong,
      `hero` di entri counter = id angka (bukan nama).
- [ ] Tes headless: home tampil, halaman hero yang diubah tampil
      (counter + howto + item), `#/items` dan `#/quiz` tampil tanpa error JS.
- [ ] Deploy `./deploy.sh` (naikkan versi cache `sw.js` kalau `app.js` /
      `styles.css` / `index.html` berubah — aturannya wajib).
- [ ] Verifikasi live: alias 200, versi cache cocok, 1–2 potongan teks
      baru ketemu di `data-1.json`/`data-2.json` live.

## 6. Kalau tidak ada yang berubah

Patch yang tidak menyentuh hero/item/counter = tidak ada yang diedit.
Tulis tanggal cek di sini (biar ketahuan patch itu sudah diperiksa):

- S16 — 9 Nov 2026: data lengkap (Fase 16–19).
- **Patch 5 Nov 2026 — dicek 9 Nov 2026: TIDAK ADA EDIT.** Balance patch:
  buff Flowborn (Mage), Biron, Hou Yi, Nakoruru, Arli; nerf Fuzi, Nezha.
  Semuanya hanya angka damage (mis. Skill 2 Biron 150→270, pasif Arli
  40%→55%), tanpa perubahan mekanik, item, atau hero baru. Dicek semua
  entri 7 hero di data.json — tidak ada `howToPlayAgainst`/`why` yang
  menyebut angka yang berubah (yang ketemu cuma penomoran "1) 2)" dan
  "level 4"), dan semua counter/item-nya berbasis mekanik, jadi tidak ada
  yang perlu diubah. Buff Arli malah menguatkan alasan item
  anti-autoattack-nya. Tanggal "Terakhir diperbarui" di situs TETAP
  9 Nov 2026 karena datanya memang tidak berubah. Season masih S16.
- S17 — _belum rilis / belum dicek_.
- **Dicek ulang 10 Nov 2026: TIDAK ADA PATCH BARU.** Patch terbaru tetap
  5 Nov 2026 (sumber: pengumuman resmi HoK 4 Nov + hub-game updates
  7 Nov). Hub-game 9 Nov hanya memperbarui tier + win/pick/ban ke data
  resmi per 6 Nov (Gao Changgong & Mi Yue naik ke A, Da Qiao & Nuwa turun
  ke B di tier MEREKA — metodologi berbeda dari tier proxy kita, BUKAN
  koreksi data kita). Season masih S16, tidak ada hero/item baru.
  Catatan: klaim "data resmi" hub-game ini kandidat buat perbaikan tier
  kita — tapi WAJIB diverifikasi dulu sumber + tanggalnya sebelum dipakai.
