import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  Sun,
  Moon,
  MessageCircle,
} from 'lucide-react';

import { api } from './services/api';
import { supabase } from './lib/supabase';
import { User, BillRecord, PredictionResult, Recommendation } from './types';

// Components
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
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
import { Footer } from './components/Footer';
import { ResetPasswordPage } from './components/RecoveryPages';

export function App() {
  if (window.location.pathname === '/reset-password') return <ResetPasswordPage />;
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('powersense-theme') === 'light' ? 'light' : 'dark');

  // Application Master State
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Initialize Data
  useEffect(() => {
    const initApp = async () => {
      try {
        const u = await api.getCurrentUser();
        setUser(u);
        if (u) {
          setActiveTab('dashboard');
        }

        const [bList, recs] = await Promise.all([api.getBills(), api.getRecommendations()]);

        setBills(bList);
        setRecommendations(recs);
      } catch (err) {
        console.warn('Initial session loading fallback:', err);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    localStorage.setItem('powersense-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    supabase?.auth.signOut();
    setUser(null);
    setActiveTab('landing');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { id: 'ocr', label: 'Bill OCR', icon: FileScan, requiresAuth: true },
    { id: 'prediction', label: 'AI Prediction', icon: TrendingUp, requiresAuth: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true },
    { id: 'chatbot', label: 'AI Chatbot', icon: Bot, requiresAuth: true },
    { id: 'recommendations', label: 'Tips & Savings', icon: Lightbulb, requiresAuth: true },
    { id: 'history', label: 'Bill History', icon: History, requiresAuth: true },
    { id: 'profile', label: 'Profile', icon: UserIcon, requiresAuth: true },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, requiresAuth: true, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, requiresAuth: true },
  ];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
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
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
              {navItems
                .filter((item) => !item.adminOnly || user?.role === 'admin')
                .map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                        active
                          ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          )}

          {/* User Auth Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center space-x-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{user.name.split(' ')[0]}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800/50 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl bg-slate-900 border border-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && user && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 text-left ${
                    activeTab === item.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 text-rose-400 hover:bg-rose-500/10 text-left pt-2 border-t border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main View Router Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (user) {
                setActiveTab('dashboard');
              } else {
                setAuthMode('register');
                setAuthModalOpen(true);
              }
            }}
            onLoginClick={() => {
              setAuthMode('login');
              setAuthModalOpen(true);
            }}
          />
        )}

        {user && activeTab === 'dashboard' && (
          <Dashboard
            user={user}
            bills={bills}
            prediction={prediction}
            recommendations={recommendations}
            setActiveTab={setActiveTab}
          />
        )}

        {user && activeTab === 'ocr' && (
          <BillUploadOCR
            onBillAdded={(newBill) => {
              setBills((prev) => [newBill, ...prev]);
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {user && activeTab === 'prediction' && <PredictionEngine bills={bills} />}

        {user && activeTab === 'analytics' && <InteractiveAnalytics bills={bills} />}

        {user && activeTab === 'chatbot' && <AIChatbot user={user} bills={bills} />}

        {user && activeTab === 'recommendations' && (
          <Recommendations
            recommendations={recommendations}
            onRecommendationUpdate={(updated) => {
              setRecommendations((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r))
              );
            }}
          />
        )}

        {user && activeTab === 'history' && (
          <BillHistory
            bills={bills}
            onBillDeleted={(id) => {
              setBills((prev) => prev.filter((b) => b.id !== id));
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {user && activeTab === 'profile' && (
          <UserProfile
            user={user}
            onUserUpdated={(u) => setUser(u)}
          />
        )}

        {user && activeTab === 'admin' && <AdminPanel />}

        {user && activeTab === 'settings' && <Settings />}
      </main>

      {/* Footer */}
      <Footer />

      {user && activeTab !== 'chatbot' && (
        <button
          onClick={() => setActiveTab('chatbot')}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-2xl shadow-cyan-500/30 transition-transform hover:scale-105"
          aria-label="Open PowerSense AI assistant"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Ask PowerSense</span>
        </button>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
