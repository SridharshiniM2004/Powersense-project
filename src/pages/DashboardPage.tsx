import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { BillRecord, PredictionResult, Recommendation, User } from '../types';

interface DashboardPageProps {
  user: User | null;
  bills: BillRecord[];
  prediction: PredictionResult | null;
  recommendations: Recommendation[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  bills,
  prediction,
  recommendations,
}) => {
  const navigate = useNavigate();

  const setActiveTab = (tab: string) => {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      ocr: '/bill-ocr',
      prediction: '/ai-prediction',
      analytics: '/analytics',
      chatbot: '/ai-chatbot',
      recommendations: '/tips-savings',
      history: '/bill-history',
      profile: '/profile',
      settings: '/settings',
      admin: '/admin',
    };
    if (routes[tab]) navigate(routes[tab]);
  };

  return (
    <Dashboard
      user={user}
      bills={bills}
      prediction={prediction}
      recommendations={recommendations}
      setActiveTab={setActiveTab}
    />
  );
};
