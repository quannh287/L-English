(() => {
  "use strict";

  const SEGMENT_SELECTOR = "ytd-transcript-segment-renderer";
  const TEXT_SELECTOR = "yt-formatted-string.segment-text";
  const CAPTION_SELECTOR = ".ytp-caption-segment";
  let editor;

  function videoTitle() {
    return (
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim() ||
      document.title.replace(/\s*-\s*YouTube$/, "").trim() ||
      "YouTube video"
    );
  }

  async function saveStructure(original, pattern, startSeconds) {
    if (!chrome.storage) {
      throw new Error("Extension was reloaded. Refresh this page and try again.");
    }
    const videoId = YSC.getVideoId(location.href);
    if (!videoId) throw new Error("No YouTube video ID found.");

    const { videos = {} } = await chrome.storage.local.get("videos");
    const video = videos[videoId] || {
      videoId,
      title: videoTitle(),
      url: location.href,
      structures: []
    };
    video.title = videoTitle();
    video.url = location.href;

    const candidate = {
      id: crypto.randomUUID(),
      original,
      pattern,
      startSeconds,
      createdAt: new Date().toISOString()
    };
    if (YSC.isDuplicate(video.structures, candidate)) return false;

    video.structures.push(candidate);
    videos[videoId] = video;
    await chrome.storage.local.set({ videos });
    return true;
  }

  function closeEditor() {
    document.removeEventListener("pointerdown", onOutsidePointerDown, true);
    editor?.remove();
    editor = null;
  }

  function onOutsidePointerDown(event) {
    if (editor && !editor.contains(event.target)) {
      playVideo();
      closeEditor();
    }
  }

  function currentTime() {
    const seconds = document.querySelector("video")?.currentTime;
    return Number.isFinite(seconds) ? Math.floor(seconds) : undefined;
  }

  function pauseVideo() {
    document.querySelector("video")?.pause();
  }

  function playVideo() {
    document.querySelector("video")?.play().catch(() => {});
  }

  function openEditor(original, startSeconds) {
    closeEditor();
    const tokens = YSC.tokenize(original).map((text) => ({ text, selected: false }));

    editor = document.createElement("section");
    editor.className = "ysc-editor";
    editor.setAttribute("role", "dialog");
    editor.setAttribute("aria-label", "Create a fill-in-the-blank pattern");

    const heading = document.createElement("h2");
    heading.textContent = "Select words to hide";
    const sentence = document.createElement("p");
    sentence.className = "ysc-original";
    const tokenArea = document.createElement("div");
    tokenArea.className = "ysc-tokens";
    const status = document.createElement("p");
    status.className = "ysc-status";
    status.setAttribute("aria-live", "polite");

    const kept = () => tokens.filter((token) => !token.removed);
    const currentOriginal = () => YSC.normalizeText(kept().map((token) => token.text).join(""));
    const currentPattern = () =>
      YSC.normalizeText(kept().map((token) => (token.selected ? YSC.PLACEHOLDER : token.text)).join(""))
        .replace(/\[____\](?:\s+\[____\])+/g, YSC.PLACEHOLDER);

    function render() {
      sentence.textContent = currentOriginal();
      tokenArea.textContent = "";
      tokens.forEach((token) => {
        if (token.removed) return;
        if (!YSC.isWord(token.text)) {
          tokenArea.append(document.createTextNode(token.text));
          return;
        }
        const item = document.createElement("span");
        item.className = "ysc-item";

        const word = document.createElement("button");
        word.type = "button";
        word.className = "ysc-word";
        word.textContent = token.text;
        word.setAttribute("aria-pressed", String(token.selected));
        word.classList.toggle("is-selected", token.selected);
        word.addEventListener("click", () => {
          token.selected = !token.selected;
          word.classList.toggle("is-selected", token.selected);
          word.setAttribute("aria-pressed", String(token.selected));
          status.textContent = "";
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "ysc-remove";
        remove.textContent = "\u00d7";
        remove.setAttribute("aria-label", `Remove ${token.text}`);
        remove.addEventListener("click", () => {
          token.removed = true;
          status.textContent = "";
          render();
        });

        item.append(word, remove);
        tokenArea.append(item);
      });
    }
    render();

    const actions = document.createElement("div");
    actions.className = "ysc-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => {
      playVideo();
      closeEditor();
    });
    const save = document.createElement("button");
    save.type = "button";
    save.className = "ysc-primary";
    save.textContent = "Save structure";
    save.addEventListener("click", async () => {
      if (!tokens.some((token) => token.selected && !token.removed)) {
        status.textContent = "Select at least one word.";
        return;
      }
      save.disabled = true;
      playVideo();
      try {
        const saved = await saveStructure(currentOriginal(), currentPattern(), startSeconds);
        status.textContent = saved ? "Saved." : "This structure is already saved.";
        setTimeout(closeEditor, 700);
      } catch (error) {
        status.textContent = error.message;
        save.disabled = false;
      }
    });
    actions.append(cancel, save);
    editor.append(heading, sentence, tokenArea, status, actions);
    document.body.append(editor);
    document.addEventListener("pointerdown", onOutsidePointerDown, true);
    editor.querySelector(".ysc-word")?.focus();
  }

  function enhanceTranscript(root = document) {
    const segments = root.matches?.(SEGMENT_SELECTOR)
      ? [root, ...root.querySelectorAll(SEGMENT_SELECTOR)]
      : root.querySelectorAll(SEGMENT_SELECTOR);
    segments.forEach((segment) => {
      if (segment.dataset.yscReady) return;
      const textElement = segment.querySelector(TEXT_SELECTOR);
      const original = textElement?.textContent?.trim();
      if (!original) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ysc-save-button";
      button.textContent = "+ Structure";
      button.setAttribute("aria-label", `Create a structure from: ${original}`);
      const startSeconds = YSC.parseTimestamp(
        segment.querySelector(".segment-timestamp")?.textContent
      );
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openEditor(original, startSeconds ?? currentTime());
      });
      segment.append(button);
      segment.dataset.yscReady = "true";
    });
  }

  function enhanceCaptions(root = document) {
    const captions = root.matches?.(CAPTION_SELECTOR)
      ? [root, ...root.querySelectorAll(CAPTION_SELECTOR)]
      : root.querySelectorAll(CAPTION_SELECTOR);
    captions.forEach((caption) => {
      if (caption.dataset.yscReady) return;
      caption.dataset.yscReady = "true";
      caption.title = "Click to create a structure";
      caption.addEventListener("click", (event) => {
        const captionWindow = caption.closest(".caption-window");
        const segments = captionWindow?.querySelectorAll(CAPTION_SELECTOR) || [caption];
        const original = YSC.normalizeText(
          Array.from(segments, (segment) => segment.textContent).join(" ")
        );
        if (!original) return;
        event.preventDefault();
        event.stopPropagation();
        pauseVideo();
        openEditor(original, currentTime());
      });
    });
  }

  function enhancePage(root = document) {
    enhanceTranscript(root);
    enhanceCaptions(root);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) enhancePage(node);
      }
    }
  });

  function start() {
    closeEditor();
    enhancePage();
    observer.disconnect();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("yt-navigate-finish", start);
  start();
})();
