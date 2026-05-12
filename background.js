function createQueueMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "add-to-queue",
      title: "Add to Queue",
      contexts: ["all"],
      documentUrlPatterns: [
        "*://www.youtube.com/*",
        "*://youtube.com/*",
        "*://youtu.be/*"
      ]
    });
  });
}

chrome.runtime.onInstalled.addListener(createQueueMenu);
chrome.runtime.onStartup.addListener(createQueueMenu);
createQueueMenu();

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId !== "add-to-queue") {
    return;
  }

  chrome.tabs.sendMessage(tab.id, {action: "queueVideo", info: info}, function(response) {
    if (response && response.video) {
      chrome.storage.local.get(['queue'], function(result) {
        let queue = result.queue || [];
        queue.push(response.video);
        chrome.storage.local.set({queue: queue});
      });
    }
  });
});