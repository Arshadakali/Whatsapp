import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SignIn } from '@/app/components/SignIn';
import { SignUp } from '@/app/components/SignUp';
import { MainApp } from '@/app/components/MainApp';
import { AdminLogin } from '@/app/components/AdminLogin';
import { SuperAdminLogin } from '@/app/components/SuperAdminLogin';
import { AdminSignUp } from '@/app/components/AdminSignUp';
import { AdminPanel } from '@/app/components/AdminPanel';
import { AdminAdd } from '@/app/components/AdminAdd';
import { FaqPage } from '@/app/components/FaqPage';
import { CommentsPage } from '@/app/components/CommentsPage';
import { QuestionsPage } from '@/app/components/QuestionsPage';
import { QuestionsUserPage } from '@/app/components/QuestionsUserPage';
import { ThemeProvider } from '@/app/components/theme-provider';
import { Toaster } from '@/app/components/ui/sonner';

type AuthView = 'signin' | 'signup' | 'main' | 'adminLogin' | 'admin' | 'adminSignUp' | 'superAdminLogin' | 'adminAdd' | 'faq' | 'comments' | 'questions' | 'questionsUser';

// REPLACE THIS WITH YOUR ACTUAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "97559999189-31ra3av7ul5qknevipnvo4edmitm3jh2.apps.googleusercontent.com";

export default function App() {
  const [currentView, setCurrentView] = useState<AuthView>('signin');
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

  const handleSignIn = () => {
    setCurrentView('main');
  };

  const handleSignUp = () => {
    setCurrentView('signin');
  };

  const handleAdminLogin = () => {
    setIsSuperAdminMode(false);
    setCurrentView('admin');
  };

  const handleAdminSignUp = () => {
    setCurrentView('adminLogin');
  };

  const handleLogout = () => {
    setCurrentView('signin');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className="size-full">
          {currentView === 'signin' && (
            <SignIn 
              onSignIn={handleSignIn}
              onSwitchToSignUp={() => setCurrentView('signup')}
              onSwitchToAdmin={() => setCurrentView('adminLogin')}
              onTriggerSuperAdmin={() => setCurrentView('superAdminLogin')}
            />
          )}
          {currentView === 'signup' && (
            <SignUp 
              onSignUp={handleSignUp}
              onSwitchToSignIn={() => setCurrentView('signin')}
            />
          )}
          {currentView === 'main' && (
          <MainApp 
            onLogout={handleLogout}
            onSwitchToFaq={() => setCurrentView('faq')}
            onSwitchToComments={() => setCurrentView('comments')}
            onSwitchToQuestions={() => setCurrentView('questionsUser')}
          />
        )}
        {currentView === 'adminLogin' && (
          <AdminLogin 
            onAdminLogin={handleAdminLogin}
            onSwitchToUserLogin={() => setCurrentView('signin')}
            onSwitchToAdminSignUp={() => setCurrentView('adminSignUp')}
            onSwitchToAdminAdd={() => setCurrentView('adminAdd')}
          />
        )}
        {currentView === 'adminSignUp' && (
          <AdminSignUp 
            onAdminSignUp={handleAdminSignUp}
            onSwitchToAdminLogin={() => setCurrentView('adminLogin')}
          />
        )}
        {currentView === 'superAdminLogin' && (
          <SuperAdminLogin
            onSuperAdminLogin={() => {
              setIsSuperAdminMode(true);
              setCurrentView('admin');
            }}
            onSwitchToUserLogin={() => setCurrentView('signin')}
          />
        )}
        {currentView === 'adminAdd' && (
          <AdminAdd
            onAdminCreated={() => setCurrentView('adminLogin')}
            onBackToAdminLogin={() => setCurrentView('adminLogin')}
          />
        )}
        {currentView === 'admin' && (
          <AdminPanel 
            onLogout={handleLogout}
            isSuperAdmin={isSuperAdminMode}
            onOpenQuestions={() => setCurrentView('questions')}
          />
        )}
        {currentView === 'faq' && (
          <FaqPage onBack={() => setCurrentView('main')} />
        )}
        {currentView === 'comments' && (
          <CommentsPage onBack={() => setCurrentView('main')} />
        )}
        {currentView === 'questions' && (
          <QuestionsPage onBack={() => setCurrentView('admin')} />
        )}
        {currentView === 'questionsUser' && (
          <QuestionsUserPage onBack={() => setCurrentView('main')} />
        )}
        <Toaster />
      </div>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
