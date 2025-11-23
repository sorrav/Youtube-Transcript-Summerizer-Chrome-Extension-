// Inject a "Summarize" button below YouTube video player
function injectSummarizeButton() {
  // Check if button already exists
  if (document.getElementById('yt-summarize-btn')) return;
  
  // Find the action buttons container
  const actionsContainer = document.querySelector('#top-level-buttons-computed');
  
  if (!actionsContainer) {
    setTimeout(injectSummarizeButton, 1000);
    return;
  }
  
  // Create button
  const button = document.createElement('button');
  button.id = 'yt-summarize-btn';
  button.innerHTML = '📝 Summarize';
  button.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 18px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 8px;
    font-size: 14px;
  `;
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  actionsContainer.appendChild(button);
}

// Watch for YouTube page changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes('/watch')) {
      setTimeout(injectSummarizeButton, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Initial injection
if (location.href.includes('/watch')) {
  injectSummarizeButton();
}