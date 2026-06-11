console.log('Yoga content script loaded');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "queueVideo") {
    console.log('Yoga queueVideo request received', request, sender);
    let info = request.info || {};
    let url = info.linkUrl || window.location.href;
    let title = 'YouTube Video';
    let thumbnail = '';
    let ogImage = document.querySelector('meta[property="og:image"]');

    function getYoutubeVideoId(value) {
      let patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/, 
        /(?:youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/
      ];
      for (let pattern of patterns) {
        let match = value.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    }

    let videoId = getYoutubeVideoId(url);
    if (window.location.href.includes('watch')) {
      title = document.title || title;
      thumbnail = ogImage?.content || '';
    }

    if (!thumbnail && videoId) {
      thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    if (!thumbnail && info.srcUrl && info.srcUrl.includes('ytimg.com')) {
      thumbnail = info.srcUrl;
    }

    if (!thumbnail) {
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      thumbnail = twitterImage?.content || '';
    }

    if (!thumbnail && info.srcUrl) {
      thumbnail = info.srcUrl;
    }

    if (!title || title === 'YouTube Video') {
      if (window.location.href.includes('watch')) {
        title = document.querySelector('h1.title')?.textContent?.trim() || document.title || title;
      } else if (info.linkUrl) {
        let normalizedLink;
        try {
          normalizedLink = new URL(info.linkUrl, window.location.origin).href;
        } catch (e) {
          normalizedLink = info.linkUrl;
        }

        let anchorTitle = '';
        document.querySelectorAll('a[href]').forEach(anchor => {
          try {
            let anchorHref = new URL(anchor.href, window.location.origin).href;
            if (anchorHref === normalizedLink) {
              anchorTitle = anchor.textContent.trim() || anchor.getAttribute('title') || anchorTitle;
            }
          } catch (e) {
          }
        });

        if (anchorTitle) {
          title = anchorTitle;
        }
      }
    }

    sendResponse({video: {title: title, thumbnail: thumbnail, url: url}});
    return true;
  }
});
