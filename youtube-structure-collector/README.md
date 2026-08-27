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
├── scripts/         # Release ZIP packaging
├── src/
│   ├── content/    # YouTube transcript integration
│   ├── lib/        # Shared, testable structure utilities
│   └── popup/      # Extension popup UI
└── tests/          # Node built-in tests
```

Chrome loads source files directly from `src/`. The build command packages those runtime files without transpiling, bundling, or minifying them.

## Test

```sh
npm test
npm run check
npm run build
```

The ZIP is written to `dist/youtube-structure-collector-v<version>.zip`.

## Release

Use Conventional Commits on `main`. Release Please maintains a release pull request and determines the next semantic version:

- `fix:` creates a patch release.
- `feat:` creates a minor release.
- A breaking change creates a major release.

Merging the release pull request updates `package.json`, `package-lock.json`, and `manifest.json`. Release Please then creates a draft GitHub Release and passes its tag name and exact release commit to the extension publishing workflow. The publishing workflow checks out that immutable commit, validates and builds the extension, attaches the installable ZIP, and publishes the release and tag.

Only after publication does Release Please prepare the next release pull request. This prevents draft releases from causing previously released commits to be collected again.

The **Publish Extension** workflow can also be run manually with an existing release tag to rebuild or replace its ZIP.

## v1 limits

- Only subtitles currently displayed over the video and lines in YouTube's transcript panel are supported.
- The extension does not fetch hidden subtitles or process audio.
- YouTube may change its transcript markup; update the selectors in `src/content/content-script.js` if capture buttons stop appearing.
