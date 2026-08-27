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
    checkAnswer
  };

  root.YSC = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
