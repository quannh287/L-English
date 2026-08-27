# YouTube Structure Collector — redesign brief

Chrome MV3 extension. User watches YouTube in English, grabs sentence patterns and new words from the transcript/captions, practices them later. No framework, no build step: plain HTML/CSS/JS files loaded by Chrome.

## Data (chrome.storage.local)

- `videos[videoId] = { videoId, title, url, structures: [] }`
- structure = `{ id, original, pattern, startSeconds, createdAt, examples: [], reviewCount, lastReviewedAt }` — `pattern` is `original` with chosen words replaced by the literal `[____]`.
- `words = [{ id, word, meaning, createdAt }]` — flat vocabulary list, not tied to a video.

## Surface 1 — in-page editor (injected on youtube.com/watch)

- Entry points: a `+ Structure` button appended to each transcript row; clicking the on-video caption (pauses the video).
- Editor is a fixed card, bottom-right, ~520px. Contents: heading, the full sentence (selectable text, no chips), action bar `Hide / Save word / Remove` (disabled until the user highlights text), pattern preview (only once something is hidden), status line, `Cancel` / `Save structure`.
- Selection model: native text selection — double-click = one word, drag = a phrase. Actions apply to the highlighted words. `Hide` toggles to `Unhide` when the whole selection is already hidden.
- Dismiss: Cancel, click outside, or save (resumes video playback).

## Surface 2 — popup (390px wide), four exclusive views

1. **This video** — title link, `Practice` / `All videos` / `New words`, search box, structure cards (due badge, timestamp link, original, editable pattern + Delete, usage-example list with per-item ×, input to add an example), export row (Copy MD / Download MD / Download TXT), `Clear this video`.
2. **All videos** — search across everything, grouped by video, read-only, same three export buttons.
3. **Practice** — quiz over due items (spaced repetition 0/1/3/7/14/30 days; falls back to all items when nothing is due): score line, pattern shown, answer input, Check → feedback → Next, exit back to list.
4. **New words** — word + meaning form (re-adding a word overwrites its meaning), list with × delete, Copy MD / Download MD.

## Flows

- **Capture**: watch → transcript row `+ Structure` (or click caption) → highlight words → Hide → Save structure → editor closes, video resumes.
- **Vocabulary**: same editor, highlight → `Save word` (meaning left blank) → fill the meaning later in the popup's New words view.
- **Review**: popup → Practice → type the missing words → correct answers push the item further out in the review schedule.
- **Export**: markdown/text per video or for the whole library; vocabulary exports separately.

## Redesign goals

- Popup is four hand-rolled hidden/shown sections with ad-hoc buttons — needs a real navigation model (tabs?) and a consistent card/list language.
- The editor must stay unobtrusive over the YouTube player and readable in both YouTube themes (currently light-only).
- Keep it keyboard- and selection-driven; avoid tiny hover-only controls (a previous version had 16px `+`/`×` per word and was easy to misclick).
- Vocabulary and structures are separate objects but should feel like one study collection.
