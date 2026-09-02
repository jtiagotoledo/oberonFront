import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './secureStorage';

export type Role = 'student' | 'admin' | 'professor';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      login: (userData, token) => set({ user: userData, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'muvup-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);