# Review: Redesain Stitch "Obsidian Aegis" (9 Nov 2026)

Sumber: `~/workspace/user/files/stitch_website_redesign_ideas.zip` — 20 layar
(10 konsep × desktop + mobile) + `obsidian_aegis/DESIGN.md` + file teks hasil
ekstraksi situs live. Status: DIREVIEW, belum dieksekusi. Keputusan Akmal
masih menunggu.

## Yang Stitch usulkan

- **Design system baru "Obsidian Aegis"**: obsidian gelap `#0F131C`/`#090D16`,
  emas `#F59E0B`, cyan `#06B6D4`, font Outfit (judul) + Inter (isi), sudut tajam
  4px, panel kaca (glassmorphism), warna per-lane (Clash merah, Jungle ungu,
  Mid biru, Farm amber, Roam hijau).
- **Nav jadi 6 item eksplisit**: Counter Matrix, Draft Simulator, Favorit,
  Quiz Counter, Item & Equipment, Meta Tierlist (+ ikon profil & region ID/SEA).
  Mobile pakai bottom nav 5 item.
- **Layar baru**: Meta Tier List S16, Profil Pemain + Riwayat Pertandingan,
  Quiz skenario (Asah Taktik, MMR/streak/leaderboard), Analisis Sinergi/Matchup
  (modal), Item Wiki berkategori, Favorit "Roster Andalan & Counter Deck",
  dropdown filter lane (bottom sheet mobile), Draft Simulator arena 5v5
  (3 kolom: Tim Biru / advisor tengah / Tim Merah, mode Ranked 3 Ban &
  Tournament 4 Ban, timer giliran 20 dtk).
- **Home "Bedah Counter"**: panel spotlight hero terpilih — win rate, fase
  dominasi, daftar counter + delta, item counter, seksi "jangan pick".

## Yang bagus & bisa diambil

1. Identitas visual lebih kuat & beda dari Kurohiko (emas+cyan di obsidian,
   tipografi Outfit/Inter, sudut tajam). Ini menjawab permintaan "bedakan sama
   Kurohiko".
2. "Bedah Counter" di home — sebagian besar bisa dibangun dari data yang ada
   (counter hard/soft + alasan + item counter; "jangan pick" = lookup balik).
3. Struktur kategori Item Wiki (Anti-Regen / Anti-AS / Anti-Burst / Magic Def)
   nyaris sama dengan 5 kategori kita — tinggal rapikan.
4. Layout arena draft 3 kolom (desktop) & bottom nav (mobile) — lebih kaya
   dari layout bertumpuk sekarang, tanpa mengubah cara pick.
5. Format kuis skenario (Bagian A pick hero, Bagian B pick item pertama,
   timer) — bisa digenerate dari data counter; MMR/streak lokal saja.
6. Favorit "Counter Deck": catatan taktik per hero, blind-spot, cheat sheet,
   prioritas ban — derivable dari data + localStorage.

## Masalah besar: datanya karangan

Stitch TIDAK pernah melihat aplikasi aslinya — file ekstraksi menunjukkan ia
hanya membaca shell no-JS ("Butuh JavaScript buat buka Lawanku"). Akibatnya
hampir semua angka di mockup adalah karangan:

- Win rate / pick rate / ban rate semua hero (mis. Charlotte 52.4%, Lam 53.8%).
- "1,248,930 pertandingan Mythic/Grandmaster SEA S16", "99.4% win rate sync",
  "Update 12 menit lalu", "Last Telemetry Sync Real-time API 20m ago".
- Patch notes 16.3 dengan angka spesifik (Dun shield cooldown −1s, Heino
  −3.4% WR, Blazing Cape −80G) — belum terverifikasi; klaim patch juga
  tidak konsisten antar layar (S16 / 16.3 / 9.2.1.8).
- Tier list S+/S/A, skor sinergi, bar win-probability (54.2% vs 45.8%),
  "AI Ban-Pick Advisor 98.4% confidence".
- Leaderboard (KaguraX, RosterKing_ID) & profil pemain "Ryuto Kagami,
  Grandmaster 42 bintang, 348 match, KDA 4.82" — pemain palsu.
- Hitungan lane tidak konsisten antar layar: home 26/24/25/23/22 (=120),
  tier list 22/18/19/15/14 (=88), dropdown mobile Farm 22 / Roam 23.
- Item wiki bilang "114 Core" (data kita 113). Favorit menulis "Siege Breaker"
  sebagai nama item — kesalahan yang sama yang sudah diperbaiki (itu pasif
  Overlord's Might, bukan item).
- Gambar hero di mockup adalah placeholder AI (lh3.googleusercontent.com),
  bukan ikon asli kita. File code.html adalah mockup Tailwind CDN — tidak ada
  yang bisa ditempel langsung; yang reusable hanya token desainnya.
- 3 layar modal sinergi/matchup render-nya rusak di Stitch sendiri (hampir
  seluruhnya hitam/kosong di bawah header).

Aturan main: ambil kulitnya, buang angkanya. Semua angka di atas harus
dihapus, dilabeli estimasi, atau diganti data kurasi nyata sebelum tayang.

## Yang tidak bisa dieksekusi apa adanya

- **Profil + riwayat pertandingan**: tidak ada sumber data (tidak ada API
  publik HoK). Satu-satunya opsi: profil manual isi-sendiri — bukan seperti
  mockup.
- **Leaderboard / room code / share Discord / "AI advisor"**: butuh backend
  & akun; situs kita statis + localStorage.
- **Tier List**: butuh kurasi 120 hero ke S+/S/A/B/C — kerja riset tersendiri
  & sifatnya opini; tidak bisa diturunkan dari data counter.
- **Sinergi matchup**: tidak ada data sinergi; cek komposisi kita sekarang
  hanya coverage 5 role.
- **Draft turn-based + timer**: mengubah produk (draft bebas → simulasi
  ranked). Keputusan desain, bukan sekadar reskin.
- **Kartu hero besar di home**: Akmal sudah 2× minta kartu diperkecil
  (Fase 5b/5c). Kartu besar Stitch mundur dari keputusan itu.
- **Font Google Fonts**: situs offline-first (SW cache-first) — font harus
  di-self-host (woff2 lokal), bukan CDN.

## Rencana bertahap yang diusulkan

- **Fase A — reskin saja**: token Obsidian Aegis (warna, font self-hosted,
  sudut tajam, panel kaca, CTA emas, warna lane, nav 6 item, bottom nav
  mobile). Semua fitur & data tetap. Estimasi: satu sesi kerja penuh
  (rewrite styles.css + sebagian index.html + tes ulang semua halaman).
- **Fase B — Bedah Counter di home**: spotlight hero dari data yang ada
  (hard/soft, bukan win rate).
- **Fase C — Item Wiki**: rapikan 5 kategori yang ada (+ harga/stat item
  hanya kalau terverifikasi).
- **Fase D — layout arena draft**: 3 kolom desktop, advisor = saran pick/ban
  yang sudah ada; tetap draft bebas (tanpa timer / win-probability palsu).
- **Fase E — butuh kurasi/keputusan**: Tier List (kurasi 120 hero) & kuis
  skenario (generate dari data counter).
- **Ditolak**: profil pemain, leaderboard/room code, semua angka karangan,
  modal sinergi (sampai ada data sinergi).
