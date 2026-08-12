import React from 'react';
import { AIChatbot } from '../components/AIChatbot';
import { BillRecord, User } from '../types';

interface ChatbotPageProps {
  user: User | null;
  bills: BillRecord[];
}

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ user, bills }) => {
  return <AIChatbot user={user} bills={bills} />;
};
