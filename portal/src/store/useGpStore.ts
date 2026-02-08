import { create } from "zustand";
import { loadGpState, deductGp as deductGpLib } from "@/lib/gp";
import { GP_DAILY_AMOUNT } from "@/config/constants";

interface GpStore {
  balance: number;
  dailyAmount: number;
  isLoaded: boolean;
  initialize: () => void;
  deductGp: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
}

export const useGpStore = create<GpStore>((set, get) => ({
  balance: 0,
  dailyAmount: GP_DAILY_AMOUNT,
  isLoaded: false,

  initialize: () => {
    const state = loadGpState();
    set({ balance: state.balance, isLoaded: true });
  },

  deductGp: (amount: number) => {
    const result = deductGpLib(amount);
    if (result.success) {
      set({ balance: result.newBalance });
    }
    return result.success;
  },

  canAfford: (amount: number) => get().balance >= amount,
}));
