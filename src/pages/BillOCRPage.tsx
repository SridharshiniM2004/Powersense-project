import React from 'react';
import { BillUploadOCR } from '../components/BillUploadOCR';

interface BillOCRPageProps {
  onAnalysisComplete?: (result: any) => Promise<void>;
}

export const BillOCRPage: React.FC<BillOCRPageProps> = ({ onAnalysisComplete }) => (
  <BillUploadOCR onAnalysisComplete={onAnalysisComplete || (async () => {})} />
);
