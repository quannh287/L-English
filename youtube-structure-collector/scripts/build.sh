#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

VERSION="$(node -p "require('./manifest.json').version")"
ARCHIVE="$PROJECT_DIR/dist/youtube-structure-collector-v${VERSION}.zip"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
ESBUILD="node_modules/.bin/esbuild"

mkdir -p "$STAGE/assets/icons" "$STAGE/src"
cp assets/icons/icon-16.png assets/icons/icon-32.png assets/icons/icon-48.png assets/icons/icon-128.png \
  "$STAGE/assets/icons/"

# Each execution context (popup page vs. content script) gets exactly one
# minified JS file and one minified CSS file — Manifest V3 runs them in
# separate JS runtimes, so they can't share a single bundle. These are plain
# global scripts (no import/export), so concatenation order is the only
# thing that matters — structure-utils.js must come first in each pair.
cat src/lib/structure-utils.js src/content/content-script.js \
  | "$ESBUILD" --minify --loader=js > "$STAGE/src/content.bundle.js"
cat src/lib/structure-utils.js src/popup/popup.js \
  | "$ESBUILD" --minify --loader=js > "$STAGE/src/popup.bundle.js"
"$ESBUILD" --minify src/content/content.css > "$STAGE/src/content.css"
"$ESBUILD" --minify src/popup/popup.css > "$STAGE/src/popup.css"

node scripts/finalize-stage.js "$STAGE"

mkdir -p dist
rm -f "$ARCHIVE"
(cd "$STAGE" && zip -qr "$ARCHIVE" manifest.json assets src)

echo "$ARCHIVE"
