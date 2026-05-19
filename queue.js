console.log('queue script loaded');

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

  chrome.storage.local.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
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
      originalIndices[JSON.stringify(video)] = index;
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
        let originalIndex = originalIndices[JSON.stringify(video)];
        let div = document.createElement('div');
        div.className = 'video-card';
        div.innerHTML = `
          <button class="delete-btn" aria-label="Delete video">×</button>
          <img src="${video.thumbnail}" alt="${video.title}">
          <h3>${video.title}</h3>
        `;
        div.addEventListener('click', () => openVideo(originalIndex, storageKey));
        div.querySelector('.delete-btn').addEventListener('click', function(event) {
          event.stopPropagation();
          deleteVideo(originalIndex, storageKey);
        });
        gridDiv.appendChild(div);
      });
      
      groupDiv.appendChild(gridDiv);
      container.appendChild(groupDiv);
    });
  });
}

function openVideo(index, storageKey) {
  chrome.storage.local.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      let video = videos[index];
      window.open(video.url, '_blank');
    }
  });
}

function deleteVideo(index, storageKey) {
  chrome.storage.local.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      videos.splice(index, 1);
      chrome.storage.local.set({[storageKey]: videos}, function() {
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
  chrome.storage.local.get(['quick-links'], function(result) {
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
  chrome.storage.local.get(['quick-links'], function(result) {
    let links = result['quick-links'] || [];
    links.push({ title, url });
    chrome.storage.local.set({ 'quick-links': links }, function() {
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
  
  chrome.storage.local.get(['quick-links'], function(result) {
    let links = result['quick-links'] || [];
    if (index >= 0 && index < links.length) {
      links[index] = { title: newTitle, url: newUrl };
      chrome.storage.local.set({ 'quick-links': links }, function() {
        displayQuickLinks();
      });
    }
  });
}

ensureQueueStyles();
displayVideos('queue');
initializeQuickLinks();
window.addEventListener('DOMContentLoaded', () => {
  displayVideos('queue');
  initializeQuickLinks();
});