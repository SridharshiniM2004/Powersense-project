import { BillRecord, OCRResult, PredictionResult, MLPredictionInput, Recommendation, AdminStats, UserSettings, User, AuthResponse } from '../types';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_ROOT = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
async function request(path: string, init: RequestInit = {}) {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in to continue.');
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${data.session.access_token}`, ...(init.headers || {}) } });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || error.error || 'Request failed'); }
  return response.status === 204 ? null : response.json();
}

export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error || !data.user) throw new Error(error?.message || 'Login failed');
    return { token: data.session?.access_token || '', user: (await request('/auth/me')).user };
  },
  async register(input: {name:string; email:string; password?:string; role?:string; utilityProvider?:string; consumerNumber?:string}): Promise<AuthResponse> {
    if (!supabase || !input.password) throw new Error('Supabase configuration and password are required.');
    const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { name: input.name, role: input.role || 'user', utilityProvider: input.utilityProvider || '', consumerNumber: input.consumerNumber || '' } } });
    if (error) throw new Error(error.message); if (!data.session) throw new Error('Check your email to verify your account, then sign in.');
    return { token: data.session.access_token, user: (await request('/auth/me')).user };
  },
  async forgotPassword(email:string) { if (!supabase) throw new Error('Supabase is not configured.'); const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`}); if(error) throw new Error(error.message); return {message:'Check your inbox for the password reset link.'}; },
  async getCurrentUser(): Promise<User> { return (await request('/auth/me')).user; },
  async updateProfile(data: Partial<User>): Promise<User> { return (await request('/auth/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})).user; },
  getBills: (): Promise<BillRecord[]> => request('/bills'),
  createBill: (data: Partial<BillRecord>): Promise<BillRecord> => request('/bills',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),
  deleteBill: (id:string): Promise<void> => request(`/bills/${id}`,{method:'DELETE'}),
  async processOCR(input: File | {imageBase64?: string; mimeType?: string; samplePreset?: unknown}): Promise<OCRResult> {
    const form=new FormData();
    if (input instanceof File) form.append('file',input);
    else if (input.imageBase64) { const blob=await (await fetch(input.imageBase64)).blob(); form.append('file',blob,`bill.${(input.mimeType || 'image/png').split('/')[1]}`); }
    else throw new Error('Select an electricity bill image to scan.');
    return request('/bill/upload-ocr',{method:'POST',body:form});
  },
  predictUsage: (input: MLPredictionInput): Promise<PredictionResult> => request('/bill/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),
  predictUnits: (input: MLPredictionInput) => request(`${API_ROOT}/predict-units`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),
  predictBill: (input: MLPredictionInput) => request(`${API_ROOT}/predict-bill`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),
  getRecommendations: (): Promise<Recommendation[]> => request('/recommendations'),
  updateRecommendationStatus: (id:string,status:'new'|'in_progress'|'completed'): Promise<Recommendation> => request(`/recommendations/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}),
  sendChatMessage: (message:string,history:{sender:string;text:string}[]) => request('/chatbot/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history})}),
  getAdminStats: (): Promise<AdminStats> => request('/admin/stats'), getAdminUsers: (): Promise<User[]> => request('/admin/users'),
  getSettings: (): Promise<UserSettings> => request('/settings'), updateSettings: (data:Partial<UserSettings>): Promise<UserSettings> => request('/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),
};
