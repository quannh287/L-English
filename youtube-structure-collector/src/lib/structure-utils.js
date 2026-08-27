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

  function parseTimestamp(text) {
    const raw = String(text || "").trim();
    if (!/^\d{1,2}(:\d{1,2}){0,2}$/.test(raw)) return null;
    return raw.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  }

  function formatTimestamp(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const parts = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
    if (!parts[0]) parts.shift();
    return parts.map((part, index) => index ? String(part).padStart(2, "0") : String(part)).join(":");
  }

  function timestampUrl(url, seconds) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("t", `${Math.max(0, Math.floor(seconds))}s`);
      return parsed.toString();
    } catch {
      return url;
    }
  }

  // ponytail: `note` was the pre-array single example, kept readable here only
  function examplesOf(item) {
    if (Array.isArray(item.examples)) return item.examples.filter(Boolean);
    return item.note ? [item.note] : [];
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
      if (Number.isFinite(item.startSeconds)) {
        lines.push(`At: ${formatTimestamp(item.startSeconds)} — ${timestampUrl(video.url, item.startSeconds)}`, "");
      }
      examplesOf(item).forEach((example) => lines.push(`Usage: ${example}`, ""));
    });
    return lines.join("\n").trimEnd() + "\n";
  }

  function formatText(video) {
    const lines = [video.title, video.url, ""];
    video.structures.forEach((item, index) => {
      lines.push(
        `Structure ${index + 1}`,
        `Original: ${item.original}`,
        `Pattern: ${item.pattern}`
      );
      if (Number.isFinite(item.startSeconds)) {
        lines.push(`At: ${formatTimestamp(item.startSeconds)} — ${timestampUrl(video.url, item.startSeconds)}`);
      }
      examplesOf(item).forEach((example) => lines.push(`Usage: ${example}`));
      lines.push("");
    });
    return lines.join("\n").trimEnd() + "\n";
  }

  function formatWordsMarkdown(words) {
    const lines = ["# Vocabulary", ""];
    words.forEach((item) => lines.push(item.meaning ? `- **${item.word}** — ${item.meaning}` : `- **${item.word}**`));
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
    examplesOf,
    parseTimestamp,
    formatTimestamp,
    timestampUrl,
    buildPattern,
    isDuplicate,
    sanitizeFilename,
    formatMarkdown,
    formatText,
    formatWordsMarkdown,
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
