const COUNTS_STORAGE_KEY = "blockedCountsByTab";
const BLOCKED_MESSAGE_TYPE = "AI_CONTENT_SHIELD_BLOCKED";
const GET_COUNT_MESSAGE_TYPE = "AI_CONTENT_SHIELD_GET_COUNT";

let storageQueue = Promise.resolve();

function serializeStorageOperation(operation) {
  const result = storageQueue.then(operation, operation);
  storageQueue = result.catch(() => undefined);
  return result;
}

async function readCounts() {
  const stored = await chrome.storage.session.get(COUNTS_STORAGE_KEY);
  return stored[COUNTS_STORAGE_KEY] || {};
}

async function updateBadge(tabId, count) {
  const text = count > 0 ? (count > 999 ? "999+" : String(count)) : "";
  await chrome.action.setBadgeText({ tabId, text });
}

async function addBlockedCount(tabId, amount) {
  await serializeStorageOperation(async () => {
    const counts = await readCounts();
    const key = String(tabId);
    const total = (counts[key] || 0) + amount;

    counts[key] = total;
    await chrome.storage.session.set({ [COUNTS_STORAGE_KEY]: counts });
    await updateBadge(tabId, total);
  });
}

async function clearTabCount(tabId, shouldUpdateBadge = true) {
  await serializeStorageOperation(async () => {
    const counts = await readCounts();
    delete counts[String(tabId)];
    await chrome.storage.session.set({ [COUNTS_STORAGE_KEY]: counts });
    if (shouldUpdateBadge) await updateBadge(tabId, 0);
  });
}

async function getTabCount(tabId) {
  return serializeStorageOperation(async () => {
    const counts = await readCounts();
    return counts[String(tabId)] || 0;
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#b42318" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === BLOCKED_MESSAGE_TYPE) {
    const tabId = sender.tab?.id;
    const amount = Number.isSafeInteger(message.count) && message.count > 0 ? message.count : 0;

    if (Number.isInteger(tabId) && amount > 0) {
      addBlockedCount(tabId, amount).then(() => {
        sendResponse({ ok: true });
      }).catch(() => {
        sendResponse({ ok: false });
      });
    } else {
      sendResponse({ ok: false });
    }

    return true;
  }

  if (message?.type === GET_COUNT_MESSAGE_TYPE) {
    const tabId = Number.isInteger(message.tabId) ? message.tabId : null;

    if (tabId === null) {
      sendResponse({ count: 0 });
      return false;
    }

    getTabCount(tabId).then((count) => {
      sendResponse({ count });
    }).catch(() => {
      sendResponse({ count: 0 });
    });

    return true;
  }

  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") void clearTabCount(tabId).catch(() => undefined);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearTabCount(tabId, false).catch(() => undefined);
});
