(() => {
  "use strict";

  const SEGMENT_SELECTOR = "ytd-transcript-segment-renderer";
  const TEXT_SELECTOR = "yt-formatted-string.segment-text";
  const CAPTION_SELECTOR = ".ytp-caption-segment";
  let editor;
  let onSelectionChange;

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

  async function saveWord(word) {
    if (!chrome.storage) {
      throw new Error("Extension was reloaded. Refresh this page and try again.");
    }
    const { words = [] } = await chrome.storage.local.get("words");
    if (words.some((entry) => entry.word.toLowerCase() === word.toLowerCase())) return false;
    const entry = await YSC.lookupWord(word);
    words.push({
      id: crypto.randomUUID(),
      word,
      meaning: entry?.meaning || "",
      ipa: entry?.ipa || "",
      createdAt: new Date().toISOString()
    });
    await chrome.storage.local.set({ words });
    return true;
  }

  function closeEditor() {
    document.removeEventListener("pointerdown", onOutsidePointerDown, true);
    if (onSelectionChange) document.removeEventListener("selectionchange", onSelectionChange);
    onSelectionChange = null;
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

  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICON_PATHS = {
    brand: ["M3 3h6v6H3zM15 15h6v6h-6z", "M9 6h4a2 2 0 0 1 2 2v10"],
    close: ["M6 6l12 12M18 6L6 18"]
  };

  function icon(name, size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    ICON_PATHS[name].forEach((d) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      svg.append(path);
    });
    return svg;
  }

  function openEditor(original, startSeconds) {
    closeEditor();
    const tokens = YSC.tokenize(original).map((text) => ({ text, selected: false }));

    editor = document.createElement("section");
    editor.className = "ysc-editor";
    editor.setAttribute("role", "dialog");
    editor.setAttribute("aria-label", "Create a fill-in-the-blank pattern");

    const head = document.createElement("header");
    head.className = "ysc-head";
    const heading = document.createElement("h2");
    heading.textContent = "Capture Structure";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "ysc-close";
    closeButton.title = "Close";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.append(icon("close", 20));
    closeButton.addEventListener("click", () => {
      playVideo();
      closeEditor();
    });
    head.append(icon("brand", 18), heading, closeButton);
    const sentence = document.createElement("p");
    sentence.className = "ysc-sentence";
    const preview = document.createElement("p");
    preview.className = "ysc-preview";
    const tools = document.createElement("div");
    tools.className = "ysc-tools";
    const hint = document.createElement("p");
    hint.className = "ysc-hint";
    const status = document.createElement("p");
    status.className = "ysc-status";
    status.setAttribute("aria-live", "polite");

    const kept = () => tokens.filter((token) => !token.removed);
    const currentOriginal = () => YSC.normalizeText(kept().map((token) => token.text).join(""));
    const currentPattern = () =>
      YSC.normalizeText(kept().map((token) => (token.selected ? YSC.PLACEHOLDER : token.text)).join(""))
        .replace(/\[____\](?:\s+\[____\])+/g, YSC.PLACEHOLDER);

    // ponytail: native text selection instead of per-word buttons — double-click = one word, drag = a phrase
    function highlighted() {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed) return [];
      return Array.from(sentence.querySelectorAll(".ysc-token"))
        .filter((span) => selection.containsNode(span, true))
        .map((span) => tokens[Number(span.dataset.index)]);
    }

    function renderSentence() {
      sentence.textContent = "";
      tokens.forEach((token, index) => {
        if (token.removed) return;
        if (!YSC.isWord(token.text)) {
          sentence.append(document.createTextNode(token.text));
          return;
        }
        const span = document.createElement("span");
        span.className = "ysc-token";
        span.classList.toggle("is-hidden", token.selected);
        span.dataset.index = String(index);
        span.textContent = token.text;
        sentence.append(span);
      });
      const hidden = kept().filter((token) => token.selected).length;
      preview.textContent = hidden ? currentPattern() : "";
      preview.hidden = !hidden;
      hint.textContent = hidden ? `${hidden} ${hidden === 1 ? "word" : "words"} hidden` : "Select words, then press Hide";
      syncTools();
    }

    function action(label, title, handler) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.title = title;
      // keep the text selection alive when the button takes focus
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => handler(highlighted()));
      tools.append(button);
      return button;
    }

    const hideButton = action("Hide", "Turn the selected word(s) into a blank", (picked) => {
      const hiding = picked.some((token) => !token.selected);
      picked.forEach((token) => { token.selected = hiding; });
      status.textContent = "";
      renderSentence();
    });
    const wordButton = action("Save word", "Save the selection to your new words list", async (picked) => {
      const phrase = picked.map((token) => token.text).join(" ");
      if (!phrase) return;
      try {
        const added = await saveWord(phrase);
        status.textContent = added ? `Added "${phrase}" to new words.` : `"${phrase}" is already in new words.`;
      } catch (error) {
        status.textContent = error.message;
      }
    });
    const removeButton = action("Remove", "Drop the selected word(s) from this sentence", (picked) => {
      picked.forEach((token) => { token.removed = true; });
      status.textContent = "";
      renderSentence();
    });

    function syncTools() {
      const picked = highlighted();
      [hideButton, wordButton, removeButton].forEach((button) => { button.disabled = !picked.length; });
      hideButton.textContent = picked.length && picked.every((token) => token.selected) ? "Unhide" : "Hide";
    }
    onSelectionChange = syncTools;
    document.addEventListener("selectionchange", onSelectionChange);
    renderSentence();

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
    save.textContent = "Save Structure";
    save.addEventListener("click", async () => {
      if (!tokens.some((token) => token.selected && !token.removed)) {
        status.textContent = "Select a word and press Hide first.";
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
    editor.append(head, tools, sentence, preview, hint, status, actions);
    document.body.append(editor);
    document.addEventListener("pointerdown", onOutsidePointerDown, true);
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
