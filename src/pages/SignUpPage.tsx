import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';
import { UserPlus, Mail, Key, Building, Shield, Home } from 'lucide-react';

interface SignUpPageProps {
  user: User | null;
  onSuccess: (user: User) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ user, onSuccess }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'commercial' | 'admin'>('user');
  const [utilityProvider, setUtilityProvider] = useState('TNEB (Tamil Nadu Electricity Board)');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const authResponse = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        utilityProvider,
        consumerNumber: consumerNumber.trim(),
      });
      if (authResponse.user) {
        onSuccess(authResponse.user);
        setSuccessMessage('Welcome to PowerSense! Redirecting to your dashboard…');
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create your PowerSense account</h1>
          <p className="text-sm text-slate-400 mt-2">
            Start scanning bills, forecasting energy use, and chatting with the PowerSense AI assistant.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Full name</label>
              <div className="relative">
                <Home className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rajesh Sharma"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-10 py-3 text-slate-100 outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-10 py-3 text-slate-100 outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Password</label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  autoComplete="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-10 py-3 text-slate-100 outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Confirm password</label>
              <input
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Account type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'commercial' | 'admin')}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="user">Residential Homeowner</option>
                <option value="commercial">Commercial / Business</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Utility provider</label>
              <div className="relative">
                <Building className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={utilityProvider}
                  onChange={(e) => setUtilityProvider(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-10 py-3 text-slate-100 outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Consumer / meter number (optional)</label>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              placeholder="Add it later if needed"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create My Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-semibold text-cyan-400 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
