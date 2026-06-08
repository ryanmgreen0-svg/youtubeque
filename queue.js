console.log('queue script loaded');

// Debug helper
function debugLog(...args) {
  if (window.console && typeof console.log === 'function') console.log('[queue.js]', ...args);
}

const storage = {
  get(keys, callback) {
    if (window.chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === 'function') {
      chrome.storage.local.get(keys, callback);
      return;
    }
    let result = {};
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        let value = localStorage.getItem(key);
        try { result[key] = value ? JSON.parse(value) : undefined; } catch (e) { result[key] = undefined; }
      });
    } else {
      let value = localStorage.getItem(keys);
      try { result[keys] = value ? JSON.parse(value) : undefined; } catch (e) { result[keys] = undefined; }
    }
    callback(result);
  },
  set(obj, callback) {
    if (window.chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.set === 'function') {
      chrome.storage.local.set(obj, callback);
      return;
    }
    Object.entries(obj).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    if (typeof callback === 'function') callback();
  },
  remove(key, callback) {
    if (window.chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.remove === 'function') {
      chrome.storage.local.remove(key, callback);
      return;
    }
    localStorage.removeItem(key);
    if (typeof callback === 'function') callback();
  }
};

function ensureQueueStyles() {
  if (document.getElementById('youtube-queue-styles')) return;

  let style = document.createElement('style');
  style.id = 'youtube-queue-styles';
  style.textContent = `
    #queue-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
      padding: 0;
      margin: 0;
    }
    .video-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .video-group-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    .video-group-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
    }
    .video-card {
      position: relative;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      background: #fff;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .video-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(0,0,0,0.08);
    }
    .video-card.viewed {
      opacity: 0.68;
      border-color: #cbd5e1;
    }
    .video-card.viewed h3::after {
      content: " (watched)";
      font-size: 0.9rem;
      font-weight: 600;
      color: #71717a;
    }
    .delete-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      border: none;
      background: #f8d7da;
      color: #8b1a1a;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .delete-btn:hover {
      background: #f5c6cb;
    }
    .video-card img {
      width: 100%;
      height: auto;
      border-radius: 6px;
      display: block;
    }
    .video-card h3 {
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.3;
      min-height: 3.9em;
      overflow: hidden;
      text-align: left;
    }
    .video-card p { margin: 0; }
    .flash-fav { animation: favFlash 1s ease; }
    @keyframes favFlash { 0% { color: inherit; background: transparent } 30% { color: #fff; background: #b91c1c } 100% { color: inherit; background: transparent } }
  `;
  document.head.appendChild(style);
}

function getDateGroup(timestamp) {
  if (!timestamp) return 'past';
  
  let videoDate = new Date(timestamp);
  let today = new Date();
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Normalize to start of day for comparison
  let videoDateNormalized = new Date(videoDate.getFullYear(), videoDate.getMonth(), videoDate.getDate());
  let todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let yesterdayNormalized = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (videoDateNormalized.getTime() === todayNormalized.getTime()) {
    return 'today';
  } else if (videoDateNormalized.getTime() === yesterdayNormalized.getTime()) {
    return 'yesterday';
  } else {
    return 'past';
  }
}

function displayVideos(storageKey) {
  ensureQueueStyles();
  debugLog('displayVideos(', storageKey, ')');

  storage.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    debugLog('loaded', storageKey, 'count=', videos.length, videos);
    let container = document.getElementById('queue-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'queue-container';
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    if (videos.length === 0) {
      container.innerHTML = '<p>No videos in this collection.</p>';
      return;
    }
    
    // Group videos by date
    let groups = { today: [], yesterday: [], past: [] };
    let originalIndices = {};
    
    videos.forEach((video, index) => {
      let group = getDateGroup(video.dateAdded);
      groups[group].push(video);
      originalIndices[video.url] = index;
    });
    
    // Display groups in order
    let groupOrder = ['today', 'yesterday', 'past'];
    let groupLabels = { today: 'Today', yesterday: 'Yesterday', past: 'Past' };
    
    groupOrder.forEach((groupKey) => {
      let groupVideos = groups[groupKey];
      if (groupVideos.length === 0) return;
      
      // Reverse within group to show most recent first
      groupVideos = groupVideos.reverse();
      
      let groupDiv = document.createElement('div');
      groupDiv.className = 'video-group';
      
      let titleDiv = document.createElement('div');
      titleDiv.className = 'video-group-title';
      titleDiv.textContent = groupLabels[groupKey];
      groupDiv.appendChild(titleDiv);
      
      let gridDiv = document.createElement('div');
      gridDiv.className = 'video-group-grid';
      
      groupVideos.forEach((video) => {
        let originalIndex = originalIndices[video.url];
        let div = document.createElement('div');
        div.className = 'video-card';
        div.setAttribute('data-url', video.url || '');
        div.innerHTML = `
          <button class="delete-btn" aria-label="Delete video">×</button>
          <img src="${video.thumbnail}" alt="${video.title}">
          <h3>${video.title}</h3>
        `;
        // Long-press to favorite (1s). Short click opens.
        let pressTimer = null;
        let didLongPress = false;
        let pointerStartedOnDelete = false;
        // Use pointer events to reduce accidental triggers
        const onPointerDown = (e) => {
          // only primary pointers
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          pointerStartedOnDelete = !!e.target.closest('.delete-btn');
          if (pointerStartedOnDelete) return;
          didLongPress = false;
          pressTimer = setTimeout(() => {
            didLongPress = true;
            favoriteVideo(originalIndex, storageKey);
          }, 1000);
        };
        const onPointerUp = (e) => {
          if (pressTimer) clearTimeout(pressTimer);
          pressTimer = null;
          if (pointerStartedOnDelete) { pointerStartedOnDelete = false; return; }
          if (!didLongPress) {
            openVideo(originalIndex, storageKey);
          }
        };
        div.addEventListener('pointerdown', onPointerDown);
        div.addEventListener('pointerup', onPointerUp);
        div.addEventListener('pointercancel', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });
        div.addEventListener('pointerleave', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });
        let deleteBtn = div.querySelector('.delete-btn');
        if (video.viewed) {
          deleteBtn.style.background = '#ef4444';
          deleteBtn.style.color = '#fff';
        }
        deleteBtn.addEventListener('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          deleteVideo(originalIndex, storageKey);
        });
        gridDiv.appendChild(div);
      });
      
      groupDiv.appendChild(gridDiv);
      container.appendChild(groupDiv);
    });

  // If rendering favorites page, flash the last favorited item as confirmation
  if (storageKey === 'favorites') {
    storage.get(['lastFavorited'], function(res) {
      let url = res['lastFavorited'];
      if (url) {
        // Find the matching card and flash its title
        setTimeout(() => {
          let el = document.querySelector(`#queue-container .video-card[data-url="${url}"]`);
          if (el) {
            let title = el.querySelector('h3');
            if (title) {
              title.classList.add('flash-fav');
              setTimeout(() => title.classList.remove('flash-fav'), 1200);
            }
          }
          // clear the flag
          storage.remove('lastFavorited');
        }, 80);
      }
    });
  }
  });
}

function favoriteVideo(index, storageKey) {
  storage.get([storageKey, 'favorites'], function(result) {
    let videos = result[storageKey] || [];
    let favorites = result['favorites'] || [];
    if (index >= 0 && index < videos.length) {
      let video = videos.splice(index, 1)[0];
      // Avoid duplicates: check by url
      if (!favorites.find(f => f.url === video.url)) {
        favorites.push(video);
      }
      storage.set({[storageKey]: videos, 'favorites': favorites, 'lastFavorited': video.url}, function() {
        displayVideos(storageKey);
      });
    }
  });
}

// Ensure view-tracking only applies to videos added after this script first ran
storage.get(['viewTrackingEnabledAt'], function(res) {
  if (!res.viewTrackingEnabledAt) {
    storage.set({ viewTrackingEnabledAt: Date.now() });
  }
});

function clearViewed(storageKey) {
  storage.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    let deleted = videos.filter(v => v.viewed);
    let remaining = videos.filter(v => !v.viewed);
    storage.set({[storageKey]: remaining, 'lastDeletedVideos': deleted, 'lastDeletedStorageKey': storageKey}, function() {
      displayVideos(storageKey);
      updateUndoButtonState();
    });
  });
}

function undoDelete() {
  storage.get(['lastDeletedVideos', 'lastDeletedStorageKey'], function(result) {
    let deleted = result['lastDeletedVideos'] || [];
    let storageKey = result['lastDeletedStorageKey'];
    if (deleted.length === 0 || !storageKey) return;
    
    storage.get([storageKey], function(getResult) {
      let videos = getResult[storageKey] || [];
      let restored = videos.concat(deleted);
      storage.set({[storageKey]: restored, 'lastDeletedVideos': [], 'lastDeletedStorageKey': null}, function() {
        displayVideos(storageKey);
        updateUndoButtonState();
      });
    });
  });
}

function updateUndoButtonState() {
  let undoBtn = document.getElementById('undo-delete-btn');
  if (!undoBtn) return;
  storage.get(['lastDeletedVideos'], function(result) {
    let deleted = result['lastDeletedVideos'] || [];
    undoBtn.disabled = deleted.length === 0;
  });
}

function openVideo(index, storageKey) {
  storage.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      let video = videos[index];
      window.open(video.url, '_blank');
      // mark watched state for clicked items
      video.viewed = true;
      videos[index] = video;
      storage.set({[storageKey]: videos}, function() {
        displayVideos(storageKey);
      });
    }
  });
}

function deleteVideo(index, storageKey) {
  storage.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      videos.splice(index, 1);
      storage.set({[storageKey]: videos}, function() {
        displayVideos(storageKey);
      });
    }
  });
}

function initializeQuickLinks() {
  displayQuickLinks();
  let addBtn = document.getElementById('quick-link-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      let title = prompt('Enter link title:');
      if (title === null) return;
      title = title.trim();
      if (!title) return;
      
      let url = prompt('Enter URL:');
      if (url === null) return;
      url = url.trim();
      if (!url) return;
      
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      addQuickLink(title, url);
    });
  }
}

function displayQuickLinks() {
  storage.get(['quick-links'], function(result) {
    let links = result['quick-links'] || [];
    let container = document.getElementById('quick-links-container');
    if (!container) return;
    
    let addBtn = container.querySelector('#quick-link-add-btn');
    container.innerHTML = '';
    
    links.forEach((link, index) => {
      let linkEl = document.createElement('a');
      linkEl.className = 'quick-link';
      linkEl.href = link.url;
      linkEl.target = '_blank';
      linkEl.textContent = link.title;
      
      let isPressed = false;
      let pressTimer;
      
      linkEl.addEventListener('mousedown', () => {
        isPressed = true;
        pressTimer = setTimeout(() => {
          if (isPressed) {
            editQuickLink(index, link);
          }
        }, 500);
      });
      
      linkEl.addEventListener('mouseup', () => {
        isPressed = false;
        clearTimeout(pressTimer);
      });
      
      linkEl.addEventListener('mouseleave', () => {
        isPressed = false;
        clearTimeout(pressTimer);
      });
      
      container.appendChild(linkEl);
    });
    
    if (addBtn) {
      container.appendChild(addBtn);
    }
  });
}

function addQuickLink(title, url) {
  storage.get(['quick-links'], function(result) {
    let links = result['quick-links'] || [];
    links.push({ title, url });
    storage.set({ 'quick-links': links }, function() {
      displayQuickLinks();
    });
  });
}

function editQuickLink(index, link) {
  let newTitle = prompt('Edit link title:', link.title);
  if (newTitle === null) return;
  newTitle = newTitle.trim();
  if (!newTitle) return;
  
  let newUrl = prompt('Edit URL:', link.url);
  if (newUrl === null) return;
  newUrl = newUrl.trim();
  if (!newUrl) return;
  
  if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
    newUrl = 'https://' + newUrl;
  }
  
  storage.get(['quick-links'], function(result) {
    let links = result['quick-links'] || [];
    if (index >= 0 && index < links.length) {
      links[index] = { title: newTitle, url: newUrl };
      storage.set({ 'quick-links': links }, function() {
        displayQuickLinks();
      });
    }
  });
}

function initQueuePage() {
  // Prefer an explicit marker on the body: <body data-collection="queue|favorites">
  let bodyCollection = document.body && document.body.dataset && document.body.dataset.collection;
  let page = window.location.pathname.split('/').pop();
  let storageKey = bodyCollection ? bodyCollection : (page === 'favorites.html' ? 'favorites' : 'queue');
  debugLog('initQueuePage: bodyCollection=', bodyCollection, 'page=', page, '=> storageKey=', storageKey);
  if (typeof displayVideos === 'function') {
    displayVideos(storageKey);
  }
  if (storageKey === 'queue' && typeof initializeQuickLinks === 'function') {
    initializeQuickLinks();
  }
}

ensureQueueStyles();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQueuePage);
} else {
  // If script loaded after DOM ready, run immediately
  initQueuePage();
}
