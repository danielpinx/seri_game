import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

const W = 620, H = 680, BG = "#0a0c1a";
const COLS = 7, ROWS = 6;
const CELL = 76;
const GX = Math.floor((W - COLS * CELL) / 2); // grid left
const GY = 90; // grid top
const RAD = 30; // disc radius

const CONFIG = { id: "connect4", width: W, height: H, fps: 60, backgroundColor: BG };

const EMPTY = 0, PLAYER = 1, CPU = 2;
const P_COLOR = "#ff2e97"; // magenta
const C_COLOR = "#00d4ff"; // cyan

interface Drop {
  col: number;
  row: number;
  who: number;
  y: number; // current pixel Y (animating)
  targetY: number;
}

export class Connect4Game extends BaseGame {
  private grid: number[][] = [];
  private turn = PLAYER;
  private won = 0; // 0=none, 1=player, 2=cpu, 3=draw
  private winCells: [number, number][] = [];
  private hover = -1; // column mouse is over
  private drop: Drop | null = null;
  private cpuDelay = 0;
  private best = 0;
  private pm = false;
  private _aiDepth = 5;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) { super(canvas, CONFIG, cb); }

  init(): void {
    try { this.best = parseInt(localStorage.getItem("connect4-best") || "0", 10); } catch { this.best = 0; }
    this.resetState();
  }

  reset(): void { this.resetState(); }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._aiDepth = Math.round(diffValue(d, 2, 5, 7));
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    this.turn = PLAYER;
    this.won = 0;
    this.winCells = [];
    this.drop = null;
    this.cpuDelay = 0;
    this.setScore(0);
  }

  private canDrop(col: number): boolean {
    return this.grid[0][col] === EMPTY;
  }

  private getRow(col: number): number {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r][col] === EMPTY) return r;
    }
    return -1;
  }

  private placePiece(col: number, who: number): number {
    const row = this.getRow(col);
    if (row < 0) return -1;
    this.grid[row][col] = who;
    return row;
  }

  private checkWin(who: number): [number, number][] | null {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] !== who) continue;
        for (const [dr, dc] of dirs) {
          const cells: [number, number][] = [];
          let ok = true;
          for (let i = 0; i < 4; i++) {
            const nr = r + dr * i, nc = c + dc * i;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || this.grid[nr][nc] !== who) { ok = false; break; }
            cells.push([nr, nc]);
          }
          if (ok) return cells;
        }
      }
    }
    return null;
  }

  private isDraw(): boolean {
    return this.grid[0].every(c => c !== EMPTY);
  }

  // ── AI (Minimax with alpha-beta) ──

  private evaluate(): number {
    if (this.checkWin(CPU)) return 1000;
    if (this.checkWin(PLAYER)) return -1000;
    let score = 0;
    // Prefer center
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r][3] === CPU) score += 3;
      if (this.grid[r][3] === PLAYER) score -= 3;
    }
    return score;
  }

  private minimax(depth: number, alpha: number, beta: number, maximizing: boolean): number {
    const w = this.checkWin(CPU) ? 1000 : this.checkWin(PLAYER) ? -1000 : 0;
    if (w !== 0) return w + (maximizing ? -depth : depth);
    if (this.isDraw() || depth === 0) return this.evaluate();

    if (maximizing) {
      let best = -Infinity;
      for (let c = 0; c < COLS; c++) {
        const r = this.getRow(c);
        if (r < 0) continue;
        this.grid[r][c] = CPU;
        best = Math.max(best, this.minimax(depth - 1, alpha, beta, false));
        this.grid[r][c] = EMPTY;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (let c = 0; c < COLS; c++) {
        const r = this.getRow(c);
        if (r < 0) continue;
        this.grid[r][c] = PLAYER;
        best = Math.min(best, this.minimax(depth - 1, alpha, beta, true));
        this.grid[r][c] = EMPTY;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private cpuMove(): number {
    let bestScore = -Infinity;
    let bestCol = 3;
    const order = [3, 2, 4, 1, 5, 0, 6]; // center first
    for (const c of order) {
      const r = this.getRow(c);
      if (r < 0) continue;
      this.grid[r][c] = CPU;
      const score = this.minimax(this._aiDepth, -Infinity, Infinity, false);
      this.grid[r][c] = EMPTY;
      if (score > bestScore) { bestScore = score; bestCol = c; }
    }
    return bestCol;
  }

  private startDrop(col: number, who: number): void {
    const row = this.getRow(col);
    if (row < 0) return;
    this.drop = {
      col, row, who,
      y: GY - CELL,
      targetY: GY + row * CELL + CELL / 2,
    };
  }

  private finishDrop(): void {
    if (!this.drop) return;
    this.grid[this.drop.row][this.drop.col] = this.drop.who;
    const who = this.drop.who;
    this.drop = null;

    const cells = this.checkWin(who);
    if (cells) {
      this.won = who;
      this.winCells = cells;
      if (who === PLAYER) {
        this.setScore(this.score + 100);
        if (this.score > this.best) { this.best = this.score; try { localStorage.setItem("connect4-best", String(this.best)); } catch {} }
      }
      this.gameOver();
      return;
    }
    if (this.isDraw()) {
      this.won = 3;
      this.gameOver();
      return;
    }

    this.turn = who === PLAYER ? CPU : PLAYER;
    if (this.turn === CPU) this.cpuDelay = 400;
  }

  update(dt: number): void {
    const m = this.input.getMousePosition();
    const down = this.input.isMouseDown(0);
    const jd = down && !this.pm;
    this.pm = down;

    // Hover
    this.hover = -1;
    if (m.y >= GY && m.y < GY + ROWS * CELL && m.x >= GX && m.x < GX + COLS * CELL) {
      this.hover = Math.floor((m.x - GX) / CELL);
    }

    // Animate drop
    if (this.drop) {
      this.drop.y += dt * 1.2;
      if (this.drop.y >= this.drop.targetY) {
        this.drop.y = this.drop.targetY;
        this.finishDrop();
      }
      return;
    }

    if (this.won) return;

    // CPU turn
    if (this.turn === CPU) {
      this.cpuDelay -= dt;
      if (this.cpuDelay <= 0) {
        const col = this.cpuMove();
        this.startDrop(col, CPU);
      }
      return;
    }

    // Player turn
    if (jd && this.hover >= 0 && this.canDrop(this.hover)) {
      this.startDrop(this.hover, PLAYER);
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Board background
    ctx.fillStyle = "rgba(108,92,231,0.08)";
    ctx.beginPath();
    ctx.roundRect(GX - 8, GY - 8, COLS * CELL + 16, ROWS * CELL + 16, 12);
    ctx.fill();

    // Hover indicator
    if (this.hover >= 0 && this.turn === PLAYER && !this.won && !this.drop) {
      const hx = GX + this.hover * CELL + CELL / 2;
      ctx.fillStyle = `${P_COLOR}40`;
      ctx.beginPath();
      ctx.arc(hx, GY - 20, RAD * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = GX + c * CELL + CELL / 2;
        const cy = GY + r * CELL + CELL / 2;

        // Cell bg
        ctx.fillStyle = "#0e0e24";
        ctx.beginPath();
        ctx.arc(cx, cy, RAD + 2, 0, Math.PI * 2);
        ctx.fill();

        const v = this.grid[r][c];
        if (v === EMPTY) {
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.beginPath();
          ctx.arc(cx, cy, RAD, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const isWin = this.winCells.some(([wr, wc]) => wr === r && wc === c);
          const color = v === PLAYER ? P_COLOR : C_COLOR;

          if (isWin) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
          }

          const g = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, RAD);
          g.addColorStop(0, v === PLAYER ? "#ff5cb5" : "#40e8ff");
          g.addColorStop(1, color);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, RAD, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.beginPath();
          ctx.arc(cx - 5, cy - 8, RAD * 0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        }
      }
    }

    // Dropping piece
    if (this.drop) {
      const cx = GX + this.drop.col * CELL + CELL / 2;
      const color = this.drop.who === PLAYER ? P_COLOR : C_COLOR;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, this.drop.y, RAD, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // UI
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("WINS", 20, 24);
    ctx.fillStyle = P_COLOR;
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(this.score / 100 | 0), 20, 48);

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`BEST ${this.best / 100 | 0}`, 20, 64);

    // Turn indicator
    ctx.textAlign = "center";
    if (!this.won && !this.drop) {
      const label = this.turn === PLAYER ? "YOUR TURN" : "CPU THINKING...";
      const col = this.turn === PLAYER ? P_COLOR : C_COLOR;
      ctx.fillStyle = `${col}90`;
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText(label, W / 2, 36);
    }

    // Legend
    ctx.textAlign = "right";
    ctx.fillStyle = P_COLOR;
    ctx.beginPath(); ctx.arc(W - 60, 28, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("YOU", W - 74, 33);

    ctx.fillStyle = C_COLOR;
    ctx.beginPath(); ctx.arc(W - 60, 52, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("CPU", W - 74, 57);

    // Bottom hint
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click a column to drop", W / 2, H - 12);
  }
}
