chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "queueVideo") {
    let info = request.info || {};
    let url = info.linkUrl || window.location.href;
    let title = 'YouTube Video';
    let thumbnail = '';
    let ogImage = document.querySelector('meta[property="og:image"]');

    if (ogImage && window.location.href.includes('watch')) {
      title = document.title || title;
      thumbnail = ogImage.content || thumbnail;
    }

    if (!thumbnail) {
      if (info.srcUrl && info.srcUrl.includes('ytimg.com')) {
        thumbnail = info.srcUrl;
      } else {
        let videoIdMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        let videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId) {
          thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
    }

    if (!title || title === 'YouTube Video') {
      if (window.location.href.includes('watch')) {
        title = document.querySelector('h1.title')?.textContent?.trim() || document.title || title;
      } else if (info.linkUrl) {
        let anchor = document.querySelector(`a[href="$${info.linkUrl}"]`);
        if (!anchor) {
          anchor = document.querySelector(`a[href="${info.linkUrl}"]`);
        }
        if (anchor) {
          title = anchor.textContent.trim() || title;
          if (!title) {
            title = anchor.getAttribute('title') || title;
          }
        }
      }
    }

    sendResponse({video: {title: title, thumbnail: thumbnail, url: url}});
  }
});