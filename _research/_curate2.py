# Kurasi counter alami HOK Counter (Fase 3a).
# 1) FILL: isi alasan yang kosong ("(tanpa alasan)") dengan alasan yang
#    didukung teks "Cara melawan" kedua hero di data asli / dump kurasi.
#    9 pasangan DIBIARKAN kosong karena kit hero counter-nya tidak ada di
#    sumber (Dyadia, Dolia, Wang Wei, Luara, Devara, Flowborn Roamer, dan
#    Agudo vs Sakeer) — jujur kosong lebih baik daripada mengarang.
# 2) CLEAN: buang disclaimer "Artikel lama, bisa berubah karena patch."
#    dari 94 alasan yang mekaniknya masih berlaku; perbaiki nama lokal
#    (Ying Zheng->Garuda, Gongsun Li->Arli, Zhang Liang->Liang),
#    "Thorns"->Spikemail, tulis ulang 2 alasan yang cuma "kata guide",
#    dan perluas 4 alasan yang terlalu pendek.
import json

FILL = {
("Agudo", "Meng Ya"): "Jangkauan super jauh Meng Ya mengalahkan Agudo yang harus mendekat dengan pet-nya — poke dari jauh dan jangan adu saat dia lagi mode semangat.",
("Agudo", "Luban No.7"): "Agudo tipis banget setelah memakai skill 3 — skill Luban yang bisa dihindari dari jauh tetap mengancamnya, dan meriam hiu ult-nya mengeksekusi HP rendah.",
("Angela", "Arli"): "Arli sangat lincah dengan dash bersudut sulit ditebak — skill Angela yang butuh prediksi arah sering meleset, dan begitu control-nya habis Arli masuk membunuhnya.",
("Arli", "Luban No.7"): "Arli tipis dan takut control — Luban menekan dari jauh dan ult hiu-nya bisa mengeksekusi Arli yang sekarat.",
("Arthur", "Huang Zhong"): "Arthur melee yang harus mendekat — jangkauan late game dan mode turret Huang Zhong membuatnya tidak bisa masuk; Arthur kalah sebelum sempat menyentuh.",
("Ata", "Ukyo Tachibana"): "Ukyo yang lincah bisa menghindari jebakan tembok Ata dan menyerang balik — gank dia setelah memakai skill 1.",
("Ata", "Mi Yue"): "Mi Yue kuat duel dan sulit ditangkap — skill 2-nya menguras HP Ata sambil memulihkan diri, dan ult-nya menghindar saat Ata mencoba membalas.",
("Ata", "Mai Shiranui"): "Mai yang lincah bisa masuk-keluar tanpa memberi Ata kesempatan membalas sambil regen — burst dive-nya mengenai Ata yang mengandalkan hit-and-run.",
("Ata", "Biron"): "Biron kuat di lane dengan lifesteal dan shield — dia bisa adu langsung dengan Ata dan menang trade berkat sustain-nya yang lebih besar.",
("Cai Yan", "Da Qiao"): "Cai Yan lemah kalau sendirian — Da Qiao bisa mengumpulkan tim dengan cepat untuk mengeroyok dan membunuhnya sebelum heal-nya jalan.",
("Charlotte", "Luna"): "Luna yang lincah bisa masuk di sela skill Charlotte dan membunuhnya sebelum skill-nya ke-enhance.",
("Charlotte", "Da Qiao"): "Charlotte butuh waktu menumpuk enhance — Da Qiao mengumpulkan tim untuk mengeroyoknya sebelum dia sempat menguat.",
("Devara", "Hou Yi"): "Hou Yi bisa poke Devara dari jauh selama jeda transformasinya — Devara yang cooldown-nya lama tidak bisa membalas.",
("Dharma", "Liu Bei"): "Liu Bei mengandalkan basic attack dan kebal control saat ult — dia bisa adu langsung dengan Dharma dan tidak takut ditendang ke tembok.",
("Di Renjie", "Fuzi"): "Di Renjie tidak punya dash — Fuzi bisa mendekat dan mengikatnya dengan ult, lalu membunuhnya sebelum dia kabur.",
("Erin", "Shouyue"): "Erin susah bertahan hidup — Shouyue yang one-shot dari jauh dengan skill 2 bisa membunuhnya sebelum dia sempat membalas.",
("Fang", "Mi Yue"): "Fang mengandalkan ledakan tanda dan dash — Mi Yue yang kuat duel bisa menguras HP-nya lewat skill 2 dan menghindar dengan ult saat Fang mencoba burst.",
("Fatih", "Dr Bian"): "Dr Bian mage jarak dekat yang bisa heal — dia bisa menahan duel dengan Fatih dan menggerogoti HP-nya dengan racun sambil menunggu ult Fatih habis.",
("Fatih", "Consort Yu"): "Consort Yu menyerang dari jauh dengan basic attack — dia bisa kite Fatih yang jangkauannya pendek dan menyerang dari luar jangkauan dash-nya.",
("Feyd", "Fatih"): "Feyd jago menghabisi musuh setelah level 4 — Fatih yang tebal dengan lifesteal ult sulit dihabisi sekali combo, dan bisa membalikkan keadaan.",
("Fuzi", "Kaizer"): "Fuzi mengandalkan ikatan ult dan damage reduction skill 2 — Kaizer yang tebal dengan shield dan dash bisa menahan kombo Fuzi dan menyerang balik.",
("Fuzi", "Da Qiao"): "Fuzi berbahaya saat fight jarak dekat — Da Qiao bisa memindahkan teman yang diikat Fuzi keluar dengan teleport, dan mengumpulkan tim untuk mengeroyoknya.",
("Guiguzi", "Xiang Yu"): "Guiguzi mengandalkan kejutan dari vision dan tarikan — Xiang Yu yang tebal bisa menahan tarikannya dan membalas dengan control, sehingga gank Guiguzi gagal.",
("Guiguzi", "Zhang Fei"): "Guiguzi mengandalkan serangan mendadak saat vision kurang — Zhang Fei yang tebal dengan energi penuh sulit dibunuh mendadak, dan raungannya membubarkan gank.",
("Lady Zhen", "Chicha"): "Lady Zhen mengandalkan control area yang bisa dihindari — Chicha yang sangat lincah bisa menghindari control-nya dan masuk membunuhnya.",
("Lady Zhen", "Arli"): "Lady Zhen mengandalkan control area — Arli yang lincah dengan dash sulit ditebak bisa menghindari control-nya dan membunuhnya dari dekat.",
("Lady Zhen", "Wang Zhaojun"): "Lady Zhen mengandalkan control area — Wang Zhaojun yang juga mage control bisa menekannya dari jauh dengan poke dan membekukannya lebih dulu.",
("Lian Po", "Dr Bian"): "Lian Po mengandalkan pasif menyerap damage saat cooldown — Dr Bian yang bisa heal dan memberi damage berkelanjutan bisa menggerogoti HP-nya sambil menunggu cooldown Lian Po habis.",
("Lian Po", "Biron"): "Lian Po cooldown skill-nya lama — Biron yang kuat di lane dengan lifesteal bisa menekannya di jeda cooldown dan menang trade.",
("Lian Po", "Arli"): "Lian Po mengandalkan control yang bisa dihindari — Arli yang lincah bisa menghindari skill-nya dan menyerang dari luar jangkauan.",
("Liu Bang", "Agudo"): "Agudo menyerang dengan pet dan basic attack beruntun — dia bisa menekan Liu Bang di lane dan memaksanya bertahan, sehingga teleport bantuannya terlambat.",
("Liu Bang", "Menki"): "Menki bisa menyerang Liu Bang dari jauh saat dia gendut dan menghindar saat kurus — Liu Bang yang mengandalkan control kesulitan menangkapnya.",
("Liu Bei", "Xiang Yu"): "Xiang Yu tank tebal yang bisa menahan basic attack Liu Bei — begitu ult Liu Bei habis, control Xiang Yu menguncinya.",
("Marco Polo", "Milady"): "Minion mekanik Milady bisa menahan Marco Polo yang harus mendekat untuk true damage — Milady menyerang dari jauh sementara minion-nya menghalangi.",
("Meng Ya", "Kui"): "Meng Ya mengandalkan bantuan jarak jauh dan mode semangat — hook Kui bisa menariknya keluar dari posisi aman dan memutus serangannya.",
("Meng Ya", "Lu Bu"): "Meng Ya harus menjaga jarak dan energinya — Lu Bu dengan true damage bisa menembus pertahanannya dan mengejarnya saat dia lengah.",
("Menki", "Arli"): "Menki lambat saat gendut dan tipis saat kurus — Arli yang lincah bisa kite dia dari jauh dan menyerang saat dia tipis.",
("Milady", "Zhou Yu"): "Milady mengandalkan minion mekanik — api Zhou Yu yang menyebar bisa membersihkan minion-nya dan menekannya dari jauh.",
("Milady", "Wang Zhaojun"): "Milady mengandalkan minion mekanik — poke dan control Wang Zhaojun dari jauh bisa membekukan Milady sebelum dia sempat menyiapkan minion.",
("Milady", "Lady Zhen"): "Milady mengandalkan minion mekanik — control area Lady Zhen bisa membekukan Milady dan timnya saat mereka berkumpul di sekitar minion.",
("Ming", "Fuzi"): "Ming harus menjaga jarak dengan rantai — Fuzi yang bisa mendekat dan mengikatnya dengan ult bisa membunuhnya begitu dia lengah.",
("Ming", "Zhang Fei"): "Ming mengandalkan rantai dan burst ult — Zhang Fei yang tebal bisa menahan damage-nya dan membalas dengan stun area saat Ming masuk.",
("Ming", "Liang"): "Ming mengandalkan rantai dari jarak — suppress Liang mengunci Ming dari fight selama durasi penuh, dan damage berkelanjutannya memutus rantai.",
("Nakoruru", "Agudo"): "Pet Agudo memberi target tambahan yang mengacaukan dive Nakoruru — Agudo bisa menyerang dari jauh sementara Nakoruru sibuk dengan pet.",
("Nakoruru", "Cirrus"): "Nakoruru mengandalkan dive setelah menandai — Cirrus yang bisa terbang dan poke dari jauh bisa menguras energinya dan menyerang saat dia mendarat.",
("Nakoruru", "Sun Bin"): "Nakoruru butuh control untuk dikunci — Sun Bin bisa memberi control dan silence untuk menghentikan dive-nya, lalu tim membunuhnya.",
("Nuwa", "Arli"): "Nuwa mengandalkan skill prediksi dan portal — Arli yang lincah dengan dash sulit ditebak bisa menghindari skill-nya dan masuk membunuhnya.",
("Nuwa", "Cai Yan"): "Cai Yan bisa heal tim dari poke Nuwa dan menguncinya dengan control skill 2 saat dia mencoba rotasi.",
("Pei", "Musashi"): "Musashi bisa menahan burst Pei dengan skill 1-nya dan membalas dengan ult — Pei yang gagal invade kehilangan ritme.",
("Pei", "Garuda"): "Garuda mage burst yang bisa menyerang Pei dari jauh — Pei yang harus mendekat untuk invade akan terkena burst sebelum sempat menyerang.",
("Shangguan", "Liu Bang"): "Shangguan mengandalkan terbang dengan ult — Liu Bang yang tebal dengan teleport bisa menahan burst-nya dan melindungi tim saat dia dive.",
("Shangguan", "Sima Yi"): "Shangguan mengandalkan ult terbang — Sima Yi yang lincah dengan silence bisa menghentikan kombo-nya dan membunuhnya sebelum dia sempat terbang.",
("Shangguan", "Kaizer"): "Shangguan mengandalkan ult terbang — Kaizer yang tebal dengan shield dan dash bisa menahan burst-nya dan mengejarnya saat dia mendarat.",
("Shouyue", "Hou Yi"): "Shouyue mengandalkan one-shot skill 2 dari jauh — Hou Yi yang menyerang dari jauh dengan basic attack bisa menekannya terus dan membunuhnya sebelum dia sempat membidik.",
("Sima Yi", "Menki"): "Sima Yi mengandalkan silence dan burst — Menki yang tebal dengan sustain bisa menahan kombo-nya dan membalas saat energinya habis.",
("Sima Yi", "Milady"): "Sima Yi mengandalkan silence dan burst jarak dekat — minion mekanik Milady bisa menghalangi jalannya dan menyerangnya dari jauh sebelum dia sempat masuk.",
("Sun Bin", "Arli"): "Sun Bin mengandalkan control yang bisa dihindari — Arli yang lincah bisa menghindari control-nya dan masuk membunuhnya setelah dia memakai skill.",
("Wukong", "Mi Yue"): "Wukong mengandalkan stealth dan crit burst — Mi Yue yang kuat duel bisa menguras HP-nya lewat skill 2 dan menghindar dengan ult saat Wukong muncul.",
("Yang Jian", "Ata"): "Yang Jian butuh mengenai skill 1-nya untuk kombo — Ata yang lincah dengan hit-and-run bisa menghindari dan menguras HP-nya sambil regen.",
("Yango", "Shouyue"): "Yango mengandalkan boneka yang tidak mendapat perlindungan — Shouyue yang one-shot dari jauh bisa menghancurkan bonekanya dan memaksanya pingsan.",
("Yango", "Guan Yu"): "Yango mengandalkan boneka — Guan Yu yang charge bisa mendorong dan mengacaukan posisi bonekanya, lalu mengejar badan aslinya.",
("Yaria", "Sima Yi"): "Yaria mengandalkan berubah jadi rusa untuk kabur — silence dan burst Sima Yi bisa menghentikannya sebelum dia sempat berubah, dan membunuhnya saat dia terjebak.",
("Yuhuan", "Hou Yi"): "Yuhuan mengandalkan sustain damage — Hou Yi yang menyerang dari jauh dengan basic attack bisa menekannya terus tanpa memberi kesempatan sustain.",
("Yuhuan", "Luban No.7"): "Yuhuan mengandalkan sustain damage — Luban yang menyerang dari jauh dengan skill area bisa menekannya dan mengeksekusi dengan ult hiu saat HP-nya rendah.",
("Yuhuan", "Lady Zhen"): "Yuhuan mengandalkan sustain damage — control area Lady Zhen bisa membekukannya dan menghentikan sustain-nya.",
("Yuhuan", "Wang Zhaojun"): "Yuhuan mengandalkan sustain damage — poke dan control Wang Zhaojun dari jauh bisa membekukannya sebelum dia sempat sustain.",
("Zhang Fei", "Mulan"): "Zhang Fei lemah saat energinya belum penuh — Mulan mode pedang ganda yang tipis tapi cepat bisa membunuhnya di jeda sebelum energinya penuh.",
("Zhuangzi", "Allain"): "Zhuangzi lemah kalau sendirian — Allain yang kuat duel jarak dekat bisa mem-pick-off dia saat terpisah dari tim.",
("Zilong", "Luna"): "Zilong kuat 1v1 di late — Luna yang lincah dengan dash beruntun bisa masuk-keluar tanpa memberinya duel, dan membunuhnya sebelum dia sempat menempel.",
("Zilong", "Liu Bei"): "Zilong mengandalkan menempel dan duel — Liu Bei yang juga mengandalkan basic attack bisa adu langsung dengannya, dan kebal control saat ult membuatnya sulit dihentikan.",
}

REWRITE = {
("Nezha", "Menki"): "Menki sangat kuat di lane awal — Nezha jangan adu langsung dengannya sebelum punya item, karena sustain dan damage Menki menang trade.",
("Nezha", "Mulan"): "Mulan punya silence dan super armor — dia bisa memotong gerakan Nezha dan membunuhnya dengan burst sebelum Nezha sempat kabur dengan ult.",
("Dian Wei", "Luna"): "Mobilitas Luna dengan dash beruntun dan reset bisa kite Dian Wei yang mengandalkan basic attack dan lifesteal — dia tidak pernah bisa menempel.",
("Mi Yue", "Liang"): "Suppress Liang mengunci Mi Yue yang mengandalkan mobilitas dan duel — begitu kekunci, dia tidak bisa kabur dengan skill 1 atau ult.",
("Xuance", "Gao Changgong"): "Gao Changgong mendekat lewat stealth dan burst Xuance sebelum hook-nya sempat kena.",
("Xuance", "Sima Yi"): "Silence Sima Yi membatalkan persiapan hook Xuance — begitu kena silence, dia tidak bisa lanjut ke ult.",
}

DISCLAIMERS = [
    " Artikel 2019–2022, bisa berubah karena patch.",
    " Artikel lama, bisa berubah karena patch.",
]
NAME_FIXES = [
    ("Ying Zheng", "Garuda"),
    ("Gongsun Li", "Arli"),
    ("Zhang Liang", "Liang"),
    ("Thorns", "Spikemail"),
]

if __name__ == "__main__":
    data = json.load(open("data.json", encoding="utf-8"))
    by_en = {h["en"]: h for h in data["heroes"]}
    by_id = {h["id"]: h["en"] for h in data["heroes"]}
    filled = cleaned = 0
    missing_fill = []
    for target, counter in FILL:
        h = by_en[target]
        hit = [c for c in h.get("naturalCounters") or [] if by_id.get(c["hero"]) == counter]
        assert len(hit) == 1, f"pasangan tidak ketemu: {target} <- {counter}"
        hit[0]["why"] = FILL[(target, counter)]
        filled += 1
    for (target, counter), why in REWRITE.items():
        h = by_en[target]
        hit = [c for c in h.get("naturalCounters") or [] if by_id.get(c["hero"]) == counter]
        assert len(hit) == 1, f"rewrite tidak ketemu: {target} <- {counter}"
        hit[0]["why"] = why
    for h in data["heroes"]:
        for c in h.get("naturalCounters") or []:
            w = c.get("why") or ""
            orig = w
            for d in DISCLAIMERS:
                w = w.replace(d, "")
            for a, b in NAME_FIXES:
                w = w.replace(a, b)
            if w != orig:
                c["why"] = w.strip()
                cleaned += 1
    no_reason = sum(
        1 for h in data["heroes"] for c in h.get("naturalCounters") or []
        if not (c.get("why") or "").strip() or "(tanpa alasan)" in (c.get("why") or ""))
    total = sum(len(h.get("naturalCounters") or []) for h in data["heroes"])
    data["version"] = "clone-fase3-2026-11-09"
    json.dump(data, open("data.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"alasan diisi: {filled} | disclaimer dibersihkan: {cleaned}")
    print(f"total counter alami: {total} | masih tanpa alasan: {no_reason}")
    print(f"version: {data['version']}")
