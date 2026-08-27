# YouTube Structure Collector

<p align="center">
  <img src="youtube-structure-collector/assets/icons/icon-128.png" width="96" alt="YouTube Structure Collector icon">
</p>

A lightweight Chrome extension for turning visible YouTube transcript sentences into reusable fill-in-the-blank English patterns.

## Features

- **Capture a sentence** from an on-video subtitle (click it) or from the YouTube transcript panel (**+ Structure**).
- **Hide words** you pick — each selection becomes `[____]`; adjacent words merge into one blank.
- **Trim the sentence** — drop filler words with **Remove** before saving, so the pattern keeps only what matters.
- **Timestamps** — every structure remembers the second it appears at and links back to that exact moment in the video.
- **Usage examples** — add your own notes on where and how you'd use a structure (Enter to add, trash icon to remove); as many per structure as you like.
- **Vocabulary notebook** — save a word or phrase straight from a sentence with **Save word**, or add one by hand in the **New Words** tab.
- **Dictionary lookup** — **Look up** fills in the English meaning and IPA for a saved word (no key, no account); falls back to Wiktionary when the primary source is down.
- **Edit words in place** — double-click a word or its meaning to rewrite it (Enter saves, Esc reverts).
- **Practice mode** — fill-in-the-blank quiz with lenient answer checking (case, punctuation, extra spaces), a progress bar, and **Skip**.
- **Spaced repetition** — practice drills only what's due (0/1/3/7/14/30 days); due items are badged in the list.
- **Grouped by video**, with a search box for the current video and an **All videos** library view that searches everything.
- **Edit or delete** any saved pattern, or clear a whole video.
- **Export** a video or your whole library as Markdown (copy or download) or plain text — timestamps and examples included.
- **Works off YouTube** — opening the popup elsewhere shows your most recently updated video.
- **Local only** — structures and words live in `chrome.storage.local` on the current Chrome profile; the only network call is the dictionary lookup you trigger by hand.

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
8. Select **New Words** for your vocabulary notebook — **Look up** fetches a meaning and IPA, and a double-click edits either field.

## Development

The extension uses Manifest V3 and plain HTML, CSS, and JavaScript. It has no runtime dependencies.

Building requires macOS, Linux, or WSL — the scripts are Bash and use `zip`/`unzip`, which Git Bash on Windows does not ship. Installing a release ZIP works on Windows; building one does not.

```sh
cd youtube-structure-collector
npm test
npm run check

npm run install:local            # build this checkout into ~/Documents/youtube-structure-collector
npm run install:local -- latest  # or drop the newest GitHub release there instead
```

Both overwrite that folder in place, so Chrome's "Load unpacked" entry keeps
working — it picks up the new files on restart, or on the card's reload arrow.

See the [extension README](youtube-structure-collector/README.md) for its internal project structure.

## Privacy

The extension has no backend, analytics, or account system. Saved structures and words remain in `chrome.storage.local` on the current Chrome profile.

One exception: pressing **Look up** on a saved word sends that single word to `api.dictionaryapi.dev` and, if it fails, `en.wiktionary.org`. Nothing else — no video, sentence, or identifier — ever leaves your machine, and no lookup happens unless you press the button.

## License

[MIT](LICENSE) — clone, fork, modify, and redistribute freely; just keep the copyright notice.

## Current limitations

- Only subtitles currently displayed over the video and lines in YouTube's transcript panel are supported.
- The extension does not fetch hidden subtitles or process audio.
- YouTube markup changes may require updates to the transcript selectors.
