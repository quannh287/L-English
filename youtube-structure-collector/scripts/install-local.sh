#!/usr/bin/env bash
# Unpack a built ZIP into a stable per-user folder so "Load unpacked" survives
# reboots and re-installs overwrite in place (Chrome reloads it by itself).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "$(uname -s)" in
  Darwin) DEST="$HOME/Library/Application Support/youtube-structure-collector" ;;
  *)      DEST="${XDG_DATA_HOME:-$HOME/.local/share}/youtube-structure-collector" ;;
esac

ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ]; then
  ARCHIVE="$(bash "$PROJECT_DIR/scripts/build.sh" | tail -1)"
fi
[ -f "$ARCHIVE" ] || { echo "no such archive: $ARCHIVE" >&2; exit 1; }

rm -rf "$DEST"
mkdir -p "$DEST"
unzip -q "$ARCHIVE" -d "$DEST"

echo "Installed to: $DEST"
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
