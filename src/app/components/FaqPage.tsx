import { useState, useMemo, useEffect } from 'react';
import { HelpCircle, MessageSquarePlus, CheckCircle, Clock, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/app/utils/api';

interface FaqItem {
  id: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  createdAt: string;
  answeredAt?: string;
}

interface FaqPageProps {
  onBack?: () => void;
}

export function FaqPage({ onBack }: FaqPageProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await api.faqs.list();
      if (data) {
        setFaqs(data.map((f: any) => ({
          id: String(f.id),
          question: f.question,
          answer: f.answer,
          status: f.status,
          createdAt: f.created_at,
          answeredAt: f.answered_at
        })));
      } else {
        setFaqs([]);
      }
    } catch (err) {
      console.error('Fetch faqs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const answered = useMemo(() => faqs.filter(f => f.status === 'answered'), [faqs]);
  const pending = useMemo(() => faqs.filter(f => f.status === 'pending'), [faqs]);

  const addQuestion = async () => {
    const q = question.trim();
    if (!q) {
      setError('Please enter your question');
      return;
    }
    
    try {
      await api.faqs.create({ question: q });
      await fetchFaqs();
      setQuestion('');
      setError('');
    } catch (err) {
      console.error('Add faq error:', err);
      setError('Failed to submit question');
    }
  };

  const removeQuestion = async (id: string) => {
    try {
      await api.faqs.delete(id);
      await fetchFaqs();
    } catch (err) {
      console.error('Remove faq error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                FAQs
              </h1>
              <p className="text-xs text-gray-500">Ask questions, view answers from Admin</p>
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
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
              <MessageSquarePlus className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                placeholder="Type your question for the admin..."
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={addQuestion}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-semibold disabled:opacity-50"
                  disabled={loading}
                >
                  Submit Question
                </button>
                {question && (
                  <button
                    onClick={() => { setQuestion(''); setError(''); }}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Clear
                  </button>
                )}
                {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[300px]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-gray-900">Pending Questions</span>
            </div>
            <ul className="divide-y divide-gray-200 flex-1">
              {pending.map((f) => (
                <li key={f.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <p className="text-gray-900 leading-relaxed">{f.question}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(f.createdAt).toLocaleString()}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => removeQuestion(f.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </li>
              ))}
              {!loading && pending.length === 0 && (
                <li className="flex-1 flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
                  <Clock className="w-12 h-12 text-gray-200 mb-3" />
                  No pending questions
                </li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[300px]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-900">Answered</span>
            </div>
            <ul className="divide-y divide-gray-200 flex-1">
              {answered.map((f) => (
                <li key={f.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-gray-900 leading-relaxed">{f.question}</p>
                  <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-emerald-900 text-sm leading-relaxed">{f.answer}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{new Date(f.answeredAt || f.createdAt).toLocaleString()}</p>
                </li>
              ))}
              {!loading && answered.length === 0 && (
                <li className="flex-1 flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
                  <CheckCircle className="w-12 h-12 text-gray-200 mb-3" />
                  No answered questions yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
