const test = require("node:test");
const assert = require("node:assert/strict");
const YSC = require("../src/lib/structure-utils.js");

test("builds patterns from selected words", () => {
  const text = "I was supposed to call you last night.";
  const tokens = YSC.tokenize(text);
  const selected = tokens
    .map((token, index) => YSC.isWord(token) && ["call", "you", "last", "night"].includes(token) ? index : -1)
    .filter((index) => index >= 0);
  assert.equal(YSC.buildPattern(text, selected), "I was supposed to [____].");
});

test("normalizes text collected from multiple caption segments", () => {
  assert.equal(YSC.normalizeText("  I was\n  supposed to call.  "), "I was supposed to call.");
});

test("detects duplicate structures", () => {
  const candidate = { original: "Can we leave?", pattern: "Can we [____]?" };
  assert.equal(YSC.isDuplicate([candidate], candidate), true);
  assert.equal(YSC.isDuplicate([], candidate), false);
});

test("formats exports and sanitizes filenames", () => {
  const video = {
    title: "Friends: Café / Scene?",
    url: "https://www.youtube.com/watch?v=abc",
    structures: [{ original: "Can we leave?", pattern: "Can we [____]?" }]
  };
  assert.equal(YSC.sanitizeFilename(video.title), "Friends Café Scene");
  assert.match(YSC.formatMarkdown(video), /# Friends: Café \/ Scene\?/);
  assert.match(YSC.formatText(video), /Pattern: Can we \[____\]\?/);
});

test("checks quiz answers leniently", () => {
  const original = "I was supposed to call you last night.";
  assert.equal(YSC.checkAnswer("I was supposed to call you last night.", original), true);
  assert.equal(YSC.checkAnswer("i was supposed to call you last night", original), true);
  assert.equal(YSC.checkAnswer("  I was supposed to call you last night!  ", original), true);
  assert.equal(YSC.checkAnswer("I was supposed to text you last night.", original), false);
});

test("extracts the hidden word(s) for a single blank", () => {
  const original = "I was supposed to call you last night.";
  const pattern = "I was supposed to [____] you last night.";
  assert.deepEqual(YSC.extractBlanks(original, pattern), ["call"]);
});

test("extracts one merged blank for adjacent selected words", () => {
  const original = "Yeah, I'll take that.";
  const pattern = "Yeah, I'll [____].";
  assert.deepEqual(YSC.extractBlanks(original, pattern), ["take that"]);
});

test("extracts multiple separate blanks in order", () => {
  const original = "Can we leave before it starts raining?";
  const pattern = "Can we [____] before it starts [____]?";
  assert.deepEqual(YSC.extractBlanks(original, pattern), ["leave", "raining"]);
});

test("returns an empty list when the pattern has no blanks", () => {
  const original = "Can we leave?";
  assert.deepEqual(YSC.extractBlanks(original, original), []);
});

test("marks a never-reviewed structure as due", () => {
  assert.equal(YSC.isDue({ original: "x", pattern: "x" }), true);
});

test("marks a recently reviewed structure as not due yet", () => {
  const now = Date.parse("2026-01-10T00:00:00Z");
  const item = { reviewCount: 1, lastReviewedAt: "2026-01-09T12:00:00Z" };
  assert.equal(YSC.isDue(item, now), false);
});

test("marks a structure as due once its interval has passed", () => {
  const now = Date.parse("2026-01-10T00:00:00Z");
  const item = { reviewCount: 1, lastReviewedAt: "2026-01-08T00:00:00Z" };
  assert.equal(YSC.isDue(item, now), true);
});

test("formats a library export across multiple videos, skipping empty ones", () => {
  const videos = {
    a: {
      title: "Video A",
      url: "https://www.youtube.com/watch?v=a",
      structures: [{ original: "Can we leave?", pattern: "Can we [____]?" }]
    },
    b: { title: "Video B (empty)", url: "https://www.youtube.com/watch?v=b", structures: [] },
    c: {
      title: "Video C",
      url: "https://www.youtube.com/watch?v=c",
      structures: [{ original: "I was supposed to call.", pattern: "I was supposed to [____]." }]
    }
  };
  const markdown = YSC.formatLibraryMarkdown(videos);
  assert.match(markdown, /# Video A/);
  assert.match(markdown, /# Video C/);
  assert.doesNotMatch(markdown, /Video B/);

  const text = YSC.formatLibraryText(videos);
  assert.match(text, /Video A/);
  assert.match(text, /Video C/);
  assert.doesNotMatch(text, /Video B/);
});

test("includes the usage note in exports only when present", () => {
  const video = {
    title: "V",
    url: "https://www.youtube.com/watch?v=abc",
    structures: [
      { original: "Can we leave?", pattern: "Can we [____]?", examples: ["Dùng khi muốn rủ về sớm"] },
      { original: "I'll take that.", pattern: "I'll [____]." }
    ]
  };
  assert.match(YSC.formatMarkdown(video), /Usage: Dùng khi muốn rủ về sớm/);
  assert.match(YSC.formatText(video), /Usage: Dùng khi muốn rủ về sớm/);
  assert.equal((YSC.formatText(video).match(/Usage:/g) || []).length, 1);
});

test("reads examples from the array and falls back to the legacy note", () => {
  assert.deepEqual(YSC.examplesOf({ examples: ["a", "b"] }), ["a", "b"]);
  assert.deepEqual(YSC.examplesOf({ note: "legacy" }), ["legacy"]);
  assert.deepEqual(YSC.examplesOf({}), []);
});

test("exports every example of a structure", () => {
  const video = {
    title: "V",
    url: "u",
    structures: [{ original: "o", pattern: "p", examples: ["first", "second"] }]
  };
  assert.equal((YSC.formatMarkdown(video).match(/^Usage: /gm) || []).length, 2);
  assert.match(YSC.formatText(video), /Usage: second/);
});

test("parses and formats YouTube timestamps", () => {
  assert.equal(YSC.parseTimestamp("1:23"), 83);
  assert.equal(YSC.parseTimestamp("1:02:03"), 3723);
  assert.equal(YSC.parseTimestamp("07"), 7);
  assert.equal(YSC.parseTimestamp("nope"), null);
  assert.equal(YSC.parseTimestamp(""), null);
  assert.equal(YSC.formatTimestamp(83), "1:23");
  assert.equal(YSC.formatTimestamp(3723), "1:02:03");
  assert.equal(YSC.formatTimestamp(7), "0:07");
});

test("builds a deep link at the structure's second", () => {
  assert.equal(
    YSC.timestampUrl("https://www.youtube.com/watch?v=abc", 83),
    "https://www.youtube.com/watch?v=abc&t=83s"
  );
  assert.equal(
    YSC.timestampUrl("https://www.youtube.com/watch?v=abc&t=5s", 83),
    "https://www.youtube.com/watch?v=abc&t=83s"
  );
});

test("exports the timestamp when a structure has one", () => {
  const video = {
    title: "V",
    url: "https://www.youtube.com/watch?v=abc",
    structures: [
      { original: "o", pattern: "p", startSeconds: 83 },
      { original: "o2", pattern: "p2" }
    ]
  };
  assert.match(YSC.formatMarkdown(video), /At: 1:23 — https:\/\/www\.youtube\.com\/watch\?v=abc&t=83s/);
  assert.equal((YSC.formatText(video).match(/^At: /gm) || []).length, 1);
});
