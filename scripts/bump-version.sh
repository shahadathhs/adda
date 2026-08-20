#!/usr/bin/env bash
# Bump the desktop app version everywhere it's declared.
# Usage: ./scripts/bump-version.sh 0.2.0
set -euo pipefail

VERSION="${1:?usage: bump-version.sh <version>  (e.g. 0.2.0)}"
cd "$(dirname "$0")/.."

# Strip a leading v if given.
VERSION="${VERSION#v}"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid semver: $VERSION" >&2
  exit 1
fi

ROOT=$(pwd)

# frontend/package.json
cd "$ROOT/frontend"
npm version "$VERSION" --no-git-tag-version

# src-tauri/tauri.conf.json (uses node for a safe JSON edit)
node -e '
  const fs = require("fs");
  const p = "src-tauri/tauri.conf.json";
  const conf = JSON.parse(fs.readFileSync(p, "utf8"));
  conf.version = process.argv[1];
  fs.writeFileSync(p, JSON.stringify(conf, null, 2) + "\n");
' "$VERSION"

# src-tauri/Cargo.toml (top-level [package] only)
cd "$ROOT/frontend/src-tauri"
sed -i.bak -E '0,/^version = ".*$/s//version = "'"$VERSION"'"/' Cargo.toml
rm -f Cargo.toml.bak

echo "Bumped to $VERSION in package.json, tauri.conf.json, Cargo.toml"
echo "Next: commit, tag v$VERSION, push with --tags to trigger the release build."
