import { create } from "zustand";

interface GuestSignInState {
  isSigningIn: boolean;
  setIsSigningIn: (isSigningIn: boolean) => void;
}

export const useGuestSignInStore = create<GuestSignInState>((set) => ({
  isSigningIn: false,
  setIsSigningIn: (isSigningIn) => set({ isSigningIn }),
}));
