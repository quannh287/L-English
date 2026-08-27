# YouTube Structure Collector

<p align="center">
  <img src="youtube-structure-collector/assets/icons/icon-128.png" width="96" alt="YouTube Structure Collector icon">
</p>

A lightweight Chrome extension for turning visible YouTube transcript sentences into reusable fill-in-the-blank English patterns.

## Features

- Capture a sentence directly from the YouTube transcript.
- Select words to replace with `[____]`.
- Keep structures grouped by video.
- Edit or delete saved patterns.
- Copy a collection as Markdown.
- Download collections as Markdown or plain text.
- Store everything locally in the current Chrome profile.

## Install locally

1. Clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `youtube-structure-collector` directory.

## Use

1. Open a YouTube video and expand its transcript.
2. Select **+ Structure** beside a transcript sentence.
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

- Only transcript lines displayed by YouTube are supported.
- The extension does not fetch hidden subtitles or process audio.
- YouTube markup changes may require updates to the transcript selectors.
