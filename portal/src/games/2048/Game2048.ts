import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 520;
const HEIGHT = 620;
const BG = "#0a0c1a";

const GRID = 4;
const CELL = 110;
const GAP = 10;
const GRID_SIZE = GRID * CELL + (GRID + 1) * GAP; // 470
const GRID_X = (WIDTH - GRID_SIZE) / 2;
const GRID_Y = 80;

const CONFIG = {
  id: "2048",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2:    { bg: "#1a1a2e", text: "#8888aa" },
  4:    { bg: "#16213e", text: "#99aacc" },
  8:    { bg: "#0f3460", text: "#ffffff" },
  16:   { bg: "#e94560", text: "#ffffff" },
  32:   { bg: "#ff6b6b", text: "#ffffff" },
  64:   { bg: "#ff2e97", text: "#ffffff" },
  128:  { bg: "#ffd700", text: "#1a1a2e" },
  256:  { bg: "#4ecdc4", text: "#1a1a2e" },
  512:  { bg: "#45b7d1", text: "#1a1a2e" },
  1024: { bg: "#6c5ce7", text: "#ffffff" },
  2048: { bg: "#00d4ff", text: "#1a1a2e" },
};

interface TileAnim {
  row: number;
  col: number;
  type: "spawn" | "merge";
  timer: number;
}

export class Game2048 extends BaseGame {
  private grid: number[][] = [];
  private best = 0;
  private anims: TileAnim[] = [];
  private moved = false;

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
      this.best = parseInt(localStorage.getItem("2048-best") || "0", 10);
    } catch { this.best = 0; }
  }

  private saveBest(): void {
    try { localStorage.setItem("2048-best", String(this.best)); }
    catch { /* ignore */ }
  }

  private resetState(): void {
    this.grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    this.anims = [];
    this.moved = false;
    this.setScore(0);
    this.spawnTile();
    this.spawnTile();
  }

  private spawnTile(): void {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (this.grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    this.anims.push({ row: r, col: c, type: "spawn", timer: 150 });
  }

  private slideLine(line: number[]): { result: number[]; score: number; changed: boolean } {
    // Remove zeros
    const nums = line.filter((v) => v !== 0);
    const result: number[] = [];
    let score = 0;
    let i = 0;
    while (i < nums.length) {
      if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
        const merged = nums[i] * 2;
        result.push(merged);
        score += merged;
        i += 2;
      } else {
        result.push(nums[i]);
        i++;
      }
    }
    while (result.length < GRID) result.push(0);
    const changed = line.some((v, idx) => v !== result[idx]);
    return { result, score, changed };
  }

  private slide(dir: "up" | "down" | "left" | "right"): boolean {
    let totalScore = 0;
    let anyChanged = false;
    const mergedCells: [number, number][] = [];

    if (dir === "left" || dir === "right") {
      for (let r = 0; r < GRID; r++) {
        let line = [...this.grid[r]];
        if (dir === "right") line.reverse();
        const { result, score, changed } = this.slideLine(line);
        if (dir === "right") result.reverse();
        if (changed) {
          anyChanged = true;
          // Track merged positions
          for (let c = 0; c < GRID; c++) {
            if (result[c] !== 0 && result[c] !== this.grid[r][c] && result[c] > this.grid[r][c]) {
              mergedCells.push([r, c]);
            }
          }
        }
        this.grid[r] = result;
        totalScore += score;
      }
    } else {
      for (let c = 0; c < GRID; c++) {
        let line: number[] = [];
        for (let r = 0; r < GRID; r++) line.push(this.grid[r][c]);
        if (dir === "down") line.reverse();
        const { result, score, changed } = this.slideLine(line);
        if (dir === "down") result.reverse();
        if (changed) {
          anyChanged = true;
          for (let r = 0; r < GRID; r++) {
            if (result[r] !== 0 && result[r] !== this.grid[r][c] && result[r] > this.grid[r][c]) {
              mergedCells.push([r, c]);
            }
          }
        }
        for (let r = 0; r < GRID; r++) this.grid[r][c] = result[r];
        totalScore += score;
      }
    }

    if (anyChanged) {
      this.setScore(this.score + totalScore);
      if (this.score > this.best) {
        this.best = this.score;
        this.saveBest();
      }
      for (const [r, c] of mergedCells) {
        this.anims.push({ row: r, col: c, type: "merge", timer: 200 });
      }
    }

    return anyChanged;
  }

  private canMove(): boolean {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (this.grid[r][c] === 0) return true;
        if (c + 1 < GRID && this.grid[r][c] === this.grid[r][c + 1]) return true;
        if (r + 1 < GRID && this.grid[r][c] === this.grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  update(dt: number): void {
    // Update animations
    this.anims = this.anims.filter((a) => {
      a.timer -= dt;
      return a.timer > 0;
    });

    // Input
    let dir: "up" | "down" | "left" | "right" | null = null;
    if (this.input.isKeyJustPressed("ArrowLeft")) dir = "left";
    else if (this.input.isKeyJustPressed("ArrowRight")) dir = "right";
    else if (this.input.isKeyJustPressed("ArrowUp")) dir = "up";
    else if (this.input.isKeyJustPressed("ArrowDown")) dir = "down";

    if (dir) {
      const moved = this.slide(dir);
      if (moved) {
        this.spawnTile();
        if (!this.canMove()) {
          this.gameOver();
        }
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Score UI
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", 25, 28);
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.fillText(String(this.score), 25, 56);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("BEST", WIDTH - 25, 28);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.fillText(String(this.best), WIDTH - 25, 56);

    // Grid background
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.roundRect(GRID_X, GRID_Y, GRID_SIZE, GRID_SIZE, 12);
    ctx.fill();

    // Empty cells
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = GRID_X + GAP + c * (CELL + GAP);
        const y = GRID_Y + GAP + r * (CELL + GAP);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, 8);
        ctx.fill();
      }
    }

    // Tiles
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const val = this.grid[r][c];
        if (val === 0) continue;

        const x = GRID_X + GAP + c * (CELL + GAP);
        const y = GRID_Y + GAP + r * (CELL + GAP);
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;

        // Check animation
        const anim = this.anims.find((a) => a.row === r && a.col === c);
        let scale = 1;
        if (anim) {
          if (anim.type === "spawn") {
            scale = 1 - anim.timer / 150; // 0 → 1
          } else {
            // merge: pulse 1 → 1.15 → 1
            const t = 1 - anim.timer / 200;
            scale = t < 0.5 ? 1 + 0.15 * (t * 2) : 1 + 0.15 * (1 - (t - 0.5) * 2);
          }
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        const colors = TILE_COLORS[val] || { bg: "#00d4ff", text: "#1a1a2e" };

        // Glow for high values
        if (val >= 128) {
          ctx.shadowColor = colors.bg;
          ctx.shadowBlur = 15;
        }

        ctx.fillStyle = colors.bg;
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Value text
        ctx.fillStyle = colors.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontSize = val >= 1024 ? 28 : val >= 128 ? 32 : 36;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillText(String(val), cx, cy + 1);
        ctx.textBaseline = "alphabetic";

        ctx.restore();
      }
    }

    // Hint
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Arrow keys to play", WIDTH / 2, HEIGHT - 20);
  }
}
