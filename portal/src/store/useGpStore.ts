import { create } from "zustand";
import { loadGpState, deductGp as deductGpLib, resetGpWith } from "@/lib/gp";
import { useSettingsStore } from "@/store/useSettingsStore";

interface GpStore {
  balance: number;
  isLoaded: boolean;
  initialize: () => void;
  deductGp: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;
  refreshBalance: () => void;
}

export const useGpStore = create<GpStore>((set, get) => ({
  balance: 0,
  isLoaded: false,

  initialize: () => {
    const dailyGp = useSettingsStore.getState().dailyGp;
    const state = loadGpState(dailyGp);
    set({ balance: state.balance, isLoaded: true });
  },

  deductGp: (amount: number) => {
    const dailyGp = useSettingsStore.getState().dailyGp;
    const result = deductGpLib(amount, dailyGp);
    if (result.success) {
      set({ balance: result.newBalance });
    }
    return result.success;
  },

  canAfford: (amount: number) => get().balance >= amount,

  refreshBalance: () => {
    const dailyGp = useSettingsStore.getState().dailyGp;
    const state = resetGpWith(dailyGp);
    set({ balance: state.balance });
  },
}));
