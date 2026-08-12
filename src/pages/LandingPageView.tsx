import React from 'react';
import { LandingPage } from '../components/LandingPage';
import { useNavigate } from 'react-router-dom';

export const LandingPageView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LandingPage
      setActiveTab={(tab) => {
        if (tab === 'dashboard') navigate('/dashboard');
        if (tab === 'ocr') navigate('/bill-ocr');
        if (tab === 'prediction') navigate('/ai-prediction');
        if (tab === 'chatbot') navigate('/ai-chatbot');
      }}
      onOpenAuth={() => navigate('/sign-in')}
    />
  );
};
