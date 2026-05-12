function createQueueMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      title: "Add to Queue",
      contexts: ["page", "video", "image", "link"],
      documentUrlPatterns: ["*://www.youtube.com/*"],
      onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {action: "queueVideo", info: info}, function(response) {
          if (response && response.video) {
            chrome.storage.local.get(['queue'], function(result) {
              let queue = result.queue || [];
              queue.push(response.video);
              chrome.storage.local.set({queue: queue});
            });
          }
        });
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(createQueueMenu);
chrome.runtime.onStartup.addListener(createQueueMenu);
createQueueMenu();