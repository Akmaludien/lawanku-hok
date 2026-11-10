#!/usr/bin/env python3
"""Fase 24: bangun tiers.json dari tier resmi HoK Camp (snapshot 6 Nov 2026).

Sumber:
- Tier + win rate: hub-game.com/hok/en/heroes/role/{support,assassin,fighter,mage,
  marksman,tank} (label halaman: 'Stats: official HoK Camp, as of 2026-11-06';
  tier = rating resmi in-game, daftar terurut tier lalu win rate; tier diambil dari
  posisi + hitungan header halaman). ID hero = angka di URL gambar hub-game
  (sama dengan id di data.json).
- Pick/ban (+ band & win pembanding): hokstats.gg/official-popularity/ (snapshot
  sama; terverifikasi silang: win rate cocok dengan hub-game untuk semua hero,
  dan band per lane == tier resmi untuk semua hero).
"""
import json
from collections import Counter

# id: (tier, win) -- dari 6 halaman role hub-game
HUB = {
    # S (12)
    187: ("S", 48.10), 159: ("S", 47.64), 509: ("S", 45.53),
    507: ("S", 52.16), 517: ("S", 48.63),
    142: ("S", 51.51), 109: ("S", 50.46), 156: ("S", 50.00), 504: ("S", 48.01),
    111: ("S", 50.48), 169: ("S", 50.27), 519: ("S", 49.42),
    # A (24)
    184: ("A", 52.41), 577: ("A", 50.16), 505: ("A", 49.82),
    116: ("A", 52.87), 153: ("A", 50.17), 167: ("A", 48.29), 528: ("A", 48.16),
    126: ("A", 51.94), 172: ("A", 51.34), 558: ("A", 51.19), 510: ("A", 50.80),
    108: ("A", 49.78), 121: ("A", 49.63),
    190: ("A", 51.00), 138: ("A", 51.00), 152: ("A", 50.74), 521: ("A", 47.76),
    106: ("A", 47.65),
    547: ("A", 53.02), 508: ("A", 52.96), 174: ("A", 51.25), 132: ("A", 51.05),
    155: ("A", 50.57), 112: ("A", 45.93),
    # B (36)
    585: ("B", 50.91), 191: ("B", 50.84), 171: ("B", 50.35), 175: ("B", 49.88),
    114: ("B", 49.57), 113: ("B", 48.56),
    137: ("B", 54.71), 107: ("B", 52.31), 196: ("B", 50.49), 583: ("B", 50.42),
    130: ("B", 49.56), 157: ("B", 48.40),
    193: ("B", 50.78), 135: ("B", 50.62), 631: ("B", 50.49), 166: ("B", 50.18),
    129: ("B", 49.94), 536: ("B", 49.16), 537: ("B", 48.84), 123: ("B", 48.43),
    503: ("B", 48.32), 563: ("B", 48.32),
    179: ("B", 53.82), 176: ("B", 51.79), 110: ("B", 51.42), 523: ("B", 51.02),
    127: ("B", 50.44), 148: ("B", 49.95), 141: ("B", 47.96),
    545: ("B", 52.62), 133: ("B", 52.57), 177: ("B", 51.62), 173: ("B", 49.69),
    584: ("B", 49.57), 199: ("B", 46.40),
    105: ("B", 52.06),
    # C (48)
    168: ("C", 54.77), 534: ("C", 53.29), 640: ("C", 50.80), 118: ("C", 50.53),
    501: ("C", 49.65), 189: ("C", 49.58),
    195: ("C", 53.36), 131: ("C", 53.16), 542: ("C", 52.92), 163: ("C", 52.53),
    183: ("C", 52.07), 522: ("C", 51.52), 154: ("C", 51.08), 538: ("C", 50.93),
    506: ("C", 50.53), 162: ("C", 50.04), 502: ("C", 49.32), 513: ("C", 47.90),
    125: ("C", 47.30), 150: ("C", 47.20), 531: ("C", 44.65),
    198: ("C", 54.19), 128: ("C", 53.14), 139: ("C", 52.64), 180: ("C", 52.27),
    117: ("C", 51.95), 134: ("C", 51.51), 178: ("C", 50.82), 646: ("C", 50.00),
    514: ("C", 49.94), 170: ("C", 49.93), 581: ("C", 49.57), 140: ("C", 47.35),
    564: ("C", 46.65), 146: ("C", 45.86),
    119: ("C", 51.65), 149: ("C", 51.60), 197: ("C", 51.32), 115: ("C", 51.30),
    124: ("C", 51.16), 635: ("C", 50.48), 182: ("C", 48.74), 582: ("C", 48.31),
    533: ("C", 52.78), 192: ("C", 50.66), 524: ("C", 50.33),
    556: ("C", 53.75), 120: ("C", 52.35),
}

# name: (band, win, pick, ban) -- dari tabel hokstats.gg/official-popularity/
HOK = {
    # Clash (30)
    "Li Xin": ("S", 52.2, 1.6, 2.0),
    "Sun Ce": ("A", 50.8, 1.5, 0.1), "Chicha": ("A", 51.3, 1.4, 0.3),
    "Umbrosa": ("A", 51.2, 1.4, 0.2), "Dun": ("A", 51.9, 1.3, 0.6),
    "Mi Yue": ("A", 49.6, 0.8, 1.1),
    "Devara": ("B", 48.8, 1.1, 0.2), "Lu Bu": ("B", 48.4, 1.1, 0.3),
    "Kaizer": ("B", 50.8, 1.1, 0.1), "Lian Po": ("B", 52.1, 1.0, 0.1),
    "Arthur": ("B", 50.2, 1.0, 0.0), "Biron": ("B", 48.3, 0.9, 0.2),
    "Xiang Yu": ("B", 50.6, 0.9, 0.0), "Charlotte": ("B", 49.2, 0.8, 0.1),
    "Florentino": ("B", 50.5, 0.4, 0.6),
    "Ata": ("C", 53.7, 0.5, 0.1), "Flowborn (Tank)": ("C", 49.6, 0.5, 0.0),
    "Nezha": ("C", 52.3, 0.5, 0.1), "Fatih": ("C", 53.1, 0.5, 0.0),
    "Allain": ("C", 49.9, 0.5, 0.0), "Fuzi": ("C", 52.6, 0.4, 0.0),
    "Guan Yu": ("C", 47.4, 0.4, 0.2), "Bai Qi": ("C", 52.3, 0.4, 0.0),
    "Wuyan": ("C", 51.9, 0.4, 0.0), "Yango": ("C", 47.3, 0.4, 0.1),
    "Mulan": ("C", 51.1, 0.4, 0.0), "Mayene": ("C", 46.7, 0.3, 0.0),
    "Yang Jian": ("C", 50.8, 0.3, 0.0), "Liu Bang": ("C", 51.6, 0.3, 0.0),
    "Dharma": ("C", 51.5, 0.2, 0.0),
    # Mid (27)
    "Angela": ("S", 51.5, 2.9, 1.1), "Daji": ("S", 50.5, 2.4, 1.8),
    "Milady": ("S", 48.0, 1.8, 1.7), "Liang": ("S", 50.0, 0.8, 3.9),
    "Kongming": ("A", 51.0, 1.6, 0.6), "Wang Zhaojun": ("A", 50.7, 1.6, 0.7),
    "Xiao Qiao": ("A", 47.7, 1.5, 0.3), "Mozi": ("A", 49.8, 1.2, 1.1),
    "Haya": ("A", 47.8, 0.9, 2.2), "Wang Wei": ("A", 51.0, 0.9, 1.0),
    "Nuwa": ("B", 53.8, 0.9, 0.6), "Lady Zhen": ("B", 50.4, 0.9, 0.0),
    "Garuda": ("B", 51.4, 0.8, 0.0), "Heino": ("B", 48.3, 0.8, 0.1),
    "Mai Shiranui": ("B", 48.4, 0.7, 0.1), "Diaochan": ("B", 48.0, 0.7, 0.1),
    "Ziya": ("B", 50.0, 0.7, 0.1), "Yuhuan": ("B", 51.8, 0.6, 0.1),
    "Shi": ("B", 51.0, 0.6, 0.3),
    "Yixing": ("C", 51.3, 0.6, 0.0), "Dr Bian": ("C", 51.6, 0.6, 0.1),
    "Zhou Yu": ("C", 51.2, 0.5, 0.0), "Gan & Mo": ("C", 48.7, 0.4, 0.1),
    "Gao": ("C", 51.3, 0.4, 0.0), "Shangguan": ("C", 47.9, 0.3, 0.0),
    "Lorion": ("C", 50.5, 0.3, 0.1), "Flowborn (Mage)": ("C", 48.3, 0.3, 0.0),
    # Farm (18)
    "Hou Yi": ("S", 50.3, 2.8, 0.2), "Lady Sun": ("S", 50.5, 2.2, 0.3),
    "Ao'yin": ("S", 49.4, 1.6, 2.1),
    "Marco Polo": ("A", 51.1, 1.8, 0.3), "Erin": ("A", 50.6, 1.5, 0.1),
    "Consort Yu": ("A", 51.2, 1.5, 0.2), "Garo": ("A", 53.0, 1.4, 0.4),
    "Luban No.7": ("A", 45.9, 1.4, 0.2), "Luara": ("A", 53.0, 1.4, 0.1),
    "Shouyue": ("B", 50.5, 1.0, 0.1), "Fang": ("B", 49.7, 1.0, 0.0),
    "Chano": ("B", 51.6, 1.0, 0.1), "Di Renjie": ("B", 52.6, 0.9, 0.0),
    "Alessio": ("B", 52.6, 0.8, 0.0), "Flowborn (Marksman)": ("B", 49.6, 0.8, 0.0),
    "Arli": ("B", 46.4, 0.7, 0.2),
    "Huang Zhong": ("C", 50.7, 0.4, 0.0), "Meng Ya": ("C", 50.3, 0.3, 0.0),
    # Jungle (27)
    "Augran": ("S", 48.6, 1.6, 3.3),
    "Wukong": ("A", 48.3, 1.2, 0.6), "Lam": ("A", 48.2, 1.1, 1.2),
    "Gao Changgong": ("A", 50.2, 0.8, 1.5), "Arke": ("A", 52.9, 0.7, 1.5),
    "Zilong": ("B", 52.3, 0.9, 0.1), "Musashi": ("B", 49.6, 0.9, 0.3),
    "Flowborn (Assassin)": ("B", 50.4, 0.8, 0.3), "Dian Wei": ("B", 49.9, 0.8, 0.2),
    "Sima Yi": ("B", 54.7, 0.8, 0.3),
    "Nakoruru": ("C", 50.0, 0.6, 0.1), "Li Bai": ("C", 53.2, 0.5, 0.2),
    "Yao": ("C", 51.5, 0.5, 0.0), "Ying": ("C", 50.9, 0.5, 0.0),
    "Ukyo Tachibana": ("C", 52.5, 0.5, 0.0), "Agudo": ("C", 52.8, 0.5, 0.0),
    "Luna": ("C", 45.9, 0.5, 0.1), "Feyd": ("C", 52.9, 0.5, 0.3),
    "Butterfly": ("C", 50.0, 0.4, 0.1), "Xuance": ("C", 53.4, 0.4, 0.4),
    "Jing": ("C", 44.6, 0.4, 0.1), "Han Xin": ("C", 47.2, 0.3, 0.0),
    "Liu Bei": ("C", 49.9, 0.3, 0.0), "Pei": ("C", 49.3, 0.3, 0.0),
    "Cirrus": ("C", 50.5, 0.2, 0.0), "Menki": ("C", 54.2, 0.2, 0.0),
    "Athena": ("C", 52.1, 0.1, 0.0),
    # Roam (18)
    "Dolia": ("S", 47.6, 1.9, 0.8), "Dunshan": ("S", 45.5, 1.0, 4.2),
    "Donghuang": ("S", 48.1, 0.9, 2.9),
    "Cai Yan": ("A", 52.4, 1.1, 2.0), "Dyadia": ("A", 50.2, 1.1, 1.3),
    "Yaria": ("A", 49.8, 1.1, 1.6),
    "Da Qiao": ("B", 50.8, 0.9, 0.7), "Kui": ("B", 49.9, 0.9, 0.6),
    "Liu Shan": ("B", 49.6, 0.8, 0.1), "Zhang Fei": ("B", 50.3, 0.7, 0.3),
    "Flowborn (Roamer)": ("B", 50.9, 0.6, 0.3), "Zhuangzi": ("B", 48.6, 0.5, 1.1),
    "Ming": ("C", 49.7, 0.4, 0.0), "Sakeer": ("C", 53.3, 0.4, 0.0),
    "Sun Bin": ("C", 50.5, 0.3, 0.0), "Annette": ("C", 50.8, 0.3, 0.1),
    "Lapulapu": ("C", 54.8, 0.3, 0.0), "Guiguzi": ("C", 49.6, 0.2, 0.2),
}

def main():
    d = json.load(open("data.json"))
    by_name = {h["en"]: h["id"] for h in d["heroes"]}
    by_id = {h["id"]: h["en"] for h in d["heroes"]}
    errs = []

    # 1. HUB: 120 id unik, semua ada di data.json
    if len(HUB) != 120:
        errs.append(f"HUB berisi {len(HUB)} hero, bukan 120")
    for hid in HUB:
        if hid not in by_id:
            errs.append(f"id {hid} tidak ada di data.json")

    # 2. Distribusi tier
    counts = Counter(t for t, _ in HUB.values())
    if dict(counts) != {"S": 12, "A": 24, "B": 36, "C": 48}:
        errs.append(f"distribusi tier salah: {dict(counts)}")

    # 3. HOK: semua nama ada, band == tier, win cocok (toleransi 0.06 = pembulatan 1 desimal)
    if len(HOK) != 120:
        errs.append(f"HOK berisi {len(HOK)} hero, bukan 120")
    merged = {}
    for name, (band, win, pick, ban) in HOK.items():
        if name not in by_name:
            errs.append(f"nama HoKStats tidak ada di data.json: {name}")
            continue
        hid = by_name[name]
        tier, win_hub = HUB.get(hid, (None, None))
        if tier is None:
            errs.append(f"{name} (id {hid}) ada di HoKStats tapi tidak di HUB")
            continue
        if band != tier:
            errs.append(f"{name}: band HoKStats {band} != tier hub-game {tier}")
        if abs(win_hub - win) > 0.06:
            errs.append(f"{name}: win hub-game {win_hub} vs HoKStats {win}")
        merged[hid] = {"t": tier, "w": win_hub, "p": pick, "b": ban}

    # 4. Semua 120 hero HUB punya pick/ban
    missing = [by_id[hid] for hid in HUB if hid not in merged]
    if missing:
        errs.append(f"hero tanpa pick/ban: {missing}")

    if errs:
        print("GAGAL:")
        for e in errs:
            print(" -", e)
        raise SystemExit(1)

    out = {
        "version": "hokcamp-2026-11-06",
        "source": "HoK Camp",
        "asOf": "2026-11-06",
        "tiers": {str(hid): merged[hid] for hid in sorted(merged)},
    }
    with open("tiers.json", "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print("OK: tiers.json ditulis, 120 hero")
    print("distribusi:", dict(counts))
    for hid in (187, 646, 123, 153, 179, 168):
        m = merged[hid]
        print(f"  {by_id[hid]:<14} {m['t']}  W {m['w']:.2f}  P {m['p']}  B {m['b']}")

if __name__ == "__main__":
    main()
