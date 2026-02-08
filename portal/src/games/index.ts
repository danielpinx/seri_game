import type { BaseGame } from "@/engine/BaseGame";
import type { GameConfig, GameCallbacks } from "@/engine/types";

export interface GameRegistryEntry {
  id: string;
  name: string;
  description: string;
  gpCost: number;
  controls: string;
  tags: string[];
  config: GameConfig;
  create: (
    canvas: HTMLCanvasElement,
    callbacks: GameCallbacks
  ) => Promise<BaseGame>;
}

export const GAME_REGISTRY: GameRegistryEntry[] = [
  {
    id: "pong",
    name: "Pong",
    description: "Classic paddle battle vs AI",
    gpCost: 5,
    controls: "Arrow Up/Down",
    tags: ["classic", "versus"],
    config: {
      id: "pong",
      width: 1280,
      height: 800,
      fps: 60,
      backgroundColor: "#0a0a1a",
    },
    create: async (canvas, callbacks) => {
      const { PongGame } = await import("./pong/PongGame");
      const game = new PongGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "snake",
    name: "Snake",
    description: "Eat, grow, survive",
    gpCost: 5,
    controls: "Arrow Keys",
    tags: ["classic", "survival"],
    config: {
      id: "snake",
      width: 820,
      height: 820,
      fps: 60,
      backgroundColor: "#0f1923",
    },
    create: async (canvas, callbacks) => {
      const { SnakeGame } = await import("./snake/SnakeGame");
      const game = new SnakeGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Stack blocks, clear lines",
    gpCost: 10,
    controls: "Arrows + Space to drop",
    tags: ["classic", "puzzle"],
    config: {
      id: "tetris",
      width: 520,
      height: 640,
      fps: 60,
      backgroundColor: "#0a0c1a",
    },
    create: async (canvas, callbacks) => {
      const { TetrisGame } = await import("./tetris/TetrisGame");
      const game = new TetrisGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "space-invaders",
    name: "Space Invaders",
    description: "Defend Earth from aliens",
    gpCost: 10,
    controls: "Left/Right + Space",
    tags: ["classic", "shooter"],
    config: {
      id: "space-invaders",
      width: 800,
      height: 800,
      fps: 60,
      backgroundColor: "#060610",
    },
    create: async (canvas, callbacks) => {
      const { SpaceInvadersGame } = await import(
        "./space-invaders/SpaceInvadersGame"
      );
      const game = new SpaceInvadersGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "falling-sand",
    name: "Falling Sand",
    description: "Particle physics sandbox",
    gpCost: 5,
    controls: "Click + 1/2/3/4 keys",
    tags: ["sandbox", "physics"],
    config: {
      id: "falling-sand",
      width: 800,
      height: 640,
      fps: 120,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { FallingSandGame } = await import(
        "./falling-sand/FallingSandGame"
      );
      const game = new FallingSandGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "breakout",
    name: "Breakout",
    description: "Smash bricks with combos",
    gpCost: 5,
    controls: "Left/Right + Space",
    tags: ["classic", "arcade"],
    config: {
      id: "breakout",
      width: 900,
      height: 640,
      fps: 60,
      backgroundColor: "#0a0c1a",
    },
    create: async (canvas, callbacks) => {
      const { BreakoutGame } = await import("./breakout/BreakoutGame");
      const game = new BreakoutGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "2048",
    name: "2048",
    description: "Merge tiles, reach 2048",
    gpCost: 5,
    controls: "Arrow Keys",
    tags: ["puzzle", "strategy"],
    config: {
      id: "2048",
      width: 520,
      height: 620,
      fps: 60,
      backgroundColor: "#0a0c1a",
    },
    create: async (canvas, callbacks) => {
      const { Game2048 } = await import("./2048/Game2048");
      const game = new Game2048(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "asteroids",
    name: "Asteroids",
    description: "Destroy asteroids in space",
    gpCost: 5,
    controls: "Arrows + Space",
    tags: ["classic", "shooter"],
    config: {
      id: "asteroids",
      width: 800,
      height: 800,
      fps: 60,
      backgroundColor: "#060610",
    },
    create: async (canvas, callbacks) => {
      const { AsteroidsGame } = await import("./asteroids/AsteroidsGame");
      const game = new AsteroidsGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
];

export function getGameById(id: string): GameRegistryEntry | undefined {
  return GAME_REGISTRY.find((g) => g.id === id);
}
