# AI Content Shield

A Chrome Manifest V3 extension that hides AI-labeled posts on supported websites.

## Supported websites

- `https://www.threads.com`: scans `div[data-pagelet]` elements whose attribute contains `threads_feed_`. If one contains a `span` whose `innerText` is `AI content`, the extension rebuilds the card's inner div structure using the supplied classes and attributes, then displays the blocked notice inside `div[data-pressable-container="true"]`. It marks every scanned card with `data-ai-content-shield-processed="true"` so later scans skip it.

The Threads algorithm scans when the page loads, whenever you scroll, and when the page adds feed content. The extension badge and shared popup show the number of posts blocked in the current tab. Counts are kept separately for each open tab and reset when a tab navigates or closes.

## Architecture

- `src/algorithms/` contains domain-specific blocking logic and its page event handlers.
- `service_worker.js` receives `AI_CONTENT_SHIELD_BLOCKED` messages and stores a count for the sending tab.
- `popup.html` and `popup.js` show the active tab's count.

Every blocking algorithm should report blocked posts with the same message type, `AI_CONTENT_SHIELD_BLOCKED`, and include the number of posts it blocked in `count`.

## Install in developer mode

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this project directory.
4. Reload any open Threads tabs.

## Add a domain-specific algorithm

Create a file under `src/algorithms/`, register its algorithm in `globalThis.AIContentShieldAlgorithms` under the exact hostname, and add the file to the matching `content_scripts` entry in `manifest.json`. The algorithm owns its page event handlers and reports blocked posts with the shared `AI_CONTENT_SHIELD_BLOCKED` message type.
