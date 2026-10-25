#!/bin/sh
# Publish a test pattern to a channel so the live screens have something to show.
#   scripts/test-stream.sh <channel-slug> [stop]
# Needs Docker and a running stack (backend on :7001, mediamtx on :1935). Uses an
# admin or owner login from the seed accounts; override with ADDA_EMAIL / ADDA_PASSWORD.
set -eu
SLUG="${1:?usage: test-stream.sh <channel-slug> [stop]}"
NAME="adda-test-stream"
API="${ADDA_API:-http://localhost:7001}"

if [ "${2:-}" = "stop" ]; then docker rm -f "$NAME" >/dev/null 2>&1 && echo stopped; exit 0; fi

TOKEN=$(curl -fsS -X POST "$API/api/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"${ADDA_EMAIL:-admin@example.com}\",\"password\":\"${ADDA_PASSWORD:-admin12345}\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
CHANNEL=$(curl -fsS "$API/api/communities/by-slug/$SLUG" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
URL=$(curl -fsS "$API/api/communities/$CHANNEL/stream-key" -H "authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["stream_url"])')
# Inside the container, the host is host.docker.internal.
URL=$(echo "$URL" | sed 's#//localhost#//host.docker.internal#')

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" jrottenberg/ffmpeg:6-alpine \
  -re -f lavfi -i "testsrc2=size=1280x720:rate=30" -f lavfi -i "sine=frequency=440" \
  -c:v libx264 -preset veryfast -tune zerolatency -g 60 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -f flv "$URL" >/dev/null
echo "publishing a test pattern to '$SLUG' (stop with: $0 $SLUG stop)"
