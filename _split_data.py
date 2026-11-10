#!/usr/bin/env python3
"""Pecah data.json jadi data-1.json + data-2.json (60 hero tiap file).

Alasan: Vercel MCP create_deployment/upload_file menerima argumen maks ~128 KB
per panggilan, sedangkan data.json (128 KB) tidak muat dalam satu argumen.
Aplikasi memuat kedua chunk dan menggabungkannya (lihat boot() di app.js).
Jalankan ulang skrip ini setiap kali data.json berubah (mis. habis kurasi).
"""
import json

SRC = "data.json"
CHUNK = 60

with open(SRC, encoding="utf-8") as f:
    data = json.load(f)

heroes = data["heroes"]
parts = [heroes[i:i + CHUNK] for i in range(0, len(heroes), CHUNK)]
for n, part in enumerate(parts, 1):
    out = {"version": data.get("version"), "heroes": part}
    with open(f"data-{n}.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"data-{n}.json: {len(part)} hero")
