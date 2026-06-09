import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, Atom } from 'lucide-react';

export const LoginRegister: React.FC = () => {
  const { user, login, register, error, setError } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Reset errors when switching tabs
    setError(null);
    setLocalError(null);
  }, [isLogin, setError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    // Simple Validations
    if (!form.password) {
      setLocalError("Password is required");
      return;
    }

    if (isLogin) {
      if (!form.username) {
        setLocalError("Username or email is required");
        return;
      }
      setLoading(true);
      try {
        await login(form.username, form.password);
        navigate('/dashboard');
      } catch (err) {
        // Handled by auth store
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.username || !form.email) {
        setLocalError("All fields are required");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }
      if (form.password.length < 6) {
        setLocalError("Password must be at least 6 characters");
        return;
      }
      setLoading(true);
      try {
        await register(form.username, form.email, form.password);
        navigate('/dashboard');
      } catch (err) {
        // Handled by auth store
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col justify-center items-center px-4">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-2xl text-white shadow-purpleGlow mb-3">
            <Atom className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">
            ResearchHub AI
          </h2>
          <p className="text-xs text-gray-400 font-mono tracking-widest mt-1">SECURE ACCESS GATEWAY</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-violet-950/30 p-1.5 rounded-2xl mb-6 border border-violet-900/20">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              isLogin 
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              !isLogin 
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Briefing */}
        {(localError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{localError || error}</span>
          </motion.div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                {isLogin ? <Mail className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder={isLogin ? 'yourname@example.com or name' : 'academic_pioneer'}
                className="w-full pl-11 pr-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="pioneer@university.edu"
                  className="w-full pl-11 pr-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all placeholder:text-gray-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all placeholder:text-gray-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-purpleGlow"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In Session</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Initialize Account</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
export default LoginRegister;
