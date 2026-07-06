import { create } from "zustand";

import { fetchMe, logout as apiLogout } from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  loadUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await fetchMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    apiLogout();
    set({ user: null, isAuthenticated: false });
  },
}));
