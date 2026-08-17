import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', onSuccess }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | 'commercial'>('user');
  const [utilityProvider, setUtilityProvider] = useState('TNEB (Tamil Nadu Electricity Board)');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRegister(initialMode === 'register');
      setIsForgotPassword(false);
      setResetSent(false);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          const { data, error: sbError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                role,
                utilityProvider,
                consumerNumber,
              },
            },
          });
          if (sbError) throw new Error(sbError.message);
          const newUser: User = {
            id: data.user?.id || 'usr_sb_' + Date.now(),
            name: name || email.split('@')[0],
            email,
            role,
            utilityProvider,
            consumerNumber,
            sanctionedLoadKw: 6.5,
            homeAreaSqFt: 1850,
            occupants: 4,
            createdAt: new Date().toISOString(),
          };
          onSuccess(newUser);
        } else {
          const { data, error: sbError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (sbError) throw new Error(sbError.message);
          const sbUser = data.user;
          const loggedUser: User = {
            id: sbUser.id,
            name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Rajesh Sharma',
            email: sbUser.email || email,
            role: sbUser.user_metadata?.role || 'user',
            utilityProvider: sbUser.user_metadata?.utilityProvider || 'TNEB (Tamil Nadu Electricity Board)',
            consumerNumber: sbUser.user_metadata?.consumerNumber || '08849-30219',
            sanctionedLoadKw: 6.5,
            homeAreaSqFt: 1850,
            occupants: 4,
            createdAt: new Date().toISOString(),
          };
          onSuccess(loggedUser);
        }
      } else {
        // Fallback to local server API
        if (isRegister) {
          const res = await api.register({
            name,
            email,
            password,
            role,
            utilityProvider,
            consumerNumber,
          });
          onSuccess(res.user);
        } else {
          const res = await api.login(email, password);
          onSuccess(res.user);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: sbError } = await supabase.auth.resetPasswordForEmail(email);
        if (sbError) throw new Error(sbError.message);
        setResetMessage(`Password reset link dispatched to ${email}. Please check your inbox.`);
      } else {
        const res = await api.forgotPassword(email);
        setResetMessage(res.message);
      }
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  // Removed auto-populate functions to keep fields empty on page load
  // Users must enter their own credentials

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            {isForgotPassword
              ? 'Reset Your Password'
              : isRegister
              ? 'Create PowerSense Account'
              : 'Welcome Back to PowerSense'}
          </h3>
          <p className="text-xs text-slate-400">
            {isForgotPassword
              ? 'Enter your registered email to receive a password reset token'
              : isRegister
              ? 'Join the AI-powered energy optimization platform'
              : 'Sign in with your password credentials or select a role below'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300">
            {error}
          </div>
        )}

        {/* FORGOT PASSWORD MODE */}
        {isForgotPassword ? (
          <div className="space-y-4">
            {resetSent ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 text-center text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-emerald-300 font-semibold">{resetMessage}</p>
                <p className="text-slate-400 text-[11px]">
                  Check your spam/junk folder if you don't see the email within a few moments.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rajesh.sharma@powersense.ai"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
                >
                  {loading ? <span>Sending...</span> : <span>Send Reset Instructions</span>}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD SIGN IN / REGISTER MODE */
          <div className="space-y-4">
            {/* Credentials section - fields start empty */}
            {!isRegister && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-xs text-slate-400 font-medium">
                  Enter your email and password to sign in.
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative px-3 bg-slate-900 text-[11px] text-slate-400 font-medium">
                {isRegister ? 'Account Information' : 'Password Credentials'}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {isRegister && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.sharma@powersense.ai"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">Password</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {isRegister && (
                <>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Account Role</label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="user">Residential Homeowner</option>
                      <option value="commercial">Commercial / Small Business</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Utility Electric Provider</label>
                    <input
                      type="text"
                      value={utilityProvider}
                      onChange={(e) => setUtilityProvider(e.target.value)}
                      placeholder="TNEB (Tamil Nadu Electricity Board)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Consumer / Meter Number (optional)</label>
                    <input
                      type="text"
                      value={consumerNumber}
                      onChange={(e) => setConsumerNumber(e.target.value)}
                      placeholder="Add it later if needed"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Toggle */}
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              {isRegister ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-cyan-400 font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-cyan-400 font-medium hover:underline"
                  >
                    Register Now
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
