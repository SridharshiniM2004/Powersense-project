import React from 'react';
import { InteractiveAnalytics } from '../components/InteractiveAnalytics';
import { BillRecord } from '../types';

interface AnalyticsPageProps {
  bills: BillRecord[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ bills }) => {
  return <InteractiveAnalytics bills={bills} />;
};
