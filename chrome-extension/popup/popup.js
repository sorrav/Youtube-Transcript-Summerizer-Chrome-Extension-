const API_URL = 'http://localhost:3000';

let currentVideoId = null;
let selectedLength = 'medium';

// Get current YouTube video ID
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  
  if (!tab.url.includes('youtube.com/watch')) {
    document.getElementById('statusText').textContent = 'Not on a YouTube video page';
    document.getElementById('statusBadge').style.borderColor = '#fca5a5';
    return;
  }
  
  const url = new URL(tab.url);
  currentVideoId = url.searchParams.get('v');
  
  if (currentVideoId) {
    document.getElementById('statusText').textContent = `Video detected: ${currentVideoId}`;
    document.getElementById('statusBadge').style.borderColor = '#86efac';
    document.getElementById('lengthSelector').style.display = 'block';
    document.getElementById('summarizeBtn').style.display = 'flex';
  } else {
    document.getElementById('statusText').textContent = 'Could not detect video ID';
    document.getElementById('statusBadge').style.borderColor = '#fca5a5';
  }
});

// Length button handlers
document.querySelectorAll('.length-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all
    document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
    
    // Add active to clicked
    btn.classList.add('active');
    selectedLength = btn.dataset.length;
  });
});

// Summarize button click
document.getElementById('summarizeBtn').addEventListener('click', async () => {
  // Hide everything
  document.getElementById('summarizeBtn').style.display = 'none';
  document.getElementById('lengthSelector').style.display = 'none';
  document.getElementById('statusBadge').style.display = 'none';
  document.getElementById('summaryContainer').style.display = 'none';
  document.getElementById('errorContainer').style.display = 'none';
  
  // Show loading
  document.getElementById('loading').style.display = 'block';
  
  try {
    const response = await fetch(`${API_URL}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: currentVideoId,
        summaryLength: selectedLength
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    
    // Show summary
    displaySummary(data.data);
    
  } catch (error) {
    document.getElementById('loading').style.display = 'none';
    displayError(error.message || 'Failed to summarize video');
  }
});

function displaySummary(data) {
  // Update summary text
  document.getElementById('summaryText').textContent = data.summary;
  
  // Update length badge
  const badge = document.getElementById('lengthBadge');
  badge.textContent = selectedLength.toUpperCase();
  badge.className = 'length-badge badge-' + selectedLength;
  
  // Update header border color
  const header = document.querySelector('.summary-header');
  if (selectedLength === 'short') {
    header.style.borderColor = '#10b981';
  } else if (selectedLength === 'medium') {
    header.style.borderColor = '#eab308';
  } else {
    header.style.borderColor = '#ef4444';
  }
  
  // Update stats
  document.getElementById('statTime').textContent = data.processing_time + 's';
  document.getElementById('statCompression').textContent = 
    `${data.original_length} → ${data.summary_length}`;
  
  // Show token reduction if applicable
  if (data.lsa_intermediate_length) {
    const reductionPercent = Math.round((1 - data.lsa_intermediate_length / data.original_length) * 100);
    document.getElementById('tokenText').textContent = 
      `${reductionPercent}% token reduction with smart chunking!`;
    document.getElementById('tokenReduction').style.display = 'flex';
  }
  
  // Show summary container
  document.getElementById('summaryContainer').style.display = 'block';
  
  // Show buttons again for retry
  document.getElementById('summarizeBtn').style.display = 'flex';
  document.getElementById('lengthSelector').style.display = 'block';
  document.getElementById('statusBadge').style.display = 'flex';
}

function displayError(message) {
  document.getElementById('errorText').textContent = message;
  document.getElementById('errorContainer').style.display = 'block';
  
  // Show buttons again for retry
  document.getElementById('summarizeBtn').style.display = 'flex';
  document.getElementById('lengthSelector').style.display = 'block';
  document.getElementById('statusBadge').style.display = 'flex';
}