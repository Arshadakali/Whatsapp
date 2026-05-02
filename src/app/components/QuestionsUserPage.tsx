import { useMemo, useState, useEffect } from 'react';
import { ListChecks, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

interface AnswerItem {
  id?: number | string;
  questionId: string;
  type: QuestionType;
  response: { optionIndex?: number; text?: string };
  userName?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  score?: number;
  maxScore?: number;
  submitted?: boolean;
  submittedAt?: string;
}

interface QuestionsUserPageProps {
  onBack?: () => void;
}

export function QuestionsUserPage({ onBack }: QuestionsUserPageProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [userName, setUserName] = useState('');
  const [userId] = useState<string>(() => {
    const existing = localStorage.getItem('currentUserId');
    if (existing) return existing;
    const gen = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    localStorage.setItem('currentUserId', gen);
    return gen;
  });
  const [activeTab, setActiveTab] = useState<QuestionType | 'all'>('all');

  const fetchData = async () => {
    try {
      // User Name
      const savedUserName = localStorage.getItem(`userName_${userId}`);
      if (savedUserName) setUserName(savedUserName);

      // Questions
      const questionsData = await api.questions.list();
      let parsedQuestions: QuestionItem[] = [];
      if (questionsData) {
        parsedQuestions = questionsData.map((q: any) => ({
          id: String(q.id),
          type: q.type,
          prompt: q.prompt || q.text,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_option,
          answerSample: q.answerSample || q.answer_sample,
          createdAt: q.createdAt || q.created_at,
          points: q.points,
          keywords: typeof q.keywords === 'string' ? JSON.parse(q.keywords) : q.keywords,
        }));
        setQuestions(parsedQuestions);
      }

      // Answers
      const answersData = await api.questionAnswers.list(userId);
      if (answersData) {
        const parsedAnswers = answersData.map((a: any) => ({
          ...a,
          questionId: String(a.question_id),
          userId: a.user_id,
          userName: a.user_name,
          maxScore: a.max_score,
          response: typeof a.response === 'string' ? JSON.parse(a.response) : a.response,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          submitted: !!a.submitted
        }));

        // Score/Sync logic (if questions exist)
        const updatedAnswers = parsedAnswers.map((a: any) => {
          const q = parsedQuestions.find((x: any) => String(x.id) === String(a.questionId));
          if (!q) return a;

          let score = a.score;
          let maxScore = a.maxScore;

          if (q.type === 'mcq' && typeof a.response.optionIndex === 'number') {
            score = scoreMcq(q, a.response.optionIndex);
            maxScore = q.points || 1;
          } else if (q.type !== 'mcq') {
            score = scoreText(q, a.response.text || '');
            maxScore = q.points || 5;
          }

          return { ...a, score, maxScore };
        });

        setAnswers(updatedAnswers);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const persistAnswer = async (answer: AnswerItem) => {
    try {
      const data = {
        id: answer.id,
        question_id: answer.questionId,
        user_id: answer.userId,
        response: answer.response,
        score: answer.score,
        max_score: answer.maxScore,
        submitted: answer.submitted
      };
      await api.questionAnswers.submit(data);
      // We can optionally refetch, or just update local state if we trust it
      // For now, let's just log success
      console.log('Answer saved');
    } catch (err) {
      console.error('Save answer error:', err);
    }
  };

  const filtered = useMemo(() => {
    if (activeTab === 'all') return questions;
    return questions.filter(q => q.type === activeTab);
  }, [questions, activeTab]);

  const scoreMcq = (q: QuestionItem, idx: number) => {
    const pts = typeof q.points === 'number' ? q.points : 1;
    return idx === q.correctIndex ? pts : 0;
  };

  const scoreText = (q: QuestionItem, text: string) => {
    const pts = typeof q.points === 'number' ? q.points : 5;
    const kws = (q.keywords || []).map(k => k.toLowerCase());
    if (!kws.length) return 0;
    const body = (text || '').toLowerCase();
    const matches = kws.filter(k => body.includes(k)).length;
    const ratio = matches / kws.length;
    return Math.round(pts * ratio);
  };

  const setMcqAnswer = (questionId: string, optionIndex: number) => {
    const q = questions.find(x => x.id === questionId);
    if (!q) return;
    const score = scoreMcq(q, optionIndex);
    const maxScore = typeof q.points === 'number' ? q.points : 1;
    
    const existingIdx = answers.findIndex(a => a.questionId === questionId);
    if (existingIdx >= 0 && answers[existingIdx].submitted) return;

    const nextOne: AnswerItem = {
      id: existingIdx >= 0 ? answers[existingIdx].id : Math.floor(Date.now() + Math.random() * 1000),
      questionId,
      type: 'mcq',
      response: { optionIndex },
      userName: userName || undefined,
      userId,
      createdAt: existingIdx >= 0 ? answers[existingIdx].createdAt : new Date().toISOString(),
      score,
      maxScore,
    };

    const nextAnswers = [...answers];
    if (existingIdx >= 0) {
      nextAnswers[existingIdx] = nextOne;
    } else {
      nextAnswers.unshift(nextOne);
    }
    setAnswers(nextAnswers);
    persistAnswer(nextOne);
  };

  const setTextAnswer = (questionId: string, type: 'short' | 'long', text: string) => {
    const q = questions.find(x => x.id === questionId);
    if (!q) return;
    const score = scoreText(q, text);
    const maxScore = typeof q.points === 'number' ? q.points : 5;
    
    const existingIdx = answers.findIndex(a => a.questionId === questionId);
    if (existingIdx >= 0 && answers[existingIdx].submitted) return;

    const nextOne: AnswerItem = {
      id: existingIdx >= 0 ? answers[existingIdx].id : Math.floor(Date.now() + Math.random() * 1000),
      questionId,
      type,
      response: { text },
      userName: userName || undefined,
      userId,
      createdAt: existingIdx >= 0 ? answers[existingIdx].createdAt : new Date().toISOString(),
      score,
      maxScore,
    };

    const nextAnswers = [...answers];
    if (existingIdx >= 0) {
      nextAnswers[existingIdx] = nextOne;
    } else {
      nextAnswers.unshift(nextOne);
    }
    setAnswers(nextAnswers);
    persistAnswer(nextOne);
  };

  const canSubmit = (q: QuestionItem, existing?: AnswerItem) => {
    if (!existing || existing.submitted) return false;
    if (!(userName || '').trim()) return false;
    if (q.type === 'mcq') return typeof existing.response.optionIndex === 'number';
    const t = (existing.response.text || '').trim();
    return t.length > 0;
  };

  const submitAnswer = (questionId: string) => {
    const idx = answers.findIndex(a => a.questionId === questionId);
    if (idx < 0) return;
    
    const nextOne = { 
      ...answers[idx], 
      submitted: true, 
      userName: userName || answers[idx].userName 
    };
    
    const nextAnswers = [...answers];
    nextAnswers[idx] = nextOne;
    setAnswers(nextAnswers);
    persistAnswer(nextOne);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                <ListChecks className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Questions
                </h1>
                <p className="text-xs text-gray-500">Answer and submit to admins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={userName}
                onChange={(e) => { 
                  const nextName = e.target.value;
                  setUserName(nextName); 
                  localStorage.setItem(`userName_${userId}`, nextName);
                }}
                onBlur={() => {
                  if (userName.trim()) {
                    api.users.create({ id: userId, name: userName }).catch(console.error);
                  }
                }}
                placeholder="Your name"
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium text-sm">Back</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-2">
          {(['all','mcq','short','long'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === t
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t === 'mcq' && <ListChecks className="w-4 h-4" />}
              {t === 'short' && <BookOpen className="w-4 h-4" />}
              {t === 'long' && <BookOpen className="w-4 h-4" />}
              <span className="font-medium text-sm capitalize">{t}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filtered.map(q => {
              const existing = answers.find(a => a.questionId === q.id && a.userId === userId);
              return (
                <li key={q.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{new Date(q.createdAt).toLocaleString()}</p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900">{q.prompt}</h3>
                      {q.type === 'mcq' && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, idx) => {
                            const selected = existing?.response.optionIndex === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setMcqAnswer(q.id, idx)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                                  selected ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                                disabled={existing?.submitted}
                              >
                                <span className={`inline-block w-5 h-5 rounded-full border ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}></span>
                                <span className="text-sm">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {q.type !== 'mcq' && (
                        <div className="mt-4">
                          <textarea
                            value={existing?.response.text || ''}
                            onChange={e => setTextAnswer(q.id, q.type as 'short' | 'long', e.target.value)}
                            placeholder={q.type === 'short' ? 'Type your short answer...' : 'Type your long answer...'}
                            className="w-full min-h-[120px] px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={existing?.submitted}
                          />
                        </div>
                      )}
                      {q.type !== 'mcq' && q.answerSample && (
                        <p className="mt-3 text-xs text-gray-500">Hint: {q.answerSample}</p>
                      )}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => submitAnswer(q.id)}
                          disabled={!canSubmit(q, existing)}
                          className={`px-4 py-2.5 rounded-xl border ${
                            canSubmit(q, existing)
                              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              : 'border-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          Submit Answer
                        </button>
                      </div>
                    </div>
                    {existing && (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Answered</span>
                        {typeof existing.score === 'number' && typeof existing.maxScore === 'number' && (
                          <span className="text-xs font-semibold">· {existing.score}/{existing.maxScore}</span>
                        )}
                        {existing.submitted && (
                          <span className="text-xs font-semibold">· Submitted</span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-6 py-8 text-center text-gray-500 text-sm">No questions available</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
