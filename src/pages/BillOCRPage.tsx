import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BillUploadOCR } from '../components/BillUploadOCR';
import { BillRecord } from '../types';

interface BillOCRPageProps {
  onBillAdded: (bill: BillRecord) => void;
}

export const BillOCRPage: React.FC<BillOCRPageProps> = ({ onBillAdded }) => {
  const navigate = useNavigate();

  const setActiveTab = (tab: string) => {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      ocr: '/bill-ocr',
      prediction: '/ai-prediction',
    };
    if (routes[tab]) navigate(routes[tab]);
  };

  return (
    <BillUploadOCR onBillAdded={onBillAdded} setActiveTab={setActiveTab} />
  );
};
