export const GP_DAILY_AMOUNT = 1000;
export const GP_STORAGE_KEY = "seri-arcade-gp";

// Settings
export const SETTINGS_STORAGE_KEY = "seri-arcade-settings";
export const DEFAULT_NICKNAME = "Guest";
export const DEFAULT_AVATAR = "avatar_001";
export const DEFAULT_DIFFICULTY = 3;
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Very Easy",
  2: "Easy",
  3: "Normal",
  4: "Hard",
  5: "Very Hard",
};
export const AVATAR_OPTIONS = [
  "avatar_001",
  "avatar_009",
  "avatar_016",
  "avatar_017",
  "avatar_024",
  "avatar_025",
] as const;
