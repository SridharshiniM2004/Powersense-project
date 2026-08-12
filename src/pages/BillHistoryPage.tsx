import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BillHistory } from '../components/BillHistory';
import { BillRecord } from '../types';

interface BillHistoryPageProps {
  bills: BillRecord[];
  onBillDeleted: (id: string) => void;
}

export const BillHistoryPage: React.FC<BillHistoryPageProps> = ({
  bills,
  onBillDeleted,
}) => {
  const navigate = useNavigate();

  const setActiveTab = (tab: string) => {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      ocr: '/bill-ocr',
    };
    if (routes[tab]) navigate(routes[tab]);
  };

  return (
    <BillHistory
      bills={bills}
      onBillDeleted={onBillDeleted}
      setActiveTab={setActiveTab}
    />
  );
};
