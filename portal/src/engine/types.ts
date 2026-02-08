export interface GameConfig {
  id: string;
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
}

export type GameStatus = "idle" | "running" | "paused" | "game_over";

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onStatusChange: (status: GameStatus) => void;
  onGameOver: (finalScore: number) => void;
}
