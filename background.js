console.log('background script loaded');

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
    chrome.contextMenus.create({
      id: "add-to-yoga",
      title: "Add to Yoga",
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
  let action = null;
  let storageKey = null;

  if (info.menuItemId === "add-to-queue") {
    action = "queueVideo";
    storageKey = "queue";
  } else if (info.menuItemId === "add-to-yoga") {
    action = "queueVideo";
    storageKey = "yoga";
  } else {
    return;
  }

  chrome.tabs.sendMessage(tab.id, {action: action, info: info}, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Queue message failed:', chrome.runtime.lastError.message, info, tab);
      return;
    }

    console.log('Queue response from content script:', response);
    if (response && response.video) {
      chrome.storage.local.get([storageKey], function(result) {
        let videos = result[storageKey] || [];
        videos.push(response.video);
        let updateObj = {};
        updateObj[storageKey] = videos;
        chrome.storage.local.set(updateObj, function() {
          console.log('Video added to ' + storageKey + ':', response.video);
        });
      });
    }
  });
});