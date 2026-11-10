# Kurasi item counter HOK Counter (Fase 1).
# Sumber alasan: data.json (howToPlayAgainst + alasan counter alami) + riset patch
# ~/workspace/hok/research-2026-11-05.md (nama item & efek terverifikasi Season 16).
# Aturan: hanya entri yang alasannya didukung teks sumber yang ditandai terkurasi
# (needsReview=False). Entri yang tidak cocok dihapus; yang belum bisa dipastikan
# dibiarkan apa adanya (needsReview=True).
import json

CURATED = {
"Agudo": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Agudo heal timnya dan memberi buff lewat skill 3 — anti-heal memotong pemulihannya, lalu fokus bunuh dia saat tipis setelah ult.", "needsReview": False},
],
"Arke": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati) / Ominous Premonition", "why": "Arke roaming dan burst dari stealth satu combo — Destiny menyelamatkanmu sekali dari one-shot, Ominous memperlambat serangan lanjutannya.", "needsReview": False},
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Tekan aktif Spikemail saat Arke muncul dari stealth — 35% damage yang diterima memantul jadi true damage selama 3 detik.", "needsReview": False},
],
"Athena": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Shield Athena satu-satunya pertahanan — penetrasi armor menembusnya; pecahkan shield skill 1-nya cepat lalu kunci dengan control.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
],
"Ata": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Ata memulihkan HP sambil menyerang — serang hit-and-run dan potong heal-nya supaya dia tidak bisa membalas sambil regen.", "needsReview": False},
],
"Augran": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Damage dan heal Augran berasal dari basic attack beruntun — penetrasi armor mempercepat membunuhnya sebelum batas execute-nya tercapai.", "needsReview": False},
],
"Bai Qi": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Bai Qi regen cepat dan biasanya membeli item regen di clash lane — anti-heal memotong pemulihannya.", "needsReview": False},
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage reduction Bai Qi berasal dari basic attack — Spikemail aktif memantulkan damage-nya, Ominous memperlambat serangannya.", "needsReview": False},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "HP tebal + taunt area luas — penetrasi armor dan true damage menembus ketahanannya; kalau sama-sama susah dibunuh, menangkan lewat rotasi dan curi jungle.", "needsReview": False},
],
"Biron": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Biron kuat di lane berkat lifesteal, shield, dan dash — anti-heal memotong lifesteal-nya, lalu kite dari luar jangkauannya yang pendek.", "needsReview": False},
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Burst Biron mengandalkan skill beruntun jarak dekat — Spikemail aktif memantulkan damage saat dia masuk.", "needsReview": False},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Shield dan heal Biron membuat ult perisainya tebal — penetrasi armor dan true damage mengabaikannya.", "needsReview": False},
],
"Cai Yan": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Cai Yan heal timnya terus-menerus — anti-heal memotong heal-nya, lalu pick-off dia saat sendirian karena dia lemah tanpa tim.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control skill 2 Cai Yan bisa dihindari — Boots of Resistance memperpendek durasinya; Purify melepas control saat dia mengunci.", "needsReview": False},
],
"Consort Yu": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage utama Consort Yu dari basic attack jarak jauh — Ominous Premonition memotong attack speed-nya; tunggu efek skill 2-nya habis baru serang.", "needsReview": False},
],
"Daji": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control skill 2 Daji mengunci satu target — Purify melepasnya; masuklah setelah Daji memakai control-nya.", "needsReview": False},
  {"tag": "anti-burst", "items": "Succubus Cloak / Destiny", "why": "Daji one-combo hero tipis di late — Succubus Cloak menahan burst magic-nya; jangan jalan sendirian saat skill-nya ready.", "needsReview": False},
],
"Dharma": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control skill 1 Dharma bisa dihindari dengan bergerak — Purify melepasnya saat kamu ditendang ke tembok; hero tipis waspada dash-nya.", "needsReview": False},
  {"tag": "anti-burst", "items": "Destiny (anti-mati) / Ominous Premonition", "why": "Dash + tendangan Dharma ke tembok bisa one-combo hero tipis — Destiny menyelamatkanmu sekali.", "needsReview": False},
],
"Di Renjie": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Di Renjie dari basic attack — Ominous Premonition memotong attack speed-nya; bunuh dia dengan assassin karena dia tidak punya dash.", "needsReview": False},
],
"Dian Wei": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Dian Wei mengandalkan basic attack + lifesteal dari ult — Spikemail aktif memantulkan damage-nya.", "needsReview": False},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Dengan build semi-tank Dian Wei sulit dibunuh sekali combo — penetrasi armor dan true damage menembusnya.", "needsReview": False},
],
"Diaochan": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Pasif Diaochan memberi slow berlapis dan skill-nya mengunci area — Boots of Resistance memperpendek slow-nya; Purify melepas control saat dia mengunci.", "needsReview": False},
  {"tag": "anti-burst", "items": "Succubus Cloak / Destiny", "why": "Diaochan menari dengan true damage di sekitar combo melee — Succubus Cloak menahan burst magic-nya; jangan berdiri rapat agar AoE-nya tidak kena banyak orang.", "needsReview": False},
],
"Donghuang": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Bola energi Donghuang heal dia saat menyentuh musuh — anti-heal memotong pemulihannya; saat ult-nya mengunci temanmu, jangan serang dia karena damage-nya diteruskan.", "needsReview": False},
],
"Dr Bian": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Dr Bian bisa heal dan memberi damage — anti-heal memotong pemulihannya; dia lemah sendirian, jadi pick-off dia.", "needsReview": False},
  {"tag": "anti-burst", "items": "Succubus Cloak / Destiny", "why": "Damage racun Dr Bian itu magic — Succubus Cloak menahannya; keluar dari area ult-nya saat tumpukan pasifnya sudah tinggi.", "needsReview": False},
],
"Dun": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Pasif regen Dun saat sekarat — anti-heal memotong regennya; jangan adu dengannya saat sama-sama sekarat.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control Dun bisa dihindari dengan bergerak — Boots of Resistance memperpendek durasinya; hero lincah bisa kite dia.", "needsReview": False},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Shield + true damage Dun — penetrasi armor menembus ketahanannya; Lu Bu contohnya unggul mulai mid game.", "needsReview": False},
],
"Erin": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Lifesteal Erin menolongnya di duel — anti-heal memotong pemulihannya, lalu burst dia sebelum sempat pulih.", "needsReview": False},
],
"Fatih": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Ult Fatih memberi lifesteal dan heal besar — anti-heal memotong pemulihannya; jangan adu langsung saat ult aktif.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Tiga dash skill 1 Fatih, tahap ketiga memberi knock-up — hindari dash-nya; Boots of Resistance memperpendek control-nya.", "needsReview": False},
],
"Feyd": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati) / Ominous Premonition", "why": "Feyd menghabisi musuh dengan burst setelah level 4 — Destiny menyelamatkanmu sekali dari eksekusinya; tekan dia di awal karena dia lemah di level 1.", "needsReview": False},
],
"Flowborn (Tank)": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Tank tebal dengan damage kecil — penetrasi armor dan true damage menembus ketahanannya.", "needsReview": False},
],
"Fuzi": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Skill 2 Fuzi mengurangi damage termasuk true damage, dan ult-nya mengikat — Purify melepas ikatan ult-nya; hero tipis jaga jarak saat fight.", "needsReview": False},
],

# ---- Chunk 2: G-M ----
"Gao": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Ult Gao memberi lifesteal besar saat dia burst AoE jarak dekat — anti-heal memotong pemulihannya; gank dia di awal karena dia tidak punya dash dan lemah kalau ketinggalan.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Gao mage burst magic jarak dekat — Succubus Cloak + shield magic menahan burst-nya; pilih hero lincah atau yang punya control agar tidak kena ult-nya.", "needsReview": False},
],
"Gao Changgong": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Gao Changgong muncul dari stealth dan burst target yang sendirian — Destiny menyelamatkanmu sekali dari one-shot-nya; jangan jalan sendirian dan minta tank menempel ke carry.", "needsReview": False},
],
"Guan Yu": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
],
"Han Xin": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Han Xin lincah dan burst dari skill-nya — Destiny menyelamatkanmu sekali; kunci terus dengan control begitu dia masuk, karena dia tipis saat skill-nya habis.", "needsReview": False},
],
"Hou Yi": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Hou Yi dari basic attack — Ominous Premonition memotong attack speed-nya; dia tipis dan tidak bisa menyelamatkan diri, jadi dive dia dengan assassin.", "needsReview": False},
],
"Huang Zhong": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Huang Zhong dari basic attack, terutama saat mode turret — Ominous Premonition memotong attack speed-nya; serang segera setelah dia memasang ult.", "needsReview": False},
],
"Jing": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Burst Jing tinggi banget — Destiny menyelamatkanmu sekali dari kombo ult-nya; begitu dia ult, langsung keluar dari areanya atau dorong dia keluar.", "needsReview": False},
],
"Kongming": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Kongming mage burst magic dengan dash berkali-kali — Succubus Cloak + shield magic menahan burst-nya; saat ult-nya mengincar teman sekarat, berdiri di jalurnya untuk menahan.", "needsReview": False},
],
"Kui": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Kui tank tebal dengan hook dan silence — penetrasi armor menembus ketahanannya; sembunyi di belakang minion atau tank agar tidak kena hook-nya.", "needsReview": False},
],
"Lady Sun": [],
"Lady Zhen": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control area Lady Zhen membekukan dan memberi damage AoE — Boots of Resistance memperpendek durasinya; Purify melepas freeze saat dia mengunci, dan jangan berdiri rapat agar AoE-nya tidak kena banyak orang.", "needsReview": False},
],
"Lam": [],
"Lapulapu": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Lapulapu tank tebal — penetrasi armor dan true damage menembus ketahanannya; jangan buang skill ke dia saat teamfight.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
],
"Li Bai": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Ult Li Bai memberi burst besar saat dia tidak bisa diserang — Destiny menyelamatkanmu sekali; jangan cast skill saat ult-nya aktif dan jangan menyentuh lingkaran pedang skill 2-nya.", "needsReview": False},
],
"Li Xin": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Li Xin mode gelap memulihkan HP dan membalikkan keadaan kalau gagal dibunuh dalam satu serangan — anti-heal memotong pemulihannya; paksa dia berhenti mengayun pedang saat mode komando.", "needsReview": False},
],
"Lian Po": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Pasif Lian Po menyerap banyak damage — penetrasi armor dan true damage menembus ketahanannya; poke dia saat skill-nya cooldown agar pasifnya tidak menyerap banyak damage.", "needsReview": False},
],
"Liang": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Liang itu magic berkelanjutan dan ult-nya mengeksekusi HP rendah — Succubus Cloak + shield magic menahan burst-nya; jaga HP tetap tinggi sebelum dia ult, dan mundur sedikit saat kena damage-nya agar pasifnya gagal.", "needsReview": False},
],
"Liu Bang": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control skill 2 Liu Bang bisa kena banyak orang sekaligus — jangan berdiri sejajar dengan teman; Purify melepasnya saat dia mengunci.", "needsReview": False},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Liu Bang tank tebal yang teleport ke tim — penetrasi armor menembus ketahanannya; saat dia channel ult, cepat bunuh teman yang dia teleport agar teleport-nya batal.", "needsReview": False},
],
"Liu Bei": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Liu Bei mengandalkan basic attack — Ominous Premonition memotong attack speed-nya; dia kebal control saat ult aktif, jadi jangan buang control ke dia di momen itu.", "needsReview": False},
],
"Liu Shan": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control Liu Shan mengunci satu target — Purify melepasnya; jangan buang semua skill mengejarnya karena dia jago kabur.", "needsReview": False},
],
"Lu Bu": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Lu Bu memberi damage besar yang menembus armor dan shield", "needsReview": True},
],
"Luban No.7": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Ult Luban mengeksekusi hero sekarat dari jauh — Destiny menyelamatkanmu sekali saat HP rendah; jangan adu di bawah bantuan udaranya kecuali HP cukup.", "needsReview": False},
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Luban dari basic attack — Ominous Premonition memotong attack speed-nya; semua skill-nya bisa dihindari dengan bergerak, jadi cari momen masuk dengan assassin.", "needsReview": False},
],
"Luna": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Luna itu magic dan dia dive dengan dash beruntun — Succubus Cloak + shield magic menahan burst-nya; sebelum level 4 dia hampir tidak punya power, jadi gank dia di awal.", "needsReview": False},
],
"Mai Shiranui": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Burst dive Mai Shiranui itu magic — Succubus Cloak + shield magic menahan burst-nya; jangan berdiri rapat agar skill 3-nya tidak kena banyak orang, dan tahan dia dengan hero control.", "needsReview": False},
],
"Marco Polo": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Ult Marco Polo memberi burst area besar saat dia diam — Destiny menyelamatkanmu sekali; sebar posisi saat dia ult dan simpan skill control untuk memotongnya.", "needsReview": False},
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Marco Polo dari basic attack dengan true damage — Ominous Premonition memotong attack speed-nya; jaga jarak setelah dia menyerang beberapa kali agar dia tidak burst dengan true damage.", "needsReview": False},
],
"Menki": [],
"Mi Yue": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Skill 2 Mi Yue menguras HP dan memulihkannya saat duel — anti-heal memotong pemulihannya; tahan dia di awal karena dia butuh gold banget dan lemah di teamfight late kalau awalnya tidak jalan.", "needsReview": False},
],
"Milady": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Milady itu magic dan datang dari minion mekaniknya", "needsReview": True},
],
"Ming": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Ult Ming memberi damage magic besar lewat rantai — Succubus Cloak + shield magic menahan burst-nya; mundur saat kena rantai, lalu serang dan bunuh dia setelah dia memakai ult.", "needsReview": False},
],
"Mozi": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control jarak jauh skill 2 Mozi mengunci dari jauh — Purify melepasnya; jangan berdiri berdekatan dengan teman agar ult-nya tidak kena banyak orang.", "needsReview": False},
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Mozi itu magic — Succubus Cloak + shield magic menahan burst-nya; hindari control jarak jauh skill 2-nya dengan bergerak.", "needsReview": False},
],
"Mulan": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
],
"Musashi": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Musashi dari basic attack yang diperkuat setelah skill — Ominous Premonition memotong attack speed-nya; hindari skill 1-nya dan jaga jarak sebagai hero tipis.", "needsReview": False},
],

# ---- Chunk 3: N-Z ----
"Nakoruru": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Nakoruru dive dengan burst besar setelah menandai dengan mata elang — Destiny menyelamatkanmu sekali dari one-shot-nya; hindari serangannya setelah ditandai dan simpan control untuk mengunci baru membunuhnya.", "needsReview": False},
],
"Nezha": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Nezha fighter tebal yang sulit dibunuh dan kebal control saat ult", "needsReview": True},
],
"Pei": [],
"Sakeer": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Sakeer itu magic", "needsReview": True},
],
"Shangguan": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Ult Shangguan terbang dan memberi burst magic besar — Succubus Cloak + shield magic menahan burst-nya; simpan control untuk memotong ult-nya, karena ancamannya langsung turun jauh.", "needsReview": False},
],
"Shi": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Shi mage control dengan burst rendah yang sangat mengandalkan tim — Purify melepas control-nya; hero lincah berjangkauan jauh mudah meng-counter dia.", "needsReview": False},
],
"Sima Yi": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Pasif skill 2 Sima Yi mengubah sebagian magic damage yang diterima jadi heal — anti-heal memotong pemulihannya; paksa dia keluar dari zona silence agar dia tidak bisa mengembalikan energi.", "needsReview": False},
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Silence Sima Yi mematikan skill-mu — Purify melepasnya; di awal dia kekurangan energi, jadi tekan dia.", "needsReview": False},
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Sima Yi itu magic dengan burst dan silence — Succubus Cloak + shield magic menahan burst-nya.", "needsReview": False},
],
"Sun Bin": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control Sun Bin (stun + silence dari ult) mengunci tim — Purify melepasnya; assassin masuk setelah dia memakai control, dan sebar posisi saat teamfight agar silence-nya tidak kena banyak orang.", "needsReview": False},
],
"Wang Zhaojun": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Control dan poke Wang Zhaojun membekukan dari jauh — Purify melepas freeze-nya; simpan control untuk memotong ult-nya.", "needsReview": False},
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Damage Wang Zhaojun itu magic dengan burst AoE dari ult — Succubus Cloak + shield magic menahan burst-nya; bergerak lincah untuk menghindari poke dan control-nya.", "needsReview": False},
],
"Wukong": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Wukong muncul dari stealth dengan crit burst besar — Destiny menyelamatkanmu sekali; jangan cast skill saat skill 1-nya aktif, dan hero tipis selalu menjaga jarak darinya.", "needsReview": False},
],
"Wuyan": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Petrify dan ult Wuyan memberi damage dan control besar — Purify melepasnya; jangan berkumpul terlalu rapat saat teamfight.", "needsReview": False},
],
"Xiang Yu": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Xiang Yu tank tebal — penetrasi armor menembus ketahanannya; jangan buang damage ke dia saat teamfight, dan assassin masuk setelah dia memakai control.", "needsReview": False},
],
"Xiao Qiao": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Skill 2 Xiao Qiao melempar musuh ke udara dan ult-nya mengunci otomatis — Purify melepas knock-up-nya; bunuh dia dengan assassin sebelum dia mengunci.", "needsReview": False},
],
"Xuance": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Sabit Xuance menarik dan meng-control dari jauh — Purify melepasnya; hindari sabitnya dan lawan dia dengan hero yang punya control atau mobilitas.", "needsReview": False},
],
"Yang Jian": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Musuh punya banyak crowd control", "needsReview": True},
],
"Yango": [],
"Yao": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Yao memilih antara burst besar atau gerak lincah, tidak bisa dua-duanya — Destiny menyelamatkanmu sekali dari burst-nya; jaga jarak saat dia memilih mode burst.", "needsReview": False},
],
"Yaria": [],
"Ying": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Ult Ying memberi burst besar — Destiny menyelamatkanmu sekali; perhatikan jenis jurus tombaknya dan sebisa mungkin hindari ult-nya.", "needsReview": False},
],
"Zhang Fei": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Raungan dan ult Zhang Fei memberi stun area — Purify melepasnya; serang dia saat energinya belum penuh.", "needsReview": False},
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Zhang Fei tank tebal saat energinya penuh — penetrasi armor menembus ketahanannya; jangan buang skill ke dia saat teamfight.", "needsReview": False},
],
"Zhuangzi": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Zhuangzi tank yang membersihkan control timnya dengan ult — penetrasi armor menembus ketahanannya; pancing ult-nya dulu sebelum menyerang penuh, dan pick-off dia saat sendirian.", "needsReview": False},
],
}

# Hero tanpa item di data asli yang jelas didukung dump -> ditambah entri terkurasi.
ADD = {
"Kaizer": [
  {"tag": "anti-tank", "items": "Overlord's Might / Starbreaker (armor pen)", "why": "Kaizer fighter tebal dengan shield dan dash — penetrasi armor menembus ketahanannya; hindari skill 1-nya dan jaga jarak sebagai hero tipis agar tidak di-engage.", "needsReview": False},
],
"Chicha": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Chicha dari basic attack beruntun yang lincah — Ominous Premonition memotong attack speed-nya; Spikemail aktif memantulkan damage saat dia masuk.", "needsReview": False},
],
"Umbrosa": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Umbrosa memulihkan HP lewat skill-nya saat bertarung — anti-heal memotong pemulihannya, lalu burst dia sebelum sempat pulih.", "needsReview": False},
],
"Ao'yin": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Hampir semua damage Ao'yin itu fisik dari basic attack — Ominous Premonition memotong attack speed-nya; skill 2 Consort Yu kebal damage fisik dan skill 2 Arli menahan proyektilnya.", "needsReview": False},
],
"Arthur": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Arthur masuk dengan burst skill 1 + silence yang bisa one-combo hero tipis — Destiny menyelamatkanmu sekali; hindari skill 1-nya, lalu adu langsung.", "needsReview": False},
],
"Angela": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Angela mage burst magic tanpa dash — Succubus Cloak + shield magic menahan one-combo-nya; dekati dengan jalur zig-zag karena semua skill-nya butuh prediksi arah.", "needsReview": False},
],
"Gan & Mo": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Gan & Mo memberi burst magic jarak jauh dari pedang terbangnya — Succubus Cloak + shield magic menahan burst-nya; tekan mereka dari dekat karena mereka lemah saat didekati.", "needsReview": False},
],
"Garuda": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Garuda mage burst magic — Succubus Cloak + shield magic menahan burst-nya; hindari skill 1-nya dan geser keluar dari garis lurus ult-nya.", "needsReview": False},
],
"Haya": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Ult Haya memberi control area yang menahan gerakan — Purify melepasnya seperti skill 2 Di Renjie membersihkan control; Boots of Resistance memperpendek durasinya.", "needsReview": False},
],
"Shouyue": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Shouyue sniper yang one-shot dari jauh dengan skill 2-nya — Destiny menyelamatkanmu sekali; terjang ke dekatnya saat dia memakai skill 2 agar dia membatalkannya.", "needsReview": False},
],
"Sun Ce": [
  {"tag": "anti-cc", "items": "Boots of Resistance + Purify (spell)", "why": "Ombak skill 1 dan kapal ult Sun Ce memberi knock-up — Purify melepasnya; hindari ombaknya dan manfaatkan medan karena kapalnya tidak bisa melompati tembok.", "needsReview": False},
],
"Ukyo Tachibana": [
  {"tag": "anti-heal", "items": "Mortal Punisher (fisik) / Venomous Staff (magic)", "why": "Ult Ukyo memulihkan HP-nya besar-besaran — anti-heal memotong pemulihannya; hindari skill 2-nya dan gank dia setelah memakai skill 1.", "needsReview": False},
],
"Zhou Yu": [
  {"tag": "anti-burst", "items": "Succubus Cloak", "why": "Api Zhou Yu itu magic damage yang menyebar — Succubus Cloak + shield magic menahan burst-nya; dia tidak punya dash, jadi assassin bisa mengincarnya.", "needsReview": False},
],
"Zilong": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Zilong mengandalkan basic attack dan sangat kuat 1v1 di late — Ominous Premonition memotong attack speed-nya; jangan adu duel dengannya sendirian.", "needsReview": False},
],
"Ziya": [
  {"tag": "anti-burst", "items": "Destiny (anti-mati)", "why": "Ult Ziya mengeksekusi hero HP rendah dari jarak jauh — Destiny menyelamatkanmu sekali; jangan berdiri rapat dan segera menghindar begitu terlihat lintasan ult-nya.", "needsReview": False},
],
"Alessio": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Alessio dari proyektil basic attack — Ominous Premonition memotong attack speed-nya; skill 1 Musashi memblokir pelurunya dan ult-nya tetap kena meski Alessio sedang terbang.", "needsReview": False},
],
"Cirrus": [
  {"tag": "anti-autoattack", "items": "Spikemail (aktifkan manual) / Ominous Premonition", "why": "Damage Cirrus datang terus-menerus dari serangannya — Spikemail aktif memantulkan damage-nya; perhatikan sisa energi terbangnya dan serang saat dia mendarat.", "needsReview": False},
],
}

if __name__ == "__main__":
    data = json.load(open("data.json", encoding="utf-8"))
    by_name = {h["en"]: h for h in data["heroes"]}
    missing = [n for n in list(CURATED) + list(ADD) if n not in by_name]
    assert not missing, f"nama tidak ada di data.json: {missing}"
    orig_total = sum(len(h.get("itemCounters") or []) for h in data["heroes"])
    replaced = curated_n = review_n = deleted = empty_n = 0
    for name, entries in {**CURATED, **ADD}.items():
        h = by_name[name]
        old = len(h.get("itemCounters") or [])
        h["itemCounters"] = entries
        deleted += max(0, old - len(entries))
        replaced += 1
        curated_n += sum(1 for e in entries if not e["needsReview"])
        review_n += sum(1 for e in entries if e["needsReview"])
        if not entries:
            empty_n += 1
    new_total = sum(len(h.get("itemCounters") or []) for h in data["heroes"])
    data["version"] = "clone-fase1-2026-11-09"
    json.dump(data, open("data.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"hero dipatch: {replaced} (CURATED {len(CURATED)} + ADD {len(ADD)})")
    print(f"entri item: {orig_total} -> {new_total} (dihapus {deleted})")
    print(f"terkurasi (needsReview=False): {curated_n} | masih needsReview: {review_n}")
    print(f"hero tanpa entri item sekarang: {empty_n}")
    print(f"version: {data['version']}")

