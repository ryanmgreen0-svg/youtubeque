console.log('Yoga queue script loaded');

const STORAGE_KEY = 'yoga';
let currentView = STORAGE_KEY;

function ensureQueueStyles() {
  if (document.getElementById('youtube-queue-styles')) return;

  let style = document.createElement('style');
  style.id = 'youtube-queue-styles';
  style.textContent = `
    #queue-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    #queue-controls h1 {
      margin: 0;
      font-size: 1.8rem;
    }
    #clear-all-btn {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      background: #d32f2f;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    #clear-all-btn:hover {
      background: #b71c1c;
    }
    #queue-container {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
      padding: 0;
      margin: 0;
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
    .video-card.viewed {
      border-color: #c0392b;
      opacity: 0.95;
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
    .delete-btn.viewed {
      background: #c0392b;
      color: #fff;
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

function renderControls() {
  let controls = document.getElementById('queue-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'queue-controls';
    let contentArea = document.body.querySelector('body > div') || document.body;
    document.body.insertBefore(controls, document.body.firstChild);
  }

  controls.innerHTML = `
    <h1 id="page-title">Yoga</h1>
    <button id="clear-all-btn" type="button">Clear All</button>
  `;

  let clearButton = document.getElementById('clear-all-btn');
  clearButton.addEventListener('click', function() {
    if (!confirm('Remove all videos from the Yoga queue?')) return;
    clearAllVideos(currentView);
  });
}

function displayVideos(storageKey) {
  ensureQueueStyles();
  renderControls();
  currentView = storageKey;

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
    videos.forEach((video, index) => {
      let div = document.createElement('div');
      div.className = 'video-card';
      if (video.viewed) {
        div.classList.add('viewed');
      }
      div.innerHTML = `
        <button class="delete-btn${video.viewed ? ' viewed' : ''}" aria-label="Delete video">×</button>
        <img src="${video.thumbnail}" alt="${video.title}">
        <h3>${video.title}</h3>
        <p>${video.viewed ? 'Viewed' : ''}</p>
      `;
      div.addEventListener('click', () => openVideo(index, storageKey));
      div.querySelector('.delete-btn').addEventListener('click', function(event) {
        event.stopPropagation();
        deleteVideo(index, storageKey);
      });
      container.appendChild(div);
    });
  });
}

function openVideo(index, storageKey) {
  chrome.storage.local.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      let video = videos[index];
      if (!video.viewed) {
        markVideoViewed(index, storageKey);
      }
      window.open(video.url, '_blank');
    }
  });
}

function markVideoViewed(index, storageKey) {
  chrome.storage.local.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      videos[index] = {
        ...videos[index],
        viewed: true,
        viewedAt: videos[index].viewedAt || new Date().toISOString()
      };
      chrome.storage.local.set({[storageKey]: videos}, function() {
        displayVideos(storageKey);
      });
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

function clearAllVideos(storageKey) {
  chrome.storage.local.set({[storageKey]: []}, function() {
    displayVideos(storageKey);
  });
}

function setupToggleButtons() {
  let yogaBtn = document.getElementById('yoga-btn');
  let pageTitle = document.getElementById('page-title');

  if (!yogaBtn) return;

  yogaBtn.style.background = '#1f2937';
  yogaBtn.style.color = 'white';
  if (pageTitle) pageTitle.textContent = 'Yoga';
  document.title = 'Yoga';
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    displayVideos(STORAGE_KEY);
  }
});

ensureQueueStyles();
setupToggleButtons();
displayVideos(STORAGE_KEY);
window.addEventListener('DOMContentLoaded', () => {
  setupToggleButtons();
  displayVideos(STORAGE_KEY);
});
