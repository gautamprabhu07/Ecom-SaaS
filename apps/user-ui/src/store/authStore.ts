//Path: apps/user-ui/src/store/authStore.ts
import {create} from "zustand";

type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  setLoggedIn: (value: boolean) => set({isLoggedIn: value}),
}));