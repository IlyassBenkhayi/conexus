import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  pronouns?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
}

interface AuthState {
  user: UserProfile | null;
  session: AuthSession | null;
  initializing: boolean;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: AuthSession | null) => void;
  setInitializing: (initializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initializing: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setInitializing: (initializing) => set({ initializing }),
}));
