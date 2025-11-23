import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import summarizeRouter from './routes/summarize.js';
import { checkPythonHealth } from './services/pythonClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Allow Chrome Extensions
app.use(cors({
  origin: true,  // Allow all origins including chrome-extension://
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false, 
    error: 'Too many requests from this IP, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Routes
app.use('/api/summarize', summarizeRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const pythonHealth = await checkPythonHealth();
  
  res.json({ 
    status: 'healthy', 
    service: 'nodejs-backend',
    python_service: pythonHealth.status,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'YouTube Transcript Summarizer API',
    version: '1.0.0',
    endpoints: {
      summarize: 'POST /api/summarize',
      health: 'GET /health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`[NODE] Server running on port ${PORT}`);
  console.log(`[NODE] Python service expected at: ${process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'}`);
  console.log(`[NODE] CORS enabled for all origins (including Chrome extensions)`);
  console.log(`[NODE] Ready to summarize YouTube videos!`);
});