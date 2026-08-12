import { BillRecord } from '../types';
import { api } from './api';

export const billService = {
  getBills: () => api.getBills(),
  createBill: (data: Partial<BillRecord>) => api.createBill(data),
  deleteBill: (id: string) => api.deleteBill(id),
};
