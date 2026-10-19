import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const AuthGateway: React.FC = () => {
  const { loginWithGoogle, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      setError('You must accept the Terms of Service and acknowledge code audit responsibility to proceed.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Google Sign-In failed');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must accept the Terms of Service and acknowledge code audit responsibility to proceed.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 transition-colors duration-200">
      {/* Top Bar with Brand and Theme Toggle */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">AgentForge</span>
            <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">v1.4 Multi-Agent Playground</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AgentForge Gateway
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your Google account to access architecture state & AI multi-agent orchestration.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mandatory Legal & Safety Agreement Checkbox */}
          <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <label className="flex items-start gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) setError(null);
                }}
                className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer accent-indigo-600 shrink-0"
              />
              <span className="text-[11px] leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                I agree to the <span className="text-indigo-400 font-medium">Terms of Service</span> and understand I am responsible for auditing generated code.
              </span>
            </label>
          </div>

          {/* Primary Action: Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || !agreedToTerms}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] mb-4 cursor-pointer ${
              agreedToTerms
                ? 'bg-white hover:bg-slate-100 text-slate-900'
                : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[10px] uppercase tracking-wider font-mono">
              Or email credentials
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Fallback Email/Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3 mt-2">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Architect Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@agentforge.dev"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !email || !password || !agreedToTerms}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Sign In with Password
            </button>
          </form>
        </div>
      </main>

      {/* Subtle Legal & Safety Guardrails Footer */}
      <footer className="text-center py-4 px-4 text-xs text-slate-500 border-t border-slate-900 bg-slate-950 flex flex-col items-center gap-1.5">
        <p className="max-w-2xl text-[11px] text-slate-400 text-center leading-relaxed">
          AgentForge uses AI to generate code. Output is provided as-is without warranty. Do not input sensitive credentials or proprietary data.
        </p>
        <span className="text-[10px] text-slate-600 font-mono">
          AgentForge Orchestration • Powered by Google Gemini & Firebase
        </span>
      </footer>
    </div>
  );
};
