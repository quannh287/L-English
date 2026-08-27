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

  async function saveStructure(original, pattern) {
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
      createdAt: new Date().toISOString()
    };
    if (YSC.isDuplicate(video.structures, candidate)) return false;

    video.structures.push(candidate);
    videos[videoId] = video;
    await chrome.storage.local.set({ videos });
    return true;
  }

  function closeEditor() {
    editor?.remove();
    editor = null;
  }

  function pauseVideo() {
    document.querySelector("video")?.pause();
  }

  function playVideo() {
    document.querySelector("video")?.play().catch(() => {});
  }

  function openEditor(original) {
    closeEditor();
    const selected = new Set();
    const tokens = YSC.tokenize(original);

    editor = document.createElement("section");
    editor.className = "ysc-editor";
    editor.setAttribute("role", "dialog");
    editor.setAttribute("aria-label", "Create a fill-in-the-blank pattern");

    const heading = document.createElement("h2");
    heading.textContent = "Select words to hide";
    const tokenArea = document.createElement("div");
    tokenArea.className = "ysc-tokens";
    const status = document.createElement("p");
    status.className = "ysc-status";
    status.setAttribute("aria-live", "polite");

    tokens.forEach((token, index) => {
      if (!YSC.isWord(token)) {
        tokenArea.append(document.createTextNode(token));
        return;
      }
      const word = document.createElement("button");
      word.type = "button";
      word.className = "ysc-word";
      word.textContent = token;
      word.addEventListener("click", () => {
        selected.has(index) ? selected.delete(index) : selected.add(index);
        word.classList.toggle("is-selected", selected.has(index));
        word.setAttribute("aria-pressed", String(selected.has(index)));
        status.textContent = "";
      });
      tokenArea.append(word);
    });

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
      if (!selected.size) {
        status.textContent = "Select at least one word.";
        return;
      }
      save.disabled = true;
      playVideo();
      try {
        const saved = await saveStructure(original, YSC.buildPattern(original, selected));
        status.textContent = saved ? "Saved." : "This structure is already saved.";
        setTimeout(closeEditor, 700);
      } catch (error) {
        status.textContent = error.message;
        save.disabled = false;
      }
    });
    actions.append(cancel, save);
    editor.append(heading, tokenArea, status, actions);
    document.body.append(editor);
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
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openEditor(original);
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
        openEditor(original);
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
