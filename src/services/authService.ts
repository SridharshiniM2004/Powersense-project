import { AuthResponse } from '../types';
import { api } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        throw new Error(error?.message || 'Login failed');
      }

      const user = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'PowerSense User',
        email: data.user.email || email,
        role: (data.user.user_metadata?.role as any) || 'user',
        utilityProvider: data.user.user_metadata?.utilityProvider || 'BESCOM (Bengaluru Electricity Supply Co.)',
        consumerNumber: data.user.user_metadata?.consumerNumber || '08849-30219',
        sanctionedLoadKw: data.user.user_metadata?.sanctionedLoadKw || 6.5,
        homeAreaSqFt: data.user.user_metadata?.homeAreaSqFt || 1850,
        occupants: data.user.user_metadata?.occupants || 4,
        createdAt: data.user.user_metadata?.createdAt || new Date().toISOString(),
        avatarUrl: data.user.user_metadata?.avatarUrl || undefined,
      };

      return { token: data.session?.access_token || '', user };
    }

    return api.login(email, password);
  },

  async register(input: {
    name: string;
    email: string;
    password: string;
    role: string;
    utilityProvider: string;
    consumerNumber: string;
  }): Promise<AuthResponse> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            role: input.role,
            utilityProvider: input.utilityProvider,
            consumerNumber: input.consumerNumber,
          },
        },
      });
      if (error || !data.user) {
        throw new Error(error?.message || 'Registration failed');
      }
      const user = {
        id: data.user.id,
        name: input.name,
        email: input.email,
        role: input.role as any,
        utilityProvider: input.utilityProvider,
        consumerNumber: input.consumerNumber,
        sanctionedLoadKw: 6.5,
        homeAreaSqFt: 1850,
        occupants: 4,
        createdAt: new Date().toISOString(),
      };
      return { token: data.session?.access_token || '', user };
    }

    return api.register(input);
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },
};
