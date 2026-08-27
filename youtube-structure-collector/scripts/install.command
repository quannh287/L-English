#!/usr/bin/env bash
# Shipped inside the ZIP: double-click on macOS to move the unpacked extension
# to a stable folder, then Chrome's own "Load unpacked" step (Chrome offers no
# way to install an unpacked extension programmatically).
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Documents/youtube-structure-collector"

if [ "$SRC" != "$DEST" ]; then
  # Copy into a staging dir first so a failed copy can't leave Chrome pointing
  # at a half-replaced folder.
  STAGE="$(mktemp -d)"
  trap 'rm -rf "$STAGE"' EXIT
  (cd "$SRC" && tar cf - manifest.json assets src) | (cd "$STAGE" && tar xf -)
  rm -rf "$DEST"
  mkdir -p "$(dirname "$DEST")"
  mv "$STAGE" "$DEST"
  trap - EXIT
fi

VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$DEST/manifest.json" | head -1)"

printf '%s' "$DEST" | pbcopy
open -a "Google Chrome" "chrome://extensions/" 2>/dev/null || true

cat <<TXT

Installed v$VERSION to (path copied to clipboard):
  $DEST

In the Chrome tab that just opened:
  1. Turn on "Developer mode" (top right)
  2. Click "Load unpacked"
  3. Press Cmd+Shift+G, paste (Cmd+V), Enter, then "Open"

Done. You can delete the folder you unzipped.
TXT
read -r -p "Press Enter to close..." _
