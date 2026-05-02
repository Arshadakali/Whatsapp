import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/app/utils/api';

interface CommentItem {
  id: string;
  type: 'want' | 'not_want' | 'general';
  text: string;
  createdAt: string;
}

interface CommentsPageProps {
  onBack?: () => void;
}

export function CommentsPage({ onBack }: CommentsPageProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'want' | 'not_want'>('want');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await api.comments.list();
      if (data) {
        setComments(data.map((c: any) => ({
          id: String(c.id),
          type: c.type,
          text: c.content,
          createdAt: c.created_at
        })));
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const addComment = async () => {
    const t = text.trim();
    if (!t) {
      setError('Please enter your comment');
      return;
    }
    
    try {
      await api.comments.create({ type, content: t });
      await fetchComments();
      setText('');
      setError('');
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Failed to add comment');
    }
  };

  const removeComment = async (id: string) => {
    try {
      await api.comments.delete(id);
      await fetchComments();
    } catch (err) {
      console.error('Remove comment error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Comments & Reports
              </h1>
              <p className="text-xs text-gray-500">Tell us what you want or don’t want</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200"
            >
              Back
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setType('want')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    type === 'want' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Want
                </button>
                <button
                  onClick={() => setType('not_want')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    type === 'not_want' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Don’t Want
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                placeholder="Describe what you want or don’t want..."
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              <div className="mt-3">
                <button
                  onClick={addComment}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-semibold disabled:opacity-50"
                  disabled={loading}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-[300px] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Recent Comments</span>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          </div>
          <ul className="divide-y divide-gray-200 flex-1">
            {comments.map((c) => (
              <li key={c.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  {c.type === 'want' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                      <ThumbsUp className="w-3 h-3" /> Want
                    </span>
                  ) : c.type === 'not_want' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium">
                      <ThumbsDown className="w-3 h-3" /> Don’t Want
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
                      General
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-900 leading-relaxed">{c.text}</p>
                <div className="mt-2">
                  <button
                    onClick={() => removeComment(c.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </li>
            ))}
            {!loading && comments.length === 0 && (
              <li className="flex-1 flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                No comments yet
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
