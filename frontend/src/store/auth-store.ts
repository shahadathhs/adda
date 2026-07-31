import { create } from "zustand";
import { api, clearToken, getToken, setToken } from "../lib/api";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    display_name: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = getToken();
    if (!token) {
      set({ loading: false, user: null });
      return;
    }
    try {
      const user = await api.me();
      set({ user, loading: false });
    } catch {
      clearToken();
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const token = await api.login({ email, password });
    setToken(token.access_token);
    set({ user: token.user });
  },

  register: async (data) => {
    const token = await api.register(data);
    setToken(token.access_token);
    set({ user: token.user });
  },

  logout: () => {
    clearToken();
    set({ user: null });
  },
}));
