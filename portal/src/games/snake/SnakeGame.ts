import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const CELL_SIZE = 28;
const GRID = 25;
const OFFSET = 60;
const W = 2 * OFFSET + CELL_SIZE * GRID;
const BG = "#0f1923";
const GRID_DARK = "#141f2b";
const GRID_LIGHT = "#172430";
const SNAKE_HEAD = "#00d4ff";
const FOOD_COLOR = "#ff2e97";
const FOOD_GLOW = "rgba(255, 46, 151, 0.3)";
const MOVE_INTERVAL = 130;

const CONFIG = {
  id: "snake",
  width: W,
  height: W,
  fps: 60,
  backgroundColor: BG,
};

interface Vec2 {
  x: number;
  y: number;
}

export class SnakeGame extends BaseGame {
  private body: Vec2[] = [];
  private direction: Vec2 = { x: 1, y: 0 };
  private nextDirection: Vec2 = { x: 1, y: 0 };
  private food: Vec2 = { x: 0, y: 0 };
  private addSegment = false;
  private moveTimer = 0;
  private running = true;
  private foodPulse = 0;
  private best = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.loadBest();
    this.resetState();
  }

  reset(): void {
    this.resetState();
  }

  private loadBest(): void {
    try {
      this.best = parseInt(localStorage.getItem("snake-best") || "0", 10);
    } catch {
      this.best = 0;
    }
  }

  private saveBest(): void {
    try {
      localStorage.setItem("snake-best", String(this.best));
    } catch { /* ignore */ }
  }

  private resetState(): void {
    this.body = [
      { x: 6, y: 12 },
      { x: 5, y: 12 },
      { x: 4, y: 12 },
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.addSegment = false;
    this.moveTimer = 0;
    this.running = true;
    this.foodPulse = 0;
    this.setScore(0);
    this.spawnFood();
  }

  private spawnFood(): void {
    let pos: Vec2;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
    } while (this.body.some((s) => s.x === pos.x && s.y === pos.y));
    this.food = pos;
  }

  update(dt: number): void {
    this.foodPulse += dt * 0.004;

    // Direction input (prevent 180-degree turn)
    if (this.input.isKeyJustPressed("ArrowUp") && this.direction.y !== 1) {
      this.nextDirection = { x: 0, y: -1 };
    }
    if (this.input.isKeyJustPressed("ArrowDown") && this.direction.y !== -1) {
      this.nextDirection = { x: 0, y: 1 };
    }
    if (this.input.isKeyJustPressed("ArrowLeft") && this.direction.x !== 1) {
      this.nextDirection = { x: -1, y: 0 };
    }
    if (this.input.isKeyJustPressed("ArrowRight") && this.direction.x !== -1) {
      this.nextDirection = { x: 1, y: 0 };
    }

    if (!this.running) return;

    this.moveTimer += dt;
    if (this.moveTimer < MOVE_INTERVAL) return;
    this.moveTimer -= MOVE_INTERVAL;

    this.direction = this.nextDirection;

    // Move
    const head = this.body[0];
    const newHead = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    this.body.unshift(newHead);

    if (this.addSegment) {
      this.addSegment = false;
    } else {
      this.body.pop();
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
      this.running = false;
      if (this.score > this.best) {
        this.best = this.score;
        this.saveBest();
      }
      this.gameOver();
      return;
    }

    // Self collision
    for (let i = 1; i < this.body.length; i++) {
      if (this.body[i].x === newHead.x && this.body[i].y === newHead.y) {
        this.running = false;
        if (this.score > this.best) {
          this.best = this.score;
          this.saveBest();
        }
        this.gameOver();
        return;
      }
    }

    // Food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.addSegment = true;
      this.setScore(this.score + 1);
      this.spawnFood();
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Checkerboard grid
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? GRID_DARK : GRID_LIGHT;
        ctx.fillRect(OFFSET + c * CELL_SIZE, OFFSET + r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Grid border
    ctx.strokeStyle = "rgba(0, 212, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(OFFSET - 1, OFFSET - 1, CELL_SIZE * GRID + 2, CELL_SIZE * GRID + 2);

    // Food glow
    const fx = OFFSET + this.food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = OFFSET + this.food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseSize = 1 + Math.sin(this.foodPulse) * 0.3;
    const glowGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, CELL_SIZE * 1.5 * pulseSize);
    glowGrad.addColorStop(0, FOOD_GLOW);
    glowGrad.addColorStop(1, "rgba(255, 46, 151, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(fx - CELL_SIZE * 2, fy - CELL_SIZE * 2, CELL_SIZE * 4, CELL_SIZE * 4);

    // Food
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    ctx.arc(fx, fy, (CELL_SIZE / 2 - 3) * pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Snake body
    for (let i = this.body.length - 1; i >= 0; i--) {
      const seg = this.body[i];
      const x = OFFSET + seg.x * CELL_SIZE;
      const y = OFFSET + seg.y * CELL_SIZE;
      const pad = 1;

      if (i === 0) {
        // Head - brightest with glow
        ctx.shadowColor = SNAKE_HEAD;
        ctx.shadowBlur = 10;
        ctx.fillStyle = SNAKE_HEAD;
        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        const ex1 = x + CELL_SIZE * 0.3;
        const ex2 = x + CELL_SIZE * 0.7;
        const ey = y + CELL_SIZE * 0.4;
        if (this.direction.x === 1) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE * 0.7, y + CELL_SIZE * 0.35, 3, 0, Math.PI * 2);
          ctx.arc(x + CELL_SIZE * 0.7, y + CELL_SIZE * 0.65, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.direction.x === -1) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE * 0.3, y + CELL_SIZE * 0.35, 3, 0, Math.PI * 2);
          ctx.arc(x + CELL_SIZE * 0.3, y + CELL_SIZE * 0.65, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.direction.y === -1) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(ex1, y + CELL_SIZE * 0.3, 3, 0, Math.PI * 2);
          ctx.arc(ex2, y + CELL_SIZE * 0.3, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(ex1, ey + CELL_SIZE * 0.25, 3, 0, Math.PI * 2);
          ctx.arc(ex2, ey + CELL_SIZE * 0.25, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Body - gradient from body to tail
        const t = i / this.body.length;
        const r = Math.round(lerp(0, 0, t) + lerp(0x00, 0x00, 1 - t));
        const g = Math.round(lerp(0x97, 0x68, t));
        const b = Math.round(lerp(0xb2, 0x78, t));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 5);
        ctx.fill();
      }
    }

    // UI - Title
    ctx.fillStyle = SNAKE_HEAD;
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SNAKE", OFFSET, 38);

    // Score
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(this.score), W - OFFSET, 38);

    // Best
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`BEST ${this.best}`, W - OFFSET, 55);

    // Length
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(`Length: ${this.body.length}`, OFFSET, W - OFFSET + 28);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
