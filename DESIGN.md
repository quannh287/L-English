# Design System: YouTube Sentence Miner

Single source of truth for generating every screen in this project: the in-page
editor injected over the YouTube player, and the four popup views (This video,
All videos, Practice, New words).

## 1. Visual Theme & Atmosphere

A dense, instrument-grade study tool — closer to a lab notebook than to an app.
Density 8 (Cockpit Dense): the popup is 390px wide and must hold a searchable
list of sentence patterns without scrolling twice for one card. Variance 3
(Predictable Symmetric): this is a utility surface used dozens of times a day,
so structure is repeated, never re-invented per view. Motion 3 (Static
Restrained): the editor floats over playing video — anything that moves steals
attention from the sentence being read.

The mood is quiet, warm-neutral paper with one calm accent. It must sit next to
YouTube's saturated red chrome without competing, and read correctly in both
YouTube themes. Hierarchy comes from weight, mono/sans contrast, and 1px rules —
not from shadows, fills, or color.

## 2. Color Palette & Roles

**Light (default)**
- **Paper** (`#FAFAF9`) — App background, popup canvas
- **Card White** (`#FFFFFF`) — Structure cards, editor surface, input fill
- **Ink** (`#1C1917`) — Primary text: sentences, headings, word entries
- **Graphite** (`#57534E`) — Secondary text: meanings, video titles, helper copy
- **Ash** (`#8A857F`) — Tertiary: timestamps, counts, metadata, placeholders
- **Rule** (`#E7E5E4`) — 1px dividers, card borders, input borders
- **Deep Teal** (`#2E6A5F`) — THE accent (H 170°, S 39%, L 30%). Primary buttons,
  focus rings, active tab underline, correct-answer state, `[____]` placeholder ink
- **Teal Wash** (`#E4EFEC`) — Accent at rest: selected text highlight, active tab fill

**Dark (YouTube dark theme)**
- **Slate Night** (`#17171A`) — Background. Never `#000000`
- **Raised Night** (`#1F1F23`) — Card and editor surface
- **Bone** (`#EDEBE8`) — Primary text
- **Fog** (`#A8A29E`) — Secondary text
- **Rule Dark** (`#33333A`) — Borders and dividers
- **Teal Light** (`#6FB3A4`) — Accent on dark
- **Teal Wash Dark** (`rgba(111,179,164,0.14)`) — Selection and active fill

**Semantic only (never decorative, never a second accent)**
- **Due Ochre** (`#8A6B1F`) — "Due" badge text on `#F5EEDC`; dark: `#D6B25E` on `rgba(214,178,94,0.14)`
- **Brick** (`#A33B32`) — Destructive: Delete, Remove, Clear this video, wrong answer

One accent. No purple, no indigo, no neon, no gradient fills, no pure black.

## 3. Typography Rules

- **Display / UI:** `Geist` — headings, buttons, tabs, sentences. Track-tight
  (`-0.011em`) at 16px+. Hierarchy by weight (600 vs 400), never by size jumps.
- **Body:** `Geist` 400 — sentences at 14px/20px. Meanings and helper copy 13px.
  Max 65 characters per line; in the 390px popup that is the natural wrap.
- **Font loading:** no webfont is bundled and extension pages cannot pull a CDN
  font, so every stack is `"Geist", ui-sans-serif, system-ui, …` / `"Geist Mono",
  ui-monospace, …` — Geist when the user has it, a neutral system face otherwise.
  Never `Inter`, even as a fallback entry.
- **Mono:** `Geist Mono` — every pattern preview, every `[____]` placeholder,
  every timestamp (`04:12`), every count, every score line (`3 / 12`), every date.
  Density is 8, so all numbers are monospace. No exceptions.
- **Labels:** `Geist` 600, 11px, `0.06em` tracking, uppercase, Ash — for
  "PATTERN", "EXAMPLES", "DUE", section headers.
- **Banned:** `Inter`. All system-font stacks as a "premium" choice. All serifs —
  this is a software UI, serif is banned outright here.

## 4. Component Stylings

- **Buttons:** Flat, 4px radius, no outer glow, no gradient. Primary = Deep Teal
  fill, Card White text. Secondary = 1px Rule border, Ink text, transparent fill.
  Destructive = ghost with Brick text, Brick 1px border on hover only. Active
  state translates `1px` down for tactile push. This is a pointer-only surface, so hit
  boxes are 40px tall for primary actions and at least 32×44px for inline icon
  buttons — the previous 16px `+`/`×` targets are banned.
- **Structure cards:** No shadow, no fill difference from canvas — separated by a
  1px Rule border-top and 12px vertical rhythm. Elevation is reserved for the
  editor alone. The pattern preview sits inside the card as a Teal Wash block,
  Geist Mono, 4px radius. Selected card gets a 2px Deep Teal left border.
- **In-page editor:** The only elevated surface. Fixed bottom-right, 520px wide,
  8px radius, 1px Rule border plus one diffused shadow tinted to the background
  hue (`0 8px 24px rgba(28,25,23,0.12)`; dark: `rgba(0,0,0,0.45)`). Contents
  stack top to bottom: label, full sentence, action bar, pattern preview, status
  line, footer buttons. Disabled actions are Ash text at full opacity — greyed,
  never hidden, so the user learns what selection unlocks them.
- **Text selection:** Native browser selection, painted Teal Wash with 2px
  corner radius. Hidden words render as Geist Mono `[____]` in Deep Teal. No
  per-word chips, no hover-only affordances.
- **Tabs:** Full-width segmented row across the popup top. Inactive = Graphite
  text on Paper. Active = Ink text, Teal Wash fill, 2px Deep Teal bottom border.
  Four tabs, equal width, always visible — never a dropdown.
- **Inputs:** Label above in Label style, input below, error text below that,
  8px gaps. 1px Rule border → Deep Teal on focus plus a 2px focus ring at 20%
  accent opacity. No floating labels, no placeholder-as-label.
- **Badges:** Pill radius, 11px Geist Mono, 2px/8px padding. "Due" uses Due Ochre.
- **Loading:** Skeletal blocks matching exact card dimensions — three stacked
  rules at card height. No circular spinners.
- **Empty states:** A composed block showing the shape of a future card plus one
  sentence naming the action that fills it ("Open a video transcript and press
  + Structure"). Never a bare "No data".
- **Errors:** Inline, below the field or action that failed, in Brick. No toasts
  that vanish, no modal alerts.

## 5. Layout Principles

- CSS Grid throughout. No flexbox percentage math, no `calc()` hacks.
- Popup is a fixed 390px column: 12px container padding, 12px gaps between
  cards, 4px baseline grid for everything inside.
- One view at a time — the four popup views are mutually exclusive, driven by
  the tab row. No nested scroll regions; the card list is the only scroller.
- No overlapping elements anywhere. The editor is the single absolutely
  positioned surface, and nothing stacks on top of it.
- No 3-equal-card rows. Lists are vertical and full-bleed to the container.
- Editor caps at `min(520px, calc(100vw - 32px))` and clears YouTube's player
  controls by 24px at the bottom.
- Any full-height region uses `min-h-[100dvh]`, never `h-screen`.

## 6. Motion & Interaction

- Spring physics (`stiffness: 100, damping: 20`) for the editor's entrance and
  dismissal. No linear easing anywhere.
- Editor enters with an 8px rise plus opacity, 180ms. It exits the same way on
  Cancel, outside click, or save — and playback resumes as it leaves.
- Practice feedback: the answer field border transitions to Deep Teal or Brick
  over 120ms. No confetti, no shake, no sound.
- Overdue badges get one slow perpetual pulse (opacity 1 → 0.72, 2.4s) — this is
  the only infinite loop in the product, because everything else sits over video.
- Transform and opacity only. Never animate `top`, `left`, `width`, `height`.
- Staggered 40ms cascade when a card list first mounts. Never on re-filter — a
  search box that re-animates on every keystroke is unusable.
- Keyboard first: Esc closes the editor, Enter submits the practice answer,
  Tab order follows visual order in every view.

## 7. Anti-Patterns (Banned)

- No emojis, anywhere, including empty states and practice feedback.
- No `Inter`. No serif fonts of any kind in this UI.
- No pure black (`#000000`) and no pure-white-on-pure-black dark mode.
- No purple, indigo, or neon accents. No outer glows. No gradient text or fills.
- No second accent color — Due Ochre and Brick are semantic, not decorative.
- No overlapping elements; no absolute-positioned content stacking.
- No 3-column equal card grids.
- No circular spinners, no toast notifications, no modal alerts.
- No hover-only controls and no hit box under 32×44px.
- No custom mouse cursors.
- No filler UI text: "Scroll to explore", "Swipe down", scroll arrows, chevrons.
- No AI copywriting: "Elevate", "Seamless", "Unleash", "Next-Gen", "Supercharge".
- No generic placeholder content ("John Doe", "Acme", "Lorem ipsum") — sample
  data must be real English sentences with real timestamps.
- No fake round numbers (`99.99%`, `50% faster`) in any label or badge.
- No broken image links — use `picsum.photos` or inline SVG for video thumbnails.
