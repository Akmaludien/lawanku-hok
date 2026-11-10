/* Lawanku — counter hero Honor of Kings.
   Home (cari + filter role), halaman hero, draft (skor hard +2 / soft +1),
   favorit (localStorage), more. Data: data.json (120 hero). */
"use strict";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const ROLES = ["all", "clash", "jungle", "mid", "farm", "roam"];
const ROLE_LABEL = { all: "Semua", clash: "Clash", jungle: "Jungle", mid: "Mid", farm: "Farm", roam: "Roam" };

let HEROES = [];
let ITEM_DETAILS = {};
const byId = new Map();
const bySlug = new Map();

/* ---------- util ---------- */
function slug(name) {
  return name
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/'/g, "-").replace(/&/g, " ")
    .replace(/[()]/g, " ").replace(/\./g, "-")
    .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function icon(id) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#" + id);
  s.appendChild(u);
  return s;
}
function avatar(hero, size, isAboveFold = false) {
  const img = el("img", "av r-" + hero.roles[0]);
  img.src = "icons/hero/" + hero.id + ".webp";
  img.alt = hero.en || "";
  img.width = img.height = size || 40;
  img.loading = isAboveFold ? "eager" : "lazy";
  if (isAboveFold) img.fetchPriority = "high";
  img.decoding = "async";
  return img;
}
function roleName(r) { return r.charAt(0).toUpperCase() + r.slice(1); }
/* Kartu hero vertikal: gambar di atas, nama di bawah, badge role di pojok. */
function heroCard(tag, h, cls, isAboveFold = false) {
  const c = el(tag, "hcard" + (cls ? " " + cls : ""));
  c.dataset.hero = String(h.id);
  const wrap = el("span", "himg");
  wrap.appendChild(avatar(h, 96, isAboveFold));
  const badge = el("span", "rolebadge");
  const lane = el("i", "lane");
  lane.style.setProperty("--m", "url(icons/role/" + h.roles[0] + ".png)");
  badge.appendChild(lane);
  wrap.appendChild(badge);
  c.appendChild(wrap);
  c.appendChild(el("span", "nm", h.en));
  return c;
}
function esc(s) { return s; } // teks selalu via textContent, bukan innerHTML

/* ---------- pencarian fuzzy (skor sama seperti aslinya) ---------- */
function norm(s) {
  return (s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
function damerau(a, b) {
  const n = [];
  for (let r = 0; r <= a.length; r++) {
    n[r] = [r];
    for (let c = 1; c <= b.length; c++) n[r][c] = r ? 0 : c;
  }
  for (let r = 1; r <= a.length; r++)
    for (let c = 1; c <= b.length; c++) {
      const cost = a[r - 1] === b[c - 1] ? 0 : 1;
      n[r][c] = Math.min(n[r - 1][c] + 1, n[r][c - 1] + 1, n[r - 1][c - 1] + cost);
      if (r > 1 && c > 1 && a[r - 1] === b[c - 2] && a[r - 2] === b[c - 1])
        n[r][c] = Math.min(n[r][c], n[r - 2][c - 2] + 1);
    }
  return n[a.length][b.length];
}
function isSubseq(q, s) {
  let i = 0;
  for (const ch of s) if (ch === q[i]) i++;
  return i === q.length;
}
function keyScore(q, key) {
  if (!q) return 0;
  if (q === key) return 100;
  if (key.startsWith(q)) return 80;
  if (key.includes(q)) return 60;
  const lim = q.length <= 5 ? 1 : 2;
  const d = Math.min(damerau(q, key), damerau(q, key.slice(0, q.length)));
  if (d <= lim) return 50 - d + (isSubseq(q, key) ? 0.5 : 0);
  if (q.length >= 2 && isSubseq(q, key)) return 40;
  return 0;
}
function withKeys(list) {
  return list.map(h => ({ ...h, keys: [h.en, h.cn, ...(h.aliases || [])].map(norm).filter(Boolean) }));
}
function searchHeroes(indexed, query) {
  const q = norm(query);
  if (!q) return [];
  return indexed
    .map(h => ({ h, s: Math.max(...h.keys.map(k => keyScore(q, k))) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.h.en.localeCompare(b.h.en))
    .map(x => x.h);
}

/* ---------- favorit (localStorage) ---------- */
const FAV_KEY = "hok-fav";
function getFavs() {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return Array.isArray(v) ? v.filter(Number.isInteger) : [];
  } catch { return []; }
}
function toggleFav(id) {
  const favs = getFavs();
  const has = favs.includes(id);
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(has ? favs.filter(x => x !== id) : [...favs, id]));
  } catch {}
  applyFavStars();
  scheduleSyncPush();
  return !has;
}
function applyFavStars() {
  const favs = new Set(getFavs());
  for (const n of $$("[data-hero]"))
    n.classList.toggle("fav", favs.has(Number(n.dataset.hero)));
}

/* ---------- dock & tab ---------- */
function tabEl(href, ic, label, active, extra) {
  const a = el("a", "tab" + (active ? " on" : ""));
  a.href = href;
  a.setAttribute("aria-label", label);
  if (active) a.setAttribute("aria-current", "page");
  a.appendChild(icon(ic));
  a.appendChild(document.createTextNode(label));
  if (extra) a.appendChild(extra);
  return a;
}
function renderDock(route, controls) {
  const dock = $("#dock-in");
  dock.replaceChildren();
  if (controls) dock.appendChild(controls);
  const nav = el("nav", "tabs");
  nav.setAttribute("aria-label", "Menu utama");
  nav.appendChild(tabEl("#/", "i-swords", "Counter", route === "home"));
  nav.appendChild(tabEl("#/favorit", "i-star", "Favorit", route === "favorit"));
  nav.appendChild(tabEl("#/draft", "i-draft", "Draft", route === "draft"));
  nav.appendChild(tabEl("#/quiz", "i-quiz", "Kuis", route === "quiz"));
  nav.appendChild(tabEl("#/items", "i-item", "Item", route === "items"));
  nav.appendChild(tabEl("#/tier", "i-gem", "Tier", route === "tier"));
  nav.appendChild(tabEl("#/tentang", "i-info", "Tentang", route === "tentang"));
  dock.appendChild(nav);
  const top = route === "home" ? "#/" : "#/" + route;
  for (const a of $$(".topnav a")) a.classList.toggle("on", a.getAttribute("href") === top);
}
function roleButtons(active, onPick) {
  const wrap = el("div", "roles");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Filter role");
  for (const r of ROLES) {
    const b = el("button", "role" + (r === active ? " on" : ""), ROLE_LABEL[r]);
    b.type = "button";
    b.dataset.role = r;
    b.setAttribute("aria-pressed", String(r === active));
    if (r === "all") b.prepend(icon("i-all"));
    else {
      const i = el("i", "lane");
      i.style.setProperty("--m", "url(icons/role/" + r + ".png)");
      b.prepend(i);
    }
    b.addEventListener("click", () => onPick(r, b));
    wrap.appendChild(b);
  }
  return wrap;
}
function counterFilterChips(activeRole, onSelect) {
  const wrap = el("div", "fchips compact");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Filter role counter");
  for (const r of ROLES) {
    const b = el("button", "fchip" + (r === activeRole ? " on" : ""), ROLE_LABEL[r]);
    b.type = "button";
    b.dataset.role = r;
    b.setAttribute("aria-pressed", String(r === activeRole));
    b.addEventListener("click", () => {
      $$(".fchip", wrap).forEach(btn => {
        const isMatch = btn.dataset.role === r;
        btn.classList.toggle("on", isMatch);
        btn.setAttribute("aria-pressed", String(isMatch));
      });
      onSelect(r);
    });
    wrap.appendChild(b);
  }
  return wrap;
}
function searchBox(id, placeholder) {
  const label = el("label", "srch");
  label.appendChild(icon("i-search"));
  const input = el("input");
  input.id = id; input.name = "q"; input.type = "search";
  input.placeholder = placeholder; input.autocomplete = "off";
  input.setAttribute("aria-label", "Cari hero");
  label.appendChild(input);
  return { label, input };
}
function heroButton(h) {
  const b = el("button", "hero");
  b.type = "button";
  b.dataset.id = String(h.id);
  b.dataset.hero = String(h.id);
  b.dataset.roles = h.roles.join(" ");
  b.appendChild(avatar(h, 40));
  b.appendChild(el("span", null, h.en));
  return b;
}

/* ---------- HOME ---------- */
function renderHome() {
  document.title = "Lawanku — counter hero Honor of Kings";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Lawan siapa?"));
  const sub = el("p", "mut");
  const n = el("span"); n.id = "n"; n.textContent = String(HEROES.length);
  sub.appendChild(n);
  sub.appendChild(document.createTextNode(" hero, A–Z."));
  main.appendChild(sub);
  const stats = el("div", "stats");
  const totalCtr = HEROES.reduce((n, h) => n + (h.naturalCounters || []).length, 0);
  const totalItems = HEROES.reduce((n, h) => n + (h.itemCounters || []).length, 0);
  for (const [v, l] of [[HEROES.length, "hero"], [totalCtr, "counter alami"], [totalItems, "rekomendasi item"]]) {
    const s = el("span", "stat");
    s.appendChild(el("b", null, String(v)));
    s.appendChild(document.createTextNode(" " + l));
    stats.appendChild(s);
  }
  main.appendChild(stats);
  const indexed = withKeys(HEROES);
  let role = "all";
  const tools = el("div", "ctl");
  const { label, input } = searchBox("q", "Cari hero musuh…");
  input.setAttribute("enterkeyhint", "go");
  tools.appendChild(label);
  const roles = roleButtons(role, (r) => {
    role = r;
    $$(".role", roles).forEach(b => {
      b.classList.toggle("on", b.dataset.role === r);
      b.setAttribute("aria-pressed", String(b.dataset.role === r));
    });
    applyFilter(); scrollTo(0, 0);
  });
  tools.appendChild(roles);
  main.appendChild(tools);
  // ---- Bedah Counter: panel spotlight hero yang dicari (data asli saja) ----
  const bedah = el("section", "bedah card");
  bedah.id = "bedah";
  bedah.hidden = true;
  main.appendChild(bedah);
  let bedahShown = 0;
  let bedahDismissed = "";
  function bedahRow(ch, c) {
    const a = el("a", "brow");
    a.href = "#/hero/" + slug(ch.en);
    a.appendChild(avatar(ch, 40));
    const tx = el("div", "brow-tx");
    tx.appendChild(el("b", null, ch.en));
    if (c.why) tx.appendChild(el("small", "why", c.why));
    a.appendChild(tx);
    a.appendChild(el("span", "badge " + c.strength, c.strength));
    return a;
  }
  function paintBedah() {
    const q = input.value.trim();
    if (q.length < 2) { bedah.hidden = true; bedahShown = 0; bedahDismissed = ""; return; }
    if (q === bedahDismissed) { bedah.hidden = true; bedahShown = 0; return; }
    const res = searchHeroes(indexed, q);
    if (!res.length) { bedah.hidden = true; bedahShown = 0; return; }
    const h = res[0];
    const score = Math.max(...h.keys.map(k => keyScore(norm(q), k)));
    if (score < 40) { bedah.hidden = true; bedahShown = 0; return; }
    if (bedahShown === h.id) return;
    bedahShown = h.id;
    bedah.replaceChildren();
    const x = el("button", "bedah-x");
    x.type = "button"; x.setAttribute("aria-label", "Tutup Bedah Counter");
    x.textContent = "×";
    x.addEventListener("click", () => { bedahDismissed = input.value.trim(); bedah.hidden = true; bedahShown = 0; });
    bedah.appendChild(x);
    const head = el("div", "bedah-head");
    head.appendChild(avatar(h, 96));
    const hi = el("div");
    hi.appendChild(el("div", "bedah-name", h.en));
    hi.appendChild(el("p", "mut", h.roles.map(roleName).join(" / ") + " · " + h.classes.join(", ")));
    const ctrs = h.naturalCounters || [];
    const hardN = ctrs.filter(c => c.strength === "hard").length;
    const stats = el("div", "bedah-stats");
    stats.appendChild(el("span", "chip", ctrs.length + " counter alami"));
    stats.appendChild(el("span", "chip", hardN + " hard · " + (ctrs.length - hardN) + " soft"));
    if ((h.itemCounters || []).length) stats.appendChild(el("span", "chip", h.itemCounters.length + " rekomendasi item"));
    hi.appendChild(stats);
    head.appendChild(hi);
    bedah.appendChild(head);
    if (h.howToPlayAgainst) bedah.appendChild(el("p", "mut why", "Cara melawan: " + h.howToPlayAgainst));
    const grid2 = el("div", "bedah-grid");
    const colA = el("div");
    colA.appendChild(el("h2", "lbl", "Counter alami"));
    let bedahRole = "all";
    const bedahCountEl = el("p", "mut");
    const bedahListEl = el("div", "clist");
    function paintBedahCounters() {
      bedahListEl.replaceChildren();
      if (!ctrs.length) {
        bedahCountEl.textContent = "0 counter alami";
        bedahListEl.appendChild(el("p", "mut", "Belum ada data counter alami."));
        return;
      }
      const filtered = ctrs.filter(c => {
        if (bedahRole === "all") return true;
        const ch = byId.get(c.hero);
        return ch && ch.roles.includes(bedahRole);
      }).sort((a, b) => (a.strength === "hard" ? 0 : 1) - (b.strength === "hard" ? 0 : 1)).slice(0, 5);

      if (bedahRole === "all") {
        bedahCountEl.textContent = filtered.length + " counter alami";
      } else {
        bedahCountEl.textContent = filtered.length + " counter · role " + ROLE_LABEL[bedahRole];
      }

      if (!filtered.length) {
        bedahListEl.appendChild(el("p", "mut", "Tidak ada counter alami untuk role " + ROLE_LABEL[bedahRole] + "."));
        return;
      }

      for (const c of filtered) {
        const ch = byId.get(c.hero);
        if (ch) bedahListEl.appendChild(bedahRow(ch, c));
      }
    }
    colA.appendChild(counterFilterChips(bedahRole, (r) => {
      bedahRole = r;
      paintBedahCounters();
    }));
    colA.appendChild(bedahCountEl);
    colA.appendChild(bedahListEl);
    paintBedahCounters();
    grid2.appendChild(colA);
    const colB = el("div");
    colB.appendChild(el("h2", "lbl", "Counter item"));
    if (!(h.itemCounters || []).length) colB.appendChild(el("p", "mut", "Belum ada data."));
    else for (const c of h.itemCounters) {
      const it = el("div", "bitem");
      const row = el("div", "row");
      row.appendChild(el("b", null, c.items));
      row.appendChild(el("span", "tag" + (c.needsReview ? "" : " ok"), c.needsReview ? "belum dikurasi" : "terkurasi"));
      it.appendChild(row);
      if (c.why) it.appendChild(el("p", "mut why", c.why));
      colB.appendChild(it);
    }
    colB.appendChild(el("h2", "lbl", "Jangan pick"));
    const rev = [];
    for (const xh of HEROES) {
      if (xh.id === h.id) continue;
      for (const c of (xh.naturalCounters || [])) {
        if (c.hero === h.id) { rev.push({ hero: xh, c }); break; }
      }
    }
    rev.sort((a, b) => (a.c.strength === "hard" ? 0 : 1) - (b.c.strength === "hard" ? 0 : 1));
    if (!rev.length) colB.appendChild(el("p", "mut", "Belum ada data."));
    else {
      for (const r of rev.slice(0, 5)) colB.appendChild(bedahRow(r.hero, r.c));
      if (rev.length > 5) colB.appendChild(el("p", "mut", "…dan " + (rev.length - 5) + " hero lagi."));
    }
    grid2.appendChild(colB);
    bedah.appendChild(grid2);
    const actions = el("div", "row");
    actions.style.marginTop = "var(--s2)";
    const more = el("a", "link", "Buka halaman hero →");
    more.href = "#/hero/" + slug(h.en);
    const h2hLink = el("a", "link", "Bandingkan hero ini ⇄");
    h2hLink.href = "#/h2h?a=" + slug(h.en);
    const shareHeroBtn = el("button", "link", "Bagikan kartu ⎘");
    shareHeroBtn.id = "sharebedahbtn";
    shareHeroBtn.type = "button";
    shareHeroBtn.addEventListener("click", () => showHeroShareCard(h));
    actions.appendChild(more);
    actions.appendChild(h2hLink);
    actions.appendChild(shareHeroBtn);
    bedah.appendChild(actions);
    bedah.hidden = false;
  }
  renderDock("home", null);
  const grid = el("ul", "grid"); grid.id = "grid";
  let hIdx = 0;
  for (const h of HEROES) {
    const li = el("li");
    li.dataset.id = String(h.id);
    li.dataset.roles = h.roles.join(" ");
    const isAboveFold = hIdx < 12;
    const a = heroCard("a", h, null, isAboveFold);
    a.href = "#/hero/" + slug(h.en);
    li.appendChild(a);
    grid.appendChild(li);
    hIdx++;
  }
  main.appendChild(grid);
  const empty = el("p", "mut", "Hero tidak ketemu.");
  empty.id = "empty"; empty.hidden = true;
  main.appendChild(empty);


  function applyFilter() {
    const q = input.value.trim();
    const order = q ? new Map(searchHeroes(indexed, q).map((h, i) => [h.id, i])) : null;
    let first = null, best = Infinity, count = 0;
    for (const li of $$("#grid li")) {
      const id = Number(li.dataset.id);
      const rank = order ? order.get(id) : 0;
      const show = (role === "all" || li.dataset.roles.split(" ").includes(role)) && (!order || order.has(id));
      li.hidden = !show;
      li.style.order = order ? String(rank) : "";
      if (show) {
        count++;
        if (order ? rank < best : !first) { first = li; best = rank; }
      }
    }
    empty.hidden = !!first;
    n.textContent = String(count);
    paintBedah();
    return first;
  }
  input.addEventListener("input", () => { applyFilter(); scrollTo(0, 0); });
  label.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const first = applyFilter();
      const a = first && first.querySelector("a");
      if (a) location.hash = a.getAttribute("href");
    }
  });
  applyFilter();
  applyFavStars();
}

/* ---------- HALAMAN HERO ---------- */
/* Harga + stat item (data terverifikasi S16 di data.json -> itemDetails). */
function itemPriceLine(itemsStr) {
  const det = ITEM_DETAILS[itemsStr];
  if (!det) return "";
  return det.map(d => d.price ? d.name + " " + d.price + "G" : d.name + " (" + (d.note || "spell") + ")").join(" · ");
}

function renderHero(slugName) {
  const h = bySlug.get(slugName);
  const main = $("#main");
  if (!h) {
    document.title = "Hero tidak ketemu — Lawanku";
    main.replaceChildren();
    main.appendChild(el("h1", null, "Hero tidak ketemu."));
    const p = el("p", "mut");
    const a = el("a", "link", "Balik ke daftar hero");
    a.href = "#/";
    p.appendChild(a);
    main.appendChild(p);
    renderDock("hero", null);
    return;
  }
  document.title = h.en + " — Lawanku";
  main.replaceChildren();
  const heroHead = el("div", "herohead");
  const head = el("div", "tgt");
  head.appendChild(avatar(h, 96));
  const tt = el("div");
  tt.appendChild(el("h1", null, h.en));
  tt.appendChild(el("p", "mut", h.roles.map(roleName).join(" / ") + " · " + h.classes.join(", ")));
  head.appendChild(tt);
  heroHead.appendChild(head);

  const favBtn = el("button", "favbtn");
  favBtn.id = "favbtn";
  favBtn.type = "button";
  favBtn.dataset.id = String(h.id);
  favBtn.appendChild(icon("i-star"));
  const favSpan = el("span");
  favBtn.appendChild(favSpan);
  const paintFav = () => {
    const on = getFavs().includes(h.id);
    favBtn.setAttribute("aria-pressed", String(on));
    favBtn.setAttribute("aria-label", on ? "Hapus " + h.en + " dari favorit" : "Tambah " + h.en + " ke favorit");
    favSpan.textContent = on ? "Di Favorit" : "Tambah ke Favorit";
  };
  paintFav();
  favBtn.addEventListener("click", () => { toggleFav(h.id); paintFav(); });
  const actRow = el("div", "heroact");
  actRow.appendChild(favBtn);
  const h2hBtn = el("a", "btn-sec");
  h2hBtn.href = "#/h2h?a=" + slug(h.en);
  h2hBtn.appendChild(icon("i-swords"));
  h2hBtn.appendChild(document.createTextNode("Bandingkan"));
  actRow.appendChild(h2hBtn);
  heroHead.appendChild(actRow);
  main.appendChild(heroHead);

  const cols = el("div", "hero2col");
  const colA = el("div");
  const colB = el("div");
  cols.appendChild(colA);
  cols.appendChild(colB);
  main.appendChild(cols);
  colA.appendChild(el("h2", null, "Counter alami"));
  const ctrs = h.naturalCounters || [];
  let currentRole = "all";
  const countEl = el("p", "mut");
  const listEl = el("div", "clist");
  function paintCounters() {
    listEl.replaceChildren();
    if (!ctrs.length) {
      countEl.textContent = "0 counter alami";
      listEl.appendChild(el("p", "mut", "Belum ada data"));
      return;
    }
    const filtered = ctrs.filter(c => {
      if (currentRole === "all") return true;
      const ch = byId.get(c.hero);
      return ch && ch.roles.includes(currentRole);
    }).sort((a, b) => (a.strength === "hard" ? 0 : 1) - (b.strength === "hard" ? 0 : 1)).slice(0, 5);

    if (currentRole === "all") {
      countEl.textContent = filtered.length + " counter alami";
    } else {
      countEl.textContent = filtered.length + " counter · role " + ROLE_LABEL[currentRole];
    }

    if (!filtered.length) {
      listEl.appendChild(el("p", "mut", "Tidak ada counter alami untuk role " + ROLE_LABEL[currentRole] + "."));
      return;
    }

    for (const c of filtered) {
      const ch = byId.get(c.hero);
      if (!ch) continue;
      const card = el("div", "card");
      const row = el("div", "row");
      row.appendChild(avatar(ch, 40));
      const a = el("a", "link", ch.en);
      a.href = "#/hero/" + slug(ch.en);
      row.appendChild(a);
      row.appendChild(el("span", "badge " + c.strength, c.strength));
      card.appendChild(row);
      if (c.why) card.appendChild(el("p", null, c.why));
      listEl.appendChild(card);
    }
  }
  colA.appendChild(counterFilterChips(currentRole, (r) => {
    currentRole = r;
    paintCounters();
  }));
  colA.appendChild(countEl);
  colA.appendChild(listEl);
  paintCounters();

  colB.appendChild(el("h2", null, "Counter item"));
  if (!h.itemCounters || !h.itemCounters.length) {
    colB.appendChild(el("p", "mut", "Belum ada data"));
  } else for (const c of h.itemCounters) {
    const card = el("div", "card");
    const row = el("div", "row");
    row.appendChild(el("b", null, c.items));
    if (c.needsReview) row.appendChild(el("span", "tag", "belum dikurasi"));
    else row.appendChild(el("span", "tag ok", "terkurasi"));
    card.appendChild(row);
    const pl = itemPriceLine(c.items);
    if (pl) card.appendChild(el("p", "mut iprice", pl));
    if (c.why) card.appendChild(el("p", "mut", c.why));
    colB.appendChild(card);
  }

  if (h.howToPlayAgainst) {
    colB.appendChild(el("h2", null, "Cara melawan"));
    colB.appendChild(el("p", null, h.howToPlayAgainst));
  }

  const usulBtn = el("button", "favbtn", "Usulkan / laporkan");
  usulBtn.id = "usulbtn";
  usulBtn.type = "button";
  colB.appendChild(usulBtn);

  const dlg = document.createElement("dialog");
  dlg.id = "usul";
  const form = el("form");
  form.id = "usulF";
  form.method = "dialog";
  form.appendChild(el("h2", null, "Usulan untuk " + h.en));
  const fs = document.createElement("fieldset");
  fs.className = "kind";
  fs.appendChild(el("legend", "mut", "Jenis"));
  for (const [v, label] of [["hero", "Counter hero"], ["item", "Counter item"], ["error", "Data salah"]]) {
    const lab = el("label");
    const radio = document.createElement("input");
    radio.type = "radio"; radio.name = "kind"; radio.value = v;
    if (v === "hero") radio.checked = true;
    lab.appendChild(radio);
    lab.appendChild(document.createTextNode(" " + label));
    fs.appendChild(lab);
  }
  form.appendChild(fs);
  const fHero = el("label", "f", "Hero counter");
  fHero.dataset.for = "hero";
  const sel = document.createElement("select");
  sel.name = "counter";
  sel.appendChild(el("option", null, "Pilih hero…")).value = "";
  for (const x of HEROES) {
    if (x.id === h.id) continue;
    const o = el("option", null, x.en);
    o.value = String(x.id);
    sel.appendChild(o);
  }
  fHero.appendChild(sel);
  form.appendChild(fHero);
  const fItem = el("label", "f", "Item");
  fItem.dataset.for = "item"; fItem.hidden = true;
  const itemInput = document.createElement("input");
  itemInput.type = "text"; itemInput.name = "items";
  itemInput.placeholder = "Contoh: Overlord's Might";
  fItem.appendChild(itemInput);
  form.appendChild(fItem);
  const fNote = el("label", "f", "Catatan");
  const note = document.createElement("textarea");
  note.name = "note"; note.rows = 3;
  fNote.appendChild(note);
  form.appendChild(fNote);
  const msg = el("p", "mut");
  msg.id = "usulMsg";
  form.appendChild(msg);
  const rowBtn = el("div", "row");
  const closeBtn = el("button", "x", "Tutup");
  closeBtn.id = "usulX"; closeBtn.type = "button";
  const sendBtn = el("button", "send", "Kirim");
  sendBtn.type = "submit";
  rowBtn.appendChild(closeBtn);
  rowBtn.appendChild(sendBtn);
  form.appendChild(rowBtn);
  dlg.appendChild(form);
  main.appendChild(dlg);

  const syncKind = () => {
    const kind = form.elements.namedItem("kind").value;
    $$("[data-for]", form).forEach(n => { n.hidden = n.dataset.for !== kind; });
  };
  form.addEventListener("change", syncKind);
  usulBtn.addEventListener("click", () => { msg.textContent = ""; dlg.showModal(); });
  closeBtn.addEventListener("click", () => dlg.close());
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const kind = form.elements.namedItem("kind").value;
    const counterId = kind === "hero" ? Number(sel.value) || null : null;
    const counterHero = counterId && byId.has(counterId) ? byId.get(counterId).en : null;
    const itemsVal = kind === "item" ? itemInput.value.trim() : null;
    const noteVal = note.value.trim();

    const data = {
      kind, target: h.id,
      counter: counterId,
      items: itemsVal,
      note: noteVal, at: new Date().toISOString(),
    };
    try {
      const all = JSON.parse(localStorage.getItem("hok-usulan") || "[]");
      all.push(data);
      localStorage.setItem("hok-usulan", JSON.stringify(all));
    } catch {}

    sendBtn.disabled = true;
    msg.textContent = "Mengirim usulan…";

    let messageBody = "[Hero: " + h.en + " (ID " + h.id + ")] Jenis: " + kind;
    if (counterHero) messageBody += " | Counter: " + counterHero + " (ID " + counterId + ")";
    if (itemsVal) messageBody += " | Item: " + itemsVal;
    if (noteVal) messageBody += " | Catatan: " + noteVal;

    const res = await sendSuggestion({ message: messageBody });
    sendBtn.disabled = false;
    form.reset(); syncKind();
    if (res && res.error) {
      msg.textContent = res.error;
    } else if (res && res.queued) {
      msg.textContent = "Usulan disimpan di antrean perangkat dan dikirim otomatis saat online. Makasih!";
    } else {
      msg.textContent = "Usulan berhasil dikirim ke server Lawanku. Makasih!";
    }
  });
  syncKind();
  renderDock("hero", null);
  applyFavStars();
}

/* ---------- DRAFT ---------- */
const DRAFT_KEY = "hok-draft";
const ROLE_KEY = "hok-role";
const RECENT_KEY = "hok-recent";
function getRecentHeroes() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter(Number.isInteger) : [];
  } catch { return []; }
}
function pushRecentHero(id) {
  try {
    const r = [id, ...getRecentHeroes().filter(x => x !== id)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
  } catch {}
}
let draftKeyHandler = null;
let draft = null;
function loadDraft() {
  const fresh = { ally: [null, null, null, null, null], enemy: [null, null, null, null, null], ban: [null, null, null, null, null, null] };
  const history = [];
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (saved) {
      const seen = new Set();
      for (const team of ["ally", "enemy", "ban"])
        fresh[team].forEach((_, i) => {
          const id = saved[team] && saved[team][i];
          if (byId.has(id) && !seen.has(id)) { fresh[team][i] = id; seen.add(id); }
        });
      if (Array.isArray(saved.history))
        for (const e of saved.history)
          if (Array.isArray(e) && ["ally", "enemy", "ban"].includes(e[0]) && Number.isInteger(e[1]) && fresh[e[0]][e[1]] != null)
            history.push(e);
    }
  } catch {}
  return { ...fresh, history };
}
function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
}
function draftSuggestions(role, n) {
  const used = new Set([...draft.ban, ...draft.ally, ...draft.enemy].filter(Boolean));
  const score = new Map(), why = new Map();
  for (const id of draft.enemy.filter(Boolean)) {
    const enemy = byId.get(id);
    if (!enemy) continue;
    for (const c of enemy.naturalCounters || []) {
      if (used.has(c.hero)) continue;
      if (role && role !== "all") {
        const ch = byId.get(c.hero);
        if (!ch || !ch.roles.includes(role)) continue;
      }
      const pts = c.strength === "hard" ? 2 : 1;
      score.set(c.hero, (score.get(c.hero) || 0) + pts);
      if (!why.has(c.hero) || pts > (why.get(c.hero)[0] || 0))
        why.set(c.hero, [pts, (c.strength === "hard" ? "Hard" : "Soft") + " counter " + enemy.en]);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || byId.get(a[0]).en.localeCompare(byId.get(b[0]).en))
    .slice(0, n || 5)
    .map(([id, s]) => ({ id, s, why: why.get(id)[1] }));
}
function itemSuggestions() {
  // Paket item yang melawan hero musuh terbanyak (diurutkan jumlah hero).
  const score = new Map(), vs = new Map(), curated = new Map();
  for (const id of draft.enemy.filter(Boolean)) {
    const enemy = byId.get(id);
    if (!enemy) continue;
    for (const c of enemy.itemCounters || []) {
      const k = c.items;
      score.set(k, (score.get(k) || 0) + 1);
      if (!vs.has(k)) { vs.set(k, []); curated.set(k, true); }
      if (!vs.get(k).includes(enemy.en)) vs.get(k).push(enemy.en);
      if (c.needsReview) curated.set(k, false);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([items, n]) => ({ items, n, vs: vs.get(items), allCurated: curated.get(items) }));
}
function banSuggestions() {
  // Ancaman buat tim kamu: hero yang counter pick tim kamu (hard +2, soft +1).
  const used = new Set([...draft.ban, ...draft.ally, ...draft.enemy].filter(Boolean));
  const score = new Map(), why = new Map();
  for (const id of draft.ally.filter(Boolean)) {
    const ally = byId.get(id);
    if (!ally) continue;
    for (const c of ally.naturalCounters || []) {
      if (used.has(c.hero)) continue;
      const pts = c.strength === "hard" ? 2 : 1;
      score.set(c.hero, (score.get(c.hero) || 0) + pts);
      if (!why.has(c.hero) || pts > (why.get(c.hero)[0] || 0))
        why.set(c.hero, [pts, (c.strength === "hard" ? "Hard" : "Soft") + " counter " + ally.en]);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || byId.get(a[0]).en.localeCompare(byId.get(b[0]).en))
    .slice(0, 5)
    .map(([id, s]) => ({ id, s, why: why.get(id)[1] }));
}
const COMP_ROLES = [["farm", "Farm"], ["mid", "Mid"], ["jungle", "Jungle"], ["roam", "Roam"], ["clash", "Clash"]];
function teamComposition() {
  const picks = draft.ally.filter(Boolean).map(id => byId.get(id)).filter(Boolean);
  return COMP_ROLES.map(([role, label]) => ({
    role, label,
    n: picks.filter(h => h.roles.includes(role)).length,
  }));
}

/* ---------- draft tersimpan & link berbagi ---------- */
const SAVED_KEY = "hok-drafts";
function loadSavedDrafts() {
  try { const v = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
function storeSavedDrafts(list) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
  scheduleSyncPush();
}
function draftToParam(d) {
  const p = new URLSearchParams();
  for (const [k, team] of [["a", "ally"], ["e", "enemy"], ["b", "ban"]]) {
    const ids = d[team].filter(Boolean);
    if (ids.length) p.set(k, ids.join(","));
  }
  return p.toString();
}
function draftFromParam(qs) {
  const p = new URLSearchParams(qs);
  const fresh = { ally: [null, null, null, null, null], enemy: [null, null, null, null, null], ban: [null, null, null, null, null, null] };
  const seen = new Set();
  let any = false;
  for (const [k, team] of [["a", "ally"], ["e", "enemy"], ["b", "ban"]]) {
    const raw = p.get(k);
    if (!raw) continue;
    raw.split(",").map(Number).filter(Number.isInteger).forEach((id, i) => {
      if (i < fresh[team].length && byId.has(id) && !seen.has(id)) { fresh[team][i] = id; seen.add(id); any = true; }
    });
  }
  return any ? fresh : null;
}

/* ---------- SINKRONISASI CLOUD (Cloudflare Workers + D1) ---------- */
const API_BASE = "https://lawanku-api.akmaludienramadhan1.workers.dev";
const KEY_DEVICE_ID = "hok-device-id";
const KEY_SYNC_ACCOUNT = "hok-sync-account";
const KEY_SYNC_UPDATED = "hok-sync-updated";
const KEY_USULAN_QUEUE = "hok-usulan-queue";

function getDeviceId() {
  let id = "";
  try { id = localStorage.getItem(KEY_DEVICE_ID) || ""; } catch {}
  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { localStorage.setItem(KEY_DEVICE_ID, id); } catch {}
  }
  return id;
}

function getSyncAccount() {
  try { return localStorage.getItem(KEY_SYNC_ACCOUNT) || null; } catch { return null; }
}

function setSyncAccount(accId) {
  try {
    if (accId) localStorage.setItem(KEY_SYNC_ACCOUNT, String(accId));
    else localStorage.removeItem(KEY_SYNC_ACCOUNT);
  } catch {}
}

function getLastSyncUpdated() {
  try { return Number(localStorage.getItem(KEY_SYNC_UPDATED) || 0); } catch { return 0; }
}

function setLastSyncUpdated(ts) {
  try { localStorage.setItem(KEY_SYNC_UPDATED, String(Number(ts) || 0)); } catch {}
}

function getSyncPayload() {
  return {
    favs: getFavs(),
    drafts: loadSavedDrafts(),
  };
}

function applyRemotePayload(payload, updatedAt) {
  if (!payload || typeof payload !== "object") return false;
  let changed = false;
  try {
    if (Array.isArray(payload.favs)) {
      const cur = JSON.stringify(getFavs());
      const next = JSON.stringify(payload.favs.filter(Number.isInteger));
      if (cur !== next) {
        localStorage.setItem(FAV_KEY, next);
        changed = true;
      }
    }
    if (Array.isArray(payload.drafts)) {
      const cur = JSON.stringify(loadSavedDrafts());
      const next = JSON.stringify(payload.drafts.slice(0, 12));
      if (cur !== next) {
        localStorage.setItem(SAVED_KEY, next);
        changed = true;
      }
    }
    if (updatedAt) setLastSyncUpdated(updatedAt);
  } catch {}
  if (changed) {
    applyFavStars();
    const hash = location.hash.replace(/^#/, "") || "/";
    if (hash === "/favorit" || hash === "/draft") {
      route();
    }
  }
  return changed;
}

let syncPushTimer = null;
function scheduleSyncPush(delay = 2000) {
  if (!getSyncAccount() || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  clearTimeout(syncPushTimer);
  syncPushTimer = setTimeout(() => {
    syncPush().catch(() => {});
  }, delay);
}

async function syncPush() {
  const accountId = getSyncAccount();
  if (!accountId || (typeof navigator !== "undefined" && !navigator.onLine)) return null;
  const payload = getSyncPayload();
  try {
    const res = await fetch(API_BASE + "/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, payload }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.updatedAt) {
      setLastSyncUpdated(data.updatedAt);
      return data.updatedAt;
    }
  } catch {}
  return null;
}

async function syncPull() {
  const accountId = getSyncAccount();
  if (!accountId || (typeof navigator !== "undefined" && !navigator.onLine)) return null;
  try {
    const res = await fetch(API_BASE + "/api/sync?account=" + encodeURIComponent(accountId));
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    const remoteUpdated = Number(data.updatedAt) || 0;
    const localUpdated = getLastSyncUpdated();

    if (data.payload === null) {
      const favs = getFavs();
      const drafts = loadSavedDrafts();
      if (favs.length || drafts.length) {
        await syncPush();
      }
      return { status: "pushed_initial" };
    }

    if (remoteUpdated > localUpdated) {
      applyRemotePayload(data.payload, remoteUpdated);
      return { status: "pulled", updatedAt: remoteUpdated };
    } else if (localUpdated > remoteUpdated) {
      await syncPush();
      return { status: "pushed_newer" };
    }
    return { status: "in_sync", updatedAt: remoteUpdated };
  } catch {
    return null;
  }
}

let pollingInterval = null;
function startSyncPolling() {
  if (pollingInterval) return;
  pollingInterval = setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (getSyncAccount()) {
      syncPull().catch(() => {});
    }
  }, 60000);

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && getSyncAccount() && (typeof navigator === "undefined" || navigator.onLine)) {
        syncPull().catch(() => {});
      }
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      if (getSyncAccount()) syncPull().catch(() => {});
      flushUsulanQueue().catch(() => {});
    });
  }
}

/* ---------- USULAN (POST /api/suggest + Antrean Offline) ---------- */
function getUsulanQueue() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY_USULAN_QUEUE) || "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function enqueueUsulan(item) {
  try {
    const q = getUsulanQueue();
    q.push(item);
    localStorage.setItem(KEY_USULAN_QUEUE, JSON.stringify(q));
  } catch {}
}
async function flushUsulanQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const q = getUsulanQueue();
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    try {
      const res = await fetch(API_BASE + "/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok && res.status !== 429) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  try {
    localStorage.setItem(KEY_USULAN_QUEUE, JSON.stringify(remaining));
  } catch {}
}

async function sendSuggestion(data) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueUsulan(data);
    return { ok: true, queued: true };
  }
  try {
    const res = await fetch(API_BASE + "/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 429) {
      return { ok: false, error: "Batas pengiriman tercapai (maks 10 usulan/jam). Coba lagi nanti." };
    }
    if (!res.ok) {
      enqueueUsulan(data);
      return { ok: true, queued: true };
    }
    const json = await res.json().catch(() => ({ ok: true }));
    return { ok: !!(json && json.ok) };
  } catch {
    enqueueUsulan(data);
    return { ok: true, queued: true };
  }
}

/* ---------- MODAL SINKRONISASI PERANGKAT ---------- */
function openSyncModal() {
  let dlg = $("#sync-dlg");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "sync-dlg";
    document.body.appendChild(dlg);
  }

  let countdownTimer = null;
  function cleanup() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  dlg.onclose = cleanup;

  function renderModalContent() {
    cleanup();
    dlg.replaceChildren();

    const head = el("div", "dlg-head");
    head.appendChild(el("h2", null, "Sinkronisasi Perangkat"));
    const closeBtn = el("button", "x", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Tutup dialog sinkronisasi");
    closeBtn.onclick = () => dlg.close();
    head.appendChild(closeBtn);
    dlg.appendChild(head);

    const accountId = getSyncAccount();

    if (!accountId) {
      // STATE 1: BELUM TERHUBUNG
      const desc = el("p", "mut", "Sinkronkan daftar Favorit dan simpanan Draft antar perangkat kamu secara otomatis (Cloudflare Workers + D1). Tanpa akun password.");
      dlg.appendChild(desc);

      const secGen = el("div", "card");
      secGen.appendChild(el("b", null, "1. Minta Kode Pairing"));
      secGen.appendChild(el("p", "mut why", "Buat kode 6 digit untuk menghubungkan perangkat ini dengan perangkat baru."));

      const genArea = el("div");
      const genBtn = el("button", "btn-acc", "Minta Kode Pairing");
      genBtn.type = "button";
      genArea.appendChild(genBtn);
      secGen.appendChild(genArea);
      dlg.appendChild(secGen);

      genBtn.onclick = async () => {
        genBtn.disabled = true;
        genBtn.textContent = "Menghubungkan ke server…";
        try {
          const res = await fetch(API_BASE + "/api/pair", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: getDeviceId() }),
          });
          const data = await res.json();
          if (!res.ok || !data.code || !data.accountId) {
            throw new Error((data && data.error) || "Gagal meminta kode");
          }
          setSyncAccount(data.accountId);
          await syncPush();
          showCodeDisplay(genArea, data.code, data.expiresIn || 600);
        } catch (err) {
          genBtn.disabled = false;
          genBtn.textContent = "Minta Kode Pairing";
          alert("Gagal: " + (err.message || "Koneksi bermasalah"));
        }
      };

      const secClaim = el("div", "card");
      secClaim.appendChild(el("b", null, "2. Atau Punya Kode dari Perangkat Lain?"));
      secClaim.appendChild(el("p", "mut why", "Masukkan kode 6 digit yang tampil di perangkat kamu yang lain:"));

      const claimForm = el("form", "sync-input-row");
      const inp = document.createElement("input");
      inp.type = "text";
      inp.maxLength = 6;
      inp.placeholder = "KODE6X";
      inp.setAttribute("aria-label", "Kode pairing 6 digit");
      inp.autocomplete = "off";

      const subBtn = el("button", "btn-acc", "Hubungkan");
      subBtn.type = "submit";
      claimForm.appendChild(inp);
      claimForm.appendChild(subBtn);
      secClaim.appendChild(claimForm);

      const claimMsg = el("p", "mut");
      claimMsg.style.marginTop = "8px";
      secClaim.appendChild(claimMsg);

      claimForm.onsubmit = async (e) => {
        e.preventDefault();
        const code = inp.value.trim().toUpperCase();
        if (!code || code.length !== 6) {
          claimMsg.textContent = "Masukkan 6 karakter kode pairing.";
          claimMsg.style.color = "var(--hard)";
          return;
        }
        subBtn.disabled = true;
        subBtn.textContent = "Mengecek…";
        claimMsg.textContent = "";

        try {
          const res = await fetch(API_BASE + "/api/pair/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, deviceId: getDeviceId() }),
          });
          const data = await res.json();
          if (!res.ok || !data.accountId) {
            throw new Error((data && data.error) || (res.status === 410 ? "Kode sudah kedaluwarsa" : "Kode tidak valid"));
          }
          setSyncAccount(data.accountId);
          claimMsg.style.color = "var(--soft)";
          claimMsg.textContent = "Berhasil terhubung! Menyinkronkan data…";
          await syncPull();
          setTimeout(() => {
            renderModalContent();
          }, 800);
        } catch (err) {
          subBtn.disabled = false;
          subBtn.textContent = "Hubungkan";
          claimMsg.style.color = "var(--hard)";
          claimMsg.textContent = "Gagal: " + (err.message || "Periksa kembali kode.");
        }
      };

      dlg.appendChild(secClaim);

    } else {
      // STATE 2: SUDAH TERHUBUNG (PERINGATAN: JANGAN PERNAH TAMPILKAN accountId DI LAYAR)
      const card = el("div", "sync-status-card");
      const badgeRow = el("div", "row");
      const badge = el("span", "sync-badge", "● Terhubung ke Cloud");
      badgeRow.appendChild(badge);
      card.appendChild(badgeRow);

      const ts = getLastSyncUpdated();
      const timeStr = ts ? new Date(ts).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Belum pernah";
      const infoP = el("p", "mut", "Perangkat ini aktif tersinkronisasi. Favorit & Draft tersimpan aman di Cloudflare D1.");
      const syncInfo = el("small", "mut", "Terakhir sinkron: " + timeStr);
      card.appendChild(infoP);
      card.appendChild(syncInfo);
      dlg.appendChild(card);

      const actRow = el("div", "row");
      actRow.style.flexWrap = "wrap";
      actRow.style.gap = "8px";
      actRow.style.marginTop = "12px";

      const manualBtn = el("button", "btn-acc", "Sinkronkan Sekarang");
      manualBtn.type = "button";
      manualBtn.onclick = async () => {
        manualBtn.disabled = true;
        manualBtn.textContent = "Menyinkronkan…";
        await syncPull();
        manualBtn.disabled = false;
        manualBtn.textContent = "Tersinkron!";
        setTimeout(() => renderModalContent(), 600);
      };
      actRow.appendChild(manualBtn);

      const addDevBtn = el("button", "btn-sec", "Tambah Perangkat Baru");
      addDevBtn.type = "button";
      actRow.appendChild(addDevBtn);

      dlg.appendChild(actRow);

      const addArea = el("div");
      addArea.style.marginTop = "12px";
      dlg.appendChild(addArea);

      addDevBtn.onclick = async () => {
        addDevBtn.disabled = true;
        addDevBtn.textContent = "Membuat kode…";
        try {
          const res = await fetch(API_BASE + "/api/pair", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: getDeviceId(), accountId: getSyncAccount() }),
          });
          const data = await res.json();
          if (!res.ok || !data.code) throw new Error(data.error || "Gagal membuat kode");
          showCodeDisplay(addArea, data.code, data.expiresIn || 600);
          addDevBtn.hidden = true;
        } catch (err) {
          addDevBtn.disabled = false;
          addDevBtn.textContent = "Tambah Perangkat Baru";
          alert("Gagal: " + err.message);
        }
      };

      const discSec = el("div");
      discSec.style.marginTop = "24px";
      discSec.style.borderTop = "1px solid var(--line)";
      discSec.style.paddingTop = "12px";
      const discBtn = el("button", "mini", "Putus Sambungan Perangkat Ini");
      discBtn.type = "button";
      discBtn.style.color = "var(--hard)";
      discBtn.onclick = () => {
        if (confirm("Putus sambungan perangkat ini dari sinkronisasi cloud? Data lokal di perangkat ini tidak akan dihapus.")) {
          setSyncAccount(null);
          setLastSyncUpdated(0);
          renderModalContent();
        }
      };
      discSec.appendChild(discBtn);
      dlg.appendChild(discSec);
    }
  }

  function showCodeDisplay(container, code, expiresInSec) {
    container.replaceChildren();
    const box = el("div", "sync-code-box");
    box.appendChild(el("b", null, "KODE PAIRING PERANGKAT:"));
    const val = el("div", "sync-code-val", code);
    box.appendChild(val);

    let secLeft = expiresInSec;
    const timerTxt = el("small", "mut", "Berlaku " + Math.floor(secLeft / 60) + ":" + String(secLeft % 60).padStart(2, "0"));
    box.appendChild(timerTxt);

    countdownTimer = setInterval(() => {
      secLeft--;
      if (secLeft <= 0) {
        clearInterval(countdownTimer);
        timerTxt.textContent = "Kode sudah kedaluwarsa. Silakan minta kode baru.";
        timerTxt.style.color = "var(--hard)";
      } else {
        timerTxt.textContent = "Berlaku " + Math.floor(secLeft / 60) + ":" + String(secLeft % 60).padStart(2, "0");
      }
    }, 1000);

    const btnSalin = el("button", "btn-sec", "Salin Kode");
    btnSalin.type = "button";
    btnSalin.style.marginTop = "8px";
    btnSalin.onclick = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          btnSalin.textContent = "Tersalin!";
          setTimeout(() => { btnSalin.textContent = "Salin Kode"; }, 2000);
        }).catch(() => {
          prompt("Salin kode pairing:", code);
        });
      } else {
        prompt("Salin kode pairing:", code);
      }
    };
    box.appendChild(btnSalin);
    const hint = el("p", "mut why", "Buka Lawanku di perangkat lain → buka Sinkronisasi → masukkan kode ini di kolom 'Punya Kode dari Perangkat Lain'.");
    hint.style.fontSize = "13px";
    hint.style.marginTop = "8px";
    box.appendChild(hint);
    container.appendChild(box);
  }

  renderModalContent();
  dlg.showModal();
}

/* ---------- SHARE CARD (CANVAS GENERATOR) ---------- */
function loadAvatarImg(id) {
  return new Promise(resolve => {
    if (!id) return resolve(null);
    const img = new Image();
    img.onload = () => resolve({ id, img });
    img.onerror = () => resolve(null);
    img.src = "icons/hero/" + id + ".webp";
  });
}

function drawRoundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawAvatarOnCanvas(ctx, img, x, y, size, r = 8) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, size, size, r);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.clip();
  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 6) {
  if (!text) return;
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let linesCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
      linesCount++;
      if (linesCount >= maxLines - 1 && n < words.length - 1) {
        ctx.fillText(line.trim() + "…", x, currentY);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function drawDraftCard(canvas, draftState, imgMap) {
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");

  // 1. Background
  const grad = ctx.createLinearGradient(0, 0, 0, 675);
  grad.addColorStop(0, "#090d16");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 675);

  // Top accent bar
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(0, 0, 1200, 4);

  // Outer subtle border
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 1200, 675);

  // 2. Header
  ctx.fillStyle = "#f59e0b";
  ctx.font = "800 26px 'Outfit', 'Inter', sans-serif";
  ctx.fillText("⚔ LAWANKU", 40, 50);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.fillText("HONOR OF KINGS DRAFT ADVISOR", 195, 47);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 14px 'Inter', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("lawanku.vercel.app", 1160, 48);
  ctx.textAlign = "left";

  ctx.strokeStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(40, 68);
  ctx.lineTo(1160, 68);
  ctx.stroke();

  // 3. Left Panel (Tim Kita)
  drawRoundRect(ctx, 40, 84, 545, 336, 12, "#0b1220", "#1e293b");
  ctx.fillStyle = "#38bdf8";
  ctx.font = "800 15px 'Outfit', sans-serif";
  ctx.fillText("TIM KITA", 58, 112);

  for (let i = 0; i < 5; i++) {
    const sy = 128 + i * 55;
    const id = draftState.ally[i];
    const hero = id ? byId.get(id) : null;
    drawRoundRect(ctx, 58, sy, 509, 48, 8, "#131b2e", "#1e293b");
    if (hero) {
      drawAvatarOnCanvas(ctx, imgMap.get(hero.id), 64, sy + 6, 36, 6);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 14px 'Inter', sans-serif";
      ctx.fillText(hero.en, 110, sy + 23);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.fillText(hero.roles.map(roleName).join(" / ") + " · " + hero.classes.join(", "), 110, sy + 40);
    } else {
      ctx.fillStyle = "#475569";
      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.fillText("+ Slot Kosong", 72, sy + 30);
    }
  }

  // 4. Right Panel (Tim Musuh)
  drawRoundRect(ctx, 615, 84, 545, 336, 12, "#180f19", "#341724");
  ctx.fillStyle = "#ef4444";
  ctx.font = "800 15px 'Outfit', sans-serif";
  ctx.fillText("TIM MUSUH", 633, 112);

  for (let i = 0; i < 5; i++) {
    const sy = 128 + i * 55;
    const id = draftState.enemy[i];
    const hero = id ? byId.get(id) : null;
    drawRoundRect(ctx, 633, sy, 509, 48, 8, "#22131e", "#381927");
    if (hero) {
      drawAvatarOnCanvas(ctx, imgMap.get(hero.id), 639, sy + 6, 36, 6);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 14px 'Inter', sans-serif";
      ctx.fillText(hero.en, 685, sy + 23);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.fillText(hero.roles.map(roleName).join(" / ") + " · " + hero.classes.join(", "), 685, sy + 40);
    } else {
      ctx.fillStyle = "#475569";
      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.fillText("+ Slot Kosong", 647, sy + 30);
    }
  }

  // 5. Bottom Panel (Saran Counter & Item)
  drawRoundRect(ctx, 40, 434, 1120, 196, 12, "#0d1424", "#1e293b");

  // Vertical divider between left and right bottom sections
  ctx.strokeStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(600, 448);
  ctx.lineTo(600, 616);
  ctx.stroke();

  // Bottom Left: Saran Pick Counter
  ctx.fillStyle = "#f59e0b";
  ctx.font = "800 14px 'Outfit', sans-serif";
  ctx.fillText("⚔ TOP COUNTER LAWAN MUSUH", 58, 460);

  const topCounters = draftSuggestions(null, 3);
  if (!topCounters.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillText("Pilih hero musuh di atas untuk melihat saran counter.", 58, 500);
  } else {
    for (let i = 0; i < topCounters.length; i++) {
      const s = topCounters[i];
      const h = byId.get(s.id);
      const cy = 478 + i * 46;
      drawAvatarOnCanvas(ctx, imgMap.get(s.id), 58, cy, 34, 6);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 13px 'Inter', sans-serif";
      ctx.fillText(h.en, 102, cy + 15);
      // Badge score
      ctx.fillStyle = "#10b981";
      ctx.font = "700 12px 'Inter', sans-serif";
      ctx.fillText("+" + s.s, 102 + ctx.measureText(h.en).width + 8, cy + 15);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px 'Inter', sans-serif";
      const whyText = s.why ? (s.why.length > 55 ? s.why.slice(0, 52) + "…" : s.why) : "";
      ctx.fillText(whyText, 102, cy + 30);
    }
  }

  // Bottom Right: Saran Item Counter
  ctx.fillStyle = "#38bdf8";
  ctx.font = "800 14px 'Outfit', sans-serif";
  ctx.fillText("🛡 SARAN ITEM ANTI-MUSUH", 620, 460);

  const topItems = itemSuggestions();
  if (!topItems.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillText("Pilih hero musuh di atas untuk melihat rekomendasi item counter.", 620, 500);
  } else {
    for (let i = 0; i < topItems.length; i++) {
      const it = topItems[i];
      const iy = 478 + i * 46;
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 13px 'Inter', sans-serif";
      ctx.fillText(it.items, 620, iy + 15);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.fillText("lawan " + it.n + " hero", 620 + ctx.measureText(it.items).width + 8, iy + 15);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px 'Inter', sans-serif";
      const vsText = "Lawan: " + (it.vs || []).join(", ");
      ctx.fillText(vsText.length > 58 ? vsText.slice(0, 55) + "…" : vsText, 620, iy + 30);
    }
  }

  // 6. Footer
  ctx.fillStyle = "#64748b";
  ctx.font = "500 11px 'Inter', sans-serif";
  ctx.fillText("Dibuat otomatis di lawanku.vercel.app · Draft pick, counter hero, item & meta Honor of Kings", 40, 652);
}

function drawHeroCounterCard(canvas, hero, imgMap) {
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, 675);
  grad.addColorStop(0, "#090d16");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 675);

  // Top accent bar
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(0, 0, 1200, 4);

  // Outer border
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 1200, 675);

  // Header
  ctx.fillStyle = "#f59e0b";
  ctx.font = "800 26px 'Outfit', 'Inter', sans-serif";
  ctx.fillText("⚔ LAWANKU", 40, 50);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.fillText("BEDAH COUNTER HERO · " + hero.en.toUpperCase(), 195, 47);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 14px 'Inter', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("lawanku.vercel.app", 1160, 48);
  ctx.textAlign = "left";

  ctx.strokeStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(40, 68);
  ctx.lineTo(1160, 68);
  ctx.stroke();

  // Left Column: Hero Profile & Cara Melawan (x: 40, y: 84, w: 460, h: 546)
  drawRoundRect(ctx, 40, 84, 460, 546, 12, "#0b1220", "#1e293b");

  // Hero Avatar & Names
  drawAvatarOnCanvas(ctx, imgMap.get(hero.id), 60, 104, 76, 10);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "800 24px 'Outfit', sans-serif";
  ctx.fillText(hero.en, 150, 136);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.fillText(hero.roles.map(roleName).join(" / ") + " · " + hero.classes.join(", "), 150, 160);

  // Cara Melawan Section
  drawRoundRect(ctx, 58, 200, 424, 410, 8, "#131b2e", "#1e293b");
  ctx.fillStyle = "#f59e0b";
  ctx.font = "800 14px 'Outfit', sans-serif";
  ctx.fillText("CARA MELAWAN", 74, 230);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 14px 'Inter', sans-serif";
  drawWrappedText(ctx, hero.howToPlayAgainst, 74, 260, 392, 22, 14);

  // Right Column: Natural Counters & Items (x: 520, y: 84, w: 640, h: 546)
  drawRoundRect(ctx, 520, 84, 640, 546, 12, "#0d1424", "#1e293b");

  // Natural Counters Section
  ctx.fillStyle = "#10b981";
  ctx.font = "800 15px 'Outfit', sans-serif";
  ctx.fillText("COUNTER ALAMI", 544, 112);

  const counters = (hero.naturalCounters || []).slice(0, 4);
  if (!counters.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillText("Tidak ada data counter alami.", 544, 140);
  } else {
    for (let i = 0; i < counters.length; i++) {
      const c = counters[i];
      const ch = byId.get(c.hero);
      const cy = 130 + i * 62;
      drawRoundRect(ctx, 544, cy, 592, 54, 8, "#141c2f", "#1e293b");
      if (ch) drawAvatarOnCanvas(ctx, imgMap.get(ch.id), 552, cy + 7, 40, 6);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 14px 'Inter', sans-serif";
      ctx.fillText(ch ? ch.en : "Hero #" + c.hero, 604, cy + 24);

      // Hard / Soft badge
      const isHard = c.strength === "hard";
      ctx.fillStyle = isHard ? "#ef4444" : "#10b981";
      ctx.font = "700 12px 'Inter', sans-serif";
      ctx.fillText(isHard ? "Hard Counter" : "Soft Counter", 604 + ctx.measureText(ch ? ch.en : "").width + 10, cy + 24);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px 'Inter', sans-serif";
      const whyText = c.why ? (c.why.length > 70 ? c.why.slice(0, 67) + "…" : c.why) : "";
      ctx.fillText(whyText, 604, cy + 42);
    }
  }

  // Item Counters Section (y: 395)
  ctx.fillStyle = "#38bdf8";
  ctx.font = "800 15px 'Outfit', sans-serif";
  ctx.fillText("COUNTER ITEM", 544, 400);

  const items = (hero.itemCounters || []).slice(0, 2);
  if (!items.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillText("Hero ini tidak membutuhkan paket item khusus.", 544, 430);
  } else {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const iy = 416 + i * 94;
      drawRoundRect(ctx, 544, iy, 592, 84, 8, "#141c2f", "#1e293b");
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "700 14px 'Inter', sans-serif";
      ctx.fillText(it.items, 558, iy + 26);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "600 12px 'Inter', sans-serif";
      ctx.fillText(it.tag || "anti-burst", 558 + ctx.measureText(it.items).width + 10, iy + 26);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 12px 'Inter', sans-serif";
      drawWrappedText(ctx, it.why, 558, iy + 48, 564, 18, 2);
    }
  }

  // Footer
  ctx.fillStyle = "#64748b";
  ctx.font = "500 11px 'Inter', sans-serif";
  ctx.fillText("Dibuat otomatis di lawanku.vercel.app · Draft pick, counter hero, item & meta Honor of Kings", 40, 652);
}

let shareDlgEl = null;
function openShareModal(title, renderFn) {
  if (!shareDlgEl) {
    shareDlgEl = document.createElement("dialog");
    shareDlgEl.id = "sharecard-dlg";
    const head = el("div", "dlg-head");
    const h2 = el("h2", null, title);
    h2.id = "sharecard-title";
    head.appendChild(h2);
    const x = el("button", "x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Tutup");
    x.addEventListener("click", () => shareDlgEl.close());
    head.appendChild(x);
    shareDlgEl.appendChild(head);

    const prevWrap = el("div", "share-preview-wrap");
    prevWrap.id = "sharecard-preview";
    shareDlgEl.appendChild(prevWrap);

    const actRow = el("div", "share-actions");
    const dlBtn = el("button", "btn-acc", "Unduh PNG");
    dlBtn.id = "sharecard-dl"; dlBtn.type = "button";
    const copyBtn = el("button", "all", "Salin Gambar");
    copyBtn.id = "sharecard-copy"; copyBtn.type = "button";
    actRow.appendChild(dlBtn);
    actRow.appendChild(copyBtn);
    shareDlgEl.appendChild(actRow);

    const msg = el("p", "mut");
    msg.id = "sharecard-msg";
    shareDlgEl.appendChild(msg);

    document.body.appendChild(shareDlgEl);
  }

  const h2 = $("#sharecard-title", shareDlgEl);
  if (h2) h2.textContent = title;
  const prevWrap = $("#sharecard-preview", shareDlgEl);
  prevWrap.replaceChildren();
  const loading = el("p", "mut", "Membuat kartu gambar…");
  loading.id = "sharecard-loading";
  prevWrap.appendChild(loading);

  const msg = $("#sharecard-msg", shareDlgEl);
  if (msg) msg.textContent = "";

  shareDlgEl.showModal();

  const canvas = document.createElement("canvas");
  renderFn(canvas).then(() => {
    prevWrap.replaceChildren(canvas);

    const dlBtn = $("#sharecard-dl", shareDlgEl);
    dlBtn.onclick = () => {
      try {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "lawanku-" + (title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) + ".png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (msg) {
          msg.textContent = "Gambar berhasil diunduh! ✓";
          setTimeout(() => { if (msg) msg.textContent = ""; }, 3000);
        }
      } catch (err) {
        if (msg) msg.textContent = "Gagal mengunduh gambar: " + err.message;
      }
    };

    const copyBtn = $("#sharecard-copy", shareDlgEl);
    copyBtn.onclick = () => {
      if (navigator.clipboard && window.ClipboardItem && canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            if (msg) msg.textContent = "Gagal membuat blob gambar.";
            return;
          }
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            if (msg) {
              msg.textContent = "Gambar berhasil disalin ke clipboard! ✓";
              setTimeout(() => { if (msg) msg.textContent = ""; }, 3000);
            }
          } catch (e) {
            if (msg) msg.textContent = "Browser tidak mengizinkan salin langsung — silakan gunakan 'Unduh PNG'.";
          }
        }, "image/png");
      } else {
        if (msg) msg.textContent = "Fitur salin gambar tidak didukung di browser ini — silakan gunakan 'Unduh PNG'.";
      }
    };
  }).catch(err => {
    prevWrap.replaceChildren(el("p", "mut", "Gagal menggambar kartu: " + err.message));
  });
}

function showDraftShareCard(draftState) {
  openShareModal("Kartu Draft Pick", async (canvas) => {
    const ids = new Set([
      ...draftState.ally.filter(Boolean),
      ...draftState.enemy.filter(Boolean),
      ...draftState.ban.filter(Boolean),
      ...draftSuggestions(null, 3).map(s => s.id)
    ]);
    const loaded = await Promise.all([...ids].map(loadAvatarImg));
    const imgMap = new Map();
    for (const item of loaded) {
      if (item) imgMap.set(item.id, item.img);
    }
    drawDraftCard(canvas, draftState, imgMap);
  });
}

function showHeroShareCard(hero) {
  openShareModal("Kartu Counter " + hero.en, async (canvas) => {
    const ids = new Set([
      hero.id,
      ...(hero.naturalCounters || []).map(c => c.hero)
    ]);
    const loaded = await Promise.all([...ids].map(loadAvatarImg));
    const imgMap = new Map();
    for (const item of loaded) {
      if (item) imgMap.set(item.id, item.img);
    }
    drawHeroCounterCard(canvas, hero, imgMap);
  });
}

function renderDraft() {
  document.title = "Draft — Lawanku";
  if (!draft) draft = loadDraft();
  let myRole = "all";
  try { const r = localStorage.getItem(ROLE_KEY); if (ROLES.includes(r)) myRole = r; } catch {}
  // Terapkan draft dari link berbagi (?a=..&e=..&b=..), lalu bersihkan URL.
  const qPos = location.hash.indexOf("?");
  if (qPos >= 0) {
    const shared = draftFromParam(location.hash.slice(qPos + 1));
    if (shared) { draft = { ...shared, history: [] }; saveDraft(); }
    try { history.replaceState(null, "", "#/draft"); } catch {}
  }
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Draft Pick"));
  let mode = "ally", popupRole = "all";
  let activeSlot = null; // {team, idx} | null — slot yang dipilih user jadi target isi
  const indexed = withKeys(HEROES);

  const arena = el("div", "arena");
  const center = el("div", "arena-c");
  const teamSections = {};
  for (const [team, label] of [["ally", "Tim kamu"], ["enemy", "Musuh"]]) {
    const sec = el("section");
    sec.dataset.team = team;
    sec.classList.add(team === "ally" ? "arena-a" : "arena-e");
    sec.appendChild(el("h2", "lbl", label));
    for (let i = 0; i < 5; i++) {
      const s = el("div", "slot empty", "+ pick");
      s.dataset.team = team; s.dataset.idx = String(i);
      s.tabIndex = 0; s.setAttribute("role", "button");
      s.setAttribute("aria-label", label + " slot " + (i + 1));
      sec.appendChild(s);
    }
    teamSections[team] = sec;
  }
  const banH = el("h2", "lbl");
  banH.appendChild(document.createTextNode("Ban · "));
  const banN = el("span"); banN.id = "banN"; banN.textContent = "0";
  banH.appendChild(banN);
  banH.appendChild(document.createTextNode("/6"));
  const bans = el("div", "bans");
  bans.dataset.team = "ban";
  for (let i = 0; i < 6; i++) {
    const s = el("div", "slot ban empty");
    s.dataset.team = "ban"; s.dataset.idx = String(i);
    s.tabIndex = 0; s.setAttribute("role", "button");
    s.setAttribute("aria-label", "Ban slot " + (i + 1));
    bans.appendChild(s);
  }
  arena.appendChild(teamSections.ally);
  arena.appendChild(center);
  arena.appendChild(teamSections.enemy);
  main.appendChild(arena);
  // ---- kontrol picker di halaman: mode + tombol buka picker mengambang ----
  const pickctl = el("div", "pickctl");
  const seg = el("div", "seg");
  seg.setAttribute("role", "group");
  seg.setAttribute("aria-label", "Mode");
  for (const [m, labelTxt] of [["ally", "Pick kamu"], ["enemy", "Pick musuh"], ["ban", "Ban"]]) {
    const b = el("button", "m" + (m === mode ? " on" : ""), labelTxt);
    b.type = "button"; b.dataset.mode = m;
    b.setAttribute("aria-pressed", String(m === mode));
    b.addEventListener("click", () => setMode(m, true));
    seg.appendChild(b);
  }
  const undoBtn = el("button", "ic1");
  undoBtn.id = "undo"; undoBtn.type = "button"; undoBtn.setAttribute("aria-label", "Undo");
  undoBtn.appendChild(icon("i-undo"));
  const resetBtn = el("button", "ic1");
  resetBtn.id = "reset"; resetBtn.type = "button"; resetBtn.setAttribute("aria-label", "Reset");
  resetBtn.appendChild(icon("i-reset"));
  seg.appendChild(undoBtn);
  seg.appendChild(resetBtn);
  pickctl.appendChild(seg);
  const openBtn = el("button", "btn-acc", "Pilih hero");
  openBtn.type = "button";
  openBtn.prepend(icon("i-all"));
  openBtn.addEventListener("click", () => openPicker(true));
  pickctl.appendChild(openBtn);
  center.appendChild(pickctl);
  center.appendChild(banH);
  center.appendChild(bans);
  // Fase 23: seksi advisor pindah ke 2 baris penuh di bawah arena (desktop):
  // baris 1 = Saran ban | Saran pick | Role kamu + Saran pick role | Saran item;
  // baris 2 = Komposisi tim | Bagikan & simpan. Di HP tetap tersusun vertikal.
  function dsec(...nodes) {
    const w = el("div", "dsec");
    nodes.forEach(n => w.appendChild(n));
    return w;
  }
  const drow1 = el("div", "drow drow1");
  const drow2 = el("div", "drow drow2");
  main.appendChild(drow1);
  main.appendChild(drow2);

  const banSug = el("div");
  banSug.id = "bansug";
  banSug.setAttribute("aria-live", "polite");
  const sug = el("div");
  sug.id = "sug";
  sug.setAttribute("aria-live", "polite");
  const noteEl = el("p", "note mut", "Tap slot buat pilih target, tap hero buat isi. Skor: hard +2, soft +1 per musuh.");
  drow1.appendChild(dsec(el("h2", "lbl", "Saran ban"), banSug));
  drow1.appendChild(dsec(el("h2", "lbl", "Saran pick"), sug, noteEl));
  const roleWrap = roleButtons(myRole, (r) => {
    myRole = r;
    try { localStorage.setItem(ROLE_KEY, r); } catch {}
    $$(".role", roleWrap).forEach(b => {
      b.classList.toggle("on", b.dataset.role === r);
      b.setAttribute("aria-pressed", String(b.dataset.role === r));
    });
    paintRoleSug();
  });
  roleWrap.id = "myrole";
  const roleSug = el("div");
  roleSug.id = "rolesug";
  roleSug.setAttribute("aria-live", "polite");
  const itemSug = el("div");
  itemSug.id = "itemsug";
  itemSug.setAttribute("aria-live", "polite");
  drow1.appendChild(dsec(el("h2", "lbl", "Role kamu"), roleWrap, el("h2", "lbl", "Saran pick buat role kamu"), roleSug));
  drow1.appendChild(dsec(el("h2", "lbl", "Saran item lawan tim musuh"), itemSug));
  const comp = el("div", "comp");
  comp.id = "comp";
  const shareRow = el("div", "share-row");
  const copyBtn = el("button", "btn-acc", "Salin link draft");
  copyBtn.id = "copylink"; copyBtn.type = "button";
  const shareImgBtn = el("button", "all", "Bagikan sebagai gambar");
  shareImgBtn.id = "shareimgbtn"; shareImgBtn.type = "button";
  shareImgBtn.addEventListener("click", () => showDraftShareCard(draft));
  const copyMsg = el("span", "mut", "");
  copyMsg.id = "copymsg";
  const syncDraftBtn = el("button", "all", getSyncAccount() ? "☁ Tersinkron" : "☁ Sinkron Cloud");
  syncDraftBtn.id = "syncdraftbtn"; syncDraftBtn.type = "button";
  syncDraftBtn.addEventListener("click", () => openSyncModal());
  shareRow.appendChild(copyBtn);
  shareRow.appendChild(shareImgBtn);
  shareRow.appendChild(syncDraftBtn);
  shareRow.appendChild(copyMsg);
  const saveRow = el("div", "share-row");
  const nameInput = el("input");
  nameInput.id = "savename"; nameInput.type = "text";
  nameInput.placeholder = "Nama draft (mis. Ranked malam)";
  nameInput.setAttribute("aria-label", "Nama draft");
  const saveBtn = el("button", "btn-acc", "Simpan draft");
  saveBtn.id = "savedraft"; saveBtn.type = "button";
  saveRow.appendChild(nameInput); saveRow.appendChild(saveBtn);
  const savedList = el("div");
  savedList.id = "savedlist";
  drow2.appendChild(dsec(el("h2", "lbl", "Komposisi tim"), comp));
  drow2.appendChild(dsec(el("h2", "lbl", "Bagikan & simpan"), shareRow, saveRow, savedList));


  // ---- popup pilih hero (bottom sheet) ----
  const dlg = document.createElement("dialog");
  dlg.id = "pickdlg";
  const dlgHead = el("div", "dlg-head");
  const dlgTitle = el("h2", null, "Pilih hero");
  dlgHead.appendChild(dlgTitle);
  const dlgX = el("button", "x", "×");
  dlgX.type = "button"; dlgX.setAttribute("aria-label", "Tutup");
  dlgX.addEventListener("click", () => dlg.close());
  dlgHead.appendChild(dlgX);
  dlg.appendChild(dlgHead);
  const pqWrap = searchBox("pq", "Cari hero…");
  const pq = pqWrap.input;
  pq.setAttribute("enterkeyhint", "go");
  dlg.appendChild(pqWrap.label);
  const pRoles = roleButtons(popupRole, (r) => {
    popupRole = r;
    $$(".role", pRoles).forEach(b => {
      b.classList.toggle("on", b.dataset.role === r);
      b.setAttribute("aria-pressed", String(b.dataset.role === r));
    });
    applyPickerFilter();
  });
  dlg.appendChild(pRoles);
  const recentLbl = el("p", "lbl", "Terakhir dipakai");
  recentLbl.hidden = true;
  dlg.appendChild(recentLbl);
  const recentStrip = el("div", "strip");
  recentStrip.id = "recentStrip";
  recentStrip.hidden = true;
  dlg.appendChild(recentStrip);
  const pGrid = el("div", "pgrid");
  dlg.appendChild(pGrid);
  for (const h of HEROES) {
    const b = heroCard("button", h, "pickhero");
    b.type = "button";
    b.dataset.id = String(h.id);
    b.dataset.roles = h.roles.join(" ");
    pGrid.appendChild(b);
  }
  const pEmpty = el("p", "mut", "Hero tidak ketemu.");
  pEmpty.hidden = true;
  dlg.appendChild(pEmpty);
  main.appendChild(dlg);

  renderDock("draft", null);

  const getRecent = getRecentHeroes;
  const pushRecent = pushRecentHero;
  function paintSlots() {
    const nextIdx = activeSlot ? -1 : draft[mode].indexOf(null);
    for (const team of ["ally", "enemy", "ban"]) {
      const container = team === "ban" ? bans : teamSections[team];
      $$(".slot", container).forEach((slotEl, i) => {
        const id = draft[team][i];
        const hero = id ? byId.get(id) : null;
        const isActive = !!activeSlot && activeSlot.team === team && activeSlot.idx === i;
        const isNext = !activeSlot && team === mode && i === nextIdx;
        slotEl.className = "slot" + (team === "ban" ? " ban" : "") + (hero ? "" : " empty") + (isActive ? " active" : isNext ? " next" : "");
        slotEl.replaceChildren();
        if (hero) {
          slotEl.appendChild(avatar(hero, team === "ban" ? 40 : 32));
          if (team !== "ban") {
            const tx = el("span", "tx");
            tx.appendChild(el("span", "nm", hero.en));
            tx.appendChild(el("span", "sub", hero.roles.map(roleName).join(" / ") + " · " + hero.classes.join(", ")));
            slotEl.appendChild(tx);
          }
          const x = el("button", "x", "×");
          x.type = "button";
          x.setAttribute("aria-label", "Hapus " + hero.en);
          slotEl.appendChild(x);
          slotEl.title = hero.en;
        } else {
          if (team !== "ban") slotEl.appendChild(document.createTextNode("+ pick"));
          slotEl.removeAttribute("title");
        }
      });
    }
    banN.textContent = String(draft.ban.filter(Boolean).length);
  }
  function sugButton(s) {
    const h = byId.get(s.id);
    const b = el("button", "sug");
    b.type = "button"; b.dataset.id = String(s.id);
    b.appendChild(avatar(h, 48));
    const box = el("div", "b");
    const nm = el("div", "nm");
    nm.appendChild(document.createTextNode(h.en));
    nm.appendChild(el("b", "sc", "+" + s.s));
    box.appendChild(nm);
    box.appendChild(el("p", null, s.why));
    b.appendChild(box);
    return b;
  }
  function paintSug() {
    sug.replaceChildren();
    if (!draft.enemy.some(Boolean)) {
      sug.appendChild(el("p", "mut", "Isi pick musuh dulu, saran muncul di sini."));
      return;
    }
    const list = draftSuggestions();
    if (!list.length) {
      sug.appendChild(el("p", "mut", "Belum ada counter yang cocok di data."));
      return;
    }
    for (const s of list) sug.appendChild(sugButton(s));
  }
  function paintRoleSug() {
    roleSug.replaceChildren();
    if (!draft.enemy.some(Boolean)) {
      roleSug.appendChild(el("p", "mut", "Isi pick musuh dulu, saran muncul di sini."));
      return;
    }
    if (myRole === "all") {
      roleSug.appendChild(el("p", "mut", "Pilih role kamu di atas — saran pick disesuaikan sama role itu."));
      return;
    }
    const list = draftSuggestions(myRole, 3);
    if (!list.length) {
      roleSug.appendChild(el("p", "mut", "Belum ada counter " + ROLE_LABEL[myRole] + " yang cocok di data."));
      return;
    }
    for (const s of list) roleSug.appendChild(sugButton(s));
  }
  function paintItemSug() {
    itemSug.replaceChildren();
    if (!draft.enemy.some(Boolean)) {
      itemSug.appendChild(el("p", "mut", "Isi pick musuh dulu, saran item muncul di sini."));
      return;
    }
    const list = itemSuggestions();
    if (!list.length) {
      itemSug.appendChild(el("p", "mut", "Belum ada item counter yang tercatat buat tim musuh ini."));
      return;
    }
    for (const s of list) {
      const card = el("div", "card");
      const row = el("div", "row");
      const a = el("a", "link", s.items);
      a.href = "#/items";
      row.appendChild(a);
      row.appendChild(el("span", s.allCurated ? "tag ok" : "tag", s.allCurated ? "terkurasi" : "sebagian belum dikurasi"));
      card.appendChild(row);
      const pl = itemPriceLine(s.items);
      if (pl) card.appendChild(el("p", "mut iprice", pl));
      card.appendChild(el("p", "mut", "Lawan " + s.n + " hero musuh: " + s.vs.join(", ")));
      itemSug.appendChild(card);
    }
  }
  function paintBanSug() {
    banSug.replaceChildren();
    if (!draft.ally.some(Boolean)) {
      banSug.appendChild(el("p", "mut", "Isi tim kamu dulu, saran ban muncul di sini."));
      return;
    }
    const list = banSuggestions();
    if (!list.length) {
      banSug.appendChild(el("p", "mut", "Tidak ada ancaman counter yang tercatat buat tim ini."));
      return;
    }
    for (const s of list) {
      const h = byId.get(s.id);
      const b = el("button", "sug bansug-btn");
      b.type = "button"; b.dataset.id = String(s.id);
      b.appendChild(avatar(h, 48));
      const box = el("div", "b");
      const nm = el("div", "nm");
      nm.appendChild(document.createTextNode(h.en));
      nm.appendChild(el("b", "sc", "+" + s.s));
      box.appendChild(nm);
      box.appendChild(el("p", null, s.why + " — tap buat ban."));
      b.appendChild(box);
      banSug.appendChild(b);
    }
  }
  function paintComp() {
    comp.replaceChildren();
    for (const r of teamComposition()) {
      comp.appendChild(el("span", "chip" + (r.n ? " ok" : " no"),
        (r.n ? "✓ " : "✗ ") + r.label + (r.n > 1 ? " ×" + r.n : "")));
    }
    const picks = draft.ally.filter(Boolean).map(id => byId.get(id)).filter(Boolean);
    const hasFront = picks.some(h => h.classes.includes("Tank") || h.classes.includes("Fighter"));
    if (picks.length && !hasFront)
      comp.appendChild(el("p", "mut", "Belum ada frontline (Tank/Fighter) — tim gampang ditembus."));
  }
  function paintSaved() {
    savedList.replaceChildren();
    const list = loadSavedDrafts();
    if (!list.length) {
      savedList.appendChild(el("p", "mut", "Belum ada draft tersimpan."));
      return;
    }
    for (const [i, s] of list.entries()) {
      const row = el("div", "saved-row");
      row.appendChild(el("b", null, s.name));
      row.appendChild(el("span", "mut", " " + new Date(s.savedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " · " + [...s.ally, ...s.enemy, ...s.ban].filter(Boolean).length + " hero"));
      const load = el("button", "mini", "Muat");
      load.type = "button"; load.dataset.i = String(i);
      const del = el("button", "mini", "Hapus");
      del.type = "button"; del.dataset.i = String(i);
      row.appendChild(load); row.appendChild(del);
      savedList.appendChild(row);
    }
  }
  function applyPickerFilter() {
    const q = pq.value.trim();
    const order = q ? new Map(searchHeroes(indexed, q).map((h, i) => [h.id, i])) : null;
    const used = new Set([...draft.ally, ...draft.enemy, ...draft.ban]);
    let count = 0, first = null, firstRank = Infinity;
    for (const b of $$(".pickhero", pGrid)) {
      const id = Number(b.dataset.id);
      const show = (popupRole === "all" || b.dataset.roles.split(" ").includes(popupRole)) && (!order || order.has(id));
      b.hidden = !show;
      const rank = order ? order.get(id) : 0;
      b.style.order = order ? String(rank) : "";
      b.classList.toggle("used", used.has(id));
      if (show) {
        count++;
        if (rank < firstRank) { first = b; firstRank = rank; }
      }
    }
    pEmpty.hidden = count > 0;
    const recents = q ? [] : getRecent().filter(id => byId.has(id));
    recentLbl.hidden = !recents.length;
    recentStrip.hidden = !recents.length;
    recentStrip.replaceChildren();
    for (const id of recents) {
      const b = heroButton(byId.get(id));
      b.classList.toggle("used", used.has(id));
      recentStrip.appendChild(b);
    }
    return first;
  }
  let pickerSticky = false; // true: panel tetap buka setelah pick (rapid pick)
  function paintPickerTitle() {
    const target = activeSlot || { team: mode, idx: draft[mode].indexOf(null) };
    const teamLabel = target.team === "ally" ? "Tim kamu" : target.team === "enemy" ? "Musuh" : "Ban";
    dlgTitle.textContent = target.idx >= 0 ? "Pilih hero · " + teamLabel + " " + (target.idx + 1) : "Pilih hero · " + teamLabel;
  }
  function openPicker(sticky) {
    pickerSticky = !!sticky;
    pq.value = "";
    popupRole = "all";
    $$(".role", pRoles).forEach(b => {
      b.classList.toggle("on", b.dataset.role === "all");
      b.setAttribute("aria-pressed", String(b.dataset.role === "all"));
    });
    paintPickerTitle();
    applyPickerFilter();
    if (!dlg.open) dlg.showModal();
    pq.focus();
  }
  function setMode(m, clearActive) {
    mode = m;
    if (clearActive) activeSlot = null;
    $$(".m", seg).forEach(x => {
      x.classList.toggle("on", x.dataset.mode === m);
      x.setAttribute("aria-pressed", String(x.dataset.mode === m));
    });
    paintSlots();
  }
  function selectSlot(team, idx) {
    activeSlot = { team, idx };
    setMode(team, false);
    openPicker(false);
  }
  function removeSlot(team, idx) {
    if (draft[team][idx] == null) return;
    draft[team][idx] = null;
    draft.history = draft.history.filter(([t, i]) => !(t === team && i === idx));
    sync();
  }
  function sync() { saveDraft(); paintSlots(); paintSug(); paintBanSug(); paintComp(); paintRoleSug(); paintItemSug(); }
  function pickHero(id, team) {
    team = team || mode;
    for (const t of ["ally", "enemy", "ban"]) {
      const i = draft[t].indexOf(id);
      if (i >= 0) {
        draft[t][i] = null;
        draft.history = draft.history.filter(([tt, ii]) => !(tt === t && ii === i));
        sync();
        return;
      }
    }
    let target = null;
    if (activeSlot && activeSlot.team === team) target = { ...activeSlot };
    if (!target) {
      const i = draft[team].indexOf(null);
      if (i < 0) return;
      target = { team, idx: i };
    }
    if (draft[target.team][target.idx] != null) {
      draft.history = draft.history.filter(([tt, ii]) => !(tt === target.team && ii === target.idx));
    }
    draft[target.team][target.idx] = id;
    draft.history.push([target.team, target.idx]);
    pushRecent(id);
    if (activeSlot && activeSlot.team === target.team && activeSlot.idx === target.idx) {
      const next = draft[target.team].indexOf(null);
      activeSlot = next >= 0 ? { team: target.team, idx: next } : null;
    }
    sync();
  }
  function onSlotAreaClick(e) {
    const x = e.target.closest(".x");
    if (x) {
      const slotEl = x.closest(".slot");
      removeSlot(slotEl.dataset.team, Number(slotEl.dataset.idx));
      return;
    }
    const slotEl = e.target.closest(".slot");
    if (slotEl) selectSlot(slotEl.dataset.team, Number(slotEl.dataset.idx));
  }
  function onSlotKey(e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("slot")) {
      e.preventDefault();
      selectSlot(e.target.dataset.team, Number(e.target.dataset.idx));
    }
  }
  arena.addEventListener("click", onSlotAreaClick);
  arena.addEventListener("keydown", onSlotKey);
  dlg.addEventListener("click", e => {
    const b = e.target.closest(".pickhero, #recentStrip .hero");
    if (!b) return;
    pickHero(Number(b.dataset.id));
    if (pickerSticky) { paintPickerTitle(); applyPickerFilter(); }
    else dlg.close();
  });
  pq.addEventListener("input", applyPickerFilter);
  pq.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const first = applyPickerFilter();
      if (first) {
        pickHero(Number(first.dataset.id));
        if (pickerSticky) { paintPickerTitle(); applyPickerFilter(); }
        else dlg.close();
      }
    }
  });
  dlg.addEventListener("keydown", e => {
    if (e.key.length === 1 && e.target !== pq && !e.metaKey && !e.ctrlKey) pq.focus();
  });
  dlg.addEventListener("close", () => { pq.value = ""; });
  sug.addEventListener("click", e => {
    const b = e.target.closest(".sug");
    if (b) pickHero(Number(b.dataset.id), "ally");
  });
  roleSug.addEventListener("click", e => {
    const b = e.target.closest(".sug");
    if (b) pickHero(Number(b.dataset.id), "ally");
  });
  banSug.addEventListener("click", e => {
    const b = e.target.closest(".bansug-btn");
    if (b) pickHero(Number(b.dataset.id), "ban");
  });
  copyBtn.addEventListener("click", async () => {
    const url = location.origin + location.pathname + "#/draft?" + draftToParam(draft);
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; }
    catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url; document.body.appendChild(ta); ta.select();
        ok = document.execCommand("copy"); ta.remove();
      } catch {}
    }
    copyMsg.textContent = ok ? "Link disalin ✓" : "Gagal menyalin — salin manual dari address bar.";
    setTimeout(() => { copyMsg.textContent = ""; }, 3000);
  });
  saveBtn.addEventListener("click", () => {
    const list = loadSavedDrafts();
    const name = nameInput.value.trim() || ("Draft " + (list.length + 1));
    list.unshift({ name, savedAt: Date.now(), ally: [...draft.ally], enemy: [...draft.enemy], ban: [...draft.ban] });
    storeSavedDrafts(list.slice(0, 12));
    nameInput.value = "";
    paintSaved();
  });
  savedList.addEventListener("click", e => {
    const b = e.target.closest("button.mini");
    if (!b) return;
    const i = Number(b.dataset.i);
    const list = loadSavedDrafts();
    if (b.textContent === "Muat") {
      const s = list[i];
      if (!s) return;
      draft = { ally: [...s.ally], enemy: [...s.enemy], ban: [...s.ban], history: [] };
      activeSlot = null;
      sync();
    } else {
      list.splice(i, 1);
      storeSavedDrafts(list);
      paintSaved();
    }
  });
  undoBtn.addEventListener("click", () => {
    const last = draft.history.pop();
    if (last) { draft[last[0]][last[1]] = null; sync(); }
  });
  resetBtn.addEventListener("click", () => {
    for (const t of ["ally", "enemy", "ban"]) draft[t].fill(null);
    draft.history.length = 0;
    activeSlot = null;
    sync();
  });
  if (draftKeyHandler) document.removeEventListener("keydown", draftKeyHandler);
  draftKeyHandler = (e) => {
    if (dlg.open) return;
    if (!location.hash.startsWith("#/draft")) return;
    if (e.key === "/" && !e.target.matches("input, textarea, select")) {
      e.preventDefault();
      openPicker(true);
    }
  };
  document.addEventListener("keydown", draftKeyHandler);
  paintSaved();
  sync();
  applyFavStars();
}

/* ---------- QUIZ ---------- */
/* Timer skenario: id interval modul-level biar tidak jalan terus saat pindah halaman. */
let quizTimerId = null;
function renderQuiz() {
  if (quizTimerId) { clearInterval(quizTimerId); quizTimerId = null; }
  document.title = "Kuis — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Kuis"));
  main.appendChild(el("p", "mut", "Tebak counter, tebak hero, tebak skill, atau latihan skenario draft (5 skenario, 30 detik tiap skenario: hero +150, item +100). Skor terbaik tersimpan di perangkat ini."));
  const BEST_KEY = "hok-quiz-best";
  function roundLen() {
    if (mode === "skenario") return 5;
    if (mode === "skill") return 10;
    return 20;
  }
  let mode = "counter";
  let questions = [], qi = 0, score = 0, answered = false, progEl = null;
  let aRight = 0, bRight = 0;

  function getBest(m) {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || "{}")[m] || 0; } catch { return 0; }
  }
  function setBest(m, s) {
    try {
      const b = JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
      if (s > (b[m] || 0)) { b[m] = s; localStorage.setItem(BEST_KEY, JSON.stringify(b)); }
    } catch {}
  }
  const seg = el("div", "seg");
  seg.setAttribute("role", "group");
  seg.setAttribute("aria-label", "Mode quiz");
  const modeBtns = {};
  for (const [m, labelTxt] of [["counter", "Tebak Counter"], ["tebak", "Tebak Hero"], ["skill", "Tebak Skill"], ["skenario", "Skenario"]]) {
    const b = el("button", "m" + (m === mode ? " on" : ""), labelTxt);
    b.type = "button"; b.dataset.mode = m;
    b.setAttribute("aria-pressed", String(m === mode));
    b.addEventListener("click", () => {
      mode = m;
      for (const k in modeBtns) {
        modeBtns[k].classList.toggle("on", k === m);
        modeBtns[k].setAttribute("aria-pressed", String(k === m));
      }
      startRound();
    });
    modeBtns[m] = b;
    seg.appendChild(b);
  }
  main.appendChild(seg);
  const board = el("div");
  main.appendChild(board);

  function sample(arr, n) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  }
  function makeQuestions() {
    if (mode === "skenario") {
      const pool = HEROES.filter(h => {
        const ctrs = h.naturalCounters || [];
        return ctrs.some(c => c.strength === "hard")
          && ctrs.some(c => c.strength === "soft")
          && (h.itemCounters || []).length > 0
          && HEROES.some(x => x.id !== h.id && (x.naturalCounters || []).some(c => c.hero === h.id));
      });
      const itemPool = [...new Set(HEROES.flatMap(h => (h.itemCounters || []).map(c => c.items)))];
      return sample(pool, roundLen()).map(enemy => {
        const ctrs = enemy.naturalCounters || [];
        const hard = ctrs.filter(c => c.strength === "hard");
        const soft = ctrs.filter(c => c.strength === "soft");
        const hardPick = hard[Math.floor(Math.random() * hard.length)];
        const softPick = soft[Math.floor(Math.random() * soft.length)];
        const correct = byId.get(hardPick.hero);
        const softHero = byId.get(softPick.hero);
        const trapPool = HEROES.filter(x => x.id !== enemy.id && x.id !== correct.id && x.id !== softHero.id
          && (x.naturalCounters || []).some(c => c.hero === enemy.id));
        const trap = trapPool.length ? sample(trapPool, 1)[0] : null;
        const opts = [correct, softHero];
        if (trap) opts.push(trap);
        while (opts.length < 4) {
          const cand = sample(HEROES.filter(h => h.id !== enemy.id && !opts.some(o => o.id === h.id)
            && !(enemy.naturalCounters || []).some(c => c.hero === h.id)), 1)[0];
          if (!cand) break;
          opts.push(cand);
        }
        const correctItem = enemy.itemCounters[Math.floor(Math.random() * enemy.itemCounters.length)];
        const itemDistract = sample(itemPool.filter(v => !(enemy.itemCounters || []).some(c => c.items === v)), 2);
        const matePool = HEROES.filter(h => h.id !== enemy.id && !opts.some(o => o.id === h.id)
          && !(enemy.naturalCounters || []).some(c => c.hero === h.id));
        const mates = sample(matePool, 2);
        return {
          enemy, mates, correct, trap,
          correctWhy: hardPick.why || null,
          options: sample(opts, opts.length),
          correctItem, itemWhy: correctItem.why || null,
          itemOptions: sample([correctItem.items, ...itemDistract], 3),
        };
      });
    }
    if (mode === "counter") {
      const pool = HEROES.filter(h => (h.naturalCounters || []).length);
      return sample(pool, roundLen()).map(enemy => {
        const counters = enemy.naturalCounters || [];
        const hard = counters.filter(c => c.strength === "hard");
        const pick = hard.length ? hard[Math.floor(Math.random() * hard.length)] : counters[0];
        const correct = byId.get(pick.hero);
        const banned = new Set([enemy.id, correct.id, ...counters.map(c => c.hero)]);
        const distract = sample(HEROES.filter(h => !banned.has(h.id)), 3);
        return { enemy, correct, why: pick.why || null, options: sample([correct, ...distract], 4) };
      });
    }
    if (mode === "skill") {
      const pool = HEROES.filter(h => h.skillQuiz && h.skillQuiz.name && h.skillQuiz.desc);
      return sample(pool, roundLen()).map(hero => {
        const distract = sample(HEROES.filter(h => h.id !== hero.id), 3);
        return {
          hero,
          skill: hero.skillQuiz,
          options: sample([hero, ...distract], 4),
        };
      });
    }
    return sample(HEROES, roundLen()).map(hero => ({
      hero,
      options: sample([hero, ...sample(HEROES.filter(h => h.id !== hero.id), 3)], 4),
    }));
  }
  function startRound() {
    questions = makeQuestions();
    qi = 0; score = 0; answered = false; aRight = 0; bRight = 0;
    paintQuestion();
  }
  function paintQuestion() {
    board.replaceChildren();
    answered = false;
    stopTimer();
    if (qi >= questions.length) { paintResult(); return; }
    if (mode === "skenario") { paintScenario(); return; }
    const q = questions[qi];
    progEl = el("p", "mut", "Soal " + (qi + 1) + "/" + questions.length + " · Skor " + score);
    progEl.id = "qprog";
    board.appendChild(progEl);
    const card = el("div", "card");
    if (mode === "counter") {
      const row = el("div", "row");
      row.appendChild(avatar(q.enemy, 56));
      const t = el("div");
      t.appendChild(el("b", null, "Siapa counter terkuat " + q.enemy.en + "?"));
      t.appendChild(el("p", "mut", q.enemy.roles.map(roleName).join(" / ") + " · " + q.enemy.classes.join(", ")));
      row.appendChild(t);
      card.appendChild(row);
    } else if (mode === "skill") {
      const t = el("div");
      t.style.display = "flex";
      t.style.flexDirection = "column";
      t.style.gap = "var(--s1)";
      const tag = el("span", "tag", "Skill: " + q.skill.name);
      tag.style.alignSelf = "flex-start";
      t.appendChild(tag);
      t.appendChild(el("b", null, "Hero manakah yang memiliki skill berikut?"));
      t.appendChild(el("p", null, '"' + q.skill.desc + '"'));
      card.appendChild(t);
    } else {
      const row = el("div", "row");
      const big = avatar(q.hero, 96);
      big.style.width = "96px"; big.style.height = "96px";
      row.appendChild(big);
      row.appendChild(el("b", null, "Hero apakah ini?"));
      card.appendChild(row);
    }
    board.appendChild(card);
    const grid = el("div", "qgrid");
    const optBtns = [];
    for (const opt of q.options) {
      const b = el("button", "qopt");
      b.type = "button";
      b.dataset.id = String(opt.id);
      // Tebak Hero: foto cuma di soal — opsi tanpa ikon biar nggak jadi contekan.
      if (mode === "counter") b.appendChild(avatar(opt, 40));
      b.appendChild(el("span", null, opt.en));
      b.addEventListener("click", () => answer(opt, b, optBtns));
      grid.appendChild(b);
      optBtns.push(b);
    }
    board.appendChild(grid);
    const fb = el("p", "mut");
    fb.id = "qfb";
    board.appendChild(fb);
    const next = el("button", "btn-acc", qi === questions.length - 1 ? "Lihat hasil" : "Lanjut");
    next.id = "qnext";
    next.type = "button";
    next.hidden = true;
    next.addEventListener("click", () => { qi++; paintQuestion(); });
    board.appendChild(next);
  }
  function stopTimer() {
    if (quizTimerId) { clearInterval(quizTimerId); quizTimerId = null; }
  }
  function paintScenario() {
    const q = questions[qi];
    let selA = null, selB = null, selABtn = null, selBBtn = null;
    const aBtns = [], bBtns = [];
    const prow = el("div", "row");
    progEl = el("p", "mut", "Skenario " + (qi + 1) + "/" + questions.length + " · Skor " + score);
    progEl.id = "qprog";
    prow.appendChild(progEl);
    const timerEl = el("span", "qtimer", "⏱ 30 dtk");
    prow.appendChild(timerEl);
    board.appendChild(prow);
    const card = el("div", "card");
    const row = el("div", "row");
    row.appendChild(avatar(q.enemy, 56));
    const t = el("div");
    t.appendChild(el("b", null, "Musuh mengunci " + q.enemy.en));
    t.appendChild(el("p", "mut", q.enemy.roles.map(roleName).join(" / ") + " · " + q.enemy.classes.join(", ")));
    row.appendChild(t);
    card.appendChild(row);
    if (q.mates.length) card.appendChild(el("p", "mut", "Juga terkunci: " + q.mates.map(mh => mh.en + " (" + mh.roles.map(roleName).join("/") + ")").join(", ") + "."));
    card.appendChild(el("p", null, "Pilih hero counter terbaik lawan " + q.enemy.en + ", lalu item pertama yang wajib di-rush sebelum teamfight."));
    board.appendChild(card);
    board.appendChild(el("h2", "lbl", "Bagian A — Hero counter terbaik"));
    const gridA = el("div", "qgrid");
    for (const opt of q.options) {
      const b = el("button", "qopt");
      b.type = "button";
      b.dataset.id = String(opt.id);
      b.appendChild(avatar(opt, 40));
      b.appendChild(el("span", null, opt.en));
      b.addEventListener("click", () => {
        if (answered) return;
        selA = opt; selABtn = b;
        for (const x of aBtns) x.classList.toggle("sel", x === b);
        lockBtn.disabled = !(selA && selB);
      });
      gridA.appendChild(b);
      aBtns.push(b);
    }
    board.appendChild(gridA);
    board.appendChild(el("h2", "lbl", "Bagian B — Item pertama yang di-rush"));
    const gridB = el("div", "qgrid");
    for (const it of q.itemOptions) {
      const b = el("button", "qopt item");
      b.type = "button";
      b.dataset.item = it;
      b.appendChild(el("span", null, it));
      b.addEventListener("click", () => {
        if (answered) return;
        selB = it; selBBtn = b;
        for (const x of bBtns) x.classList.toggle("sel", x === b);
        lockBtn.disabled = !(selA && selB);
      });
      gridB.appendChild(b);
      bBtns.push(b);
    }
    board.appendChild(gridB);
    const lockBtn = el("button", "btn-acc", "Kunci jawaban");
    lockBtn.type = "button";
    lockBtn.disabled = true;
    lockBtn.addEventListener("click", () => lockScenario(false));
    board.appendChild(lockBtn);
    const fb = el("p", "mut");
    fb.id = "qfb";
    board.appendChild(fb);
    const next = el("button", "btn-acc", qi === questions.length - 1 ? "Lihat hasil" : "Lanjut");
    next.id = "qnext";
    next.type = "button";
    next.hidden = true;
    next.addEventListener("click", () => { qi++; paintQuestion(); });
    board.appendChild(next);
    let timeLeft = 30;
    quizTimerId = setInterval(() => {
      if (!document.body.contains(timerEl)) { stopTimer(); return; }
      timeLeft--;
      if (timeLeft <= 0) { lockScenario(true); return; }
      timerEl.textContent = "⏱ " + timeLeft + " dtk";
      if (timeLeft <= 10) timerEl.classList.add("low");
    }, 1000);
    function lockScenario(timedOut) {
      if (answered) return;
      answered = true;
      stopTimer();
      const okA = !!selA && selA.id === q.correct.id;
      const okB = selB === q.correctItem.items;
      if (okA) { score += 150; aRight++; }
      if (okB) { score += 100; bRight++; }
      for (const b of aBtns) {
        b.disabled = true;
        if (Number(b.dataset.id) === q.correct.id) b.classList.add("ok");
        else if (b === selABtn) b.classList.add("no");
      }
      for (const b of bBtns) {
        b.disabled = true;
        if (b.dataset.item === q.correctItem.items) b.classList.add("ok");
        else if (b === selBBtn) b.classList.add("no");
      }
      const lines = [];
      if (timedOut) lines.push("Waktu habis!");
      lines.push(okA ? "Bagian A benar! " + (q.correctWhy || "") : "Bagian A: jawabannya " + q.correct.en + ". " + (q.correctWhy || ""));
      if (!okA && selA && q.trap && selA.id === q.trap.id) lines.push("Hati-hati: " + q.trap.en + " justru dikounter " + q.enemy.en + " — jangan pick dia lawan " + q.enemy.en + ".");
      lines.push(okB ? "Bagian B benar! " + (q.itemWhy || "") : "Bagian B: item yang tepat " + q.correctItem.items + ". " + (q.itemWhy || ""));
      fb.textContent = lines.join(" ");
      progEl.textContent = "Skenario " + (qi + 1) + "/" + questions.length + " · Skor " + score;
      timerEl.textContent = "⏱ 0 dtk";
      lockBtn.hidden = true;
      next.hidden = false;
    }
  }
  function answer(opt, btn, all) {
    if (answered) return;
    answered = true;
    const q = questions[qi];
    const correct = mode === "counter" ? q.correct : q.hero;
    const ok = opt.id === correct.id;
    if (ok) score++;
    for (const b of all) {
      b.disabled = true;
      if (Number(b.dataset.id) === correct.id) b.classList.add("ok");
      else if (b === btn) b.classList.add("no");
    }
    const fb = $("#qfb");
    const info = correct.roles.map(roleName).join(" / ") + " · " + correct.classes.join(", ");
    if (mode === "counter") {
      fb.textContent = ok
        ? "Benar! " + (q.why || "")
        : "Jawabannya " + correct.en + ". " + (q.why || "");
    } else if (mode === "skill") {
      fb.textContent = ok
        ? "Benar! Skill " + q.skill.name + " adalah milik " + correct.en + " (" + info + ")."
        : "Salah, skill " + q.skill.name + " adalah milik " + correct.en + " (" + info + ").";
    } else {
      fb.textContent = ok ? "Benar! " + correct.en + " — " + info : "Salah, ini " + correct.en + " — " + info;
    }
    if (progEl) progEl.textContent = "Soal " + (qi + 1) + "/" + questions.length + " · Skor " + score;
    $("#qnext").hidden = false;
  }
  function paintResult() {
    board.replaceChildren();
    setBest(mode, score);
    board.appendChild(el("h2", null, "Hasil"));
    const total = mode === "skenario" ? questions.length * 250 : questions.length;
    board.appendChild(el("p", null, "Skor kamu: " + score + "/" + total));
    board.appendChild(el("p", "mut", "Skor terbaik mode ini: " + getBest(mode) + "/" + total));
    if (mode === "skenario") board.appendChild(el("p", "mut", "Bagian A (hero) benar: " + aRight + "/" + questions.length + " · Bagian B (item) benar: " + bRight + "/" + questions.length));
    const again = el("button", "btn-acc", "Main lagi");
    again.type = "button";
    again.addEventListener("click", startRound);
    board.appendChild(again);
  }
  startRound();
  renderDock("quiz", null);
  applyFavStars();
}

/* ---------- FAVORIT ---------- */
function renderFavorit() {
  document.title = "Favorit — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Favorit"));
  const sub = el("p", "mut");
  const n = el("span"); n.id = "n"; n.textContent = "0";
  sub.appendChild(n);
  sub.appendChild(document.createTextNode(" hero · "));
  const syncFavBtn = el("button", "mini", getSyncAccount() ? "☁ Tersinkron Cloud" : "☁ Sinkron Cloud");
  syncFavBtn.id = "syncfavbtn"; syncFavBtn.type = "button";
  syncFavBtn.onclick = () => openSyncModal();
  sub.appendChild(syncFavBtn);
  main.appendChild(sub);
  const none = el("p", "mut", "Belum ada. Cari hero di bawah, tap buat tambah.");
  none.id = "none";
  main.appendChild(none);
  const awasL = el("h2", null, "Awas counter-nya");
  awasL.id = "awasL";
  main.appendChild(awasL);
  const awas = el("div");
  awas.id = "awas";
  main.appendChild(awas);
  const poolL = el("h2", null, "Semua hero");
  poolL.id = "poolL";
  main.appendChild(poolL);
  const pool = el("ul", "pool");
  pool.id = "pool";
  for (const h of HEROES) {
    const li = el("li");
    const c = heroCard("button", h, "cell");
    c.type = "button";
    c.dataset.id = String(h.id);
    li.appendChild(c);
    pool.appendChild(li);
  }
  main.appendChild(pool);
  const tip = el("p", "mut", "Tap hero buat tambah atau hapus favorit.");
  tip.id = "tip";
  main.appendChild(tip);

  const ctl = el("div", "ctl");
  const { label, input } = searchBox("q", "Cari hero…");
  ctl.appendChild(label);
  const strip = el("div", "strip");
  strip.id = "strip";
  strip.setAttribute("aria-label", "Hasil pencarian");
  const empty = el("p", "mut", "Hero tidak ketemu.");
  empty.id = "empty"; empty.hidden = true;
  strip.appendChild(empty);
  for (const h of HEROES) strip.appendChild(heroButton(h));
  ctl.appendChild(strip);
  renderDock("favorit", ctl);

  const indexed = withKeys(HEROES);
  function paint() {
    const favs = getFavs();
    const favSet = new Set(favs);
    n.textContent = String(favs.length);
    none.hidden = favs.length > 0;
    for (const id of ["awasL", "poolL", "tip"]) $("#" + id).hidden = !favs.length;
    awas.replaceChildren();
    for (const id of favs) {
      const h = byId.get(id);
      if (!h) continue;
      const row = el("div", "row1");
      row.dataset.id = String(id);
      row.appendChild(avatar(h, 40));
      const box = el("div");
      box.appendChild(el("b", null, h.en));
      const counters = (h.naturalCounters || []).slice(0, 3).map(c => byId.get(c.hero)).filter(Boolean);
      box.appendChild(el("small", null, counters.length ? "Kalah lawan " + counters.map(c => c.en).join(", ") : "Belum ada data counter"));
      row.appendChild(box);
      awas.appendChild(row);
    }
    for (const c of $$("#pool .cell"))
      c.classList.toggle("on", favSet.has(Number(c.dataset.id)));
    // pool menampilkan semua hero; urutan: favorit dulu
    for (const li of $$("#pool li")) {
      const id = Number(li.querySelector(".cell").dataset.id);
      li.style.order = favSet.has(id) ? String(favs.indexOf(id)) : String(1000 + HEROES.findIndex(h => h.id === id));
    }
    applyFavStars();
  }
  function applyStripFilter() {
    const q = input.value.trim();
    const order = q ? new Map(searchHeroes(indexed, q).map((h, i) => [h.id, i])) : null;
    let count = 0;
    for (const b of $$("#strip .hero")) {
      const id = Number(b.dataset.id);
      const show = !order || order.has(id);
      b.hidden = !show;
      b.style.order = order ? String(order.get(id)) : "";
      if (show) count++;
    }
    empty.hidden = count > 0;
    strip.scrollLeft = 0;
  }
  strip.addEventListener("click", e => {
    const b = e.target.closest(".hero");
    if (!b) return;
    toggleFav(Number(b.dataset.id));
    paint();
    if (input.value) { input.value = ""; applyStripFilter(); }
  });
  strip.addEventListener("wheel", e => {
    if (!e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    strip.scrollLeft += e.deltaY;
  }, { passive: false });
  pool.addEventListener("click", e => {
    const c = e.target.closest(".cell");
    if (!c) return;
    toggleFav(Number(c.dataset.id));
    paint();
  });
  input.addEventListener("input", applyStripFilter);
  paint();
  applyStripFilter();
}


/* ---------- ITEMS ---------- */
const ITEM_TAGS = {
  "anti-burst": "Anti-Burst",
  "anti-cc": "Anti-CC",
  "anti-heal": "Anti-Heal",
  "anti-tank": "Anti-Tank",
  "anti-autoattack": "Anti-Auto Attack",
};
function renderItems() {
  document.title = "Item Counter — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Item Counter"));
  main.appendChild(el("p", "mut", "Wiki item counter: 8 paket item untuk 116 hero. Harga dan stat di bawah sudah terverifikasi dari data Season 16 (dicek silang HoKStats dan hub-game). Yang tampil hanya rekomendasi dan alasan dari data kurasi."));
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
  const chips = el("div", "fchips");
  let cat = "all";
  const chipBtns = {};
  for (const [t, labelTxt] of [["all", "Semua"], ...Object.entries(ITEM_TAGS)]) {
    const b = el("button", "fchip" + (t === cat ? " on" : ""), labelTxt);
    b.type = "button"; b.dataset.tag = t;
    b.setAttribute("aria-pressed", String(t === cat));
    b.addEventListener("click", () => {
      cat = t;
      for (const k in chipBtns) {
        chipBtns[k].classList.toggle("on", k === t);
        chipBtns[k].setAttribute("aria-pressed", String(k === t));
      }
      paint();
    });
    chipBtns[t] = b;
    chips.appendChild(b);
  }
  main.appendChild(chips);
  const list = el("div", "wikigrid");
  main.appendChild(list);
  const empty = el("p", "mut", "Tidak ada yang cocok.");
  empty.hidden = true;
  main.appendChild(empty);
  const groups = [];
  const byItems = new Map();
  for (const h of HEROES) for (const c of h.itemCounters || []) {
    if (!byItems.has(c.items)) byItems.set(c.items, { items: c.items, tag: c.tag, rows: [] });
    byItems.get(c.items).rows.push({ h, c });
  }
  for (const g of byItems.values()) groups.push(g);
  groups.sort((a, b) => b.rows.length - a.rows.length);
  let curatedOnly = false;
  const paint = () => {
    tog.classList.toggle("on", curatedOnly);
    tog.setAttribute("aria-pressed", String(curatedOnly));
    const q = norm(input.value);
    list.replaceChildren();
    let shown = 0;
    for (const g of groups) {
      if (cat !== "all" && g.tag !== cat) continue;
      let rows = g.rows.filter(({ c }) => !(curatedOnly && c.needsReview));
      if (q) {
        const hay = norm(g.items + " " + (ITEM_TAGS[g.tag] || g.tag) + " " + rows.map(({ h, c }) => h.en + " " + (c.why || "")).join(" "));
        if (!hay.includes(q)) continue;
        rows = rows.filter(({ h, c }) => norm(g.items).includes(q) || norm(h.en + " " + (c.why || "")).includes(q));
      }
      if (!rows.length) continue;
      shown++;
      const card = el("div", "card wikicard");
      const head = el("div", "row");
      head.appendChild(el("b", null, g.items));
      head.appendChild(el("span", "badge soft", rows.length + " hero"));
      card.appendChild(head);
      card.appendChild(el("span", "tag", ITEM_TAGS[g.tag] || g.tag));
      const detItems = ITEM_DETAILS[g.items];
      if (detItems) {
        const idets = el("div", "idets");
        for (const it of detItems) {
          const row2 = el("div", "idet");
          const r2 = el("div", "row");
          r2.appendChild(el("b", null, it.name));
          r2.appendChild(el("span", "badge soft", it.price ? it.price + "G" : "Spell"));
          row2.appendChild(r2);
          if (it.stats) row2.appendChild(el("small", "mut", it.stats));
          if (it.passive) row2.appendChild(el("small", "mut", it.passive));
          idets.appendChild(row2);
        }
        card.appendChild(idets);
      }
      const strip = el("div", "wikistrip");
      for (const { h } of rows.slice(0, 8)) {
        const a = document.createElement("a");
        a.href = "#/hero/" + slug(h.en);
        a.title = h.en;
        a.appendChild(avatar(h, 28));
        strip.appendChild(a);
      }
      if (rows.length > 8) strip.appendChild(el("span", "mut", "+" + (rows.length - 8)));
      card.appendChild(strip);
      const det = el("button", "mini", "Lihat hero & alasan");
      det.type = "button";
      const body = el("div", "wikidet");
      body.hidden = true;
      det.addEventListener("click", () => {
        body.hidden = !body.hidden;
        det.textContent = body.hidden ? "Lihat hero & alasan" : "Sembunyikan";
      });
      card.appendChild(det);
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
        body.appendChild(r);
      }
      card.appendChild(body);
      list.appendChild(card);
    }
    empty.hidden = shown > 0;
  };
  input.addEventListener("input", paint);
  tog.addEventListener("click", () => { curatedOnly = !curatedOnly; paint(); });
  paint();
  renderDock("items", null);
}

/* ---------- TIER LIST ---------- */
/* ---------- TIER LIST ---------- */
// Tier resmi HoK Camp (Global), snapshot 6 Nov 2026 — di-fetch dari tiers.json
// (seperti items.json). Format: {version, source, asOf, tiers: {id: {t, w, p, b}}}.
let TIER_DATA = null;
const TIER_MONTHS = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des" };
function fmtTierDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? (Number(m[3]) + " " + TIER_MONTHS[m[2]] + " " + m[1]) : (iso || "");
}
function pct1(v) { const r = Math.round(v * 10) / 10; return (r % 1 === 0 ? String(r) : r.toFixed(1)).replace(".", ","); }
function renderTier() {
  document.title = "Tier List — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Tier List"));
  const asOf = (TIER_DATA && TIER_DATA.asOf) || "2026-11-06";
  main.appendChild(el("p", "mut", "Tier resmi HoK Camp (Global), data per " + fmtTierDate(asOf) + " — rating resmi di dalam game, bukan hitungan Lawanku."));
  main.appendChild(el("p", "mut", "Tier mengikuti seberapa sering hero di-pick dan di-ban di ranked, bukan urutan win rate. Contoh: Lapulapu win rate-nya 54,8% tapi tier C, sementara Dunshan 45,5% tapi tier S."));
  const tiers = (TIER_DATA && TIER_DATA.tiers) || {};
  if (!Object.keys(tiers).length) {
    main.appendChild(el("p", "mut", "Data tier resmi belum termuat — periksa koneksi lalu muat ulang halaman."));
    renderDock("tier", null);
    return;
  }
  const ctl = el("div", "ctl");
  const srch = el("label", "srch");
  srch.appendChild(icon("i-search"));
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Cari hero…";
  input.setAttribute("aria-label", "Cari hero");
  srch.appendChild(input);
  ctl.appendChild(srch);
  main.appendChild(ctl);
  let lane = "all";
  const roles = roleButtons(lane, (r) => {
    lane = r;
    $$(".role", roles).forEach(b => {
      b.classList.toggle("on", b.dataset.role === r);
      b.setAttribute("aria-pressed", String(b.dataset.role === r));
    });
    paint();
  });
  main.appendChild(roles);
  const list = el("div");
  main.appendChild(list);
  const empty = el("p", "mut", "Tidak ada hero yang cocok.");
  empty.hidden = true;
  main.appendChild(empty);
  const paint = () => {
    const q = norm(input.value);
    list.replaceChildren();
    let shown = 0;
    for (const tier of ["S", "A", "B", "C"]) {
      const members = HEROES
        .filter(h => tiers[String(h.id)] && tiers[String(h.id)].t === tier)
        .filter(h => (lane === "all" || h.roles.includes(lane)) && (!q || norm(h.en).includes(q)))
        .sort((a, b) => tiers[String(b.id)].w - tiers[String(a.id)].w);
      if (!members.length) continue;
      shown += members.length;
      const sec = el("section", "tiersec");
      const head = el("div", "row");
      head.appendChild(el("span", "tierbadge t" + tier.toLowerCase(), "Tier " + tier));
      head.appendChild(el("span", "mut", members.length + " hero"));
      sec.appendChild(head);
      const grid = el("div", "grid");
      for (const h of members) {
        const card = heroCard("a", h);
        card.href = "#/hero/" + slug(h.en);
        const t = tiers[String(h.id)];
        card.appendChild(el("small", "mut", "Win " + pct1(t.w) + "%"));
        card.appendChild(el("small", "mut", "Pick " + pct1(t.p) + "% · Ban " + pct1(t.b) + "%"));
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      list.appendChild(sec);
    }
    empty.hidden = shown > 0;
  };
  input.addEventListener("input", paint);
  paint();
  renderDock("tier", null);
}

/* ---------- MORE ---------- */
/* ---------- TENTANG ---------- */
// Link donasi Saweria — isi kalau sudah ada, mis. "https://saweria.co/USERNAME".
const SAWERIA_URL = "https://sawermaz.com/jembodfiraun";
function renderTentang() {
  document.title = "Tentang — Lawanku";
  const main = $("#main");
  main.replaceChildren();
  main.appendChild(el("h1", null, "Tentang Lawanku"));
  main.appendChild(el("p", "mut", "Lawanku adalah alat bantu buat nyari counter hero Honor of Kings — counter alami, counter item, saran draft, kuis, dan tier list. Dibikin supaya latihan draft kamu makin tajam, bukan buat pamer angka."));
  const totalCtr = HEROES.reduce((n, h) => n + (h.naturalCounters || []).length, 0);
  const totalItems = HEROES.reduce((n, h) => n + (h.itemCounters || []).length, 0);
  const stats = el("div", "stats");
  for (const [v, l] of [[HEROES.length, "hero"], [totalCtr, "counter alami"], [totalItems, "rekomendasi item"], ["S16", "data patch"]]) {
    const s = el("span", "stat");
    s.appendChild(el("b", null, String(v)));
    s.appendChild(document.createTextNode(" " + l));
    stats.appendChild(s);
  }
  main.appendChild(stats);
  main.appendChild(el("p", "mut", "Data patch S16 · Terakhir diperbarui 10 Nov 2026."));
  main.appendChild(el("h2", "lbl", "Fitur"));
  const list = el("div", "list");
  const feats = [
    ["#/", "i-swords", "Counter Hero", "Lihat counter alami dan counter item tiap hero, beserta alasan kenapa hero itu ngecounter."],
    ["#/draft", "i-draft", "Draft Pick", "Rakit draft 5v5 sesuka kamu, lengkap dengan saran pick, saran ban, cek komposisi tim, dan simpan draft."],
    ["#/quiz", "i-quiz", "Kuis Counter", "Asah insting counter lewat tebak hero, tebak counter, dan simulasi skenario draft 30 detik."],
    ["#/items", "i-item", "Item Counter", "Panduan 8 paket item counter yang dipakai buat ngelawan 116 hero."],
    ["#/tier", "i-gem", "Tier Hero", "Tier resmi HoK Camp per 6 Nov 2026, lengkap dengan win, pick, dan ban rate tiap hero."],
  ];
  for (const [href, ic, name, desc] of feats) {
    const a = el("a", "item");
    a.href = href;
    const icn = el("span", "ic");
    icn.appendChild(icon(ic));
    a.appendChild(icn);
    const txt = el("span");
    txt.appendChild(el("b", null, name));
    txt.appendChild(el("small", null, desc));
    a.appendChild(txt);
    const go = el("span", "go");
    go.appendChild(icon("i-go"));
    a.appendChild(go);
    list.appendChild(a);
  }
  main.appendChild(list);
  const how = el("div", "card");
  how.appendChild(el("b", null, "Cara data dibuat"));
  how.appendChild(el("p", "mut", "Counter alami disusun dari patch Season 16 (531 counter: 243 hard, 288 soft). Item counter hanya memakai 8 paket item yang sudah terverifikasi lewat data kurasi — harga dan stat item ditampilkan dari data Season 16 yang sudah dicek silang (HoKStats dan hub-game). Tier list memakai tier resmi HoK Camp (Global) per 6 Nov 2026, lengkap dengan win, pick, dan ban rate — angka-angka itu disalin dari data resmi dan dicek silang antara hub-game dan HoKStats. Kuis skenario dibangkitkan dari data counter. Di sini tidak ada data pemain — Lawanku tidak terhubung ke API resmi HoK, dan tidak pernah mengarang angka."));
  main.appendChild(how);

  const syncSec = el("div", "card");
  const sHead = el("div", "row");
  sHead.appendChild(el("b", null, "Sinkronisasi Antar-Perangkat"));
  const isLinked = !!getSyncAccount();
  sHead.appendChild(el("span", "sync-badge" + (isLinked ? "" : " off"), isLinked ? "● Terhubung" : "Belum aktif"));
  syncSec.appendChild(sHead);
  syncSec.appendChild(el("p", "mut", "Simpan dan sinkronkan daftar Favorit serta racikan Draft kamu antara HP, laptop, dan tablet secara otomatis tanpa perlu registrasi akun (Cloudflare Workers + D1)."));
  const syncBtn = el("button", "btn-acc", isLinked ? "Buka Pengaturan Sinkronisasi" : "Aktifkan Sinkronisasi");
  syncBtn.type = "button";
  syncBtn.onclick = () => openSyncModal();
  syncSec.appendChild(syncBtn);
  main.appendChild(syncSec);

  const don = el("div", "card donasi");
  const dHead = el("div", "row");
  dHead.appendChild(icon("i-heart"));
  dHead.appendChild(el("b", null, "Dukung Lawanku"));
  don.appendChild(dHead);
  don.appendChild(el("p", "mut", "Lawanku bisa dipakai gratis, tanpa iklan. Kalau kamu merasa terbantu, dukungannya bisa disalurkan lewat Sawermaz — dananya dipakai buat bayar domain dan server."));
  if (SAWERIA_URL) {
    const a = el("a", "btn-acc", "Donasi via Sawermaz");
    a.href = SAWERIA_URL;
    a.target = "_blank";
    a.rel = "noopener";
    don.appendChild(a);
  } else {
    const b = el("button", "btn-acc", "Donasi via Sawermaz");
    b.type = "button";
    b.disabled = true;
    don.appendChild(b);
    don.appendChild(el("p", "mut", "Link Saweria belum dipasang."));
  }
  main.appendChild(don);
  const about = el("div", "card");
  about.appendChild(el("b", null, "Disclaimer"));
  about.appendChild(el("p", "mut", "Lawanku adalah proyek buatan penggemar, bukan produk resmi dan tidak terafiliasi dengan Tencent, TiMi, atau Level Infinite. Honor of Kings serta seluruh aset hero di dalamnya tetap menjadi milik pemegang hak ciptanya."));
  main.appendChild(about);
  renderDock("tentang", null);
}

/* ---------- HEAD-TO-HEAD ---------- */
function renderH2H() {
  document.title = "Head-to-head — Lawanku";
  const main = $("#main");
  main.replaceChildren();

  const qPos = location.hash.indexOf("?");
  const params = new URLSearchParams(qPos >= 0 ? location.hash.slice(qPos + 1) : "");
  let heroA = bySlug.get(slug(params.get("a") || "")) || byId.get(Number(params.get("a"))) || null;
  let heroB = bySlug.get(slug(params.get("b") || "")) || byId.get(Number(params.get("b"))) || null;

  const head = el("div", "herohead");
  head.appendChild(el("h1", null, "Head-to-Head"));
  head.appendChild(el("p", "mut", "Bandingkan dua hero: relasi counter dua arah, rekomendasi item lawan, dan perbandingan tier resmi."));
  main.appendChild(head);

  const pickers = el("div", "h2h-pickers");
  const slotA = el("div", "h2h-slot");
  slotA.tabIndex = 0;
  slotA.setAttribute("role", "button");
  slotA.setAttribute("aria-label", "Pilih Hero A");
  slotA.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker("A"); }
  });
  const swapBtn = el("button", "h2h-swap", "⇄");
  swapBtn.type = "button";
  swapBtn.setAttribute("aria-label", "Tukar posisi hero");
  const slotB = el("div", "h2h-slot");
  slotB.tabIndex = 0;
  slotB.setAttribute("role", "button");
  slotB.setAttribute("aria-label", "Pilih Hero B");
  slotB.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker("B"); }
  });
  pickers.appendChild(slotA);
  pickers.appendChild(swapBtn);
  pickers.appendChild(slotB);
  main.appendChild(pickers);

  const results = el("div", "h2h-results");
  main.appendChild(results);

  // Dialog picker
  const dlg = document.createElement("dialog");
  dlg.id = "h2hdlg";
  const dlgHead = el("div", "dlg-head");
  const dlgTitle = el("h2", null, "Pilih Hero");
  dlgHead.appendChild(dlgTitle);
  const dlgX = el("button", "x", "×");
  dlgX.type = "button"; dlgX.setAttribute("aria-label", "Tutup");
  dlgX.addEventListener("click", () => dlg.close());
  dlgHead.appendChild(dlgX);
  dlg.appendChild(dlgHead);

  const pqWrap = searchBox("h2h-pq", "Cari hero…");
  const pq = pqWrap.input;
  dlg.appendChild(pqWrap.label);

  let pRole = "all";
  const pRoles = roleButtons(pRole, (r) => {
    pRole = r;
    $$(".role", pRoles).forEach(b => {
      b.classList.toggle("on", b.dataset.role === r);
      b.setAttribute("aria-pressed", String(b.dataset.role === r));
    });
    filterDlg();
  });
  dlg.appendChild(pRoles);

  const recentLbl = el("p", "lbl", "Terakhir dipakai");
  dlg.appendChild(recentLbl);
  const recentStrip = el("div", "strip");
  dlg.appendChild(recentStrip);

  const pGrid = el("div", "pgrid");
  dlg.appendChild(pGrid);

  for (const h of HEROES) {
    const b = heroCard("button", h, "pickhero");
    b.type = "button";
    b.dataset.id = String(h.id);
    b.dataset.roles = h.roles.join(" ");
    b.addEventListener("click", () => {
      pushRecentHero(h.id);
      if (pickingTarget === "A") heroA = h;
      else if (pickingTarget === "B") heroB = h;
      dlg.close();
      syncUrlAndPaint();
    });
    pGrid.appendChild(b);
  }

  const pEmpty = el("p", "mut", "Hero tidak ketemu.");
  pEmpty.hidden = true;
  dlg.appendChild(pEmpty);
  main.appendChild(dlg);

  let pickingTarget = "A";

  function filterDlg() {
    const q = norm(pq.value);
    let n = 0;
    for (const b of $$(".pickhero", pGrid)) {
      const h = byId.get(Number(b.dataset.id));
      const matchRole = pRole === "all" || (h && h.roles.includes(pRole));
      const matchQ = !q || (h && (norm(h.en).includes(q) || (h.cn && norm(h.cn).includes(q))));
      const ok = matchRole && matchQ;
      b.hidden = !ok;
      if (ok) n++;
    }
    pEmpty.hidden = n > 0;
  }
  pq.addEventListener("input", filterDlg);

  function openPicker(target) {
    pickingTarget = target;
    dlgTitle.textContent = target === "A" ? "Pilih Hero A" : "Pilih Hero B";
    pq.value = "";
    pRole = "all";
    $$(".role", pRoles).forEach(b => {
      b.classList.toggle("on", b.dataset.role === "all");
      b.setAttribute("aria-pressed", String(b.dataset.role === "all"));
    });
    const recent = getRecentHeroes().map(id => byId.get(id)).filter(Boolean);
    recentStrip.replaceChildren();
    if (recent.length) {
      recentLbl.hidden = false;
      recentStrip.hidden = false;
      for (const h of recent) {
        const btn = heroButton(h);
        btn.addEventListener("click", () => {
          pushRecentHero(h.id);
          if (pickingTarget === "A") heroA = h;
          else if (pickingTarget === "B") heroB = h;
          dlg.close();
          syncUrlAndPaint();
        });
        recentStrip.appendChild(btn);
      }
    } else {
      recentLbl.hidden = true;
      recentStrip.hidden = true;
    }
    filterDlg();
    dlg.showModal();
    pq.focus();
  }

  function syncUrlAndPaint() {
    const aSlug = heroA ? slug(heroA.en) : "";
    const bSlug = heroB ? slug(heroB.en) : "";
    let hash = "#/h2h";
    if (aSlug && bSlug) hash += `?a=${aSlug}&b=${bSlug}`;
    else if (aSlug) hash += `?a=${aSlug}`;
    else if (bSlug) hash += `?b=${bSlug}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
    paintSlotsAndResults();
  }

  swapBtn.addEventListener("click", () => {
    const tmp = heroA;
    heroA = heroB;
    heroB = tmp;
    syncUrlAndPaint();
  });

  function renderSlot(slotEl, h, label, target) {
    slotEl.replaceChildren();
    if (h) {
      slotEl.classList.add("filled");
      slotEl.onclick = null;
      slotEl.appendChild(avatar(h, 56));
      slotEl.appendChild(el("p", "hname", h.en));
      slotEl.appendChild(el("span", "mut", h.roles.map(roleName).join(" / ") + " · " + h.classes.join(", ")));
      const changeBtn = el("button", "btn-sec", "Ganti " + label);
      changeBtn.type = "button";
      changeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPicker(target);
      });
      slotEl.appendChild(changeBtn);
    } else {
      slotEl.classList.remove("filled");
      slotEl.appendChild(icon("i-swords"));
      slotEl.appendChild(el("p", "hname", "+ Pilih " + label));
      slotEl.appendChild(el("span", "mut", "Klik untuk memilih"));
      slotEl.onclick = () => openPicker(target);
    }
  }

  function paintSlotsAndResults() {
    renderSlot(slotA, heroA, "Hero A", "A");
    renderSlot(slotB, heroB, "Hero B", "B");

    results.replaceChildren();

    if (!heroA || !heroB) {
      const guide = el("div", "card");
      guide.appendChild(el("p", "mut", "Silakan pilih Hero A dan Hero B di atas untuk melihat analisis head-to-head."));
      results.appendChild(guide);
      return;
    }

    if (heroA.id === heroB.id) {
      const warn = el("div", "card");
      warn.appendChild(el("p", "mut", "Kamu memilih hero yang sama (" + heroA.en + "). Silakan pilih dua hero yang berbeda untuk membandingkan."));
      results.appendChild(warn);
      return;
    }

    // --- (a) Hubungan Counter Dua Arah ---
    const secCtr = el("section");
    secCtr.appendChild(el("h2", "lbl", "Hubungan Counter"));

    const aCountersB = (heroB.naturalCounters || []).find(c => c.hero === heroA.id);
    const bCountersA = (heroA.naturalCounters || []).find(c => c.hero === heroB.id);

    if (!aCountersB && !bCountersA) {
      const card = el("div", "card");
      const r = el("div", "row");
      r.appendChild(el("b", null, "Tidak Ada Hubungan Counter Langsung"));
      r.appendChild(el("span", "tag", "Netral"));
      card.appendChild(r);
      card.appendChild(el("p", "mut", "Tidak ada hubungan counter langsung antara " + heroA.en + " dan " + heroB.en + " dalam data kurasi. Hasil pertarungan lebih ditentukan oleh posisi, timing skill, dan gold."));
      secCtr.appendChild(card);
    } else {
      if (aCountersB) {
        const card = el("div", "card");
        const r = el("div", "row");
        r.appendChild(el("b", null, heroA.en + " meng-counter " + heroB.en));
        r.appendChild(el("span", "badge " + aCountersB.strength, aCountersB.strength));
        card.appendChild(r);
        card.appendChild(el("p", null, aCountersB.why));
        secCtr.appendChild(card);
      }
      if (bCountersA) {
        const card = el("div", "card");
        const r = el("div", "row");
        r.appendChild(el("b", null, heroB.en + " meng-counter " + heroA.en));
        r.appendChild(el("span", "badge " + bCountersA.strength, bCountersA.strength));
        card.appendChild(r);
        card.appendChild(el("p", null, bCountersA.why));
        secCtr.appendChild(card);
      }
    }
    results.appendChild(secCtr);

    // --- (b) Rekomendasi Item Tiap Pihak ---
    const secItem = el("section");
    secItem.appendChild(el("h2", "lbl", "Rekomendasi Item Lawan"));
    const gridItem = el("div", "h2h-grid2");

    const boxItemA = el("div", "card");
    boxItemA.appendChild(el("b", null, "Item untuk melawan " + heroA.en));
    boxItemA.appendChild(el("p", "mut why", "Disarankan untuk " + heroB.en + " / timnya:"));
    if (!(heroA.itemCounters || []).length) {
      boxItemA.appendChild(el("p", "mut", "Belum ada rekomendasi item khusus untuk melawan " + heroA.en + "."));
    } else {
      for (const c of heroA.itemCounters) {
        const it = el("div", "bitem");
        const r = el("div", "row");
        r.appendChild(el("b", null, c.items));
        r.appendChild(el("span", "tag" + (c.needsReview ? "" : " ok"), c.needsReview ? "belum dikurasi" : "terkurasi"));
        it.appendChild(r);
        const pl = itemPriceLine(c.items);
        if (pl) it.appendChild(el("p", "mut iprice", pl));
        if (c.why) it.appendChild(el("p", "mut why", c.why));
        boxItemA.appendChild(it);
      }
    }
    gridItem.appendChild(boxItemA);

    const boxItemB = el("div", "card");
    boxItemB.appendChild(el("b", null, "Item untuk melawan " + heroB.en));
    boxItemB.appendChild(el("p", "mut why", "Disarankan untuk " + heroA.en + " / timnya:"));
    if (!(heroB.itemCounters || []).length) {
      boxItemB.appendChild(el("p", "mut", "Belum ada rekomendasi item khusus untuk melawan " + heroB.en + "."));
    } else {
      for (const c of heroB.itemCounters) {
        const it = el("div", "bitem");
        const r = el("div", "row");
        r.appendChild(el("b", null, c.items));
        r.appendChild(el("span", "tag" + (c.needsReview ? "" : " ok"), c.needsReview ? "belum dikurasi" : "terkurasi"));
        it.appendChild(r);
        const pl = itemPriceLine(c.items);
        if (pl) it.appendChild(el("p", "mut iprice", pl));
        if (c.why) it.appendChild(el("p", "mut why", c.why));
        boxItemB.appendChild(it);
      }
    }
    gridItem.appendChild(boxItemB);
    secItem.appendChild(gridItem);
    results.appendChild(secItem);

    // --- (c) Tier Resmi & Statistik (HoK Camp) ---
    const secTier = el("section");
    secTier.appendChild(el("h2", "lbl", "Tier & Statistik Resmi (HoK Camp)"));
    const gridStats = el("div", "h2h-grid2");

    function renderStatBox(h) {
      const box = el("div", "h2h-statbox");
      const headRow = el("div", "h2h-stathead");
      headRow.appendChild(avatar(h, 40));
      const info = el("div");
      info.appendChild(el("div", "hname", h.en));
      info.appendChild(el("small", "mut", h.roles.map(roleName).join(" / ")));
      headRow.appendChild(info);
      box.appendChild(headRow);

      const t = TIER_DATA && TIER_DATA.tiers ? TIER_DATA.tiers[String(h.id)] : null;
      if (!t) {
        box.appendChild(el("p", "mut", "Data tier belum termuat."));
        return box;
      }

      const rTier = el("div", "h2h-statrow");
      rTier.appendChild(el("span", "mut", "Tier"));
      rTier.appendChild(el("span", "tierbadge t" + t.t.toLowerCase(), "Tier " + t.t));
      box.appendChild(rTier);

      const rWin = el("div", "h2h-statrow");
      rWin.appendChild(el("span", "mut", "Win Rate"));
      rWin.appendChild(el("b", null, pct1(t.w) + "%"));
      box.appendChild(rWin);

      const rPick = el("div", "h2h-statrow");
      rPick.appendChild(el("span", "mut", "Pick Rate"));
      rPick.appendChild(el("span", null, pct1(t.p) + "%"));
      box.appendChild(rPick);

      const rBan = el("div", "h2h-statrow");
      rBan.appendChild(el("span", "mut", "Ban Rate"));
      rBan.appendChild(el("span", null, pct1(t.b) + "%"));
      box.appendChild(rBan);

      return box;
    }

    gridStats.appendChild(renderStatBox(heroA));
    gridStats.appendChild(renderStatBox(heroB));
    secTier.appendChild(gridStats);
    results.appendChild(secTier);
  }

  paintSlotsAndResults();
  renderDock("h2h", null);
}

/* ---------- router & boot ---------- */
function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [path] = hash.split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) renderHome();
  else if (parts[0] === "draft") renderDraft();
  else if (parts[0] === "favorit") renderFavorit();
  else if (parts[0] === "quiz") renderQuiz();
  else if (parts[0] === "items") renderItems();
  else if (parts[0] === "tier") renderTier();
  else if (parts[0] === "h2h") renderH2H();
  else if (parts[0] === "tentang") renderTentang();
  else if (parts[0] === "more") renderTentang();
  else if (parts[0] === "hero" && parts[1]) renderHero(parts[1]);
  else renderHome();
  scrollTo(0, 0);
}
async function boot() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
  const dock = $(".dock");
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--dock-h", dock.offsetHeight + "px");
  }).observe(dock);
  try {
    // data.json dipecah jadi 2 chunk (batas argumen Vercel MCP ~128 KB per file).
    // items.json terpisah karena itemDetails bikin chunk melewati batas upload.
    const itemsP = fetch("items.json").then(r => r.json()).catch(() => null);
    const tiersP = fetch("tiers.json").then(r => r.json()).catch(() => null);
    const [d1, d2, itemsD, tiersD] = await Promise.all([
      fetch("data-1.json").then(r => r.json()),
      fetch("data-2.json").then(r => r.json()),
      itemsP,
      tiersP,
    ]);
    HEROES = [...d1.heroes, ...d2.heroes];
    ITEM_DETAILS = (itemsD && itemsD.itemDetails) || d1.itemDetails || d2.itemDetails || {};
    TIER_DATA = tiersD || null;
  } catch {
    $("#main").replaceChildren(el("p", "mut", "Gagal memuat data — buka lewat server lokal (mis. python3 -m http.server), bukan file://."));
    return;
  }
  for (const h of HEROES) {
    byId.set(h.id, h);
    bySlug.set(slug(h.en), h);
  }
  window.addEventListener("hashchange", route);
  route();
  getDeviceId();
  startSyncPolling();
  if (getSyncAccount()) {
    syncPull().catch(() => {});
  }
  flushUsulanQueue().catch(() => {});
}
boot();
