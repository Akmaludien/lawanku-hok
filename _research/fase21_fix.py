"""Fase 21 — perbaikan deploy: itemDetails dipindah ke items.json terpisah.
Masalah: itemDetails di kedua chunk bikin data-1.json 98.462 byte -> base64
~131 KB, melewati batas argumen upload_file MCP (~128 KB); deploy gagal di
tengah jalan (app.js + styles.css sempat ter-upload, deployment TIDAK dibuat,
live tetap v24).
Perbaikan: chunk kembali heroes-only (seperti sebelum Fase 21); itemDetails
tinggal di data.json (kanonis) + items.json (yang di-fetch aplikasi).
"""
import json

d = json.load(open("data.json"))
assert "itemDetails" in d and len(d["itemDetails"]) == 8

items = {"version": d["version"], "itemDetails": d["itemDetails"]}
open("items.json", "w", encoding="utf-8").write(json.dumps(items, ensure_ascii=False, indent=1) + "\n")

for i, part in enumerate([d["heroes"][0:60], d["heroes"][60:120]]):
    chunk = {"version": d["version"], "heroes": part}
    open(f"data-{i+1}.json", "w", encoding="utf-8").write(json.dumps(chunk, ensure_ascii=False, indent=1) + "\n")

# --- verifikasi ---
import os
for fn in ("data-1.json", "data-2.json"):
    ch = json.load(open(fn))
    assert "itemDetails" not in ch and len(ch["heroes"]) == 60
    b64len = (os.path.getsize(fn) * 4 + 2) // 3
    print(f"{fn}: {os.path.getsize(fn)} byte, base64 ~{b64len} (< 128 KB: {b64len < 131072})")
    assert b64len < 131072
it = json.load(open("items.json"))
assert it["itemDetails"] == d["itemDetails"]
print(f"items.json: {os.path.getsize('items.json')} byte, 8 paket, 10 komponen")
print("OK — chunk kembali heroes-only, itemDetails di items.json")
