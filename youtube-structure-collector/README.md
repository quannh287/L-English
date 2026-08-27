# YouTube Structure Collector

A dependency-free Chrome extension that turns visible YouTube transcript sentences into reusable fill-in-the-blank patterns.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this `youtube-structure-collector` folder.

## Use

1. Open a YouTube video with subtitles or an available transcript.
2. Click a subtitle over the video, or select **+ Structure** beside a transcript sentence.
3. Select one or more words to replace with `[____]`, then save.
4. Open the extension popup to edit, delete, copy, or download the structures for the current video.

Saved structures remain on this Chrome profile through `chrome.storage.local`.

## Project structure

```text
youtube-structure-collector/
├── assets/icons/  # Master artwork and Chrome icon sizes
├── manifest.json
├── src/
│   ├── content/    # YouTube transcript integration
│   ├── lib/        # Shared, testable structure utilities
│   └── popup/      # Extension popup UI
└── tests/          # Node built-in tests
```

Chrome loads source files directly from `src/`; there is no build step or generated output.

## Test

```sh
npm test
npm run check
```

## v1 limits

- Only subtitles currently displayed over the video and lines in YouTube's transcript panel are supported.
- The extension does not fetch hidden subtitles or process audio.
- YouTube may change its transcript markup; update the selectors in `src/content/content-script.js` if capture buttons stop appearing.
