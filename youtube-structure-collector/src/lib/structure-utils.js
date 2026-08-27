(function (root) {
  "use strict";

  const PLACEHOLDER = "[____]";

  function tokenize(text) {
    return text.match(/[\p{L}\p{N}'’]+|[^\p{L}\p{N}'’]+/gu) || [];
  }

  function isWord(token) {
    return /[\p{L}\p{N}]/u.test(token);
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function buildPattern(text, selectedTokenIndexes) {
    const selected = new Set(selectedTokenIndexes);
    return tokenize(text)
      .map((token, index) => selected.has(index) && isWord(token) ? PLACEHOLDER : token)
      .join("")
      .replace(/\[____\](?:\s+\[____\])+/g, PLACEHOLDER);
  }

  function isDuplicate(structures, candidate) {
    return structures.some(
      (item) => item.original === candidate.original && item.pattern === candidate.pattern
    );
  }

  function sanitizeFilename(title) {
    const cleaned = String(title || "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/g, "");
    return cleaned || "youtube-structures";
  }

  function formatMarkdown(video) {
    const lines = [`# ${video.title}`, "", `Video: ${video.url}`, ""];
    video.structures.forEach((item, index) => {
      lines.push(
        `## Structure ${index + 1}`,
        "",
        `Original: ${item.original}`,
        "",
        `Pattern: ${item.pattern}`,
        ""
      );
    });
    return lines.join("\n").trimEnd() + "\n";
  }

  function formatText(video) {
    const lines = [video.title, video.url, ""];
    video.structures.forEach((item, index) => {
      lines.push(
        `Structure ${index + 1}`,
        `Original: ${item.original}`,
        `Pattern: ${item.pattern}`,
        ""
      );
    });
    return lines.join("\n").trimEnd() + "\n";
  }

  function getVideoId(url) {
    try {
      return new URL(url).searchParams.get("v");
    } catch {
      return null;
    }
  }

  function normalizeForCompare(text) {
    return normalizeText(text).toLowerCase().replace(/[.,!?;:]+$/g, "");
  }

  function checkAnswer(answer, original) {
    return normalizeForCompare(answer) === normalizeForCompare(original);
  }

  function extractBlanks(original, pattern) {
    const segments = pattern.split(PLACEHOLDER);
    const blanks = [];
    let cursor = 0;
    for (let i = 0; i < segments.length; i++) {
      const index = original.indexOf(segments[i], cursor);
      if (index === -1) return null;
      if (i > 0) blanks.push(original.slice(cursor, index));
      cursor = index + segments[i].length;
    }
    return blanks;
  }

  const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];
  const DAY_MS = 86400000;

  function isDue(item, now = Date.now()) {
    if (!item.lastReviewedAt) return true;
    const index = Math.min(item.reviewCount || 0, REVIEW_INTERVALS_DAYS.length - 1);
    const intervalMs = REVIEW_INTERVALS_DAYS[index] * DAY_MS;
    return now - new Date(item.lastReviewedAt).getTime() >= intervalMs;
  }

  function nonEmptyVideos(videos) {
    return Object.values(videos).filter((video) => video.structures.length);
  }

  function formatLibraryMarkdown(videos) {
    return nonEmptyVideos(videos).map(formatMarkdown).join("\n");
  }

  function formatLibraryText(videos) {
    return nonEmptyVideos(videos).map(formatText).join("\n");
  }

  const api = {
    PLACEHOLDER,
    tokenize,
    isWord,
    normalizeText,
    buildPattern,
    isDuplicate,
    sanitizeFilename,
    formatMarkdown,
    formatText,
    getVideoId,
    checkAnswer,
    extractBlanks,
    isDue,
    formatLibraryMarkdown,
    formatLibraryText
  };

  root.YSC = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
