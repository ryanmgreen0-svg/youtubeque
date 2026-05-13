console.log('queue script loaded');

let currentView = 'home'; // Track which view is currently displayed

function ensureQueueStyles() {
  if (document.getElementById('youtube-queue-styles')) return;

  let style = document.createElement('style');
  style.id = 'youtube-queue-styles';
  style.textContent = `
    #queue-container {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
      padding: 0;
      margin: 0;
    }
    .video-card {
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

function displayVideos(storageKey) {
  ensureQueueStyles();
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
      div.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}">
        <h3>${video.title}</h3>
      `;
      div.addEventListener('click', () => openVideo(index, storageKey));
      container.appendChild(div);
    });
  });
}

function openVideo(index, storageKey) {
  chrome.storage.local.get([storageKey], function(result) {
    let videos = result[storageKey] || [];
    if (index >= 0 && index < videos.length) {
      let video = videos[index];
      window.open(video.url, '_blank');
      // Videos stay in collection (not removed after opening)
    }
  });
}

function setupToggleButtons() {
  let homeBtn = document.getElementById('home-btn');
  let yogaBtn = document.getElementById('yoga-btn');
  let pageTitle = document.getElementById('page-title');

  if (!homeBtn || !yogaBtn) return;

  homeBtn.addEventListener('click', () => {
    currentView = 'queue';
    homeBtn.style.background = '#1f2937';
    homeBtn.style.color = 'white';
    yogaBtn.style.background = '#d1d5db';
    yogaBtn.style.color = '#1f2937';
    if (pageTitle) pageTitle.textContent = 'Home';
    document.title = 'Home';
    displayVideos('queue');
  });

  yogaBtn.addEventListener('click', () => {
    currentView = 'yoga';
    yogaBtn.style.background = '#1f2937';
    yogaBtn.style.color = 'white';
    homeBtn.style.background = '#d1d5db';
    homeBtn.style.color = '#1f2937';
    if (pageTitle) pageTitle.textContent = 'Yoga';
    document.title = 'Yoga';
    displayVideos('yoga');
  });
}

// Display queue on load
ensureQueueStyles();
setupToggleButtons();
displayVideos('queue');
window.addEventListener('DOMContentLoaded', () => {
  setupToggleButtons();
  displayVideos('queue');
});