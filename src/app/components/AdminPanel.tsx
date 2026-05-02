import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save,
  LogOut,
  FileText,
  BarChart3,
  Cpu,
  GraduationCap,
  Briefcase,
  Users,
  ToggleLeft,
  ToggleRight,
  HelpCircle
} from 'lucide-react';
import { api } from '@/app/utils/api';

interface ContentItem {
  id: number | string;
  title: string;
  description: string;
  category: 'technology' | 'scholarships' | 'jobs';
  date: string;
  organization?: string;
  location?: string;
  deadline?: string;
  tags?: string[] | string;
  link?: string;
}

interface FaqItem {
  id: number | string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  createdAt: string;
  answeredAt?: string;
}

interface AdminPanelProps {
  onLogout: () => void;
  isSuperAdmin: boolean;
  onOpenQuestions?: () => void;
}

export function AdminPanel({ onLogout, isSuperAdmin, onOpenQuestions }: AdminPanelProps) {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'technology' | 'scholarships' | 'jobs'>('all');
  const [adminLoginHidden, setAdminLoginHidden] = useState(false);
  const [admins, setAdmins] = useState<Array<{id:number;name:string;email:string;enabled:boolean;createdAt:string}>>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '',
    description: '',
    category: 'technology',
    organization: '',
    location: '',
    deadline: '',
    tags: [],
    link: '',
  });

  const fetchData = async () => {
    try {
      // Posts
      const postsData = await api.posts.list();
      if (postsData) {
        setPosts(postsData.map((p: any) => ({
          ...p,
          tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? JSON.parse(p.tags) : [])
        })));
      }

      // FAQs
      const faqsData = await api.faqs.list();
      if (faqsData) {
        setFaqs(faqsData.map((f: any) => ({
          ...f,
          createdAt: f.created_at,
          answeredAt: f.answered_at
        })));
      }

      // Admins
      const adminsData = await api.admins.list();
      if (adminsData) {
        setAdmins(adminsData.map((a: any) => ({
          ...a,
          createdAt: a.created_at,
          enabled: !!a.enabled
        })));
      }

      // Settings
      const settingsData = await api.settings.list();
      if (settingsData) {
        if (settingsData.adminLoginHidden) {
          setAdminLoginHidden(settingsData.adminLoginHidden === 'true');
        }
      }

      // Results
      const resultsData = await api.questionAnswers.list();
      const questionsData = await api.questions.list();
      
      if (resultsData && questionsData) {
        setQuestionResults(resultsData.map((r: any) => {
          const question = questionsData.find((q: any) => String(q.id) === String(r.question_id));
          return {
            ...r,
            question_text: question?.prompt || 'Unknown Question',
            question_options: question?.options ? JSON.parse(question.options) : [],
            response: typeof r.response === 'string' ? JSON.parse(r.response) : r.response,
            createdAt: r.created_at,
            maxScore: r.max_score
          };
        }));
      }

    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (field: keyof ContentItem, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddPost = async () => {
    try {
      const newPost = {
        ...formData,
        date: new Date().toISOString().split('T')[0],
      };
      
      await api.posts.create(newPost);
      await fetchData();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Add post error:', error);
      alert('Failed to add post');
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    try {
      await api.posts.update(editingPost.id, formData);
      await fetchData();
      setEditingPost(null);
      resetForm();
    } catch (error) {
      console.error('Update post error:', error);
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.posts.delete(id);
        await fetchData();
      } catch (error) {
        console.error('Delete post error:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleEditPost = (post: ContentItem) => {
    setEditingPost(post);
    setFormData(post);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'technology',
      organization: '',
      location: '',
      deadline: '',
      tags: [],
      link: '',
    });
  };

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(post => post.category === activeTab);

  const stats = {
    total: posts.length,
    technology: posts.filter(p => p.category === 'technology').length,
    scholarships: posts.filter(p => p.category === 'scholarships').length,
    jobs: posts.filter(p => p.category === 'jobs').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                </h1>
                <p className="text-xs text-gray-500">Helping Hands Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Post
              </button>
              {onOpenQuestions && (
              <button
                onClick={onOpenQuestions}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200"
              >
                <FileText className="w-4 h-4" />
                Manage Questions
              </button>
              )}
              {isSuperAdmin && (
              <button
                onClick={async () => {
                  const next = !adminLoginHidden;
                  try {
                    await api.settings.update('adminLoginHidden', next ? 'true' : 'false');
                    setAdminLoginHidden(next);
                  } catch (error) {
                    console.error('Update setting error:', error);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${
                  adminLoginHidden 
                    ? 'bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                }`}
                title="Toggle visibility of Admin login on user sign-in page"
              >
                <span className="font-medium text-sm">
                  {adminLoginHidden ? 'Admin Login Hidden' : 'Hide Admin Login'}
                </span>
              </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-gray-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Total Posts</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-blue-900">{stats.technology}</span>
            </div>
            <p className="text-sm text-blue-700 font-medium">Technology</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-purple-900">{stats.scholarships}</span>
            </div>
            <p className="text-sm text-purple-700 font-medium">Scholarships</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-8 h-8 text-emerald-600" />
              <span className="text-3xl font-bold text-emerald-900">{stats.jobs}</span>
            </div>
            <p className="text-sm text-emerald-700 font-medium">Jobs</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1.5 w-fit">
          {(['all', 'technology', 'scholarships', 'jobs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-md font-semibold'
                  : 'text-gray-600 hover:bg-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{post.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{post.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                        post.category === 'technology' ? 'bg-blue-100 text-blue-700' :
                        post.category === 'scholarships' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{post.organization || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{post.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">Admins</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admins.map((a) => (
                  <tr key={a.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{a.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{a.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-500 text-sm">{new Date(a.createdAt || (a as any).created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                        a.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {a.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {a.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await api.admins.toggle(a.id, !a.enabled);
                              await fetchData();
                            } catch (error) {
                              console.error('Admin update error:', error);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          {a.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Remove this admin?')) return;
                            try {
                              await api.admins.delete(a.id);
                              await fetchData();
                            } catch (error) {
                              console.error('Admin delete error:', error);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No admins yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-200 mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">FAQs (Answer User Questions)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Answer</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {faqs.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{f.question}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(f.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                        f.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {f.status === 'answered' ? 'Answered' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {f.status === 'answered' ? (
                        <p className="text-gray-700">{f.answer}</p>
                      ) : (
                        <input
                          type="text"
                          value={answerDraft[f.id] || ''}
                          onChange={(e) => setAnswerDraft({ ...answerDraft, [f.id]: e.target.value })}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Type answer..."
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {f.status === 'pending' ? (
                          <button
                            onClick={async () => {
                              const text = (answerDraft[f.id] || '').trim();
                              if (!text) return;
                              try {
                                await api.faqs.answer(f.id, text);
                                await fetchData();
                                
                                const draft = { ...answerDraft };
                                delete draft[f.id];
                                setAnswerDraft(draft);
                              } catch (error) {
                                console.error('FAQ Answer Error:', error);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            Save Answer
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">{new Date(f.answeredAt || f.createdAt).toLocaleString()}</span>
                        )}
                        {f.status === 'pending' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm('Remove this question?')) return;
                              try {
                                await api.faqs.delete(f.id);
                                await fetchData();
                              } catch (error) {
                                console.error('FAQ Delete Error:', error);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {faqs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No questions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">Question Results</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Response</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questionResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No results yet
                    </td>
                  </tr>
                ) : (
                  questionResults.map((r) => {
                    const respText = r.type === 'mcq'
                      ? (typeof r.response?.optionIndex === 'number'
                          ? (r.question_options?.[r.response.optionIndex] || `Option ${r.response.optionIndex + 1}`)
                          : '(no selection)')
                      : (r.response?.text || '');
                    
                    return (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {r.userName || r.userId || '(anonymous)'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{r.question_text}</td>
                        <td className="px-6 py-4 text-sm">
                          {r.type === 'mcq' ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                              (r.score || 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {respText}
                            </span>
                          ) : (
                            <span className="block text-gray-700">{String(respText).slice(0, 140)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.score || 0}/{r.maxScore || 0}
                          </span>
                          {r.submitted && (
                            <span className="inline-flex items-center px-3 py-1 ml-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                              Submitted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this result?')) return;
                              try {
                                await api.questionAnswers.delete(r.id);
                                await fetchData();
                              } catch (error) {
                                console.error('Result delete error:', error);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPost) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPost ? 'Edit Post' : 'Add New Post'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPost(null);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter post title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Enter post description"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="technology">Technology</option>
                  <option value="scholarships">Scholarships</option>
                  <option value="jobs">Jobs</option>
                </select>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter organization name"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="text"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Feb 28, 2024"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')}
                  onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., AI, Remote, Full-time"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={editingPost ? handleUpdatePost : handleAddPost}
                  disabled={!formData.title || !formData.description}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingPost ? 'Update Post' : 'Add Post'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPost(null);
                    resetForm();
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
