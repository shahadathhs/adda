#!/bin/sh
# Back up an adda install: the database, uploads (emotes, banners) and recordings.
#   scripts/backup.sh [output-dir]        (default: ./backups)
# Run it from the install directory (where compose.yaml and .env live). It writes one
# timestamped folder holding db.sql.gz, uploads.tar.gz and recordings.tar.gz.
# Recordings are large: pass SKIP_RECORDINGS=1 to leave them out and copy that folder yourself.
set -eu
cd "$(dirname "$0")/.."
OUT="${1:-./backups}/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT"

# .env is not a shell script (values may hold spaces), so read single keys from it.
env_get() { [ -f .env ] && grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed 's/ *#.*$//' || true; }
DB_USER="$(env_get POSTGRES_USER)"; DB_USER="${DB_USER:-adda}"
DB_NAME="$(env_get POSTGRES_DB)"; DB_NAME="${DB_NAME:-adda}"

echo "backing up the database..."
docker compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --clean --if-exists \
  | gzip > "$OUT/db.sql.gz"

echo "backing up uploads..."
tar -czf "$OUT/uploads.tar.gz" -C . uploads 2>/dev/null || tar -czf "$OUT/uploads.tar.gz" --files-from /dev/null

if [ "${SKIP_RECORDINGS:-0}" = "1" ]; then
  echo "skipping recordings (SKIP_RECORDINGS=1)"
else
  echo "backing up recordings..."
  tar -czf "$OUT/recordings.tar.gz" -C . recordings 2>/dev/null || tar -czf "$OUT/recordings.tar.gz" --files-from /dev/null
fi

echo "done: $OUT"
ls -lh "$OUT"
