import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post('/v1/auth/login', { email, password });
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await api.post('/v1/auth/logout');
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/v1/auth/me');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
