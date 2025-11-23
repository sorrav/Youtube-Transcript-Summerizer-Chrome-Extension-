import os
import requests
import time
from typing import Optional

class HuggingFaceAPISummarizer:
    def __init__(self, api_key: str, model: str = None):
        """
        Initialize HuggingFace API client
        """
        # 1. Load model
        self.model = model or os.getenv("HF_MODEL", "facebook/bart-large-cnn")
        self.api_key = api_key
        
        # 2. FIX: Updated to new HuggingFace Router URL (Old api-inference is deprecated)
        self.api_url = f"https://router.huggingface.co/hf-inference/models/{self.model}"
        
        self.headers = {"Authorization": f"Bearer {api_key}"}
        
        print(f"[HF] Model: {self.model}")
        print(f"[HF] Endpoint: {self.api_url}")
    
    def summarize(
        self, 
        text: str, 
        max_length: int = 150, 
        min_length: int = 50,
        max_retries: int = 5
    ) -> Optional[str]:
        """
        Call HuggingFace API for summarization with automatic retry on model loading
        """
        # 3. Safer word limit (approx 700 words -> ~900 tokens)
        words = text.split()
        if len(words) > 700:
            text = ' '.join(words[:700])
            print("[WARN] Input truncated to first 700 words to fit token limit.")
        
        # 4. Payload structure
        payload = {
            "inputs": text,
            "parameters": {
                "max_length": max_length,
                "min_length": min_length,
                "do_sample": False  # Deterministic summary
            }
        }
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=30 
                )
                
                # SUCCESS
                if response.status_code == 200:
                    result = response.json()
                    # Handle List vs Dict response types
                    if isinstance(result, list) and result:
                        return result[0].get('summary_text')
                    elif isinstance(result, dict):
                        return result.get('summary_text')
                    return None

                # MODEL LOADING (503)
                elif response.status_code == 503:
                    error_data = response.json()
                    estimated_time = error_data.get('estimated_time', 20.0)
                    print(f"[WAIT] Model loading... (Est: {estimated_time:.1f}s)")
                    time.sleep(estimated_time) # Wait the suggested time
                    continue 
                
                # RATE LIMIT (429)
                elif response.status_code == 429:
                    print("[LIMIT] Rate limit reached. Waiting 10s...")
                    time.sleep(10)
                    continue

                else:
                    print(f"[ERROR] API {response.status_code}: {response.text}")
                    return None
                    
            except Exception as e:
                print(f"[ERROR] Exception: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return None
        
        return None

    def check_model_status(self) -> dict:
        """
        Checks API health by sending a tiny test request.
        """
        try:
            # We must use POST (summarize a single word) to check status
            payload = {
                "inputs": "Ping", 
                "parameters": {"max_length": 2, "min_length": 1}
            }
            
            response = requests.post(
                self.api_url, 
                headers=self.headers, 
                json=payload, 
                timeout=5
            )
            
            if response.status_code == 200:
                return {"status": "available", "code": 200}
            
            elif response.status_code == 503:
                data = response.json()
                estimated = data.get('estimated_time', 'unknown')
                return {"status": "loading", "code": 503, "estimated_time": estimated}
                
            else:
                return {"status": "error", "code": response.status_code, "detail": response.text}
                
        except Exception as e:
            return {"status": "down", "code": None, "error": str(e)}

    def warmup_model(self) -> bool:
        """
        Sends a tiny request to wake up the model. 
        """
        print("[WARMUP] Pinging model to ensure it is loaded...")
        res = self.summarize("Hello world.", max_length=10, min_length=5)
        if res:
            print("[OK] Model is hot and ready.")
            return True
        return False