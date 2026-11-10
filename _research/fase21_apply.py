"""Fase 21: harga + stat item (10 item/spell, semua TERVERIFIKASI S16).
Sumber: HoKStats (detail item, klaim data dari camp.honorofkings.com)
disilang hub-game.com — Destiny + Mortal Punisher diverifikasi 9 Nov 2026,
8 lainnya pada riset HoKStats/Fase 20. Venomous Staff MA +230 (bukan +240
HoKStats yang masih S15). Purify adalah spell (tanpa harga).
itemDetails dikunci ke string paket persis (8 paket unik di data.json) —
tanpa parsing, jadi tidak ada ambiguitas '/' vs '+'.
"""
import json, re, shutil

ITEM_DETAILS = {
    "Destiny (anti-mati)": [
        {"name": "Destiny", "price": 2060, "stats": "PA +75 · AS +15% · HP +500",
         "passive": "Dark Curtain: saat kena damage fatal, jadi kebal + 15% AS/MS selama 1 dtk (0,75 dtk buat ranged). CD 120 dtk."},
    ],
    "Destiny (anti-mati) / Ominous Premonition": [
        {"name": "Destiny", "price": 2060, "stats": "PA +75 · AS +15% · HP +500",
         "passive": "Dark Curtain: saat kena damage fatal, jadi kebal + 15% AS/MS selama 1 dtk (0,75 dtk buat ranged). CD 120 dtk."},
        {"name": "Ominous Premonition", "price": 2020, "stats": "PD +300 · HP +1200",
         "passive": "Cold Steel: saat menerima damage, kurangi AS penyerang 20–40% dan MS 7,5–15% selama 2,5 dtk. CD 3 dtk per target."},
    ],
    "Succubus Cloak": [
        {"name": "Succubus Cloak", "price": 2020, "stats": "MD +300 · HP +1100",
         "passive": "Mist Veil: perisai sihir 400–800 (+7% extra HP) tiap 15 dtk."},
    ],
    "Succubus Cloak / Destiny": [
        {"name": "Succubus Cloak", "price": 2020, "stats": "MD +300 · HP +1100",
         "passive": "Mist Veil: perisai sihir 400–800 (+7% extra HP) tiap 15 dtk."},
        {"name": "Destiny", "price": 2060, "stats": "PA +75 · AS +15% · HP +500",
         "passive": "Dark Curtain: saat kena damage fatal, jadi kebal + 15% AS/MS selama 1 dtk (0,75 dtk buat ranged). CD 120 dtk."},
    ],
    "Boots of Resistance + Purify (spell)": [
        {"name": "Boots of Resistance", "price": 700, "stats": "PD +50 · MD +100 · MS +50",
         "passive": "Tough: Resistance +25% (durasi CC lebih pendek). Bisa ganti gratis ke sepatu lain, CD 5 mnt."},
        {"name": "Purify", "price": None, "note": "spell · CD 120 dtk", "stats": "",
         "passive": "Hapus semua debuff dan CC kecuali suppress, lalu imun CC 1,5 dtk. CD 120 dtk."},
    ],
    "Spikemail (aktifkan manual) / Ominous Premonition": [
        {"name": "Spikemail", "price": 2020, "stats": "PA +45 · PD +300 · HP +700",
         "passive": "Countersiege (aktif): pantulkan 35% damage sebagai true damage selama 3 dtk. CD 75 dtk."},
        {"name": "Ominous Premonition", "price": 2020, "stats": "PD +300 · HP +1200",
         "passive": "Cold Steel: saat menerima damage, kurangi AS penyerang 20–40% dan MS 7,5–15% selama 2,5 dtk. CD 3 dtk per target."},
    ],
    "Mortal Punisher (fisik) / Venomous Staff (magic)": [
        {"name": "Mortal Punisher", "price": 2080, "stats": "PA +100 · AS +20% · Lifesteal fisik +20%",
         "passive": "Revive: pulih 375–750 HP selama 5 dtk saat HP di bawah 30% (CD 20 dtk). Imperil: serangan kurangi heal/lifesteal musuh 35% selama 2,5 dtk."},
        {"name": "Venomous Staff", "price": 2040, "stats": "MA +230 · CDR +7,5% · MS +7,5%",
         "passive": "Imperil: serangan kurangi pemulihan HP dan Lifesteal musuh 35% selama 2,5 dtk."},
    ],
    "Overlord's Might / Starbreaker (armor pen)": [
        {"name": "Overlord's Might", "price": 2540, "stats": "PA +150 · CDR +5%",
         "passive": "Siege Breaker: +30% damage ke musuh dengan HP di bawah 50%."},
        {"name": "Starbreaker", "price": 2080, "stats": "PA +90 · HP +700 · MS +7,5%",
         "passive": "Sunder: +30% Physical Pierce."},
    ],
}

shutil.copy("data.json", "_research/data.json.fase21.bak")
raw = open("data.json", encoding="utf-8").read()
m = re.search(r'\n( +)"version"', raw)
indent = len(m.group(1)) if m else 1
trailing_nl = raw.endswith("\n")

d = json.loads(raw)
assert "itemDetails" not in d
d2 = {"version": d["version"], "itemDetails": ITEM_DETAILS, "heroes": d["heroes"]}

out = json.dumps(d2, ensure_ascii=False, indent=indent)
open("data.json", "w", encoding="utf-8").write(out + ("\n" if trailing_nl else ""))

for i, part in enumerate([d["heroes"][0:60], d["heroes"][60:120]]):
    chunk = {"version": d["version"], "itemDetails": ITEM_DETAILS, "heroes": part}
    c = json.dumps(chunk, ensure_ascii=False, indent=1)
    open(f"data-{i+1}.json", "w", encoding="utf-8").write(c + "\n")

# --- verifikasi ---
d3 = json.load(open("data.json"))
pkgs = {c["items"] for h in d3["heroes"] for c in (h.get("itemCounters") or [])}
assert set(d3["itemDetails"].keys()) == pkgs, f"paket tidak cocok: {set(d3['itemDetails'].keys()) ^ pkgs}"
total = sum(len(h["naturalCounters"]) for h in d3["heroes"])
hard = sum(1 for h in d3["heroes"] for c in h["naturalCounters"] if c["strength"] == "hard")
items = sum(len(h.get("itemCounters") or []) for h in d3["heroes"])
comps = {c["name"] for v in d3["itemDetails"].values() for c in v}
prices = {c["name"]: c["price"] for v in d3["itemDetails"].values() for c in v}
print(f"counter: {total} (531) | hard: {hard} (243) | entri item: {items} (143)")
print(f"paket: {len(d3['itemDetails'])} (8) | komponen unik: {len(comps)} (10): {sorted(comps)}")
print("harga:", prices)
assert total == 531 and hard == 243 and items == 143
assert len(d3["itemDetails"]) == 8 and len(comps) == 10
assert all(c["price"] is None or isinstance(c["price"], int) for v in d3["itemDetails"].values() for c in v)
assert all(c["passive"] for v in d3["itemDetails"].values() for c in v)
for fn in ("data-1.json", "data-2.json"):
    ch = json.load(open(fn))
    assert ch["itemDetails"] == ITEM_DETAILS and len(ch["heroes"]) == 60
print("OK — itemDetails valid di data.json + kedua chunk")
