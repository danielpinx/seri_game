import {
  SETTINGS_STORAGE_KEY,
  DEFAULT_NICKNAME,
  DEFAULT_AVATAR,
  DEFAULT_DIFFICULTY,
  DEFAULT_DAILY_GP,
  DAILY_GP_OPTIONS,
  AVATAR_OPTIONS,
} from "@/config/constants";

export interface SettingsState {
  nickname: string;
  avatar: string;
  difficulty: number;
  dailyGp: number;
}

function getDefaults(): SettingsState {
  return {
    nickname: DEFAULT_NICKNAME,
    avatar: DEFAULT_AVATAR,
    difficulty: DEFAULT_DIFFICULTY,
    dailyGp: DEFAULT_DAILY_GP,
  };
}

function saveState(state: SettingsState): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
}

export function loadSettings(): SettingsState {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) return getDefaults();
  try {
    const parsed = JSON.parse(stored);
    return {
      nickname: parsed.nickname || DEFAULT_NICKNAME,
      avatar: AVATAR_OPTIONS.includes(parsed.avatar)
        ? parsed.avatar
        : DEFAULT_AVATAR,
      difficulty: parsed.difficulty ?? DEFAULT_DIFFICULTY,
      dailyGp: (DAILY_GP_OPTIONS as readonly number[]).includes(parsed.dailyGp)
        ? parsed.dailyGp
        : DEFAULT_DAILY_GP,
    };
  } catch {
    return getDefaults();
  }
}

export function updateNickname(nickname: string): SettingsState {
  const state = loadSettings();
  state.nickname = nickname.trim().slice(0, 20) || DEFAULT_NICKNAME;
  saveState(state);
  return state;
}

export function updateAvatar(avatar: string): SettingsState {
  const state = loadSettings();
  state.avatar = avatar;
  saveState(state);
  return state;
}

export function updateDifficulty(difficulty: number): SettingsState {
  const state = loadSettings();
  state.difficulty = Math.max(1, Math.min(5, Math.round(difficulty)));
  saveState(state);
  return state;
}

export function updateDailyGp(dailyGp: number): SettingsState {
  const state = loadSettings();
  state.dailyGp = (DAILY_GP_OPTIONS as readonly number[]).includes(dailyGp)
    ? dailyGp
    : DEFAULT_DAILY_GP;
  saveState(state);
  return state;
}

/**
 * Linearly interpolate a game parameter based on difficulty.
 * d=1 → easyVal, d=3 → normalVal, d=5 → hardVal
 */
export function diffValue(
  difficulty: number,
  easyVal: number,
  normalVal: number,
  hardVal: number
): number {
  if (difficulty <= 1) return easyVal;
  if (difficulty >= 5) return hardVal;
  if (difficulty <= 3) {
    const t = (difficulty - 1) / 2;
    return easyVal + (normalVal - easyVal) * t;
  }
  const t = (difficulty - 3) / 2;
  return normalVal + (hardVal - normalVal) * t;
}
