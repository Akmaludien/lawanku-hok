#!/usr/bin/env bash
# Deploy Lawanku sekali jalan:
#   1. hitung ulang sha manifest (_research/deploy-files.json), upload file yang berubah
#   2. create deployment production ke proyek "lawanku"
#   3. TUNGGU sampai READY (assign saat INITIALIZING gagal)
#   4. pindahkan alias lawanku.vercel.app ke deployment terbaru (alias ini
#      terikat per-deployment — deploy baru TIDAK otomatis mewarisinya)
#   5. verifikasi live (alias 200 + versi cache SW)
# Pakai: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

VERCEL=/opt/hatch/bin/vercel
NAME=lawanku
ALIAS=lawanku.vercel.app
MANIFEST=_research/deploy-files.json

vcall() { # vcall <tool> <arguments-json> -> stdout mentah
  "$VERCEL" call-tool --name "$1" --arguments-json "$2"
}
# Ambil .result dari balasan MCP (content[0].text berisi JSON string).
mcp_result() {
  python3 -c "import sys,json; print(json.loads(sys.stdin.read())['result']['content'][0]['text'])"
}

echo "== 1. manifest + upload file berubah =="
CHANGED=$(python3 - "$MANIFEST" <<'EOF'
import json, hashlib, sys
man = json.load(open(sys.argv[1]))
changed = []
for e in man:
    data = open(e["file"], "rb").read()
    sha = hashlib.sha1(data).hexdigest()
    if e["sha"] != sha or e["size"] != len(data):
        changed.append(e["file"]); e["sha"] = sha; e["size"] = len(data)
json.dump(man, open(sys.argv[1], "w"), indent=1)
print(" ".join(changed))
EOF
)
echo "berubah: ${CHANGED:- (tidak ada)}"
for f in $CHANGED; do
  B64=$(base64 -w0 "$f")
  LEN=$(stat -c%s "$f")
  SHA=$(sha1sum "$f" | cut -d' ' -f1)
  vcall upload_file "{\"requestBody\": \"$B64\", \"contentLength\": $LEN, \"xVercelDigest\": \"$SHA\"}" > /dev/null
  echo "uploaded: $f"
done

echo "== 2. create deployment =="
MAN_JSON=$(python3 -c "import json; print(json.dumps(json.load(open('$MANIFEST'))))")
DEP_JSON=$(vcall create_deployment "{\"requestBody\": {\"name\": \"$NAME\", \"files\": $MAN_JSON, \"projectSettings\": {\"framework\": null}, \"target\": \"production\"}}" | mcp_result)
DEP_ID=$(echo "$DEP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['deployment']['id'])")
echo "DEPLOY: $DEP_ID"

echo "== 3. tunggu READY =="
for i in $(seq 1 30); do
  STATE=$(vcall get_deployment "{\"idOrUrl\": \"$DEP_ID\"}" | mcp_result | python3 -c "import sys,json; d=json.load(sys.stdin)['result']['deployment']; print(d.get('readyState','?'))")
  echo "  coba $i: $STATE"
  [ "$STATE" = "READY" ] && break
  sleep 6
done
[ "$STATE" = "READY" ] || { echo "GAGAL: deployment tidak READY"; exit 1; }

echo "== 4. pindah alias $ALIAS =="
vcall assign_alias "{\"id\": \"$DEP_ID\", \"requestBody\": {\"alias\": \"$ALIAS\"}}" | mcp_result | python3 -c "import sys,json; r=json.load(sys.stdin)['result']; print('alias:', r['alias'], '| dari:', r.get('oldDeploymentId'))"

echo "== 5. verifikasi live =="
sleep 8
CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$ALIAS/")
echo "alias: $CODE"
[ "$CODE" = "200" ] || { echo "GAGAL: alias tidak 200"; exit 1; }
SW_VER=$(grep -o "lawanku-v[0-9]*" sw.js)
LIVE_VER=$(curl -s "https://$ALIAS/sw.js" | grep -o "lawanku-v[0-9]*" || true)
echo "cache lokal: $SW_VER | cache live: $LIVE_VER"
[ "$SW_VER" = "$LIVE_VER" ] || { echo "GAGAL: versi cache live belum $SW_VER"; exit 1; }
echo "SELESAI — $ALIAS live di $DEP_ID ($LIVE_VER)"
