import React from 'react';
import { PredictionEngine } from '../components/PredictionEngine';
import { BillRecord } from '../types';

interface PredictionPageProps {
  bills: BillRecord[];
}

export const PredictionPage: React.FC<PredictionPageProps> = ({ bills }) => {
  return <PredictionEngine bills={bills} />;
};
