import { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '@/app/utils/api';

interface SignInProps {
  onSignIn: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToAdmin: () => void;
  onTriggerSuperAdmin: () => void;
}

export function SignIn({ onSignIn, onSwitchToSignUp, onSwitchToAdmin, onTriggerSuperAdmin }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [showAdminAccess, setShowAdminAccess] = useState(true);

  const fetchSettings = async () => {
    try {
      const settings = await api.settings.list();
      if (settings) {
        setShowAdminAccess(settings.adminLoginHidden !== 'true');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '', general: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const enc = new TextEncoder();
        const data = enc.encode(password);
        const digest = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(digest));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const response = await api.users.login({ email, passwordHash });
        if (response && response.user) {
           localStorage.setItem('currentUserId', response.user.id);
           localStorage.setItem('currentUserName', response.user.name);
           localStorage.setItem(`userName_${response.user.id}`, response.user.name);
           onSignIn();
        }
      } catch (error: any) {
        console.error('Sign in error:', error);
        if (error.message === 'invalid_credentials') {
          setErrors(prev => ({ ...prev, general: 'Invalid email or password' }));
        } else {
          setErrors(prev => ({ ...prev, general: 'Login failed. Please try again.' }));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const response = await api.users.googleLogin(credentialResponse.credential);
        if (response && response.user) {
           localStorage.setItem('currentUserId', response.user.id);
           localStorage.setItem('currentUserName', response.user.name);
           localStorage.setItem(`userName_${response.user.id}`, response.user.name);
           onSignIn();
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setErrors(prev => ({ ...prev, general: error.message || 'Google sign-in failed' }));
    }
  };

  useEffect(() => {
    fetchSettings();
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        onTriggerSuperAdmin();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [onTriggerSuperAdmin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-emerald-500/10 p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.29-3.83-.82l-.27-.14-2.83.48.48-2.83-.14-.27C4.79 14.68 4.5 13.38 4.5 12 4.5 7.86 7.86 4.5 12 4.5S19.5 7.86 19.5 12 16.14 19.5 12 19.5z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Helping Hands
            </h1>
            <p className="text-gray-600">Welcome back! Sign in to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
                {errors.general}
              </div>
            )}
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
               <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    setErrors(prev => ({ ...prev, general: 'Google Login Failed' }));
                  }}
                  useOneTap
                />
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignUp}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Sign Up
              </button>
            </p>
            
            {showAdminAccess && (
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={onSwitchToAdmin}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Admin Access
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
