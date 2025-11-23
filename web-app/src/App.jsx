import { useState } from 'react';
import { Loader2, Youtube, FileText, Clock, TrendingUp } from 'lucide-react';

const API_URL = 'http://localhost:3000';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /^[a-zA-Z0-9_-]{11}$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1] || match[0];
    }
    return null;
  };

  const handleSummarize = async () => {
    setError('');
    setSummary(null);
    
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      setError('Invalid YouTube URL or Video ID');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          summaryLength
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setSummary(data.data);
    } catch (err) {
      setError(err.message || 'Failed to summarize video');
    } finally {
      setLoading(false);
    }
  };

  const getLengthColor = (length) => {
    if (length === 'short') return 'bg-green-500 hover:bg-green-600';
    if (length === 'medium') return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  const getLengthBorder = (length) => {
    if (length === 'short') return 'border-green-500';
    if (length === 'medium') return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6 shadow-lg">
            <Youtube size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            YouTube Transcript Summarizer
          </h1>
          <p className="text-xl text-gray-600">
            Get AI-powered summaries of YouTube videos instantly
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
            <TrendingUp size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-600">
              {/*-----*/}
            </span>
          </div>
        </header>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              YouTube URL or Video ID
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSummarize()}
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Summary Length
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['short', 'medium', 'long'].map((length) => (
                <button
                  key={length}
                  onClick={() => setSummaryLength(length)}
                  disabled={loading}
                  className={`
                    px-6 py-4 rounded-xl font-semibold text-white transition-all transform
                    ${summaryLength === length 
                      ? `${getLengthColor(length)} scale-105 shadow-lg` 
                      : 'bg-gray-300 hover:bg-gray-400'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-500 text-center">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span> Quick (~100 words)
                <span className="mx-2">•</span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Balanced (~150 words)
                <span className="mx-2">•</span>
                <span className="w-3 h-3 bg-red-500 rounded-full"></span> Detailed (~200 words)
              </span>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={loading || !videoUrl}
            className="w-full py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Analyzing Transcript...</span>
              </>
            ) : (
              <>
                <FileText size={24} />
                <span>Summarize Video</span>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Result */}
        {summary && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Summary Header */}
            <div className={`px-8 py-6 border-b-4 ${getLengthBorder(summaryLength)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={28} className="text-red-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${getLengthColor(summaryLength).split(' ')[0]}`}>
                  {summaryLength.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Summary Content */}
            <div className="p-8">
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-lg leading-relaxed text-gray-800">
                  {summary.summary}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600 uppercase">Time</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{summary.processing_time}s</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-purple-600" />
                    <span className="text-xs font-semibold text-purple-600 uppercase">Source</span>
                  </div>
                  <p className="text-sm font-bold text-purple-900">
                    {summary.transcript_source === 'youtube_api' ? 'Captions' : 'Whisper STT'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-600 uppercase">Compression</span>
                  </div>
                  <p className="text-xl font-bold text-green-900">
                    {summary.original_length} → {summary.summary_length}
                  </p>
                </div>

                {summary.chunks_processed > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-orange-600" />
                      <span className="text-xs font-semibold text-orange-600 uppercase">Chunks</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{summary.chunks_processed}</p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {summary.lsa_intermediate_length && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Smart Processing:</span> LSA compressed {summary.original_length} words → {summary.lsa_intermediate_length} words, then API refined to {summary.summary_length} words
                    <span className="ml-2 text-green-600 font-semibold">
                      ({Math.round((1 - summary.lsa_intermediate_length / summary.original_length) * 100)}% token reduction!)
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by LSA + HuggingFace API • Built with React + FastAPI</p>
        </footer>
      </div>
    </div>
  );
}

export default App;