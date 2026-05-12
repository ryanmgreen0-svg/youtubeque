chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "getVideoInfo") {
    let titleElement = document.querySelector('h1.ytd-watch-metadata');
    let title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
    let thumbnailElement = document.querySelector('meta[property="og:image"]');
    let thumbnail = thumbnailElement ? thumbnailElement.content : '';
    let url = window.location.href;
    sendResponse({title: title, thumbnail: thumbnail, url: url});
  }
});