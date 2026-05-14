# YouTube Queue Extension

This Microsoft Edge extension allows you to save YouTube videos to a queue by right-clicking on a video and selecting "Add to Queue". The queue is stored locally and can be viewed on a GitHub Pages website.

This repository is configured to use the `root` branch for source control.

## Installation

1. Clone or download this repository.
2. Open Microsoft Edge and go to `edge://extensions/`.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the folder containing these files.

## Usage

1. Go to a YouTube video page.
2. Right-click on the video player.
3. Select "Add to Queue" from the context menu.
4. Visit your GitHub Pages website (update the URL in `manifest.json`) to view the queue.
5. Click "Open and Remove" to watch the video and remove it from the queue.

## Setup GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html` to the repository.
3. Enable GitHub Pages in the repository settings.
4. Update the `matches` in `manifest.json` to point to your GitHub Pages URL, e.g., `https://yourusername.github.io/your-repo/*`.
5. If you want a separate Yoga page, create and host `yoga.html` and load it with the Yoga extension.

## Files

- `manifest.json`: Extension manifest.
- `background.js`: Service worker for context menu.
- `content.js`: Content script for YouTube pages.
- `queue.js`: Content script for the queue display page.
- `index.html`: HTML for the queue website.