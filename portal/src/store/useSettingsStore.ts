import { create } from "zustand";
import {
  loadSettings,
  updateNickname as updateNicknameLib,
  updateAvatar as updateAvatarLib,
  updateDifficulty as updateDifficultyLib,
} from "@/lib/settings";
import {
  DEFAULT_NICKNAME,
  DEFAULT_AVATAR,
  DEFAULT_DIFFICULTY,
} from "@/config/constants";

interface SettingsStore {
  nickname: string;
  avatar: string;
  difficulty: number;
  isLoaded: boolean;
  initialize: () => void;
  setNickname: (nickname: string) => void;
  setAvatar: (avatar: string) => void;
  setDifficulty: (difficulty: number) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  nickname: DEFAULT_NICKNAME,
  avatar: DEFAULT_AVATAR,
  difficulty: DEFAULT_DIFFICULTY,
  isLoaded: false,

  initialize: () => {
    const state = loadSettings();
    set({
      nickname: state.nickname,
      avatar: state.avatar,
      difficulty: state.difficulty,
      isLoaded: true,
    });
  },

  setNickname: (nickname: string) => {
    const state = updateNicknameLib(nickname);
    set({ nickname: state.nickname });
  },

  setAvatar: (avatar: string) => {
    const state = updateAvatarLib(avatar);
    set({ avatar: state.avatar });
  },

  setDifficulty: (difficulty: number) => {
    const state = updateDifficultyLib(difficulty);
    set({ difficulty: state.difficulty });
  },
}));
