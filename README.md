# YouTube Structure Collector

<p align="center">
  <img src="youtube-structure-collector/assets/icons/icon-128.png" width="96" alt="YouTube Structure Collector icon">
</p>

A lightweight Chrome extension for turning visible YouTube transcript sentences into reusable fill-in-the-blank English patterns.

## Features

- **Capture a sentence** from an on-video subtitle (click it) or from the YouTube transcript panel (**+ Structure**).
- **Hide words** you pick — each selection becomes `[____]`; adjacent words merge into one blank.
- **Timestamps** — every structure remembers the second it appears at and links back to that exact moment in the video.
- **Usage examples** — add your own notes on where and how you'd use a structure (Enter to add, `×` to remove); as many per structure as you like.
- **Practice mode** — fill-in-the-blank quiz with lenient answer checking (case, punctuation, extra spaces) and a score.
- **Spaced repetition** — practice drills only what's due (0/1/3/7/14/30 days); due items are badged in the list.
- **Grouped by video**, with a search box for the current video and an **All videos** library view that searches everything.
- **Edit or delete** any saved pattern, or clear a whole video.
- **Export** a video or your whole library as Markdown (copy or download) or plain text — timestamps and examples included.
- **Works off YouTube** — opening the popup elsewhere shows your most recently updated video.
- **Local only** — everything lives in `chrome.storage.local` on the current Chrome profile.

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
5. Open the extension popup to review, edit, practice, or export your collection.
6. In the popup, use the timestamp link to jump back to the line, and the input under a structure to add usage examples (Enter to add).
7. Select **Practice** to quiz yourself on the structures that are due.

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
