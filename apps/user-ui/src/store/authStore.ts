import {create} from "zustand";

type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: true,
  setLoggedIn: (value: boolean) => set({isLoggedIn: value}),
}));