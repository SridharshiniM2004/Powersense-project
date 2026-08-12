import { MLPredictionInput, PredictionResult } from '../types';
import { api } from './api';

export const predictionService = {
  predictUsage: (input: MLPredictionInput): Promise<PredictionResult> => api.predictUsage(input),
};
