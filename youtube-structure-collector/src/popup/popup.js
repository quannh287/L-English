(() => {
  "use strict";

  const status = document.querySelector("#status");
  const collection = document.querySelector("#collection");
  const titleLink = document.querySelector("#video-title");
  const structuresElement = document.querySelector("#structures");
  const practiceButton = document.querySelector("#practice");
  const quiz = document.querySelector("#quiz");
  const quizScoreElement = document.querySelector("#quiz-score");
  const quizPatternElement = document.querySelector("#quiz-pattern");
  const quizAnswerInput = document.querySelector("#quiz-answer");
  const quizFeedback = document.querySelector("#quiz-feedback");
  const quizCheckButton = document.querySelector("#quiz-check");
  const quizNextButton = document.querySelector("#quiz-next");
  let videoId;
  let video;
  let quizItems = [];
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  async function persist() {
    const { videos = {} } = await chrome.storage.local.get("videos");
    videos[videoId] = video;
    await chrome.storage.local.set({ videos });
  }

  function render() {
    titleLink.textContent = video.title;
    titleLink.href = video.url;
    structuresElement.replaceChildren();
    practiceButton.disabled = !video.structures.length;

    if (!video.structures.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No structures saved for this video. Open its transcript and select + Structure.";
      structuresElement.append(empty);
      return;
    }

    video.structures.forEach((item) => {
      const card = document.createElement("article");
      card.className = "structure";
      const original = document.createElement("p");
      original.className = "original";
      original.textContent = item.original;
      const row = document.createElement("div");
      row.className = "pattern-row";
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
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        video.structures = video.structures.filter((structure) => structure.id !== item.id);
        await persist();
        render();
      });
      row.append(input, remove);
      card.append(original, row);
      structuresElement.append(card);
    });
  }

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
      quizScoreElement.textContent = `Done: ${quizScore}/${quizItems.length}`;
      quizPatternElement.textContent = "";
      quizAnswerInput.hidden = true;
      quizFeedback.textContent = "";
      quizCheckButton.hidden = true;
      quizNextButton.hidden = false;
      quizNextButton.textContent = "Restart";
      return;
    }
    quizScoreElement.textContent = `Question ${quizIndex + 1}/${quizItems.length} — Score: ${quizScore}`;
    quizPatternElement.textContent = quizItems[quizIndex].pattern;
    quizAnswerInput.hidden = false;
    quizAnswerInput.value = "";
    quizAnswerInput.disabled = false;
    quizFeedback.textContent = "";
    quizAnswered = false;
    quizCheckButton.hidden = false;
    quizNextButton.hidden = true;
    quizNextButton.textContent = "Next";
    quizAnswerInput.focus();
  }

  function expectedAnswer(item) {
    const blanks = YSC.extractBlanks(item.original, item.pattern);
    return blanks && blanks.length ? blanks.join(" ") : item.original;
  }

  function checkQuizAnswer() {
    if (quizAnswered || quizIndex >= quizItems.length) return;
    const item = quizItems[quizIndex];
    const answer = expectedAnswer(item);
    const correct = YSC.checkAnswer(quizAnswerInput.value, answer);
    if (correct) quizScore += 1;
    quizFeedback.textContent = correct ? "Correct!" : `Not quite. Answer: ${answer}`;
    quizAnswered = true;
    quizAnswerInput.disabled = true;
    quizCheckButton.hidden = true;
    quizNextButton.hidden = false;
  }

  function startQuiz() {
    quizItems = shuffled(video.structures);
    quizIndex = 0;
    quizScore = 0;
    collection.hidden = true;
    quiz.hidden = false;
    renderQuizQuestion();
  }

  practiceButton.addEventListener("click", startQuiz);
  quizCheckButton.addEventListener("click", checkQuizAnswer);
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
  document.querySelector("#quiz-exit").addEventListener("click", () => {
    quiz.hidden = true;
    collection.hidden = false;
  });

  function download(contents, extension) {
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${YSC.sanitizeFilename(video.title)}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  document.querySelector("#copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(YSC.formatMarkdown(video));
    event.currentTarget.textContent = "Copied";
    setTimeout(() => { event.currentTarget.textContent = "Copy Markdown"; }, 900);
  });
  document.querySelector("#download-md").addEventListener("click", () => {
    download(YSC.formatMarkdown(video), "md");
  });
  document.querySelector("#download-txt").addEventListener("click", () => {
    download(YSC.formatText(video), "txt");
  });
  document.querySelector("#clear").addEventListener("click", async () => {
    if (!confirm("Delete all structures saved for this video?")) return;
    const { videos = {} } = await chrome.storage.local.get("videos");
    delete videos[videoId];
    await chrome.storage.local.set({ videos });
    video.structures = [];
    render();
  });

  async function initialize() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    videoId = YSC.getVideoId(tab?.url);
    if (!videoId || !tab.url?.startsWith("https://www.youtube.com/watch")) {
      status.textContent = "Open a YouTube video to view its structures.";
      return;
    }

    const { videos = {} } = await chrome.storage.local.get("videos");
    video = videos[videoId] || {
      videoId,
      title: tab.title?.replace(/\s*-\s*YouTube$/, "") || "YouTube video",
      url: tab.url,
      structures: []
    };
    status.hidden = true;
    collection.hidden = false;
    render();
  }

  initialize().catch((error) => {
    status.textContent = `Could not load structures: ${error.message}`;
  });
})();
