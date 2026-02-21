export const DEFAULT_DAILY_GP = 300;
export const DAILY_GP_OPTIONS = [100, 200, 300, 500, 1000] as const;
export const GP_STORAGE_KEY = "seri-arcade-gp";

// Settings
export const SETTINGS_STORAGE_KEY = "seri-arcade-settings";
export const DEFAULT_NICKNAME = "Guest";
export const DEFAULT_AVATAR = "1001";
export const DEFAULT_DIFFICULTY = 3;
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Very Easy",
  2: "Easy",
  3: "Normal",
  4: "Hard",
  5: "Very Hard",
};
export const AVATAR_OPTIONS: string[] = [
  ...Array.from({ length: 64 }, (_, i) => String(1001 + i)),
  ...Array.from({ length: 64 }, (_, i) => String(2000 + i)),
];
