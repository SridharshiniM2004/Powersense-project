import { AdminStats, User } from '../types';
import { api } from './api';

export const adminService = {
  getAdminStats: (): Promise<AdminStats> => api.getAdminStats(),
  getAdminUsers: (): Promise<User[]> => api.getAdminUsers(),
};
