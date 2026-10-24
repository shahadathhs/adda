#!/bin/sh
# Restore an adda backup made by scripts/backup.sh.
#   scripts/restore.sh <backup-folder>
# This REPLACES the database and the uploads and recordings folders. Stop the app first
# (docker compose stop backend web) and keep Postgres running.
# Set TARGET_DB to restore into a different database (for a dry run) instead of the live one.
set -eu
cd "$(dirname "$0")/.."
SRC="${1:?usage: restore.sh <backup-folder>}"
[ -f "$SRC/db.sql.gz" ] || { echo "no db.sql.gz in $SRC" >&2; exit 1; }

# .env is not a shell script (values may hold spaces), so read single keys from it.
env_get() { [ -f .env ] && grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed 's/ *#.*$//' || true; }
DB_USER="$(env_get POSTGRES_USER)"; DB_USER="${DB_USER:-adda}"
LIVE_DB="$(env_get POSTGRES_DB)"; DB_NAME="${TARGET_DB:-${LIVE_DB:-adda}}"

if [ -n "${TARGET_DB:-}" ]; then
  docker compose exec -T postgres psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\"" >/dev/null
  docker compose exec -T postgres psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\"" >/dev/null
fi

echo "restoring the database into '$DB_NAME'..."
gunzip -c "$SRC/db.sql.gz" | docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q >/dev/null

if [ -z "${TARGET_DB:-}" ]; then
  [ -f "$SRC/uploads.tar.gz" ] && { echo "restoring uploads..."; tar -xzf "$SRC/uploads.tar.gz" -C .; }
  [ -f "$SRC/recordings.tar.gz" ] && { echo "restoring recordings..."; tar -xzf "$SRC/recordings.tar.gz" -C .; }
fi
echo "restore complete. Start the app again: docker compose up -d"
