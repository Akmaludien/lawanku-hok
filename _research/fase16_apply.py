"""Fase 16: isi counter untuk 4 hero tanpa counter (Annette, Butterfly, Florentino, Lorion).
Riset oleh koordinator + 4 agen, cek silang, spot-check Annette via GamingOnPhone.
Keputusan edit:
- Alasan Liang (Lorion): buang instruksi internal "Jangan naikkan ke hard."
- Alasan Lu Bu (Florentino): buang angka "tier C, win rate ~48,4%" (tidak terverifikasi).
- Item baru needsReview=False (sudah lewat riset + cek silang).
"""
import json, re, shutil

shutil.copy("data.json", "_research/data.json.fase16.bak")
raw = open("data.json", encoding="utf-8").read()
m = re.search(r'\n( +)"version"', raw)
indent = len(m.group(1)) if m else 1
trailing_nl = raw.endswith("\n")

d = json.loads(raw)
by_id = {h["id"]: h for h in d["heroes"]}
by_name = {h["en"]: h for h in d["heroes"]}

def C(hero, strength, why):
    assert hero in by_name, f"nama counter tidak ada di data: {hero}"
    return {"hero": by_name[hero]["id"], "strength": strength, "why": why}

def I(tag, items, why):
    return {"tag": tag, "items": items, "why": why, "needsReview": False}

def set_hero(hid, counters, howto, items=None):
    h = by_id[hid]
    assert not h.get("naturalCounters"), f'{h["en"]} sudah punya counter!'
    assert h["en"] in ("Annette", "Butterfly", "Florentino", "Lorion")
    h["naturalCounters"] = counters
    h["howToPlayAgainst"] = howto
    if items:
        assert not h.get("itemCounters"), f'{h["en"]} sudah punya item!'
        h["itemCounters"] = items

set_hero(640, [
    C("Gao Changgong", "hard", "Annette gak punya skill reveal dan gak punya hard CC, jadi Gao bisa muncul dari stealth dan langsung one-combo badannya yang tipis sebelum dia sempat channel ult. Lingkaran slow skill 1-nya gampang dihindari kalau musuhnya gak kelihatan."),
    C("Arke", "hard", "Sama kayak Gao: stealth + burst dari belakang bikin semua alat peel Annette (slow lingkaran, tembok ult) gak kepake, soalnya dia baru sadar pas Arke udah nempel. Annette juga gak punya dash kabur beneran — skill 2-nya cuma lompatan recoil kecil."),
    C("Lu Bu", "hard", "True damage Lu Bu nembus semua shield Annette (shield skill 2 + shield item roam), jadi satu-satunya pertahanan timnya jadi gak ada gunanya. Ult lompatannya juga bisa ditiming abis tembok ult Annette kelar (cuma 4 detik), atau dive dia sebelum dia sempat ult."),
    C("Sima Yi", "soft", "Silence Sima Yi bikin Annette gak bisa casting ult — dan ult Annette itu harus dipencet sebelum CC nempel, bukan buat ngelepas CC. Abis di-silence, badannya yang tipis tinggal di-burst. Tapi kalau Annette sempat channel duluan, temboknya bisa nendang Sima Yi balik, jadi masih bisa dilawan."),
], "Jangan dive membabi buta ke dalam tembok ult-nya — tunggu 4 detik sampai temboknya hilang atau poke dari luar jangkauannya, dan kunci dia pakai CC sebelum dia sempat channel ult, soalnya ult-nya cuma kebal CC, bukan ngelepas CC yang udah nempel.")

set_hero(646, [
    C("Donghuang", "hard", "Butterfly harus dive masuk buat eksekusi, dan begitu dia lompat, Donghuang tinggal tekan ult — suppression-nya nggak bisa di-purify dan tembus CC immunity, jadi dia kekunci di tengah musuh tanpa bisa pakai skill atau kabur. Donghuang juga tebal, jadi Butterfly nggak bisa burst dia buat reset ult-nya."),
    C("Mozi", "hard", "Skill 2 Mozi itu stun jarak jauh — Butterfly bisa distop sebelum sempat nempel ke carry, dan kalau dia nekat dive, ult Mozi ngunci dia di zona stun beruntun. Dia nggak punya cleanse buat lepas dari rantai CC itu."),
    C("Mulan", "hard", "Begitu mark Mulan numpuk 5, Butterfly kena silence + slow 90% — rantai skill-nya putus dan dia nggak bisa reset apa-apa. Pindah ke heavy sword, Mulan nahan burst-nya pakai damage reduction + super armor, terus dibalas knock-up."),
    C("Lu Bu", "hard", "Butterfly nggak bisa burst Lu Bu — shield skill 2-nya numpuk sampai 3 lapis terus berubah jadi heal, dan true damage Lu Bu nembus shield skill 1 Butterfly. Kena ult-nya, dia keangkat dan melambat di killing field, sementara kill yang dia butuhin buat reset ult malah nggak kejadian."),
    C("Han Xin", "soft", "Han Xin punya tiga dash + knock-up di mana-mana, jadi dia bisa ngindarin lompatan ult Butterfly dan motong kombo-nya, apalagi ult-nya kebal CC. Tapi ini duel sesama assassin — kalau Butterfly nangkep dia pas dash-nya habis, tetap bisa mati. Bonus: Han Xin bisa invade jungle-nya di awal dan telatin level 4 Butterfly."),
], "Jangan kasih dia kill — tiap kill nge-reset skill-nya, jadi jangan jalan sendirian pas HP sekarat dan tetaplah dekat tim atau minion. Simpan CC buat momen dia dive, dan tekan dia di awal sebelum level 4 biar gank-nya nggak jadi.",
[ I("anti-burst", "Destiny (anti-mati)", "Butterfly itu burst fisik yang ngincar hero HP rendah — Destiny nyelamatin kamu sekali dari eksekusinya.") ])

set_hero(631, [
    C("Donghuang", "hard", "Ult Donghuang itu suppress yang gak bisa dihapus Purify, jadi kebal CC dari ult Florentino gak ada gunanya — begitu dia masuk mode duel, Donghuang tinggal kunci dia di tempat dan kombo bunga-bunganya langsung mati."),
    C("Liang", "hard", "Sama kayak Donghuang: ult Liang itu suppress jarak jauh yang nembus kebal CC, jadi Florentino yang lagi asyik mungutin bunga dan nge-reset skill 2 tiba-tiba kekunci diam di tempat. Catatan: ini counter konteks teamfight, bukan lane — Liang itu mid/roam, jadi butuh tim yang follow-up burst selagi dia kekunci."),
    C("Lu Bu", "soft", "True damage Lu Bu gak peduli armor dan build semi-tank Florentino, dan dia cukup tebal buat nemenin duel panjangnya sampai habis. Catatan: Florentino jauh lebih lincah dan bisa kabur dari skill Lu Bu yang lambat, jadi ini cuma soft, bukan jawaban pasti."),
    C("Gao Changgong", "soft", "Gao nyergap dari stealth dan nge-burst sebelum Florentino sempat mulai loop bunga + skill 2-nya, dan bonus damage ke musuh yang sendirian itu pas banget menghukum Florentino yang doyan duel terpisah dari tim. Catatan: kalau one-shot-nya gagal, Florentino bisa balik badan pakai sustain + kebal CC ult-nya; dan ini counter dari jungle, bukan lawan lane."),
], "Jangan layanin duel 1v1 sendirian — itu habitatnya. Bikin skill 1-nya meleset dan jauhi bunga-bunganya biar kombo dia putus, lalu kunci dia pakai suppress (Donghuang/Liang) pas dia ult, karena CC biasa mental sama kebal control-nya.",
[ I("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Sustain Florentino datang dari heal basic attack ter-enhance-nya yang digandakan saat ult — anti-heal memotong napas duelnya tepat di sumbernya.") ])

set_hero(635, [
    C("Gao Changgong", "hard", "Gao Changgong masuk pakai stealth, jadi zoning orb Lorion nggak guna — dia baru kelihatan pas udah nempel, terus burst ke Lorion yang tipis dan sendirian sebelum Lorion sempat terbang ke orb atau cast ult."),
    C("Arke", "hard", "Sama kayak Gao: Arke nyergap dari stealth dari belakang, one-combo sebelum Lorion sempat bereaksi. Lorion nggak punya reveal dan nggak punya hard CC instan — satu-satunya CC-nya ult yang delay 2 detik, gampang dihindari atau keburu mati duluan."),
    C("Kongming", "soft", "Kongming bisa dash berkali-kali, jadi gampang ngehindarin jalur orb dan ledakan ult Lorion yang delay, terus burst balik ke Lorion yang tipis. Di lane mid langsung, ini matchup yang memang nggak enak buat Lorion."),
    C("Sima Yi", "soft", "Silence Sima Yi motong rantai skill Lorion — Lorion butuh cast skill beruntun buat meledakin orb, dan kalau kena silence dia nggak bisa cast Darkness Falls buat kabur. Dive-nya juga nempel terus ke mage tipis."),
    C("Liang", "soft", "Ult Liang itu suppress yang nggak bisa dilepas Purify, jadi kalau kena sebelum Lorion terbang, Lorion kekunci dan nggak bisa kabur pakai Darkness Falls. Tapi syaratnya ketat: harus nangkep dia sebelum terbang — kalau Lorion udah mendarat dan kebal CC, atau dia poke dari luar jangkauan Liang, Liang nggak bisa apa-apa."),
], "Jauhin orb-nya dan jangan berdiri di tempat orb ditaruh — semua damage dan ult Lorion berpusat di situ. Serang pas orb masih nempel di badannya atau setelah dia terbang (escape-nya habis), dan keluar dari area ult-nya selama delay 2 detik sebelum meledak.",
[ I("anti-burst", "Succubus Cloak", "Semua damage Lorion itu magic burst satu kombo + ult, jadi shield magic Succubus Cloak menahan kombo-nya.") ])

out = json.dumps(d, ensure_ascii=False, indent=indent)
open("data.json", "w", encoding="utf-8").write(out + ("\n" if trailing_nl else ""))

for i, part in enumerate([d["heroes"][0:60], d["heroes"][60:120]]):
    chunk = {"version": d["version"], "heroes": part}
    c = json.dumps(chunk, ensure_ascii=False, indent=1)
    open(f"data-{i+1}.json", "w", encoding="utf-8").write(c + "\n")

# --- verifikasi ---
d2 = json.load(open("data.json"))
ids = {h["id"] for h in d2["heroes"]}
total_c = sum(len(h.get("naturalCounters") or []) for h in d2["heroes"])
total_i = sum(len(h.get("itemCounters") or []) for h in d2["heroes"])
empty_why = [h["en"] for h in d2["heroes"] for c in (h.get("naturalCounters") or []) if not c.get("why")]
bad_ref = [c["hero"] for h in d2["heroes"] for c in (h.get("naturalCounters") or []) if c["hero"] not in ids]
self_c = [h["en"] for h in d2["heroes"] for c in (h.get("naturalCounters") or []) if c["hero"] == h["en"]]
no_counter = [h["en"] for h in d2["heroes"] if not h.get("naturalCounters")]
no_howto = sum(1 for h in d2["heroes"] if not h.get("howToPlayAgainst"))
no_item = sum(1 for h in d2["heroes"] if not h.get("itemCounters"))
max_c = max(len(h.get("naturalCounters") or []) for h in d2["heroes"])
print(f"total counter: {total_c} (target 531)")
print(f"total item: {total_i} (target 116)")
print(f"why kosong: {empty_why or 'tidak ada'}")
print(f"counter ke hero tak dikenal: {bad_ref or 'tidak ada'}")
print(f"self-counter: {self_c or 'tidak ada'}")
print(f"hero tanpa counter: {no_counter or 'tidak ada'}")
print(f"tanpa howToPlayAgainst: {no_howto} (target 19), tanpa item: {no_item} (target 31)")
print(f"maks counter per hero: {max_c} (target <=5)")
assert total_c == 531 and total_i == 116 and not empty_why and not bad_ref and not self_c and not no_counter and max_c <= 5
print("OK — data.json + chunk valid")
