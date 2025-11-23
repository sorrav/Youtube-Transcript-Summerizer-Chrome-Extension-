import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

const pythonClient = axios.create({
  baseURL: PYTHON_SERVICE_URL,
  timeout: 120000, // 2 minutes for long transcripts
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function summarizeVideo(videoId, summaryLength) {
  try {
    const response = await pythonClient.post('/summarize', {
      video_id: videoId,
      summary_length: summaryLength
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // Python service returned an error
      throw {
        status: error.response.status,
        message: error.response.data.detail || 'Python service error'
      };
    } else if (error.request) {
      // No response from Python service
      throw {
        status: 503,
        message: 'Python service is not responding. Make sure it is running on port 8000.'
      };
    } else {
      // Other error
      throw {
        status: 500,
        message: error.message || 'Failed to connect to Python service'
      };
    }
  }
}

export async function checkPythonHealth() {
  try {
    const response = await pythonClient.get('/health');
    return { 
      status: 'healthy',
      data: response.data 
    };
  } catch (error) {
    return { 
      status: 'unhealthy',
      error: error.message 
    };
  }
}