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
