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
