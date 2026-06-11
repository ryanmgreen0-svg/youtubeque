console.log('Yoga background script loaded');

function createYogaMenu() {
  chrome.contextMenus.removeAll(() => {
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

chrome.runtime.onInstalled.addListener(createYogaMenu);
chrome.runtime.onStartup.addListener(createYogaMenu);
createYogaMenu();

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId !== "add-to-yoga") {
    return;
  }

  chrome.tabs.sendMessage(tab.id, {action: "queueVideo", info: info}, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Yoga queue message failed:', chrome.runtime.lastError.message, info, tab);
      return;
    }

    console.log('Yoga queue response from content script:', response);
    if (response && response.video) {
      chrome.storage.local.get(["yoga"], function(result) {
        let videos = result.yoga || [];
        videos.push(response.video);
        chrome.storage.local.set({yoga: videos}, function() {
          console.log('Video added to yoga:', response.video);
        });
      });
    }
  });
});
          console.log('Video added to queue:', response.video);
        });
      });
    }
  });
});
