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
  {
    id: "pacman",
    name: "Pac-Man",
    description: "Eat dots, avoid ghosts",
    gpCost: 10,
    controls: "Arrow Keys",
    tags: ["classic", "arcade"],
    config: {
      id: "pacman",
      width: 640,
      height: 740,
      fps: 60,
      backgroundColor: "#060610",
    },
    create: async (canvas, callbacks) => {
      const { PacManGame } = await import("./pacman/PacManGame");
      const game = new PacManGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "solitaire",
    name: "Solitaire",
    description: "Classic Klondike card game",
    gpCost: 5,
    controls: "Mouse drag & drop",
    tags: ["classic", "cards"],
    config: {
      id: "solitaire",
      width: 660,
      height: 900,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { SolitaireGame } = await import("./solitaire/SolitaireGame");
      const game = new SolitaireGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "connect4",
    name: "Connect Four",
    description: "Drop discs, connect 4 vs AI",
    gpCost: 5,
    controls: "Mouse click",
    tags: ["classic", "strategy"],
    config: {
      id: "connect4",
      width: 620,
      height: 680,
      fps: 60,
      backgroundColor: "#0a0c1a",
    },
    create: async (canvas, callbacks) => {
      const { Connect4Game } = await import("./connect4/Connect4Game");
      const game = new Connect4Game(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "tower-defense",
    name: "Tower Defense",
    description: "Build towers, stop the waves",
    gpCost: 10,
    controls: "Mouse + 1/2/3 keys",
    tags: ["strategy", "tower-defense"],
    config: {
      id: "tower-defense",
      width: 760,
      height: 680,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { TowerDefenseGame } = await import(
        "./tower-defense/TowerDefenseGame"
      );
      const game = new TowerDefenseGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "rhythm",
    name: "Rhythm",
    description: "Hit notes to the beat",
    gpCost: 10,
    controls: "D / F / J / K",
    tags: ["rhythm", "arcade"],
    config: {
      id: "rhythm",
      width: 520,
      height: 700,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { RhythmGame } = await import("./rhythm/RhythmGame");
      const game = new RhythmGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "wordle",
    name: "Wordle",
    description: "Guess the 5-letter word",
    gpCost: 5,
    controls: "Keyboard + Mouse",
    tags: ["puzzle", "word"],
    config: {
      id: "wordle",
      width: 480,
      height: 680,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { WordleGame } = await import("./wordle/WordleGame");
      const game = new WordleGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "checkers",
    name: "Checkers",
    description: "Classic draughts vs AI",
    gpCost: 5,
    controls: "Mouse click",
    tags: ["classic", "strategy"],
    config: {
      id: "checkers",
      width: 640,
      height: 700,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { CheckersGame } = await import("./checkers/CheckersGame");
      const game = new CheckersGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Fill the 9x9 number grid",
    gpCost: 5,
    controls: "Mouse + Number keys",
    tags: ["puzzle", "logic"],
    config: {
      id: "sudoku",
      width: 540,
      height: 700,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { SudokuGame } = await import("./sudoku/SudokuGame");
      const game = new SudokuGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Flip cards, find pairs",
    gpCost: 5,
    controls: "Mouse click",
    tags: ["puzzle", "memory"],
    config: {
      id: "memory-match",
      width: 560,
      height: 640,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { MemoryMatchGame } = await import("./memory-match/MemoryMatchGame");
      const game = new MemoryMatchGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "hangman",
    name: "Hangman",
    description: "Guess the word, save the man",
    gpCost: 5,
    controls: "Keyboard + Mouse",
    tags: ["word", "classic"],
    config: {
      id: "hangman",
      width: 480,
      height: 680,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { HangmanGame } = await import("./hangman/HangmanGame");
      const game = new HangmanGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "bubble-shooter",
    name: "Bubble Shooter",
    description: "Aim, shoot, pop bubbles",
    gpCost: 5,
    controls: "Mouse aim + click",
    tags: ["arcade", "puzzle"],
    config: {
      id: "bubble-shooter",
      width: 480,
      height: 700,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { BubbleShooterGame } = await import("./bubble-shooter/BubbleShooterGame");
      const game = new BubbleShooterGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "typing",
    name: "Type Attack",
    description: "Type falling words to survive",
    gpCost: 5,
    controls: "Keyboard",
    tags: ["arcade", "typing"],
    config: {
      id: "typing",
      width: 640,
      height: 640,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { TypingGame } = await import("./typing/TypingGame");
      const game = new TypingGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "brick-builder",
    name: "Brick Builder",
    description: "Fit blocks, clear lines",
    gpCost: 5,
    controls: "Mouse drag & drop",
    tags: ["puzzle", "strategy"],
    config: {
      id: "brick-builder",
      width: 520,
      height: 700,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { BrickBuilderGame } = await import("./brick-builder/BrickBuilderGame");
      const game = new BrickBuilderGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "sokoban",
    name: "Sokoban",
    description: "Push boxes to targets",
    gpCost: 5,
    controls: "Arrow Keys + Z/R",
    tags: ["puzzle", "classic"],
    config: {
      id: "sokoban",
      width: 560,
      height: 620,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { SokobanGame } = await import("./sokoban/SokobanGame");
      const game = new SokobanGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
  {
    id: "simon-says",
    name: "Simon Says",
    description: "Repeat the pattern",
    gpCost: 5,
    controls: "Mouse + Q/W/A/S",
    tags: ["memory", "arcade"],
    config: {
      id: "simon-says",
      width: 480,
      height: 560,
      fps: 60,
      backgroundColor: "#0a0c14",
    },
    create: async (canvas, callbacks) => {
      const { SimonSaysGame } = await import("./simon-says/SimonSaysGame");
      const game = new SimonSaysGame(canvas, callbacks);
      game.init();
      return game;
    },
  },
];

export function getGameById(id: string): GameRegistryEntry | undefined {
  return GAME_REGISTRY.find((g) => g.id === id);
}
