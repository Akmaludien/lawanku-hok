"""Fase 20: Arli — TUKAR Di Renjie → Donghuang (hard).
Terverifikasi 9 Nov 2026 (koordinator + 4 agen, cek silang): ult Donghuang
adalah suppress — mematikan total dash/teleport payung Arli; Arli tidak
punya skill pembersih. Di Renjie diganti karena alasannya paling lemah
di data kami (anekdot KPL tanpa mekanik). Daji terverifikasi soft tapi
slot sama — ditahan sebagai cadangan, TIDAK masuk.
Swap hard→hard: total counter tetap 531 (243 hard, 288 soft). Tier list
dihitung ulang otomatis — Donghuang +2, Di Renjie −2.
"""
import json, re, shutil
from collections import Counter

shutil.copy("data.json", "_research/data.json.fase20.bak")
raw = open("data.json", encoding="utf-8").read()
m = re.search(r'\n( +)"version"', raw)
indent = len(m.group(1)) if m else 1
trailing_nl = raw.endswith("\n")

d = json.loads(raw)
by_en = {h["en"]: h for h in d["heroes"]}
arli = by_en["Arli"]
donghuang = by_en["Donghuang"]
direnjie = by_en["Di Renjie"]

# tier sebelum (untuk bandingkan)
def tier_dist(heroes):
    given = Counter(); taken = Counter()
    for h in heroes:
        for c in h["naturalCounters"]:
            tgt = next(x for x in heroes if x["id"] == c["hero"])
            w = 2 if c["strength"] == "hard" else 1
            given[h["en"]] += w; taken[tgt["en"]] += w
    dist = Counter()
    scores = {}
    for h in heroes:
        s = given[h["en"]] - taken[h["en"]]
        scores[h["en"]] = s
        dist["S" if s >= 10 else "A" if s >= 5 else "B" if s >= 0 else "C" if s >= -4 else "D"] += 1
    return dist, scores

dist_before, scores_before = tier_dist(d["heroes"])
print("tier sebelum:", dict(dist_before), "| Donghuang:", scores_before["Donghuang"], "| Di Renjie:", scores_before["Di Renjie"])

assert len(arli["naturalCounters"]) == 5
assert any(c["hero"] == direnjie["id"] for c in arli["naturalCounters"]), "Di Renjie tidak ada di counter Arli!"
assert not any(c["hero"] == donghuang["id"] for c in arli["naturalCounters"]), "Donghuang sudah ada!"

arli["naturalCounters"] = [c for c in arli["naturalCounters"] if c["hero"] != direnjie["id"]]
arli["naturalCounters"].append({
    "hero": donghuang["id"],
    "strength": "hard",
    "why": "Begitu ultinya Donghuang kena, Arli nggak bisa gerak sama sekali — dash dan teleport ke payungnya mati total, dan Arli yang tipis tinggal jadi sasaran empuk tim musuh. Arli juga nggak punya skill pembersih buat lepas dari kuncian itu.",
})

out = json.dumps(d, ensure_ascii=False, indent=indent)
open("data.json", "w", encoding="utf-8").write(out + ("\n" if trailing_nl else ""))

for i, part in enumerate([d["heroes"][0:60], d["heroes"][60:120]]):
    chunk = {"version": d["version"], "heroes": part}
    c = json.dumps(chunk, ensure_ascii=False, indent=1)
    open(f"data-{i+1}.json", "w", encoding="utf-8").write(c + "\n")

# --- verifikasi ---
d2 = json.load(open("data.json"))
total = sum(len(h["naturalCounters"]) for h in d2["heroes"])
hard = sum(1 for h in d2["heroes"] for c in h["naturalCounters"] if c["strength"] == "hard")
soft = total - hard
a2 = next(h for h in d2["heroes"] if h["en"] == "Arli")
names = [next(x["en"] for x in d2["heroes"] if x["id"] == c["hero"]) for c in a2["naturalCounters"]]
dist_after, scores_after = tier_dist(d2["heroes"])
print(f"total counter: {total} (target 531) | hard: {hard} (243) | soft: {soft} (288)")
print("counter Arli:", names)
print("tier sesudah:", dict(dist_after), "| Donghuang:", scores_after["Donghuang"], "| Di Renjie:", scores_after["Di Renjie"])
assert total == 531 and hard == 243 and soft == 288
assert len(a2["naturalCounters"]) == 5 and "Donghuang" in names and "Di Renjie" not in names
assert all(isinstance(c["hero"], int) for h in d2["heroes"] for c in h["naturalCounters"])
print("OK — swap valid")
