# Patch app.js: rebrand Lawanku + halaman Database Item + SW + hero 2 kolom.
import re

p = "app.js"
src = open(p, encoding="utf-8").read()
orig = src

def rep(old, new, count=1):
    global src
    assert src.count(old) == count, f"tidak ketemu/pas ({src.count(old)}x): {old[:70]!r}"
    src = src.replace(old, new, count)

# 1. Komentar + judul + teks "clone"
rep("/* HOK Counter — clone. Logika ditulis ulang dari perilaku situs asli:",
    "/* Lawanku — counter hero Honor of Kings. */")
src = src.replace("HOK Counter", "Lawanku")
rep("Usulan tersimpan lokal di clone ini (belum ada server).",
    "Usulan tersimpan lokal di Lawanku (belum ada server).")

# 2. Dock: tab Item + sinkron topnav desktop
rep('  nav.appendChild(tabEl("#/quiz", "i-quiz", "Quiz", route === "quiz"));\n',
    '  nav.appendChild(tabEl("#/quiz", "i-quiz", "Quiz", route === "quiz"));\n'
    '  nav.appendChild(tabEl("#/items", "i-item", "Item", route === "items"));\n')
rep('  dock.appendChild(nav);\n}',
    '  dock.appendChild(nav);\n'
    '  const top = route === "home" ? "#/" : "#/" + route;\n'
    '  for (const a of $$(".topnav a")) a.classList.toggle("on", a.getAttribute("href") === top);\n}')

# 3. Router: rute items
rep('  else if (parts[0] === "quiz") renderQuiz();\n',
    '  else if (parts[0] === "quiz") renderQuiz();\n'
    '  else if (parts[0] === "items") renderItems();\n')

# 4. Halaman Database Item (sisip sebelum MORE)
items_fn = '''
/* ---------- ITEMS ---------- */
const ITEM_TAGS = {
  "anti-burst": "Anti-Burst",
  "anti-cc": "Anti-CC",
  "anti-heal": "Anti-Heal",
  "anti-tank": "Anti-Tank",
  "anti-autoattack": "Anti-Auto Attack",
};
function renderItems() {
  document.title = "Database Item — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Database Item"));
  main.appendChild(el("p", "mut", "Rekomendasi item lawan hero, dikelompokkan per kategori. Badge hijau = sudah terkurasi."));
  const ctl = el("div", "ctl");
  const srch = el("label", "srch");
  srch.appendChild(icon("i-search"));
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Cari item, kategori, atau hero…";
  input.setAttribute("aria-label", "Cari item");
  srch.appendChild(input);
  ctl.appendChild(srch);
  const row = el("div", "row");
  const tog = el("button", "all", "Hanya yang terkurasi");
  tog.type = "button";
  tog.setAttribute("aria-pressed", "false");
  row.appendChild(tog);
  ctl.appendChild(row);
  main.appendChild(ctl);
  const list = el("div", "taggrid");
  main.appendChild(list);
  const empty = el("p", "mut", "Tidak ada yang cocok.");
  empty.hidden = true;
  main.appendChild(empty);
  let curatedOnly = false;
  const paint = () => {
    tog.classList.toggle("on", curatedOnly);
    tog.setAttribute("aria-pressed", String(curatedOnly));
    const q = norm(input.value);
    list.replaceChildren();
    let shown = 0;
    const tags = [...new Set(HEROES.flatMap(h => (h.itemCounters || []).map(c => c.tag)))].sort();
    for (const tag of tags) {
      const rows = [];
      for (const h of HEROES) for (const c of h.itemCounters || []) {
        if (c.tag !== tag) continue;
        if (curatedOnly && c.needsReview) continue;
        if (q && !norm(c.items + " " + tag + " " + h.en + " " + (c.why || "")).includes(q)) continue;
        rows.push({ h, c });
      }
      if (!rows.length) continue;
      shown += rows.length;
      const card = el("div", "card tagcard");
      const head = el("div", "row");
      head.appendChild(el("b", null, ITEM_TAGS[tag] || tag));
      head.appendChild(el("span", "badge soft", rows.length + " hero"));
      card.appendChild(head);
      for (const { h, c } of rows) {
        const r = el("div", "row1");
        r.appendChild(avatar(h, 40));
        const txt = el("div");
        const a = document.createElement("a");
        a.href = "#/hero/" + slug(h.en);
        a.textContent = h.en;
        txt.appendChild(a);
        txt.appendChild(el("small", null, c.items));
        if (c.why) txt.appendChild(el("small", null, c.why));
        r.appendChild(txt);
        if (!c.needsReview) r.appendChild(el("span", "tag ok", "terkurasi"));
        card.appendChild(r);
      }
      list.appendChild(card);
    }
    empty.hidden = shown > 0;
  };
  input.addEventListener("input", paint);
  tog.addEventListener("click", () => { curatedOnly = !curatedOnly; paint(); });
  paint();
  renderDock("items", null);
}

'''
rep("/* ---------- MORE ---------- */", items_fn + "/* ---------- MORE ---------- */")

# 5. More: hapus link Kurohiko, ganti dengan Database Item + Tentang
old_more = src[src.index("function renderMore() {"):src.index("/* ---------- router & boot ---------- */")]
new_more = '''function renderMore() {
  document.title = "More — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "More"));
  const total = HEROES.reduce((n, h) => n + (h.itemCounters || []).length, 0);
  const list = el("div", "list");
  const a = el("a", "item");
  a.href = "#/items";
  const icn = el("span", "ic");
  icn.appendChild(icon("i-item"));
  a.appendChild(icn);
  const txt = el("span");
  txt.appendChild(el("b", null, "Database Item"));
  txt.appendChild(el("small", null, total + " rekomendasi item lawan hero"));
  a.appendChild(txt);
  const go = el("span", "go");
  go.appendChild(icon("i-go"));
  a.appendChild(go);
  list.appendChild(a);
  main.appendChild(list);
  const about = el("div", "card");
  about.appendChild(el("b", null, "Tentang Lawanku"));
  about.appendChild(el("p", "mut", "Lawanku adalah alat fan-made buat cari counter hero Honor of Kings: counter alami, counter item, saran draft, dan quiz. Data counter dikurasi dari patch Season 16. Bukan afiliasi resmi Tencent, TiMi, atau Level Infinite."));
  main.appendChild(about);
  renderDock("more", null);
}

'''
src = src.replace(old_more, new_more)

# 6. Hero: dua kolom (counter alami | counter item) di desktop
rep('  main.appendChild(el("h2", null, "Counter alami"));\n',
    '  const cols = el("div", "hero2col");\n'
    '  const colA = el("div");\n'
    '  const colB = el("div");\n'
    '  cols.appendChild(colA);\n'
    '  cols.appendChild(colB);\n'
    '  main.appendChild(cols);\n'
    '  colA.appendChild(el("h2", null, "Counter alami"));\n')
rep('    main.appendChild(el("p", "mut", "Belum ada data"));\n  } else for (const c of h.naturalCounters) {',
    '    colA.appendChild(el("p", "mut", "Belum ada data"));\n  } else for (const c of h.naturalCounters) {')
rep('  main.appendChild(el("h2", null, "Counter item"));\n',
    '  colB.appendChild(el("h2", null, "Counter item"));\n')
rep('    main.appendChild(el("p", "mut", "Belum ada data"));\n  } else for (const c of h.itemCounters) {',
    '    colB.appendChild(el("p", "mut", "Belum ada data"));\n  } else for (const c of h.itemCounters) {')
# dua "main.appendChild(card)" tersisa di renderHero -> colA / colB (berurutan)
i1 = src.index("    main.appendChild(card);\n  }\n\n  colB.appendChild")
src = src[:i1] + "    colA.appendChild(card);\n  }\n\n  colB.appendChild" + src[i1 + len("    main.appendChild(card);\n  }\n\n  colB.appendChild"):]
i2 = src.index("    main.appendChild(card);\n  }\n\n  if (h.howToPlayAgainst)")
src = src[:i2] + "    colB.appendChild(card);\n  }\n\n  if (h.howToPlayAgainst)" + src[i2 + len("    main.appendChild(card);\n  }\n\n  if (h.howToPlayAgainst)"):]
assert "main.appendChild(card)" not in src[src.index("function renderHero"):src.index("/* ---------- DRAFT ---------- */")]

# 7. Registrasi service worker di boot()
rep("async function boot() {\n  const dock = $(\".dock\");",
    "async function boot() {\n"
    "  if (\"serviceWorker\" in navigator) {\n"
    "    window.addEventListener(\"load\", () => {\n"
    "      navigator.serviceWorker.register(\"sw.js\").catch(() => {});\n"
    "    });\n"
    "  }\n"
    "  const dock = $(\".dock\");")

open(p, "w", encoding="utf-8").write(src)
print("OK, bytes:", len(src), "| sisa 'HOK Counter':", src.count("HOK Counter"),
      "| sisa 'Kurohiko':", src.count("Kurohiko"), "| sisa 'kurohiko':", src.count("kurohiko"),
      "| sisa 'clone':", src.count("clone"))
