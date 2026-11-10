import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHECKLIST_PATH = path.join(ROOT, '_research', 'patch-update-checklist.md');

// 1. Baca tanggal patch terakhir yang tercatat di _research/patch-update-checklist.md
export function getLatestRecordedDate() {
  if (!fs.existsSync(CHECKLIST_PATH)) return '2026-11-05';
  const content = fs.readFileSync(CHECKLIST_PATH, 'utf8');
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
  const regex = /Patch\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/gi;
  let match;
  const dates = [];
  while ((match = regex.exec(content)) !== null) {
    const day = parseInt(match[1], 10);
    const mStr = match[2].toLowerCase().slice(0, 3);
    const month = months[mStr] || 1;
    const year = parseInt(match[3], 10);
    dates.push(new Date(Date.UTC(year, month - 1, day)));
  }
  if (!dates.length) return '2026-11-05';
  dates.sort((a, b) => b - a);
  return dates[0].toISOString().split('T')[0];
}

// 2. Cek sumber online aktual
export async function checkOnlinePatch() {
  const sources = [
    { name: 'Honor of Kings Official News', url: 'https://www.honorofkings.com/' },
    { name: 'Hub-Game Updates', url: 'https://hub-game.com/' },
  ];
  for (const src of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LawankuPatchWatcher/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        const dateMatch = text.match(/202[6-9]-[0-1][0-9]-[0-3][0-9]/);
        if (dateMatch) {
          return { date: dateMatch[0], url: src.url, sourceName: src.name };
        }
      }
    } catch (e) {
      // Abaikan jika network error / timeout pada sumber eksternal
    }
  }
  return null;
}

// 3. Verifikasi issue dan buat issue GitHub bila ada patch baru
export async function handlePatchWatcher({ simulateDate = null } = {}) {
  const lastRecordedDate = getLatestRecordedDate();
  console.log(`[Watch] Tanggal patch terakhir di repo: ${lastRecordedDate}`);

  let detectedPatch = null;
  if (simulateDate) {
    console.log(`[Watch] Menggunakan tanggal patch simulasi: ${simulateDate}`);
    detectedPatch = {
      date: simulateDate,
      url: 'https://www.honorofkings.com/news/simulated-test',
      sourceName: 'Simulasi Patch Watcher',
    };
  } else {
    console.log('[Watch] Memeriksa sumber patch resmi...');
    detectedPatch = await checkOnlinePatch();
  }

  if (!detectedPatch) {
    console.log('[Watch] Tidak dapat mendeteksi patch baru dari sumber online. Selesai tanpa perubahan.');
    return { status: 'up-to-date', lastRecordedDate };
  }

  console.log(`[Watch] Patch terdeteksi: ${detectedPatch.date} (dari ${detectedPatch.sourceName})`);
  const isNewer = detectedPatch.date > lastRecordedDate;
  if (!isNewer) {
    console.log(`[Watch] Patch ${detectedPatch.date} tidak lebih baru dari catatan ${lastRecordedDate}. Data Lawanku sudah mutakhir.`);
    return { status: 'up-to-date', lastRecordedDate, onlineDate: detectedPatch.date };
  }

  console.log(`[Watch] Patch BARU terdeteksi: ${detectedPatch.date} > ${lastRecordedDate}! Memeriksa issue GitHub...`);

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || 'Akmaludien/lawanku-hok';

  if (!token) {
    console.log('[Watch] GITHUB_TOKEN tidak ada (lingkungan lokal). Simulasi pembuatan issue selesai:');
    console.log(`  Judul: [Patch Watcher] Patch HoK Baru Terdeteksi: ${detectedPatch.date}`);
    console.log(`  Sumber: ${detectedPatch.url}`);
    return { status: 'simulated-local', patchDate: detectedPatch.date };
  }

  const expectedTitle = `[Patch Watcher] Patch HoK Baru Terdeteksi: ${detectedPatch.date}`;

  // Cek duplikasi issue terbuka
  const listRes = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=50`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'LawankuPatchWatcher/1.0',
    },
  });

  if (!listRes.ok) {
    throw new Error(`Gagal mengambil issue dari GitHub API: HTTP ${listRes.status}`);
  }

  const issues = await listRes.json();
  const existing = issues.find(i => i.title === expectedTitle || (i.title.startsWith('[Patch Watcher]') && i.title.includes(detectedPatch.date)));

  if (existing) {
    console.log(`[Watch] Duplikasi dicegah: issue untuk patch ${detectedPatch.date} sudah terbuka (Issue #${existing.number}: "${existing.title}").`);
    return { status: 'duplicate-skipped', issue: existing };
  }

  // Buat issue baru
  const body = `## 🔔 Patch Baru Honor of Kings Terdeteksi!

- **Tanggal Patch Baru:** \`${detectedPatch.date}\`
- **Sumber:** ${detectedPatch.url}
- **Patch Terakhir Tercatat:** \`${lastRecordedDate}\` (di \`_research/patch-update-checklist.md\`)

---

### 📋 Checklist Verifikasi Data Lawanku
- [ ] **Hero Baru:** Cek apakah ada hero baru rilis. Jika ada, tambahkan entri lengkap di \`data.json\` (5 counter alami, rekomendasi item, dan *how to play against*), lalu jalankan \`_split_data.py\`.
- [ ] **Rework / Perubahan Skill:** Cek apakah ada kit mekanik hero yang di-rework (mis. Butterfly rework, perubahan skill true damage/crowd control). Perbarui alasan \`why\` counter yang bersangkutan.
- [ ] **Perubahan Item:** Cek apakah ada perubahan harga, stat, atau efek pasif dari 10 komponen item resmi di Season 16.
- [ ] **Perubahan Meta Counter:** Verifikasi apakah ada pergeseran hard/soft counter berdasarkan patch notes.
- [ ] **Tiers HoK Camp:** Cek apakah snapshot HoK Camp di hub-game telah diperbarui dengan tier atau win/pick/ban baru.
- [ ] **Update Tanggal & Footer:** Perbarui tanggal cek di \`_research/patch-update-checklist.md\`, \`app.js\` renderTentang, dan footer \`index.html\`.
- [ ] **Naikkan Versi Cache:** Naikkan versi cache di \`sw.js\` sebelum rilis ke produksi.

> *Dibuat otomatis oleh Patch Watcher (\`.github/workflows/patch-watch.yml\`)*.`;

  const createRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'LawankuPatchWatcher/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: expectedTitle,
      body,
      labels: ['patch-watcher'],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat issue: HTTP ${createRes.status} - ${errText}`);
  }

  const createdIssue = await createRes.json();
  console.log(`[Watch] Berhasil membuat issue #${createdIssue.number}: "${createdIssue.title}" (${createdIssue.html_url})`);
  return { status: 'created', issue: createdIssue };
}

// CLI entry point
const args = process.argv.slice(2);
let simDate = process.env.SIMULATE_PATCH_DATE || null;
const simIdx = args.indexOf('--simulate');
if (simIdx >= 0 && args[simIdx + 1]) {
  simDate = args[simIdx + 1];
}

handlePatchWatcher({ simulateDate: simDate })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Watch] Error:', err.message);
    process.exit(1);
  });
