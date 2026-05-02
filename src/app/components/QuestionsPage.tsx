import { useMemo, useState, useEffect } from 'react';
import { BookOpen, ListChecks, PencilLine, FileText, Trash2, RefreshCw } from 'lucide-react';
import { api } from '@/app/utils/api';

type QuestionType = 'mcq' | 'short' | 'long';

interface QuestionItem {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  answerSample?: string;
  createdAt: string;
  points?: number;
  keywords?: string[];
}

interface QuestionsPageProps {
  onBack?: () => void;
}

export function QuestionsPage({ onBack }: QuestionsPageProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<QuestionType>('mcq');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [answerSample, setAnswerSample] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<QuestionType | 'all'>('all');
  const [points, setPoints] = useState<number>(5);
  const [keywordsInput, setKeywordsInput] = useState<string>('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await api.questions.list();
      if (data) {
        setQuestions(data.map((q: any) => ({
          id: String(q.id),
          type: q.type,
          prompt: q.prompt || q.text,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_option,
          answerSample: q.answerSample || q.answer_sample,
          createdAt: q.createdAt || q.created_at,
          points: q.points,
          keywords: typeof q.keywords === 'string' ? JSON.parse(q.keywords) : q.keywords,
        })));
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Fetch questions error:', err);
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const filtered = useMemo(
    () => (activeTab === 'all' ? questions : questions.filter(q => q.type === activeTab)),
    [questions, activeTab]
  );

  const useRealLifeTemplate = () => {
    setType('long');
    setPrompt('Real-life scenario: Describe how you would handle [situation], including steps, stakeholders, risks, and expected outcome.');
    setAnswerSample('Explain context, list actions step-by-step, communication plan, trade-offs, and how you measure success.');
    setPoints(10);
    setKeywordsInput('steps, stakeholders, risks, communication plan, trade-offs, measure success, outcome');
    setError('');
  };

  const addQuestion = async () => {
    const p = prompt.trim();
    if (!p) {
      setError('Please enter the question text');
      return;
    }
    
    let newItem: any = {
      type,
      text: p,
      points: points > 0 ? points : (type === 'mcq' ? 1 : 5),
    };

    if (type === 'mcq') {
      const cleaned = options.map(o => o.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        setError('Please provide at least two options');
        return;
      }
      newItem.options = cleaned;
      newItem.correct_option = correctIndex;
    } else {
      newItem.answer_sample = answerSample;
      newItem.keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
    }

    try {
      await api.questions.create(newItem);
      await fetchQuestions();
      
      // Reset form
      setPrompt('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
      setAnswerSample('');
      setKeywordsInput('');
      setError('');
    } catch (err) {
      console.error('Add question error:', err);
      setError('Failed to create question');
    }
  };

  const removeQuestion = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.questions.delete(id);
      await fetchQuestions();
    } catch (err) {
      console.error('Remove question error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Question Bank
              </h1>
              <p className="text-xs text-gray-500">Add MCQs, short, and long questions</p>
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
                  onClick={() => setType('mcq')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    type === 'mcq' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <ListChecks className="w-4 h-4" />
                  MCQ
                </button>
                <button
                  onClick={() => setType('short')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    type === 'short' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <PencilLine className="w-4 h-4" />
                  Short
                </button>
                <button
                  onClick={() => setType('long')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                    type === 'long' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Long
                </button>
              </div>
              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-2">Templates</label>
                <button
                  onClick={useRealLifeTemplate}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100"
                  title="Prefill with a real-life scenario pattern"
                >
                  Use Real Life Template
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Type the question..."
              />
              {type === 'mcq' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={correctIndex === idx}
                        onChange={() => setCorrectIndex(idx)}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = options.slice();
                          next[idx] = e.target.value;
                          setOptions(next);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {type !== 'mcq' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sample Answer (optional)</label>
                  <textarea
                    value={answerSample}
                    onChange={(e) => setAnswerSample(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Provide guidance or model answer..."
                  />
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auto-mark Keywords (comma-separated)</label>
                    <input
                      type="text"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., stakeholder, risk, outcome, steps"
                    />
                    <p className="mt-1 text-xs text-gray-500">User answers earn points when these keywords appear.</p>
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                  <input
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value || '1', 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-3">
                <button
                  onClick={addQuestion}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-semibold"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            {(['all', 'mcq', 'short', 'long'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === tab ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <li className="px-6 py-12 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading questions...</p>
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500 text-sm">No questions yet</li>
            ) : (
              filtered.map((q) => (
                <li key={q.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">{q.prompt}</p>
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="mr-2">Type: {q.type.toUpperCase()}</span>
                        <span>{new Date(q.createdAt).toLocaleString()}</span>
                      {typeof q.points === 'number' && (
                        <span className="ml-2">Points: {q.points}</span>
                      )}
                      </div>
                      {q.type === 'mcq' && q.options && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((o, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-xs ${
                                q.correctIndex === i ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                      {q.type !== 'mcq' && q.answerSample && (
                        <p className="mt-2 text-gray-700">{q.answerSample}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
