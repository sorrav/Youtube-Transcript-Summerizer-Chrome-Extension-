from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import Normalizer
import numpy as np
import nltk

class LSASummarizer:
    def __init__(self, num_topics: int = 3):
        self.num_topics = num_topics
        nltk.download('punkt', quiet=True)
        
    def summarize_chunk(self, text: str, num_sentences: int = 3) -> str:
        """Summarize a single chunk using LSA (LOCAL - NO API)"""
        sentences = nltk.sent_tokenize(text)
        
        if len(sentences) <= num_sentences:
            return text
            
        vectorizer = TfidfVectorizer(
            min_df=1,
            max_df=0.9,
            stop_words='english',
            lowercase=True
        )
        
        try:
            sentence_vectors = vectorizer.fit_transform(sentences)
            svd = TruncatedSVD(n_components=min(self.num_topics, len(sentences)-1))
            sentence_vectors_lsa = svd.fit_transform(sentence_vectors)
            sentence_vectors_lsa = Normalizer(copy=False).fit_transform(sentence_vectors_lsa)
            
            scores = np.sum(sentence_vectors_lsa, axis=1)
            top_indices = np.argsort(scores)[-num_sentences:]
            top_indices.sort()
            
            return ' '.join([sentences[i] for i in top_indices])
        except ValueError:
            return ' '.join(sentences[:num_sentences])