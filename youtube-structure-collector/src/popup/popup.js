(() => {
  "use strict";

  const status = document.querySelector("#status");
  const collection = document.querySelector("#collection");
  const titleLink = document.querySelector("#video-title");
  const structuresElement = document.querySelector("#structures");
  let videoId;
  let video;

  async function persist() {
    const { videos = {} } = await chrome.storage.local.get("videos");
    videos[videoId] = video;
    await chrome.storage.local.set({ videos });
  }

  function render() {
    titleLink.textContent = video.title;
    titleLink.href = video.url;
    structuresElement.replaceChildren();

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
