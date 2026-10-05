const countElement = document.getElementById("blocked-count");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0]?.id;

  if (!Number.isInteger(tabId)) return;

  chrome.runtime.sendMessage({
    type: "AI_CONTENT_SHIELD_GET_COUNT",
    tabId
  }, (response) => {
    if (chrome.runtime.lastError) return;
    countElement.textContent = String(response?.count ?? 0);
  });
});
