# YouTube Structure Collector

<p align="center">
  <img src="youtube-structure-collector/assets/icons/icon-128.png" width="96" alt="YouTube Structure Collector icon">
</p>

A lightweight Chrome extension for turning visible YouTube transcript sentences into reusable fill-in-the-blank English patterns.

## Features

- Capture a sentence from an on-video subtitle or the YouTube transcript.
- Select words to replace with `[____]`.
- Keep structures grouped by video.
- Edit or delete saved patterns.
- Copy a collection as Markdown.
- Download collections as Markdown or plain text.
- Store everything locally in the current Chrome profile.

## Install

Chrome only loads extensions from the Web Store *or* from a folder on your computer with **Developer mode** on — there's no npm/pip step. Pick one:

### A. Download the release ZIP (recommended, no coding needed)

1. Go to the [Releases page](../../releases) and download the ZIP attached to the latest release (e.g. `youtube-structure-collector-v0.3.2.zip`).
2. Unzip it — you'll get a folder containing `manifest.json` and a `src` folder directly inside it.
3. In Chrome (or another Chromium browser: Edge, Brave, ...), open `chrome://extensions`.
4. Turn on **Developer mode** — the toggle is in the top-right corner of that page.
5. Three new buttons appear. Click **Load unpacked**.
6. In the file picker, select the folder you unzipped in step 2 (the one *containing* `manifest.json`, not a parent folder).
7. "YouTube Structure Collector" now appears in your extensions list. Click the puzzle-piece icon in Chrome's toolbar and pin it for one-click access.

### B. Clone the repository (for developers)

1. Clone this repository.
2. Follow steps 3–7 above, but in step 6 select the `youtube-structure-collector` subdirectory of the clone (not the repo root).

### Updating or removing

- To update: repeat the install steps with a newer ZIP, or click the refresh icon on the extension's card in `chrome://extensions`.
- To remove: click **Remove** on the extension's card in `chrome://extensions`.

## Use

1. Open a YouTube video with subtitles or expand its transcript.
2. Click a subtitle over the video, or select **+ Structure** beside a transcript sentence.
3. Select one or more words to hide.
4. Select **Save structure**.
5. Open the extension popup to review, edit, copy, or download your collection.

## Development

The extension uses Manifest V3 and plain HTML, CSS, and JavaScript. It has no runtime dependencies or build step.

```sh
cd youtube-structure-collector
npm test
npm run check
```

See the [extension README](youtube-structure-collector/README.md) for its internal project structure.

## Privacy

The extension has no backend, analytics, or account system. Saved structures remain in `chrome.storage.local` on the current Chrome profile.

## Current limitations

- Only subtitles currently displayed over the video and lines in YouTube's transcript panel are supported.
- The extension does not fetch hidden subtitles or process audio.
- YouTube markup changes may require updates to the transcript selectors.
