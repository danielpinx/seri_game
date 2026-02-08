import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 800;
const HEIGHT = 640;
const CELL = 10;
const COLS = WIDTH / CELL;  // 80
const ROWS = (HEIGHT - 40) / CELL; // 60 (top 40px reserved for UI)
const GRID_Y = 40;
const BG = "#0a0c14";

const CONFIG = {
  id: "falling-sand",
  width: WIDTH,
  height: HEIGHT,
  fps: 120,
  backgroundColor: BG,
};

type Mode = "sand" | "rock" | "water" | "erase";

interface Particle {
  type: "sand" | "rock" | "water";
  color: string;
}

function hsvToRgb(h: number, s: number, v: number): string {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function makeSand(): Particle {
  return { type: "sand", color: hsvToRgb(randRange(0.1, 0.12), randRange(0.5, 0.7), randRange(0.7, 0.9)) };
}

function makeRock(): Particle {
  return { type: "rock", color: hsvToRgb(randRange(0.0, 0.1), randRange(0.1, 0.3), randRange(0.3, 0.5)) };
}

function makeWater(): Particle {
  return { type: "water", color: hsvToRgb(randRange(0.55, 0.62), randRange(0.5, 0.7), randRange(0.6, 0.9)) };
}

const MODE_COLORS: Record<Mode, string> = {
  sand: "#d4a56a",
  rock: "#777777",
  water: "#4a9eff",
  erase: "#ff4a6a",
};

const MODE_KEYS: { key: string; mode: Mode }[] = [
  { key: "Digit1", mode: "sand" },
  { key: "Digit2", mode: "rock" },
  { key: "Digit3", mode: "water" },
  { key: "Digit4", mode: "erase" },
  { key: "KeyS", mode: "sand" },
  { key: "KeyR", mode: "rock" },
  { key: "KeyW", mode: "water" },
  { key: "KeyE", mode: "erase" },
];

export class FallingSandGame extends BaseGame {
  private grid: (Particle | null)[][] = [];
  private mode: Mode = "sand";
  private brushSize = 3;
  private particleCount = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.clearGrid();
  }

  reset(): void {
    this.clearGrid();
  }

  private clearGrid(): void {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.particleCount = 0;
  }

  private isEmpty(r: number, c: number): boolean {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS && this.grid[r][c] === null;
  }

  update(_dt: number): void {
    // Mode switching
    for (const mk of MODE_KEYS) {
      if (this.input.isKeyJustPressed(mk.key)) this.mode = mk.mode;
    }
    if (this.input.isKeyJustPressed("Space")) this.clearGrid();

    // Brush size
    if (this.input.isKeyJustPressed("BracketLeft") || this.input.isKeyJustPressed("Minus")) {
      this.brushSize = Math.max(1, this.brushSize - 1);
    }
    if (this.input.isKeyJustPressed("BracketRight") || this.input.isKeyJustPressed("Equal")) {
      this.brushSize = Math.min(8, this.brushSize + 1);
    }

    // Mouse painting
    if (this.input.isMouseDown(0)) {
      const pos = this.input.getMousePosition();
      const col = Math.floor(pos.x / CELL);
      const row = Math.floor((pos.y - GRID_Y) / CELL);
      const half = Math.floor(this.brushSize / 2);
      for (let dr = -half; dr < this.brushSize - half; dr++) {
        for (let dc = -half; dc < this.brushSize - half; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
          if (this.mode === "erase") {
            if (this.grid[r][c]) this.particleCount--;
            this.grid[r][c] = null;
          } else if (this.mode === "sand") {
            if (Math.random() < 0.2 && this.grid[r][c] === null) {
              this.grid[r][c] = makeSand();
              this.particleCount++;
            }
          } else if (this.mode === "rock") {
            if (this.grid[r][c] === null) {
              this.grid[r][c] = makeRock();
              this.particleCount++;
            }
          } else if (this.mode === "water") {
            if (Math.random() < 0.15 && this.grid[r][c] === null) {
              this.grid[r][c] = makeWater();
              this.particleCount++;
            }
          }
        }
      }
    }

    // Physics: bottom-up, alternating column direction
    for (let row = ROWS - 2; row >= 0; row--) {
      const forward = row % 2 === 0;
      for (let i = 0; i < COLS; i++) {
        const col = forward ? i : COLS - 1 - i;
        const p = this.grid[row][col];
        if (!p || p.type === "rock") continue;

        if (p.type === "sand") {
          if (this.isEmpty(row + 1, col)) {
            this.grid[row + 1][col] = p;
            this.grid[row][col] = null;
          } else {
            const offsets = Math.random() > 0.5 ? [-1, 1] : [1, -1];
            let moved = false;
            for (const off of offsets) {
              if (this.isEmpty(row + 1, col + off)) {
                this.grid[row + 1][col + off] = p;
                this.grid[row][col] = null;
                moved = true;
                break;
              }
            }
            // Sand displaces water
            if (!moved) {
              for (const off of offsets) {
                const nr = row + 1;
                const nc = col + off;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                  const below = this.grid[nr][nc];
                  if (below && below.type === "water") {
                    this.grid[nr][nc] = p;
                    this.grid[row][col] = below;
                    break;
                  }
                }
              }
              // Directly below
              const belowDirect = this.grid[row + 1]?.[col];
              if (belowDirect && belowDirect.type === "water") {
                this.grid[row + 1][col] = p;
                this.grid[row][col] = belowDirect;
              }
            }
          }
        }

        if (p.type === "water") {
          if (this.isEmpty(row + 1, col)) {
            this.grid[row + 1][col] = p;
            this.grid[row][col] = null;
          } else {
            // Try diagonal down
            const offsets = Math.random() > 0.5 ? [-1, 1] : [1, -1];
            let moved = false;
            for (const off of offsets) {
              if (this.isEmpty(row + 1, col + off)) {
                this.grid[row + 1][col + off] = p;
                this.grid[row][col] = null;
                moved = true;
                break;
              }
            }
            // Try sideways flow
            if (!moved) {
              for (const off of offsets) {
                if (this.isEmpty(row, col + off)) {
                  this.grid[row][col + off] = p;
                  this.grid[row][col] = null;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Grid background
    ctx.fillStyle = "#0d0f18";
    ctx.fillRect(0, GRID_Y, WIDTH, HEIGHT - GRID_Y);

    // Particles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = this.grid[r][c];
        if (p) {
          ctx.fillStyle = p.color;
          ctx.fillRect(c * CELL, GRID_Y + r * CELL, CELL, CELL);
        }
      }
    }

    // Brush cursor
    const pos = this.input.getMousePosition();
    const bc = Math.floor(pos.x / CELL);
    const br = Math.floor((pos.y - GRID_Y) / CELL);
    const half = Math.floor(this.brushSize / 2);
    const cursorX = (bc - half) * CELL;
    const cursorY = GRID_Y + (br - half) * CELL;
    const cursorSize = this.brushSize * CELL;

    ctx.strokeStyle = MODE_COLORS[this.mode];
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.strokeRect(cursorX, cursorY, cursorSize, cursorSize);
    ctx.globalAlpha = 1;

    // UI Bar
    ctx.fillStyle = "rgba(13, 15, 24, 0.95)";
    ctx.fillRect(0, 0, WIDTH, GRID_Y);

    // Mode buttons
    const modes: Mode[] = ["sand", "rock", "water", "erase"];
    const labels = ["Sand", "Rock", "Water", "Erase"];
    const keys = ["1/S", "2/R", "3/W", "4/E"];

    for (let i = 0; i < modes.length; i++) {
      const bx = 15 + i * 100;
      const isActive = this.mode === modes[i];

      // Button bg
      if (isActive) {
        ctx.fillStyle = MODE_COLORS[modes[i]] + "33";
        ctx.beginPath();
        ctx.roundRect(bx, 6, 88, 28, 6);
        ctx.fill();
        ctx.strokeStyle = MODE_COLORS[modes[i]];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = isActive ? MODE_COLORS[modes[i]] : "rgba(255,255,255,0.35)";
      ctx.font = isActive ? "bold 11px Inter, sans-serif" : "11px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(labels[i], bx + 8, 24);

      // Key hint
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "8px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(keys[i], bx + 82, 24);
    }

    // Brush size
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Brush: ${this.brushSize}`, WIDTH - 120, 24);

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText("[ / ]", WIDTH - 120, 36);

    // Particle count
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${this.particleCount} particles`, WIDTH - 15, 24);

    // Space hint
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Space = Clear", WIDTH / 2 + 160, 36);
  }
}
