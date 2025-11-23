import express from 'express';
import { summarizeVideo } from '../services/pythonClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { videoId, summaryLength = 'medium' } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }
    
    // Validate YouTube video ID format
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!videoIdRegex.test(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID' });
    }
    
    // Validate summary length
    if (!['short', 'medium', 'long'].includes(summaryLength)) {
      return res.status(400).json({ error: 'Invalid summary length. Must be: short, medium, or long' });
    }
    
    // Call Python microservice
    const result = await summarizeVideo(videoId, summaryLength);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Summarization error:', error);
    
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to summarize video'
    });
  }
});

export default router;