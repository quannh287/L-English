#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

VERSION="$(node -p "require('./manifest.json').version")"
ARCHIVE="dist/youtube-structure-collector-v${VERSION}.zip"

mkdir -p dist
rm -f "$ARCHIVE"
zip -qr "$ARCHIVE" \
  manifest.json \
  assets/icons/icon-16.png \
  assets/icons/icon-32.png \
  assets/icons/icon-48.png \
  assets/icons/icon-128.png \
  src

echo "$ARCHIVE"
