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
