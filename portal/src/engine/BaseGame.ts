import { InputManager } from "./InputManager";
import type { GameConfig, GameCallbacks, GameStatus } from "./types";

export abstract class BaseGame {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected config: GameConfig;
  protected callbacks: GameCallbacks;
  protected input: InputManager;
  protected status: GameStatus = "idle";
  protected score = 0;

  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private accumulator = 0;
  private fixedDeltaMs: number;

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig,
    callbacks: GameCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.config = config;
    this.callbacks = callbacks;
    this.input = new InputManager(canvas);
    this.fixedDeltaMs = 1000 / config.fps;

    canvas.width = config.width;
    canvas.height = config.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  abstract init(): void;
  abstract update(dt: number): void;
  abstract draw(): void;
  abstract reset(): void;

  start(): void {
    this.status = "running";
    this.callbacks.onStatusChange("running");
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTimestamp);
  }

  pause(): void {
    this.status = "paused";
    this.callbacks.onStatusChange("paused");
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  resume(): void {
    this.status = "running";
    this.callbacks.onStatusChange("running");
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  destroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.input.destroy();
  }

  protected setScore(newScore: number): void {
    this.score = newScore;
    this.callbacks.onScoreChange(newScore);
  }

  protected gameOver(): void {
    this.status = "game_over";
    this.callbacks.onStatusChange("game_over");
    this.callbacks.onGameOver(this.score);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  private loop = (timestamp: number): void => {
    const elapsed = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.accumulator += elapsed;

    if (this.accumulator > 200) this.accumulator = 200;

    while (this.accumulator >= this.fixedDeltaMs) {
      this.update(this.fixedDeltaMs);
      this.input.poll();
      this.accumulator -= this.fixedDeltaMs;
    }

    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    this.draw();

    if (this.status === "running") {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };
}
