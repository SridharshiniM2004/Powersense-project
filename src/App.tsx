import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  FileScan,
  TrendingUp,
  BarChart3,
  Bot,
  Lightbulb,
  History,
  User as UserIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

import { authService } from './services/authService';
import { billService } from './services/billService';
import { User, BillRecord, PredictionResult, Recommendation } from './types';

import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { ResetPasswordPage } from './components/RecoveryPages';
import { Dashboard } from './components/Dashboard';
import { BillUploadOCR } from './components/BillUploadOCR';
import { PredictionEngine } from './components/PredictionEngine';
import { InteractiveAnalytics } from './components/InteractiveAnalytics';
import { AIChatbot } from './components/AIChatbot';
import { Recommendations } from './components/Recommendations';
import { BillHistory } from './components/BillHistory';
import { UserProfile } from './components/UserProfile';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from './components/Settings';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('powersense-theme') === 'light' ? 'light' : 'dark'
  );
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initApp = async () => {
      try {
        const bList = await billService.getBills();
        setBills(bList);
      } catch (err) {
        console.warn('Failed to load bills:', err);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    localStorage.setItem('powersense-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const navigateToTab = (tab: string) => {
    const routeMap: Record<string, string> = {
      landing: '/',
      dashboard: '/dashboard',
      ocr: '/bill-ocr',
      prediction: '/ai-prediction',
      analytics: '/analytics',
      chatbot: '/ai-chatbot',
      recommendations: '/tips-savings',
      history: '/bill-history',
      profile: '/profile',
      admin: '/admin',
      settings: '/settings',
    };
    const route = routeMap[tab] || tab;
    navigate(route);
  };

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    navigate('/sign-in');
  };

  const navItems = [
    { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/bill-ocr', label: 'Bill OCR', icon: FileScan },
    { id: '/ai-prediction', label: 'AI Prediction', icon: TrendingUp },
    { id: '/analytics', label: 'Analytics', icon: BarChart3 },
    { id: '/ai-chatbot', label: 'AI Chatbot', icon: Bot },
    { id: '/tips-savings', label: 'Tips & Savings', icon: Lightbulb },
    { id: '/bill-history', label: 'Bill History', icon: History },
    { id: '/profile', label: 'Profile', icon: UserIcon },
    { id: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (user?.role === 'admin') {
    navItems.splice(8, 0, { id: '/admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 ${theme === 'light' ? 'theme-light' : ''}`}>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-white tracking-tight leading-none group-hover:text-cyan-400 transition-colors">
                Power<span className="text-cyan-400">Sense</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
                Smart Utility AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800/50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link to="/sign-in" className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                setActiveTab={navigateToTab}
                onOpenAuth={() => navigate('/sign-in')}
                isAdmin={user?.role === 'admin'}
              />
            }
          />
          <Route path="/sign-in" element={<SignInPage user={user} onSuccess={handleLoginSuccess} />} />
          <Route path="/sign-up" element={<SignUpPage user={user} onSuccess={handleLoginSuccess} />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} bills={bills} prediction={prediction} recommendations={recommendations} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bill-ocr"
            element={
              <ProtectedRoute user={user}>
                <BillUploadOCR onBillAdded={(newBill) => setBills((prev) => [newBill, ...prev])} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-prediction"
            element={
              <ProtectedRoute user={user}>
                <PredictionEngine bills={bills} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute user={user}>
                <InteractiveAnalytics bills={bills} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chatbot"
            element={
              <ProtectedRoute user={user}>
                <AIChatbot user={user} bills={bills} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tips-savings"
            element={
              <ProtectedRoute user={user}>
                <Recommendations recommendations={recommendations} onRecommendationUpdate={(updated) => setRecommendations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bill-history"
            element={
              <ProtectedRoute user={user}>
                <BillHistory bills={bills} onBillDeleted={(id) => setBills((prev) => prev.filter((b) => b.id !== id))} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <UserProfile user={user} onUserUpdated={(updatedUser) => setUser(updatedUser)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute user={user}>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer setActiveTab={navigateToTab} />
    </div>
  );
}

export default App;
