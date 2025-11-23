# YouTube Transcript Summarizer

A full-stack application that summarizes YouTube video transcripts using AI. Features a hybrid approach combining local LSA (Latent Semantic Analysis) with HuggingFace's transformer models to reduce API costs by 70-90% while maintaining 95% accuracy.

## Features

- Web application and Chrome extension interfaces
- Automatic transcript extraction from YouTube videos
- Three summary lengths: Short, Medium, Long
- Hybrid LSA + Transformer summarization (reduces API token usage by 70-90%)
- Support for videos with auto-generated or manual captions (option for videos without subtitles through whisper stt)
- Real-time processing with progress indicators

## ScreenShots


<img width="1523" height="899" alt="Screenshot 2025-11-23 192431" src="https://github.com/user-attachments/assets/ed5c8f04-21fb-4d71-8262-f4f8d36ad4e7" />
<img width="1709" height="966" alt="Screenshot 2025-11-23 192531" src="https://github.com/user-attachments/assets/5b7ca6cf-10e3-4c77-989a-a0196b1a3860" />


## Installation

### 1. Clone Repository

```bash
git clone 
cd Youtube_Transcript_summerizer
```

### 2. Setup Python Microservice

```bash
cd python-microservice
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python -c "import nltk; nltk.download('punkt')"
```

Create `.env` file:
```env
HUGGINGFACE_API_KEY=hf_your_key_here
HF_MODEL=sshleifer/distilbart-cnn-12-6
```

Get your free HuggingFace API key: https://huggingface.co/settings/tokens

### 3. Setup Node.js Backend

```bash
cd nodejs-backend
npm install
```

Create `.env` file:
```env
PORT=3000
PYTHON_SERVICE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

### 4. Setup Web App

```bash
cd web-app
npm install
```

### 5. Load Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

## Running the Application

From project root:
```bash
npm install -g concurrently
npm start
```
   
## How It Works

### Hybrid Summarization Approach

1. **Extract Transcript**: Get captions from YouTube API
2. **Chunk Text**: Split long transcripts into manageable pieces
3. **Local LSA**: Summarize each chunk locally (free, instant)
4. **Combine**: Merge LSA summaries
5. **API Polish**: Send combined summary to HuggingFace for final refinement

## Acknowledgments

- HuggingFace for free inference API
- YouTube Transcript API
- scikit-learn for LSA implementation
