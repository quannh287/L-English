#!/usr/bin/env bash
# Unpack a built ZIP into a stable per-user folder so "Load unpacked" survives
# reboots and re-installs overwrite in place (Chrome reloads it by itself).
#
#   install-local.sh              build from this checkout
#   install-local.sh latest       download the newest GitHub release
#   install-local.sh v2.0.0       download that release
#   install-local.sh path/to.zip  use an existing archive
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$HOME/Documents/youtube-structure-collector"
REPO="quannh287/L-English"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

SOURCE="${1:-}"
case "$SOURCE" in
  "")
    ARCHIVE="$(bash "$PROJECT_DIR/scripts/build.sh" | tail -1)" ;;
  latest|v[0-9]*)
    command -v gh >/dev/null || { echo "gh CLI required to download releases" >&2; exit 1; }
    [ "$SOURCE" = latest ] && SOURCE=""
    gh release download ${SOURCE:+"$SOURCE"} --repo "$REPO" --pattern '*.zip' --dir "$STAGE"
    ARCHIVE="$(echo "$STAGE"/*.zip)" ;;
  *)
    ARCHIVE="$SOURCE" ;;
esac
[ -f "$ARCHIVE" ] || { echo "no such archive: $ARCHIVE" >&2; exit 1; }

# Unpack fully before touching DEST so a bad archive can't leave Chrome
# pointing at a half-installed folder.
unzip -q "$ARCHIVE" -d "$STAGE/unpacked"
[ -f "$STAGE/unpacked/manifest.json" ] || { echo "archive has no manifest.json: $ARCHIVE" >&2; exit 1; }
rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
mv "$STAGE/unpacked" "$DEST"

VERSION="$(node -p "require('$DEST/manifest.json').version")"
echo "Installed v$VERSION to: $DEST"
if command -v pbcopy >/dev/null; then
  printf '%s' "$DEST" | pbcopy
  echo "(path copied to clipboard)"
fi
cat <<TXT

First time only:
  1. chrome://extensions  ->  enable "Developer mode"
  2. "Load unpacked"  ->  paste the path above (Cmd+Shift+G in the file dialog)

Updating later: re-run this script. Chrome picks up the new files on restart,
or hit the reload arrow on the extension card.
TXT
