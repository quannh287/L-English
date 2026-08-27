#!/usr/bin/env bash
# Shipped inside the ZIP: double-click on macOS to move the unpacked extension
# to a stable folder, then Chrome's own "Load unpacked" step (Chrome offers no
# way to install an unpacked extension programmatically).
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/youtube-structure-collector"

if [ "$SRC" != "$DEST" ]; then
  rm -rf "$DEST"
  mkdir -p "$DEST"
  (cd "$SRC" && tar cf - manifest.json assets src) | (cd "$DEST" && tar xf -)
fi

printf '%s' "$DEST" | pbcopy
open -a "Google Chrome" "chrome://extensions/" 2>/dev/null || true

cat <<TXT

Installed to (path copied to clipboard):
  $DEST

In the Chrome tab that just opened:
  1. Turn on "Developer mode" (top right)
  2. Click "Load unpacked"
  3. Press Cmd+Shift+G, paste (Cmd+V), Enter, then "Open"

Done. You can delete the folder you unzipped.
TXT
read -r -p "Press Enter to close..." _
