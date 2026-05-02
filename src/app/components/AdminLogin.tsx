import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '@/app/utils/api';

interface AdminLoginProps {
  onAdminLogin: () => void;
  onSwitchToUserLogin: () => void;
  onSwitchToAdminSignUp: () => void;
  onSwitchToAdminAdd: () => void;
}

export function AdminLogin({ onAdminLogin, onSwitchToUserLogin, onSwitchToAdminSignUp, onSwitchToAdminAdd }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [isAdminRegistered, setIsAdminRegistered] = useState(true);

  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const admins = await api.admins.list();
        setIsAdminRegistered(admins && admins.length > 0);
      } catch (error) {
        console.error('Check admins error:', error);
      }
    };
    checkAdmins();
  }, []);

  const validateForm = () => {
    const newErrors = { email: '', password: '', form: '' };
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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const enc = new TextEncoder();
      const data = enc.encode(password);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(digest));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await api.admins.login({ email, passwordHash });
      
      if (response && response.admin) {
        // Store current admin info if needed
        localStorage.setItem('currentAdmin', JSON.stringify(response.admin));
        onAdminLogin();
      } else {
        setErrors(prev => ({ ...prev, form: 'Invalid admin credentials' }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors(prev => ({ ...prev, form: 'Login failed. Please try again.' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-slate-500/10 p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-700 to-gray-800 rounded-2xl mb-4 shadow-lg shadow-slate-500/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-600">Secure access for administrators</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
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
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent`}
                  placeholder="admin@helpinghands.com"
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
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* General Error */}
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                {errors.form}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-slate-700 to-gray-800 text-white font-bold py-3 px-4 rounded-xl hover:from-slate-800 hover:to-gray-900 transform transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-slate-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Access Dashboard
            </button>

            {/* Add Admin */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={onSwitchToAdminAdd}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Add Admin
              </button>
            </div>

            {/* Create Admin Account Link (Only if no admin registered) */}
            {!isAdminRegistered && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={onSwitchToAdminSignUp}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Setup Primary Admin
                </button>
              </div>
            )}

            {/* Switch to User Login */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Not an admin?{' '}
                <button
                  type="button"
                  onClick={onSwitchToUserLogin}
                  className="font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Return to User Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
