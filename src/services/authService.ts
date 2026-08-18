import { AuthResponse } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const missingSupabaseConfigMessage =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the frontend.';

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
        utilityProvider: data.user.user_metadata?.utilityProvider || 'TNEB (Tamil Nadu Electricity Board)',
        consumerNumber: data.user.user_metadata?.consumerNumber || '08849-30219',
        sanctionedLoadKw: data.user.user_metadata?.sanctionedLoadKw || 6.5,
        homeAreaSqFt: data.user.user_metadata?.homeAreaSqFt || 1850,
        occupants: data.user.user_metadata?.occupants || 4,
        createdAt: data.user.user_metadata?.createdAt || new Date().toISOString(),
        avatarUrl: data.user.user_metadata?.avatarUrl || undefined,
      };

      return { token: data.session?.access_token || '', user };
    }

    throw new Error(missingSupabaseConfigMessage);
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

    throw new Error(missingSupabaseConfigMessage);
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },
};
