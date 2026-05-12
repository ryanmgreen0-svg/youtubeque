console.log('queue script loaded');

function displayQueue() {
  chrome.storage.local.get(['queue'], function(result) {
    let queue = result.queue || [];
    let container = document.getElementById('queue-container');
    container.innerHTML = '';
    if (queue.length === 0) {
      container.innerHTML = '<p>No videos in queue.</p>';
      return;
    }
    queue.forEach((video, index) => {
      let div = document.createElement('div');
      div.style.margin = '10px';
      div.style.border = '1px solid #ccc';
      div.style.padding = '10px';
      div.innerHTML = `
        <img src="${video.thumbnail}" width="120" style="float:left; margin-right:10px;">
        <h3>${video.title}</h3>
        <button class="open-remove-button" data-index="${index}">Open and Remove</button>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.open-remove-button').forEach(button => {
      button.addEventListener('click', event => {
        let index = Number(event.currentTarget.getAttribute('data-index'));
        openVideo(index);
      });
    });
  });
}

function openVideo(index) {
  chrome.storage.local.get(['queue'], function(result) {
    let queue = result.queue || [];
    if (index >= 0 && index < queue.length) {
      let video = queue.splice(index, 1)[0];
      chrome.storage.local.set({queue: queue}, function() {
        window.open(video.url, '_blank');
        displayQueue();  // Refresh the display
      });
    }
  });
}

// Display queue on load
displayQueue();
window.addEventListener('DOMContentLoaded', displayQueue);