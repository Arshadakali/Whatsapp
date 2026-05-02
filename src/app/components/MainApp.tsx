import { useState, useEffect } from 'react';
import { Cpu, GraduationCap, Briefcase, Search, Bell, Menu, X, User, Sparkles, LogOut, Loader2, Trash2 } from 'lucide-react';
import { ContentCard, ContentItem } from './ContentCard';
import { HelpCircle, MessageSquare, ListChecks } from 'lucide-react';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/app/components/ui/navigation-menu';
import { api } from '@/app/utils/api';

interface MainAppProps {
  onLogout: () => void;
  onSwitchToFaq?: () => void;
  onSwitchToComments?: () => void;
  onSwitchToQuestions?: () => void;
}

type Category = 'all' | 'technology' | 'scholarships' | 'jobs';

export function MainApp({ onLogout, onSwitchToFaq, onSwitchToComments, onSwitchToQuestions }: MainAppProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await api.posts.list();
        if (data) {
          setItems(data.map((p: any) => ({
            ...p,
            tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? JSON.parse(p.tags) : [])
          })));
        }
      } catch (error) {
        console.error('Fetch posts error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = [
    { id: 'all' as Category, name: 'All', icon: Sparkles },
    { id: 'technology' as Category, name: 'Technology', icon: Cpu },
    { id: 'scholarships' as Category, name: 'Scholarships', icon: GraduationCap },
    { id: 'jobs' as Category, name: 'Jobs', icon: Briefcase },
  ];
  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
          await api.users.delete(userId);
          localStorage.removeItem('currentUserId');
          localStorage.removeItem('currentUserName');
          onLogout();
        }
      } catch (error) {
        console.error('Delete account error:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const sections = [
    { id: 'faqs', name: 'FAQs', icon: HelpCircle, onClick: onSwitchToFaq },
    { id: 'comments', name: 'Comments', icon: MessageSquare, onClick: onSwitchToComments },
    { id: 'questions', name: 'Questions', icon: ListChecks, onClick: onSwitchToQuestions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Modern Header with Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.29-3.83-.82l-.27-.14-2.83.48.48-2.83-.14-.27C4.79 14.68 4.5 13.38 4.5 12 4.5 7.86 7.86 4.5 12 4.5S19.5 7.86 19.5 12 16.14 19.5 12 19.5z"/>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Helping Hands
                </h1>
                <p className="text-xs text-gray-500">Community Hub</p>
              </div>
            </div>

            {/* Desktop Navigation - Modern Pills */}
            <nav className="hidden md:flex items-center gap-2 bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{category.name}</span>
                  </button>
                );
              })}
              <div className="ml-1">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={navigationMenuTriggerStyle({ className: 'px-5 py-2.5 rounded-xl text-gray-700' })}>
                        Sections
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="p-4">
                        <div className="grid grid-cols-1 gap-4 w-[420px]">
                          <div className="space-y-2">
                            <button
                              onClick={() => onSwitchToFaq && onSwitchToFaq()}
                              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-100"
                            >
                              <HelpCircle className="w-5 h-5 text-gray-700 mt-0.5" />
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">FAQs</div>
                                <div className="text-sm text-gray-600">Latest answers to user questions</div>
                              </div>
                            </button>
                            <button
                              onClick={() => onSwitchToComments && onSwitchToComments()}
                              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-100"
                            >
                              <MessageSquare className="w-5 h-5 text-gray-700 mt-0.5" />
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">Comments</div>
                                <div className="text-sm text-gray-600">Discuss posts with the community</div>
                              </div>
                            </button>
                            <button
                              onClick={() => onSwitchToQuestions && onSwitchToQuestions()}
                              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-100"
                            >
                              <ListChecks className="w-5 h-5 text-gray-700 mt-0.5" />
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">Questions</div>
                                <div className="text-sm text-gray-600">Answer real-life practice questions</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <button className="relative p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="hidden sm:flex items-center gap-3 ml-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-100/80 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">Member</p>
                    <p className="text-xs text-gray-500">Active now</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium text-sm">Delete</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-gray-200/50">
              <nav className="flex flex-col gap-2 mb-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{category.name}</span>
                    </button>
                  );
                })}
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        section.onClick && section.onClick();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 bg-gray-100 transition-all"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </nav>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 rounded-xl font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for updates, scholarships, jobs..."
              className="block w-full pl-14 pr-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-shadow"
            />
          </div>
        </div>

        {/* Content Area - Will be populated with cards */}
        <div id="content-area">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-gray-500 font-medium">Loading updates...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items
                  .filter((item) => {
                    // Filter by category
                    if (activeCategory !== 'all' && item.category !== activeCategory) {
                      return false;
                    }
                    // Filter by search query
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      return (
                        item.title.toLowerCase().includes(query) ||
                        item.description.toLowerCase().includes(query) ||
                        item.organization?.toLowerCase().includes(query) ||
                        item.tags?.some(tag => tag.toLowerCase().includes(query))
                      );
                    }
                    return true;
                  })
                  .map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
              </div>
              
              {/* Empty State */}
              {items.filter((item) => {
                if (activeCategory !== 'all' && item.category !== activeCategory) {
                  return false;
                }
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  return (
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.organization?.toLowerCase().includes(query) ||
                    item.tags?.some(tag => tag.toLowerCase().includes(query))
                  );
                }
                return true;
              }).length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
