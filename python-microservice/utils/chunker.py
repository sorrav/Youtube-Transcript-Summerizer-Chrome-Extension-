import nltk
from typing import List

class TextChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 100):
        """
        chunk_size: approximate words per chunk
        overlap: words to overlap between chunks for context
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        nltk.download('punkt', quiet=True)
        
    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks at sentence boundaries"""
        sentences = nltk.sent_tokenize(text)
        chunks = []
        current_chunk = []
        current_word_count = 0
        
        for sentence in sentences:
            sentence_words = len(sentence.split())
            
            if current_word_count + sentence_words > self.chunk_size and current_chunk:
                # Save current chunk
                chunks.append(' '.join(current_chunk))
                
                # Start new chunk with overlap
                overlap_sentences = self._get_overlap_sentences(current_chunk)
                current_chunk = overlap_sentences
                current_word_count = sum(len(s.split()) for s in current_chunk)
            
            current_chunk.append(sentence)
            current_word_count += sentence_words
        
        # Add final chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _get_overlap_sentences(self, sentences: List[str]) -> List[str]:
        """Get last few sentences for overlap"""
        overlap_sentences = []
        word_count = 0
        
        for sentence in reversed(sentences):
            sentence_words = len(sentence.split())
            if word_count + sentence_words > self.overlap:
                break
            overlap_sentences.insert(0, sentence)
            word_count += sentence_words
        
        return overlap_sentences