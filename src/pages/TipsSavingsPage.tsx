import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Recommendations } from '../components/Recommendations';
import { Recommendation } from '../types';

interface TipsSavingsPageProps {
  recommendations: Recommendation[];
  onRecommendationUpdate: (updated: Recommendation) => void;
}

export const TipsSavingsPage: React.FC<TipsSavingsPageProps> = ({
  recommendations,
  onRecommendationUpdate,
}) => {
  return (
    <Recommendations
      recommendations={recommendations}
      onRecommendationUpdate={onRecommendationUpdate}
    />
  );
};
