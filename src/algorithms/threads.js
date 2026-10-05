(function registerThreadsAlgorithm(global) {
  const algorithms = global.AIContentShieldAlgorithms || (global.AIContentShieldAlgorithms = {});
  const blockedMessageType = "AI_CONTENT_SHIELD_BLOCKED";
  const blockedNotice = "This post was blocked by AI Content Shield.";
  const processedAttribute = "data-ai-content-shield-processed";

  algorithms["www.threads.com"] = {
    scan(root = document) {
      const feedCards = root.querySelectorAll('div[data-pagelet*="threads_feed_"]');
      let blockedCount = 0;

      for (const card of feedCards) {
        if (!card.isConnected || card.hasAttribute(processedAttribute)) continue;

        const hasAiLabel = Array.from(card.querySelectorAll("span")).some(
          (span) => span.innerText.trim() === "AI content"
        );

        if (hasAiLabel) {
          const feedContent = document.createElement("div");
          feedContent.className = "x78zum5 xdt5ytf";
          feedContent.setAttribute("data-virtualized", "false");

          const feedColumn = document.createElement("div");
          feedColumn.className = "x9f619 x1n2onr6 x1ja2u2z";

          const cardContent = document.createElement("div");
          cardContent.className = "x1a2a7pz x1n2onr6";

          const pressableContainer = document.createElement("div");
          pressableContainer.className = "x1n2onr6 x1ypdohk x1f9n5g x17dsfyh xzzag5r x1losyl9 xz9dl7a xz6dhga x13fuv20 xt8cgyo xsag5q8";
          pressableContainer.setAttribute("data-pressable-container", "true");
          pressableContainer.setAttribute("data-interactive-id", "");
          pressableContainer.setAttribute(
            "style",
            "--x-6wlwus: var(--barcelona-columns-item-horizontal-padding); --x-115c6n6: var(--barcelona-columns-item-horizontal-padding);"
          );
          pressableContainer.textContent = blockedNotice;

          cardContent.append(pressableContainer);
          feedColumn.append(cardContent);
          feedContent.append(feedColumn);
          card.replaceChildren(feedContent);
          blockedCount += 1;
        }

        card.setAttribute(processedAttribute, "true");
      }

      if (blockedCount > 0) {
        global.chrome.runtime.sendMessage({
          type: blockedMessageType,
          count: blockedCount
        }).catch(() => undefined);
      }

      return blockedCount;
    }
  };

  let scrollScanQueued = false;
  let mutationScanTimer = null;

  function scanPage() {
    algorithms["www.threads.com"].scan(document);
  }

  function queueScrollScan() {
    if (scrollScanQueued) return;

    scrollScanQueued = true;
    global.requestAnimationFrame(() => {
      scrollScanQueued = false;
      scanPage();
    });
  }

  function queueMutationScan() {
    if (mutationScanTimer !== null) global.clearTimeout(mutationScanTimer);

    mutationScanTimer = global.setTimeout(() => {
      mutationScanTimer = null;
      scanPage();
    }, 100);
  }

  scanPage();

  global.addEventListener("scroll", queueScrollScan, { passive: true });
  document.addEventListener("scroll", queueScrollScan, { passive: true, capture: true });

  const observer = new MutationObserver((mutations) => {
    const hasAddedContent = mutations.some((mutation) => mutation.addedNodes.length > 0);
    if (hasAddedContent) queueMutationScan();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})(globalThis);
