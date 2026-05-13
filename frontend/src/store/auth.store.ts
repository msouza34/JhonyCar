import { create } from "zustand";
import { TOKEN_KEY } from "@/services/api";
import type { UserRole } from "@/types/api";

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  hydrate: () => void;
  setAuth: (token: string, username: string, role: UserRole) => void;
  logout: () => void;
}

interface StoredUser {
  username: string;
  role: UserRole;
}

const USER_KEY = "jhonycar_user";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  role: null,
  isAuthenticated: false,
  hydrate: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);

    if (!token || !rawUser) {
      set({ token: null, username: null, role: null, isAuthenticated: false });
      return;
    }

    try {
      const user = JSON.parse(rawUser) as StoredUser;
      set({
        token,
        username: user.username,
        role: user.role,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ token: null, username: null, role: null, isAuthenticated: false });
    }
  },
  setAuth: (token, username, role) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ username, role }));
    set({ token, username, role, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, username: null, role: null, isAuthenticated: false });
  },
}));
