chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Transcript Summarizer installed!');
});