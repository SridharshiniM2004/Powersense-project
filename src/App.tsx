import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { Navbar } from './components/Navbar';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('powersense-theme') === 'light' ? 'light' : 'dark'
  );
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [authReady, setAuthReady] = useState(false);
  const activeTab = ({ '/dashboard': 'dashboard', '/bill-ocr': 'ocr', '/ai-prediction': 'prediction', '/analytics': 'analytics', '/ai-chatbot': 'chatbot', '/tips-savings': 'recommendations', '/bill-history': 'history', '/profile': 'profile', '/admin': 'admin', '/settings': 'settings' } as Record<string, string>)[location.pathname] || 'landing';

  useEffect(() => {
    const initApp = async () => {
      try {
        const restoredUser = await authService.getCurrentUser();
        if (!restoredUser) return;
        setUser(restoredUser);
        const bList = await billService.getBills();
        setBills(bList);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setAuthReady(true);
      }
    };

    initApp();
  }, [navigate]);

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

  if (!authReady) {
    return <div className="min-h-screen bg-slate-950 text-slate-300 grid place-items-center text-sm">Restoring your session...</div>;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 ${theme === 'light' ? 'theme-light' : ''}`}>
      <Navbar activeTab={activeTab} setActiveTab={navigateToTab} user={user} onOpenAuth={() => navigate('/sign-in')} onLogout={handleLogout} />

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
                <Dashboard user={user} bills={bills} prediction={prediction} recommendations={recommendations} setActiveTab={navigateToTab} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bill-ocr"
            element={
              <ProtectedRoute user={user}>
                <BillUploadOCR onBillAdded={(newBill) => setBills((prev) => [newBill, ...prev])} setActiveTab={navigateToTab} />
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

