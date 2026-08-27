# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo has two unrelated things in it:

- `youtube-structure-collector/` — the actual project: a Chrome extension. All commands below run from this directory.
- `AGENTS.md` (repo root) — not agent/dev instructions; it's a persona prompt ("English coach") for using this repo's *output* to study English. Ignore it for engineering work.
- `outputs/` — generated study material, not source code.

## Commands

Run from `youtube-structure-collector/`:

```sh
npm test          # node --test tests/*.test.js
npm run check      # node --check on each src file, then npm test
npm run build      # scripts/build.sh -> dist/youtube-structure-collector-v<version>.zip
```

Run a single test file: `node --test tests/structure-utils.test.js`.

There is no bundler/transpiler — Chrome loads the files in `src/` directly, and `build.sh` just zips `manifest.json`, `assets/icons/`, and `src/` verbatim (using the version from `manifest.json`, not `package.json`).

## Architecture

Manifest V3 extension, zero runtime dependencies, three cooperating pieces sharing `chrome.storage.local`:

- `src/lib/structure-utils.js` — pure functions (tokenizing, pattern-building, markdown/text formatting, filename sanitizing, video-id extraction). Loaded both as a content script (`globalThis.YSC`) and via `module.exports` in tests — any change here must stay isomorphic between browser and Node.
- `src/content/content-script.js` — injected into `youtube.com/watch*`. Adds a "+ Structure" button to transcript segments (`ytd-transcript-segment-renderer`) and makes on-video captions (`.ytp-caption-segment`) clickable, opening an in-page word-picker editor. A `MutationObserver` re-applies this on YouTube's SPA navigations (`yt-navigate-finish`) since transcript/caption nodes are re-rendered without a full page load.
- `src/popup/popup.js` — the extension popup. Reads the active tab's video ID, loads/edits/deletes that video's saved structures, and exports them (clipboard, `.md`, `.txt`) using the same `YSC` formatters.

Storage schema: a single `chrome.storage.local` key `videos`, keyed by YouTube video ID:

```js
videos[videoId] = { videoId, title, url, structures: [{ id, original, pattern, createdAt }] }
```

`pattern` uses the literal placeholder `[____]` (see `PLACEHOLDER` in `structure-utils.js`) in place of selected words.

Manifest content-script order matters: `structure-utils.js` must load before `content-script.js` (it defines `YSC` on `globalThis`).

## Release process

Conventional Commits on `main` drive Release Please (`fix:` = patch, `feat:` = minor, breaking change = major). Merging the release PR bumps `package.json`/`package-lock.json`/`manifest.json`; the publish workflow then builds and attaches the ZIP to a GitHub Release from that exact commit.
