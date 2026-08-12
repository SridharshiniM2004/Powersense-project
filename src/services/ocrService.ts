import { OCRResult, BillRecord } from '../types';
import { api } from './api';

export const ocrService = {
  processBill: (file: File | { imageBase64?: string; mimeType?: string; samplePreset?: unknown }) => api.processOCR(file),
  saveExtractedBill: (data: Partial<BillRecord>) => api.createBill(data),
};
