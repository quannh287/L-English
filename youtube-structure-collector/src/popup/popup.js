(() => {
  "use strict";

  const status = document.querySelector("#status");
  const collection = document.querySelector("#collection");
  const titleLink = document.querySelector("#video-title");
  const searchInput = document.querySelector("#search");
  const structuresElement = document.querySelector("#structures");
  const library = document.querySelector("#library");
  const librarySearchInput = document.querySelector("#library-search");
  const libraryGroups = document.querySelector("#library-groups");
  const quiz = document.querySelector("#quiz");
  const quizScoreElement = document.querySelector("#quiz-score");
  const quizPatternElement = document.querySelector("#quiz-pattern");
  const quizAnswerInput = document.querySelector("#quiz-answer");
  const quizFeedback = document.querySelector("#quiz-feedback");
  const quizCheckButton = document.querySelector("#quiz-check");
  const quizNextButton = document.querySelector("#quiz-next");
  const quizSkipButton = document.querySelector("#quiz-skip");
  const quizProgressBar = document.querySelector("#quiz-progress span");
  const wordsSection = document.querySelector("#words");
  const wordForm = document.querySelector("#word-form");
  const wordInput = document.querySelector("#word-input");
  const meaningInput = document.querySelector("#meaning-input");
  const wordList = document.querySelector("#word-list");
  let words = [];
  let videoId;
  let video;
  let allVideos = {};
  let quizItems = [];
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let quizReviewingAll = false;

  const SVG_NS = "http://www.w3.org/2000/svg";

  function icon(name, size = 16) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function deleteButton(label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.append(icon("trash", 18));
    button.setAttribute("aria-label", label);
    button.addEventListener("click", handler);
    return button;
  }

  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const views = { collection, library, quiz, words: wordsSection };

  function showView(name) {
    status.hidden = true;
    Object.entries(views).forEach(([key, section]) => { section.hidden = key !== name; });
    tabButtons.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.view === name)));
    if (name === "library") renderLibrary();
    if (name === "words") { renderWords(); wordInput.focus(); }
    if (name === "quiz") startQuiz();
  }

  tabButtons.forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));

  async function persist() {
    const { videos = {} } = await chrome.storage.local.get("videos");
    videos[videoId] = video;
    allVideos = videos;
    await chrome.storage.local.set({ videos });
  }

  function matchesSearch(item, query) {
    if (!query) return true;
    return `${item.original} ${item.pattern} ${YSC.examplesOf(item).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  }

  function dueBadge() {
    const badge = document.createElement("span");
    badge.className = "due-badge";
    badge.textContent = "Due";
    return badge;
  }

  function timestampLink(item, url) {
    if (!Number.isFinite(item.startSeconds)) return null;
    const link = document.createElement("a");
    link.className = "timestamp";
    link.target = "_blank";
    link.rel = "noreferrer";
    link.href = YSC.timestampUrl(url || video.url, item.startSeconds);
    link.append(icon("clock", 15), YSC.formatTimestamp(item.startSeconds));
    return link;
  }

  function render() {
    titleLink.querySelector("span").textContent = video.title;
    titleLink.href = video.url;
    structuresElement.replaceChildren();
    tabButtons.find((tab) => tab.dataset.view === "quiz").disabled = !video.structures.length;

    if (!video.structures.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No structures saved for this video. Open its transcript and select + Structure.";
      structuresElement.append(empty);
      return;
    }

    const visible = video.structures.filter((item) => matchesSearch(item, searchInput.value));
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No structures match your search.";
      structuresElement.append(empty);
      return;
    }

    visible.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";
      const head = document.createElement("header");
      head.className = "card-head";
      const meta = document.createElement("div");
      meta.className = "meta";
      if (YSC.isDue(item)) meta.append(dueBadge());
      const stamp = timestampLink(item);
      if (stamp) meta.append(stamp);
      head.append(meta);
      const original = document.createElement("p");
      original.className = "original";
      original.append(item.original);
      const row = document.createElement("div");
      row.className = "pattern-block";
      const input = document.createElement("input");
      input.value = item.pattern;
      input.setAttribute("aria-label", `Pattern for ${item.original}`);
      input.addEventListener("change", async () => {
        const value = input.value.trim();
        if (!value) {
          input.value = item.pattern;
          return;
        }
        item.pattern = value;
        await persist();
      });
      const remove = deleteButton(`Delete structure: ${item.original}`, async () => {
        video.structures = video.structures.filter((structure) => structure.id !== item.id);
        await persist();
        render();
      });
      row.append(input);
      head.append(remove);
      const examples = document.createElement("ul");
      examples.className = "examples";
      const renderExamples = () => {
        examples.replaceChildren();
        YSC.examplesOf(item).forEach((example, exampleIndex) => {
          const li = document.createElement("li");
          const text = document.createElement("span");
          text.textContent = example;
          li.append(text);
          const remove = deleteButton(`Delete example: ${example}`, async () => {
            item.examples = YSC.examplesOf(item).filter((_, i) => i !== exampleIndex);
            delete item.note;
            await persist();
            renderExamples();
          });
          li.append(remove);
          examples.append(li);
        });
      };
      renderExamples();

      const note = document.createElement("input");
      note.className = "note";
      note.placeholder = "Dùng khi nào / ví dụ của bạn — Enter để thêm";
      note.setAttribute("aria-label", `Add a usage example for ${item.original}`);
      note.addEventListener("keydown", async (event) => {
        if (event.key !== "Enter") return;
        const value = note.value.trim();
        if (!value) return;
        item.examples = [...YSC.examplesOf(item), value];
        delete item.note;
        note.value = "";
        await persist();
        renderExamples();
      });
      const examplesLabel = document.createElement("h4");
      examplesLabel.className = "label";
      examplesLabel.textContent = "Usage examples";
      card.append(head, original, row, examplesLabel, examples, note);
      structuresElement.append(card);
    });
  }

  function renderLibrary() {
    libraryGroups.replaceChildren();
    const query = librarySearchInput.value;
    const groups = Object.values(allVideos)
      .map((entry) => ({ entry, items: entry.structures.filter((item) => matchesSearch(item, query)) }))
      .filter(({ items }) => items.length);

    if (!groups.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = query ? "No structures match your search." : "No structures saved yet.";
      libraryGroups.append(empty);
      return;
    }

    groups.forEach(({ entry, items }) => {
      const group = document.createElement("section");
      group.className = "library-group";
      const head = document.createElement("header");
      head.className = "library-group-head";
      const title = document.createElement("a");
      title.className = "library-group-title";
      title.target = "_blank";
      title.rel = "noreferrer";
      title.href = entry.url;
      title.append(icon("video", 18), entry.title);
      const count = document.createElement("span");
      count.className = "count-pill";
      count.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
      head.append(title, count);
      group.append(head);

      items.forEach((item) => {
        const wrap = document.createElement("article");
        wrap.className = "card library-item";
        const meta = document.createElement("header");
        meta.className = "card-head";
        const metaInner = document.createElement("div");
        metaInner.className = "meta";
        if (YSC.isDue(item)) metaInner.append(dueBadge());
        const stamp = timestampLink(item, entry.url);
        if (stamp) metaInner.append(stamp);
        meta.append(metaInner);
        if (metaInner.childNodes.length) wrap.append(meta);
        const original = document.createElement("p");
        original.className = "original";
        original.append(item.original);
        const patternBlock = document.createElement("div");
        patternBlock.className = "pattern-block";
        const pattern = document.createElement("p");
        pattern.className = "pattern";
        pattern.textContent = item.pattern;
        patternBlock.append(pattern);
        wrap.append(original, patternBlock);
        YSC.examplesOf(item).forEach((example) => {
          const note = document.createElement("p");
          note.className = "note-text";
          note.textContent = `— ${example}`;
          wrap.append(note);
        });
        group.append(wrap);
      });
      libraryGroups.append(group);
    });
  }

  async function persistWords() {
    await chrome.storage.local.set({ words });
  }

  const wordCount = document.querySelector("#word-count");

  function renderWords() {
    wordList.replaceChildren();
    wordCount.hidden = !words.length;
    wordCount.textContent = `${words.length} ${words.length === 1 ? "item" : "items"}`;
    if (!words.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No words yet. Add one above.";
      wordList.append(empty);
      return;
    }
    words.forEach((item) => {
      const row = document.createElement("article");
      row.className = "word-item";
      const head = document.createElement("header");
      head.className = "word-head";
      const word = document.createElement("span");
      word.className = "word";
      word.textContent = item.word;
      const remove = deleteButton(`Delete word: ${item.word}`, async () => {
        words = words.filter((entry) => entry.id !== item.id);
        await persistWords();
        renderWords();
      });
      const ipa = document.createElement("span");
      ipa.className = "ipa";
      ipa.textContent = item.ipa || "";
      head.append(word, ipa, remove);
      const meaning = document.createElement("p");
      meaning.className = "meaning";
      meaning.textContent = item.meaning || "";
      row.append(head, meaning);
      if (!item.meaning || !item.ipa) {
        const lookup = document.createElement("button");
        lookup.type = "button";
        lookup.className = "lookup";
        lookup.textContent = "Look up";
        lookup.addEventListener("click", async () => {
          lookup.disabled = true;
          lookup.textContent = "Looking up…";
          const found = await YSC.lookupWord(item.word);
          if (!found) {
            lookup.disabled = false;
            lookup.textContent = "Not found — retry";
            return;
          }
          item.meaning = item.meaning || found.meaning;
          item.ipa = item.ipa || found.ipa;
          await persistWords();
          renderWords();
        });
        row.append(lookup);
      }
      wordList.append(row);
    });
  }

  wordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const word = wordInput.value.trim();
    if (!word) return;
    let meaning = meaningInput.value.trim();
    let ipa = "";
    if (!meaning) {
      const found = await YSC.lookupWord(word);
      meaning = found?.meaning || "";
      ipa = found?.ipa || "";
    }
    const existing = words.find((entry) => entry.word.toLowerCase() === word.toLowerCase());
    if (existing) {
      existing.meaning = meaning || existing.meaning;
      existing.ipa = ipa || existing.ipa;
    } else {
      words.push({ id: crypto.randomUUID(), word, meaning, ipa, createdAt: new Date().toISOString() });
    }
    wordInput.value = "";
    meaningInput.value = "";
    await persistWords();
    renderWords();
    wordInput.focus();
  });

  document.querySelector("#words-copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(YSC.formatWordsMarkdown(words));
    const label = event.currentTarget.lastChild;
    label.textContent = "Copied";
    setTimeout(() => { label.textContent = "Copy MD"; }, 900);
  });
  document.querySelector("#words-download-md").addEventListener("click", () => {
    download(YSC.formatWordsMarkdown(words), "md", "vocabulary");
  });

  function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderQuizQuestion() {
    if (quizIndex >= quizItems.length) {
      quizScoreElement.textContent = `Done — ${quizScore}/${quizItems.length} correct`;
      quizPatternElement.textContent = "";
      quizPatternElement.hidden = true;
      quizProgressBar.style.width = "100%";
      quizAnswerInput.hidden = true;
      quizFeedback.textContent = "";
      quizFeedback.className = "";
      quizSkipButton.hidden = true;
      quizCheckButton.hidden = true;
      quizNextButton.hidden = false;
      quizNextButton.textContent = "Restart";
      return;
    }
    const label = quizReviewingAll ? "Review" : "Due";
    quizScoreElement.textContent = `${label} — item ${quizIndex + 1} of ${quizItems.length}`;
    quizProgressBar.style.width = `${(quizIndex / quizItems.length) * 100}%`;
    quizPatternElement.hidden = false;
    quizPatternElement.textContent = quizItems[quizIndex].pattern;
    quizAnswerInput.hidden = false;
    quizAnswerInput.value = "";
    quizAnswerInput.disabled = false;
    quizFeedback.textContent = "";
    quizFeedback.className = "";
    quizAnswered = false;
    quizSkipButton.hidden = false;
    quizCheckButton.hidden = false;
    quizNextButton.hidden = true;
    quizNextButton.textContent = "Next";
    quizAnswerInput.focus();
  }

  function expectedAnswer(item) {
    const blanks = YSC.extractBlanks(item.original, item.pattern);
    return blanks && blanks.length ? blanks.join(" ") : item.original;
  }

  async function checkQuizAnswer() {
    if (quizAnswered || quizIndex >= quizItems.length) return;
    const item = quizItems[quizIndex];
    const answer = expectedAnswer(item);
    const correct = YSC.checkAnswer(quizAnswerInput.value, answer);
    if (correct) quizScore += 1;
    quizFeedback.textContent = correct ? "Correct!" : `Not quite. Answer: ${answer}`;
    quizFeedback.className = correct ? "is-correct" : "is-wrong";
    quizAnswered = true;
    quizAnswerInput.disabled = true;
    quizSkipButton.hidden = true;
    quizCheckButton.hidden = true;
    quizNextButton.hidden = false;

    item.reviewCount = correct ? (item.reviewCount || 0) + 1 : 0;
    item.lastReviewedAt = new Date().toISOString();
    await persist();
  }

  function startQuiz() {
    const due = video.structures.filter((item) => YSC.isDue(item));
    quizReviewingAll = !due.length;
    quizItems = shuffled(quizReviewingAll ? video.structures : due);
    quizIndex = 0;
    quizScore = 0;
    renderQuizQuestion();
  }

  quizCheckButton.addEventListener("click", checkQuizAnswer);
  quizSkipButton.addEventListener("click", () => {
    quizIndex += 1;
    renderQuizQuestion();
  });
  quizNextButton.addEventListener("click", () => {
    if (quizIndex >= quizItems.length) {
      startQuiz();
      return;
    }
    quizIndex += 1;
    renderQuizQuestion();
  });
  quizAnswerInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (quizAnswered) quizNextButton.click();
    else quizCheckButton.click();
  });

  searchInput.addEventListener("input", render);
  librarySearchInput.addEventListener("input", renderLibrary);


  function download(contents, extension, filename) {
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  document.querySelector("#copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(YSC.formatMarkdown(video));
    const label = event.currentTarget.lastChild;
    label.textContent = "Copied";
    setTimeout(() => { label.textContent = "Copy MD"; }, 900);
  });
  document.querySelector("#download-md").addEventListener("click", () => {
    download(YSC.formatMarkdown(video), "md", YSC.sanitizeFilename(video.title));
  });
  document.querySelector("#download-txt").addEventListener("click", () => {
    download(YSC.formatText(video), "txt", YSC.sanitizeFilename(video.title));
  });

  document.querySelector("#library-copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(YSC.formatLibraryMarkdown(allVideos));
    const label = event.currentTarget.lastChild;
    label.textContent = "Copied";
    setTimeout(() => { label.textContent = "Copy MD"; }, 900);
  });
  document.querySelector("#library-download-md").addEventListener("click", () => {
    download(YSC.formatLibraryMarkdown(allVideos), "md", "youtube-structures-library");
  });
  document.querySelector("#library-download-txt").addEventListener("click", () => {
    download(YSC.formatLibraryText(allVideos), "txt", "youtube-structures-library");
  });
  document.querySelector("#clear").addEventListener("click", async () => {
    if (!confirm("Delete all structures saved for this video?")) return;
    const { videos = {} } = await chrome.storage.local.get("videos");
    delete videos[videoId];
    allVideos = videos;
    await chrome.storage.local.set({ videos });
    video.structures = [];
    render();
  });

  function mostRecentlyUpdatedVideo(videos) {
    let latest = null;
    let latestTime = -Infinity;
    Object.values(videos).forEach((entry) => {
      entry.structures.forEach((item) => {
        const time = Date.parse(item.createdAt) || 0;
        if (time > latestTime) {
          latestTime = time;
          latest = entry;
        }
      });
    });
    return latest;
  }

  async function initialize() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const onWatchPage = Boolean(tab?.url?.startsWith("https://www.youtube.com/watch"));
    const tabVideoId = onWatchPage ? YSC.getVideoId(tab.url) : null;

    const { videos = {}, words: savedWords = [] } = await chrome.storage.local.get(["videos", "words"]);
    allVideos = videos;
    words = savedWords;

    if (tabVideoId) {
      videoId = tabVideoId;
      video = videos[tabVideoId] || {
        videoId: tabVideoId,
        title: tab.title?.replace(/\s*-\s*YouTube$/, "") || "YouTube video",
        url: tab.url,
        structures: []
      };
    } else {
      const last = mostRecentlyUpdatedVideo(videos);
      if (!last) {
        status.textContent = "Open a YouTube video to add structures. Nothing saved yet.";
        tabButtons.forEach((tab) => { tab.disabled = tab.dataset.view === "collection" || tab.dataset.view === "quiz"; });
        return;
      }
      videoId = last.videoId;
      video = last;
    }

    render();
    showView("collection");
  }

  initialize().catch((error) => {
    status.textContent = `Could not load structures: ${error.message}`;
  });
})();
