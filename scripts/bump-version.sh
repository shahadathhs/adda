#!/usr/bin/env bash
# Bump the project version in VERSION and web/package.json.
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

echo "$VERSION" > VERSION
(cd web && npm version "$VERSION" --no-git-tag-version --allow-same-version >/dev/null)

echo "Bumped to $VERSION in VERSION and web/package.json"
echo "Next: commit, tag v$VERSION, push with --tags."
