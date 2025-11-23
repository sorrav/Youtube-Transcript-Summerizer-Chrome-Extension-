from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import time
import os

from models.lsa_summarizer import LSASummarizer
from models.hf_api_summarizer import HuggingFaceAPISummarizer
from utils.chunker import TextChunker

# YouTube Transcript API
from youtube_transcript_api import YouTubeTranscriptApi

from dotenv import load_dotenv
load_dotenv() 

app = FastAPI(title="YouTube Transcript Summarizer API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_MODEL = os.getenv("HF_MODEL", "facebook/bart-large-cnn")
if not HF_API_KEY:
    raise ValueError("HUGGINGFACE_API_KEY not set in environment! Get one from https://huggingface.co/settings/tokens")

lsa_summarizer = LSASummarizer(num_topics=3)
hf_summarizer = HuggingFaceAPISummarizer(
    api_key=HF_API_KEY,
    model=HF_MODEL
)
text_chunker = TextChunker(chunk_size=1000, overlap=100)

class SummarizeRequest(BaseModel):
    video_id: str
    summary_length: Literal["short", "medium", "long"] = "medium"

class SummarizeResponse(BaseModel):
    summary: str
    transcript_source: str
    original_length: int
    summary_length: int
    chunks_processed: int
    lsa_intermediate_length: int
    api_calls_made: int
    processing_time: float

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_video(request: SummarizeRequest):
    start_time = time.time()
    
    try:
        # Step 1: Get transcript from YouTube API
        print(f"Fetching transcript for video: {request.video_id}")
        
        try:
            # 1. Check for cookies.txt to bypass YouTube blocking
            cookies_file = "cookies.txt" if os.path.exists("cookies.txt") else None
            if cookies_file:
                print(f"✓ Found cookies.txt, using it for authentication.")
            
            # 2. Fetch the transcript list with cookies (if available)
            transcript_list_obj = YouTubeTranscriptApi.list_transcripts(
                request.video_id, 
                cookies=cookies_file
            )
            
            # 3. Try to fetch English (manual first, then auto-generated)
            try:
                # Prioritize Manual English -> Manual English (UK/US) -> Auto English
                transcript_obj = transcript_list_obj.find_transcript(['en', 'en-US', 'en-GB'])
            except:
                # Fallback: Just get the first available transcript (often auto-generated)
                print("Specific English transcript not found, trying any generated transcript...")
                transcript_obj = next(iter(transcript_list_obj))
            
            # 4. Download and Parse
            transcript_data = transcript_obj.fetch()
            transcript = ' '.join([entry['text'] for entry in transcript_data])
            source = "youtube_api"
            
            print(f"✓ Got transcript from YouTube API ({len(transcript)} chars)")
            
        except Exception as e:
            print(f"Transcript Error: {e}")
            detail_msg = f"YouTube blocked the request or no captions found. Error: {str(e)}"
            if "no element found" in str(e):
                detail_msg += " (Hint: YouTube is blocking your IP. Try adding a 'cookies.txt' file to your project folder.)"
            
            raise HTTPException(status_code=404, detail=detail_msg)
        
        original_word_count = len(transcript.split())
        api_calls = 0
        
        # Step 2: Process based on length
        if original_word_count < 500:
            # SHORT: Direct API call
            print(f"Short transcript ({original_word_count} words), using direct API call")
            
            max_len = {"short": 100, "medium": 130, "long": 150}[request.summary_length]
            
            summary = hf_summarizer.summarize(
                transcript,
                max_length=max_len,
                min_length=max_len // 2
            )
            
            if not summary:
                raise HTTPException(status_code=503, detail="HuggingFace API unavailable or rate limited")
            
            api_calls = 1
            lsa_intermediate_length = 0
            chunks_processed = 0
            
        else:
            # LONG: Hybrid chunking approach
            print(f"Long transcript ({original_word_count} words), using hybrid LSA + API approach")
            
            # 2a. Chunk
            chunks = text_chunker.chunk_text(transcript)
            chunks_processed = len(chunks)
            print(f"✓ Split into {chunks_processed} chunks")
            
            # 2b. Local LSA
            sentences_per_chunk = {"short": 2, "medium": 3, "long": 4}[request.summary_length]
            
            print(f"Processing chunks with LOCAL LSA...")
            lsa_summaries = []
            for i, chunk in enumerate(chunks):
                chunk_summary = lsa_summarizer.summarize_chunk(
                    chunk,
                    num_sentences=sentences_per_chunk
                )
                lsa_summaries.append(chunk_summary)
            
            # 2c. Combine
            combined_lsa_summary = ' '.join(lsa_summaries)
            lsa_intermediate_length = len(combined_lsa_summary.split())
            
            # 2d. Final API call
            final_max_len = {"short": 100, "medium": 150, "long": 200}[request.summary_length]
            
            print(f"Calling HuggingFace API for final summary...")
            summary = hf_summarizer.summarize(
                combined_lsa_summary,
                max_length=final_max_len,
                min_length=final_max_len // 2
            )
            
            if not summary:
                print("⚠ API failed, using LSA summary as fallback")
                fallback_summarizer = LSASummarizer()
                summary = fallback_summarizer.summarize_chunk(
                    combined_lsa_summary, 
                    num_sentences=final_max_len // 15
                )
            
            api_calls = 1
        
        processing_time = time.time() - start_time
        print(f"✓ Complete! Processed in {processing_time:.2f}s")
        
        return SummarizeResponse(
            summary=summary,
            transcript_source=source,
            original_length=original_word_count,
            summary_length=len(summary.split()),
            chunks_processed=chunks_processed,
            lsa_intermediate_length=lsa_intermediate_length,
            api_calls_made=api_calls,
            processing_time=round(processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    hf_status = hf_summarizer.check_model_status()
    return {
        "status": "healthy",
        "huggingface_api": hf_status,
        "message": "Cookies loaded" if os.path.exists("cookies.txt") else "No cookies found (Warning: YouTube might block)"
    }
    
@app.get("/")
async def root():
    return {"message": "YouTube Summarizer API Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)