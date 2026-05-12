chrome.contextMenus.create({
  title: "Add to Queue",
  contexts: ["video"],
  onclick: function(info, tab) {
    chrome.tabs.sendMessage(tab.id, {action: "getVideoInfo"}, function(response) {
      if (response) {
        chrome.storage.local.get(['queue'], function(result) {
          let queue = result.queue || [];
          queue.push(response);
          chrome.storage.local.set({queue: queue});
        });
      }
    });
  }
});