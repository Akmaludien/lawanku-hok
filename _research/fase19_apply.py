"""Fase 19: isi howToPlayAgainst (19 hero) + itemCounters (27 hero).
Riset oleh koordinator + 6 agen, cek silang. 3 hero TIDAK ADA item (Da Qiao,
Dunshan, Yaria — tidak ada paket yang menyentuh sumber kekuatannya);
Annette tetap tanpa item (keputusan Fase 16). Item baru needsReview=False
(sudah lewat riset + cek silang). Catatan koordinator yang TIDAK masuk data:
alternatif yang ditolak, angka yang belum terverifikasi, dan flag meragukan
(Menki anti-tank sedang, Garo anti-autoattack paling meragukan, Flowborn
Roamer anti-heal sedang-tinggi, Devara data early-patch S15).
"""
import json, re, shutil

shutil.copy("data.json", "_research/data.json.fase19.bak")
raw = open("data.json", encoding="utf-8").read()
m = re.search(r'\n( +)"version"', raw)
indent = len(m.group(1)) if m else 1
trailing_nl = raw.endswith("\n")

d = json.loads(raw)
by_id = {h["id"]: h for h in d["heroes"]}
pkgs = {(ic["tag"], ic["items"]) for h in d["heroes"] for ic in (h.get("itemCounters") or [])}

HOWTO = {
    545: "Jangan jalan sendirian pas HP sekarat — ultinya ngunci satu orang dan makin sakit kalau HP udah tipis, jadi tetap dekat tim biar ada yang bantu nahan satu tembakannya. Jangan kejar dia masuk ke asap skill 2-nya, soalnya dia bisa ngilang lalu terbang ke arah carry kalian.",
    514: "Jangan duel lama sendirian — makin lama dia mukul, Fury-nya makin penuh, damage reduction naik dan pas penuh dia nge-heal gede justru pas HP-nya sekarat, jadi burst bareng tim atau kite dari jauh, dan simpan CC buat sebelum dia mulai Meteor Kill.",
    519: "Jangan buang skill pas dia terbang jadi naga — selama di udara dia nggak bisa ditarget, jadi simpan CC buat pas dia mendarat. Jangan bergerombol juga, soalnya habis mendarat basic attack-nya kena sampai dua musuh tambahan, dan jangan ajak adu poke lama-lama karena skill airnya bisa nge-heal dia.",
    517: "Jangan ajak dia duel panjang sendirian — dia nempel lewat Soul Resonance, heal dari skill 2 dan ult, lalu bisa eksekusi pas HP-mu sekarat di Seer State. Simpan CC buat pas dia sudah commit masuk, dan jangan kabur lurus lewat tembok karena jalurnya bikin dia makin cepat.",
    177: "Jangan kejar dia ke semak atau hutan — pasifnya bikin dia makin cepat dan bisa lompat keluar semak, sementara trap-nya yang tak terlihat bisa manggil serigala dan ngasih tahu posisimu. Tahan CC buat momen ult-nya, saat dia bisa nembak sambil jalan, lalu burst bareng tim karena dia tetap tipis.",
    172: "Jangan kasih dia mukul gratis — tiap basic attack nge-heal dia dan numpuk Fighting Spirit yang attack speed-nya bisa tembus cap, jadi burst + CC dia di awal sebelum stack-nya penuh, dan jangan lanjutin duel panjang pas dia lagi ult.",
    159: "Habisi Dolia dulu sebelum war besar — selama dia masih hidup, ult-nya bisa me-reset skill/ult temanmu dan memberi mereka giliran kedua. Jangan kejar dia ke kolam airnya, di sana dia nge-heal dan susah di-slow.",
    577: "Kalau kena mark dari skill 2-nya, cepat tempel teman yang kena mark juga biar damage-nya berhenti, dan jangan kasih dia heal gratis — burst satu target sampai mati sebelum dia sempat nempelin heal ke dua orang sekaligus, karena kalau dua yang di-bless itu berdekatan, heal-nya makin deras.",
    583: "Jangan kasih dia numpuk Flow gratis — tiap Convergence dan Claw Flurry nambah stack yang bisa dia tukar jadi dash dan ult ekstra, dan ult-nya kebal CC. Jaga jarak pas HP-mu sekarat, simpan CC buat setelah ult-nya selesai, dan jangan kejar dia sendirian ke semak.",
    582: "Jangan bergerombol — basic attack empowered-nya nge-chain ke musuh di dekatmu dan beam ult-nya nyambung ke yang berdekatan, jadi jaga jarak satu sama lain. Tekan dia sebelum stack Flow-nya penuh, dan gas pas Convergence-nya habis dipakai karena itu sumber heal + reset cooldown-nya.",
    584: "Jangan berdiri bergerombol di depannya — basic attack yang sudah penuh Flow bisa menembus dan kena banyak orang sekaligus, jadi sebar posisi dan dive dia saat ult Arrowstorm-nya lagi jalan. Paksa dia pakai dash dari skill 2-nya dulu, baru kejar lagi setelah dash-nya habis.",
    585: "Jangan war di atas platform-nya — di sana timnya dapat shield, vision, dan jangkauan skill yang lebih jauh, jadi pancing mereka keluar atau serang dari arah lain. Burst satu target sampai mati sebelum gelombang heal ult-nya sampai, karena kalau war-nya berlarut-larut, dia bisa nge-heal dan nge-reset cooldown timnya terus-terusan.",
    581: "Jangan buang semua CC dan burst ke dia di awal — dia tebal, dapat shield dari Power From Within, dan heal dari Convergence, jadi fokusmu itu jaga carry dari lompatan All In-nya. Sebar posisi biar knock-up-nya nggak kena ramai-ramai, dan serang balik pas skill engage-nya sudah dipakai.",
    521: "Jangan duel sendirian pas dia full kristal — mark-nya bisa jadi true damage + stun, dan ult-nya narik kamu duel 1v1 dengan shield + imun 2 detik. Pancing skill-nya habis buat clear wave, lalu gas bareng tim saat kristalnya kosong dan ult-nya cooldown, dan tahan CC sampai imunnya habis.",
    563: "Jangan cicil dia — poke pelan cuma di-heal balik lewat mark dan ult-nya, jadi all-in burst bareng tim dalam sekali jalan. Jangan kejar dia habis ult karena dia balik ke posisi awalnya.",
    547: "Jangan kasih dia mukul bebas dari belakang — serpent blade-nya makin kencang kalau dia terus menyerang, jadi dive atau CC dia duluan dan jangan berdiri di jalur ular api skill 2-nya. Pas ult-nya aktif, sebar posisi dan jangan asal keroyok, karena Fury-nya terisi dari serangan yang dia berikan maupun terima, dan saat penuh dia melontarkan area di sekitarnya.",
    564: "Jangan buang CC sembarangan — dia bisa nge-dodge pakai lompatan skill 2 yang kasih immunity + damage reduction, jadi poke dari jauh, tunggu lompatannya habis, baru CC dan burst bareng tim sebelum heal-nya nutupin damage kamu.",
    558: "Jangan asal all-in buat bunuh dia pas ult-nya masih siap — kalau mati dalam kondisi itu dia bisa bangkit lagi dan meledak di sekitarmu, jadi pancing ult-nya dulu atau habisi HP sementara Indomitable-nya, baru commit. Jangan juga duel panjang, mark dari skill 1 lalu skill 2 bikin dia nge-heal dan makin sakit.",
    138: "Jangan buang satu hit besar ke dia — pasifnya bisa dodge sekali pas 5 stack, jadi kunci dulu pakai CC (dodge-nya nggak nge-block CC), baru burst. Jangan diem di zona gunung kabutnya dan jangan jalan sendiri HP sekarat, ult-nya bisa terbang lintas map buat nge-pick kamu.",
}

ITEMS = {
    514: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Heal pasif Fury saat stack penuh — makin sekarat makin besar — adalah sumber comeback duelnya, jadi anti-heal memotong langsung mesin sustain itu."),
    199: ("anti-autoattack", "Spikemail (aktifkan manual) / Ominous Premonition", "Arli hidup dari basic attack beruntun buat numpuk mark Falling Leaves sampai meledak, jadi pantulan Spikemail dan pelambat attack speed Ominous langsung memotong mesin damage-nya."),
    177: ("anti-autoattack", "Spikemail (aktifkan manual) / Ominous Premonition", "Damage utama Chano adalah basic attack berkelanjutan (fisik) plus serangan serigala saat ult, jadi pantulan Spikemail dan pengurang attack speed dari Ominous Premonition langsung memotong sumber damage-nya."),
    536: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Splash Fount memulihkan HP di tiap tusukan dari 6 tusukannya, jadi anti-heal langsung memotong sustain yang membuat kombo beruntunnya sulit dihentikan."),
    537: ("anti-burst", "Succubus Cloak", "Semua damage skill-nya berskala Magical Attack dan burst petirnya memuncak saat bar Energy penuh + ult, jadi magic defense + shield anti-magic Succubus Cloak langsung meredam sumber damage-nya."),
    159: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Skill 2-nya (Wavebreaker) bikin kolam air yang nge-heal teman di sekitarnya, jadi anti-heal langsung memangkas sumber sustain utama timnya."),
    577: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Heal adalah inti kit-nya — skill 1 Heartlink dan ult Destined Encounter menyembuhkan satu tim sekaligus, jadi anti-heal langsung memangkas sustain yang bikin timnya susah mati di war."),
    173: ("anti-autoattack", "Spikemail (aktifkan manual) / Ominous Premonition", "Damage Fang datang dari basic attack yang menumpuk Dark Mark sampai meledak, jadi pantulan Spikemail dan pelambat attack speed Ominous langsung menghambat ledakan mark-nya."),
    583: ("anti-burst", "Destiny (anti-mati)", "Ult Mortal Talons dan Claw Flurry beruntun bisa menghabisi target sekarat dalam satu dive, jadi Destiny menahan burst finisher-nya."),
    582: ("anti-burst", "Succubus Cloak", "Damage utamanya magic DoT berulang — orb Starflow Cascade, beam Arcane Arts, dan basic attack empowered yang nge-chain — jadi shield magic meredam cicilan itu di tiap trade."),
    584: ("anti-autoattack", "Spikemail (aktifkan manual) / Ominous Premonition", "Damage utama varian Marksman ini adalah basic attack yang diperkuat Flow (menembus, crit) plus poke jarak jauh, jadi pantulan Spikemail dan pengurang attack speed dari Ominous Premonition langsung memotong sumber damage-nya."),
    585: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Ult-nya Lingering Melody adalah group heal yang menyembuhkan semua teman yang kena gelombangnya, jadi anti-heal langsung memangkas penyelamat utama timnya di war panjang."),
    508: ("anti-autoattack", "Spikemail (aktifkan manual) / Ominous Premonition", "Garo hampir seluruh damage-nya dari basic attack crit jarak jauh yang berkelanjutan, jadi pantulan Spikemail dan pelambat attack speed Ominous langsung memotong DPS-nya begitu dia menyerangmu."),
    189: ("anti-cc", "Boots of Resistance + Purify (spell)", "Kombo intinya adalah tarik + stun massal dari skill 2 The Animist setelah dia mendekat diam-diam, jadi tenacity + Purify membuatmu bisa lepas dari tarikannya sebelum burst susulan timnya masuk."),
    563: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Heino memulihkan HP dari Skill 1 mode melee, Skill 2 mode melee, dan ult Fate Rewind — anti-heal memotong loop sustain yang bikin dia susah dibunuh di fight panjang."),
    111: ("anti-burst", "Destiny (anti-mati)", "Damage Lady Sun datang dalam sekali ledakan — tembakan Rolling Raid yang diperkuat plus Ultimate Shell — jadi Destiny memberi kesempatan selamat dari burst yang seharusnya membunuh itu."),
    528: ("anti-burst", "Destiny (anti-mati)", "Pasif Hunter memberi true damage tambahan ke target di bawah 30% HP, jadi armor tidak menahan eksekusinya — Destiny yang menahan burst/eksekusi itu."),
    547: ("anti-autoattack", "Spikemail (aktifkan manual) / Ominous Premonition", "Damage utama Luara adalah basic attack/serpent blade berkelanjutan yang skalanya dari attack speed, jadi pantulan Spikemail dan pengurang attack speed dari Ominous Premonition langsung memotong mesin damage-nya."),
    564: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Heal-nya berlapis di hampir semua kombo — skill 2, kombo 1-2, kombo 2-2, plus pasif saat diam — jadi anti-heal memotong alasan dia bisa menang duel panjang."),
    524: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Saat bar Anger-nya penuh dan masuk mode Excited, kelebihan Anger memulihkan HP-nya, jadi anti-heal langsung memotong sustain yang membuatnya betah di lane dan di fight panjang."),
    198: ("anti-tank", "Overlord's Might / Starbreaker (armor pen)", "Pasif Dream-eating menumpuk Mass yang menaikkan Physical Attack sekaligus Physical dan Magical Defense, jadi makin lama duel dia makin tebal — armor pen menembus pertahanan yang dia tumpuk itu."),
    179: ("anti-burst", "Destiny (anti-mati)", "Ult global-nya bisa menembak dari luar layar dan mengeksekusi hero HP rendah, jadi Destiny menyelamatkanmu sekali dari one-shot snipe itu."),
    502: ("anti-burst", "Destiny (anti-mati) / Ominous Premonition", "Kombonya campuran poke magic bentuk manusia dan terjang burst fisik bentuk harimau dengan attack speed tinggi, jadi Destiny menahan kombo pembukanya sementara Ominous Premonition memperlambat follow-up harimaunya."),
    138: ("anti-burst", "Succubus Cloak", "Damage utamanya poke magic DoT + slow dari Misty Mountain dan Endless River, jadi shield magic Succubus Cloak meredam cicilan itu sebelum dia bisa mengulang combo."),
    125: ("anti-burst", "Destiny (anti-mati)", "Dia assassin burst fisik yang mengunci kill lewat boneka + kombo string-nya, jadi Destiny yang meniadakan fatal damage langsung menggagalkan momen pick-off itu."),
    197: ("anti-burst", "Succubus Cloak", "Damage-nya ledakan magic dari stack mark di dalam papan ult + tarikan Skill 2 yang datang bertubi-tubi, jadi shield magic meredam tiap hit itu selama kamu terjebak 4 detik di papan."),
    176: ("anti-heal", "Mortal Punisher (fisik) / Venomous Staff (magic)", "Seluruh kit-nya berputar pada heal — mode Peace memulihkan tim tiap cast dan ult-nya heal besar — jadi anti-heal memotong nilai terbesar yang dia bawa ke teamfight."),
}

for hid, text in HOWTO.items():
    h = by_id[hid]
    assert not h.get("howToPlayAgainst"), f'{h["en"]} sudah punya howto!'
    h["howToPlayAgainst"] = text

for hid, (tag, items, why) in ITEMS.items():
    h = by_id[hid]
    assert not h.get("itemCounters"), f'{h["en"]} sudah punya item!'
    assert (tag, items) in pkgs, f"paket tidak dikenal: {(tag, items)}"
    h["itemCounters"] = [{"tag": tag, "items": items, "why": why, "needsReview": False}]

out = json.dumps(d, ensure_ascii=False, indent=indent)
open("data.json", "w", encoding="utf-8").write(out + ("\n" if trailing_nl else ""))

for i, part in enumerate([d["heroes"][0:60], d["heroes"][60:120]]):
    chunk = {"version": d["version"], "heroes": part}
    c = json.dumps(chunk, ensure_ascii=False, indent=1)
    open(f"data-{i+1}.json", "w", encoding="utf-8").write(c + "\n")

# --- verifikasi ---
d2 = json.load(open("data.json"))
total_i = sum(len(h.get("itemCounters") or []) for h in d2["heroes"])
no_howto = [h["en"] for h in d2["heroes"] if not h.get("howToPlayAgainst")]
no_item = [h["en"] for h in d2["heroes"] if not h.get("itemCounters")]
empty_why = [h["en"] for h in d2["heroes"] for c in (h.get("itemCounters") or []) if not c.get("why")]
from collections import Counter
tags = Counter(ic["tag"] for h in d2["heroes"] for ic in (h.get("itemCounters") or []))
print(f"total item: {total_i} (target 143)")
print(f"tanpa howto: {no_howto or 'tidak ada'}")
print(f"tanpa item: {no_item} (target ['Annette', 'Da Qiao', 'Dunshan', 'Yaria'])")
print(f"item why kosong: {empty_why or 'tidak ada'}")
print(f"per tag: {dict(tags)}")
assert total_i == 143 and not no_howto and sorted(no_item) == ["Annette", "Da Qiao", "Dunshan", "Yaria"] and not empty_why
print("OK — data.json + chunk valid")
