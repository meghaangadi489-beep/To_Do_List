import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckSquare,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'recovery';

export const EPHEMERAL_SESSION_KEY = 'taskflow_ephemeral_session';
export const EPHEMERAL_ALIVE_KEY = 'taskflow_ephemeral_alive';
const REMEMBERED_EMAIL_KEY = 'taskflow_remembered_email';

interface AuthScreenProps {
  mode: AuthMode;
  onModeChange: (nextMode: AuthMode) => void;
  onAuthSuccess?: () => void;
  onRecoveryComplete?: () => void;
}

export function AuthScreen({
  mode,
  onModeChange,
  onAuthSuccess,
  onRecoveryComplete,
}: AuthScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem(EPHEMERAL_SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    setError('');
    setInfoMessage('');
  }, [mode]);

  const switchMode = (nextMode: AuthMode) => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setInfoMessage('');
    onModeChange(nextMode);
  };

  const applyRememberPreference = (userEmail: string) => {
    try {
      if (rememberMe) {
        localStorage.removeItem(EPHEMERAL_SESSION_KEY);
        localStorage.setItem(REMEMBERED_EMAIL_KEY, userEmail);
      } else {
        localStorage.setItem(EPHEMERAL_SESSION_KEY, '1');
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        sessionStorage.setItem(EPHEMERAL_ALIVE_KEY, '1');
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (mode === 'forgot') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }

      setLoading(true);
      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo,
        });
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setInfoMessage(
          `Password reset instructions have been sent to ${trimmedEmail}. Check your inbox to continue.`
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to send reset email. Please try again.'
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'recovery') {
      if (password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) {
          setError(updateError.message);
          return;
        }
        setPassword('');
        setConfirmPassword('');
        onRecoveryComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update password.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        applyRememberPreference(trimmedEmail);
        onAuthSuccess?.();
      } else {
        const trimmedName = fullName.trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: trimmedName,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          applyRememberPreference(trimmedEmail);
          onAuthSuccess?.();
        } else {
          setPassword('');
          setConfirmPassword('');
          onModeChange('login');
          setInfoMessage(
            `Account created for ${trimmedEmail}. Please check your email inbox to confirm your address before signing in.`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070B16] text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Premium Dark Navy Ambient Purple & Blue Gradient Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-[130px]" />
        <div className="absolute top-1/4 right-[-120px] h-[480px] w-[480px] rounded-full bg-violet-600/16 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-600/14 blur-[130px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl p-6 sm:p-8"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient shadow-lg shadow-indigo-500/25">
            <CheckSquare className="h-5 w-5 text-white" />
          </span>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white block">
              TaskFlow
            </span>
            <span className="text-xs text-slate-400">
              Personal productivity workspace
            </span>
          </div>
        </div>

        {/* Mode Tabs for Sign In / Sign Up */}
        {(mode === 'login' || mode === 'signup') && (
          <div
            className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/70 p-1 border border-white/[0.08] mb-6"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`rounded-lg py-2 text-xs font-semibold transition-all duration-150 ${
                mode === 'login'
                  ? 'bg-indigo-500/25 text-white border border-indigo-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => switchMode('signup')}
              className={`rounded-lg py-2 text-xs font-semibold transition-all duration-150 ${
                mode === 'signup'
                  ? 'bg-indigo-500/25 text-white border border-indigo-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-5">
              <h1 className="font-display text-xl font-bold text-white">
                {mode === 'login'
                  ? 'Welcome back'
                  : mode === 'signup'
                  ? 'Create your account'
                  : mode === 'forgot'
                  ? 'Reset your password'
                  : 'Set a new password'}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'login'
                  ? 'Sign in to access your TaskFlow dashboard and sync tasks.'
                  : mode === 'signup'
                  ? 'Get started with your personal TaskFlow workspace.'
                  : mode === 'forgot'
                  ? 'Enter your email address and we will send a password reset link.'
                  : 'Choose a new password for your TaskFlow account.'}
              </p>
            </div>

            {infoMessage && (
              <div
                role="status"
                className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-3 text-xs text-emerald-200 leading-relaxed"
              >
                {infoMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-200 leading-relaxed"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Alex Morgan"
                      className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                </div>
              )}

              {mode !== 'recovery' && (
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                </div>
              )}

              {mode !== 'forgot' && (
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {mode === 'recovery' ? 'New password' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        mode === 'login' ? 'current-password' : 'new-password'
                      }
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder={
                        mode === 'login'
                          ? 'Enter your password'
                          : 'At least 6 characters'
                      }
                      className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(mode === 'signup' || mode === 'recovery') && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950/70 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 accent-indigo-500"
                    />
                    <span className="text-xs text-slate-300">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl brand-gradient brand-gradient-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {mode === 'login'
                        ? 'Signing in...'
                        : mode === 'signup'
                        ? 'Creating account...'
                        : mode === 'forgot'
                        ? 'Sending reset link...'
                        : 'Updating password...'}
                    </span>
                  </>
                ) : (
                  <>
                    {mode === 'forgot' && <KeyRound className="h-4 w-4" />}
                    <span>
                      {mode === 'login'
                        ? 'Sign In'
                        : mode === 'signup'
                        ? 'Create Account'
                        : mode === 'forgot'
                        ? 'Send Reset Link'
                        : 'Update Password'}
                    </span>
                    {mode !== 'forgot' && <ArrowRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </form>

            {/* Footer Switch Links */}
            <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400">
              {mode === 'login' && (
                <p>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
