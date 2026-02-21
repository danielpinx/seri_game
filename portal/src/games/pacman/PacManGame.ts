import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

const WIDTH = 640;
const HEIGHT = 740;
const BG = "#060610";
const COLS = 19;
const ROWS = 21;
const CELL = 32;
const GRID_X = Math.floor((WIDTH - COLS * CELL) / 2);
const GRID_Y = 68;

const CONFIG = { id: "pacman", width: WIDTH, height: HEIGHT, fps: 60, backgroundColor: BG };

// 0=path, 1=wall
const MAZE: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
  [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
  [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
  [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
  [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
  [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
  [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const POWER_POS: [number, number][] = [[1,3],[17,3],[1,15],[17,15]];
const PAC_COL = 9, PAC_ROW = 15;
const GHOST_SPAWNS: [number, number][] = [[9,9],[8,9],[10,9],[9,7]];
const GHOST_COLORS = ["#ff2e97","#ffb8ff","#00d4ff","#ffd700"];
const SCARED_COLOR = "#2121de";

const PAC_SPEED = 5.5;
const GHOST_SPEED = 4.5;
const SCARED_SPEED = 2.5;
const SCARED_MS = 7000;

// Dir: 0=right, 1=down, 2=left, 3=up
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

interface Ghost {
  col: number; row: number; dir: number;
  progress: number; scared: boolean; eaten: boolean;
  wait: number;
}

export class PacManGame extends BaseGame {
  private _ghostSpeed = 4.5;
  private _scaredMs = 7000;

  private pCol = PAC_COL;
  private pRow = PAC_ROW;
  private pDir = 2;
  private pNext = 2;
  private pProg = 0;
  private pMoving = false;
  private mouth = 0.3;
  private mouthD = 1;

  private ghosts: Ghost[] = [];
  private dots: boolean[][] = [];
  private pows: boolean[][] = [];
  private scaredT = 0;
  private eatMul = 0;
  private lives = 3;
  private level = 1;
  private best = 0;
  private totalDots = 0;
  private eaten = 0;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) { super(canvas, CONFIG, cb); }

  init(): void {
    try { this.best = parseInt(localStorage.getItem("pacman-best") || "0", 10); } catch { this.best = 0; }
    this.resetFull();
  }

  reset(): void { this.level = 1; this.resetFull(); }

  private saveBest(): void {
    try { localStorage.setItem("pacman-best", String(this.best)); } catch {}
  }

  private wall(c: number, r: number): boolean {
    if (r < 0 || r >= ROWS) return true;
    if (c < 0 || c >= COLS) return r !== 9;
    return MAZE[r][c] === 1;
  }

  private wrapC(c: number): number { return c < 0 ? COLS - 1 : c >= COLS ? 0 : c; }

  private noDot(c: number, r: number): boolean {
    if (r === 7 && c >= 7 && c <= 11) return true;
    if (r === 8 && c === 9) return true;
    if (r === 9 && c >= 8 && c <= 10) return true;
    if (r === 11 && c >= 7 && c <= 11) return true;
    if (c === PAC_COL && r === PAC_ROW) return true;
    return false;
  }

  private initDots(): void {
    this.dots = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    this.pows = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    this.totalDots = 0;
    this.eaten = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (MAZE[r][c] === 0 && !this.noDot(c, r)) { this.dots[r][c] = true; this.totalDots++; }
    for (const [c, r] of POWER_POS) {
      if (this.dots[r][c]) { this.dots[r][c] = false; this.totalDots--; }
      this.pows[r][c] = true; this.totalDots++;
    }
  }

  private resetFull(): void {
    const d = useSettingsStore.getState().difficulty;
    this._ghostSpeed = diffValue(d, 3.5, 4.5, 5.5);
    this._scaredMs = Math.round(diffValue(d, 9000, 7000, 5000));

    this.initDots();
    this.lives = 3;
    this.setScore(0);
    this.resetPos();
  }

  private resetPos(): void {
    this.pCol = PAC_COL; this.pRow = PAC_ROW;
    this.pDir = 2; this.pNext = 2; this.pProg = 0; this.pMoving = false;
    this.scaredT = 0; this.eatMul = 0;
    this.ghosts = GHOST_SPAWNS.map(([c, r], i) => ({
      col: c, row: r, dir: 3, progress: 0,
      scared: false, eaten: false, wait: i * 2500,
    }));
  }

  private canGo(c: number, r: number, d: number): boolean {
    return !this.wall(c + DX[d], r + DY[d]);
  }

  private addPts(n: number): void {
    this.setScore(this.score + n);
    if (this.score > this.best) { this.best = this.score; this.saveBest(); }
  }

  update(dt: number): void {
    const ds = dt / 1000;

    // Mouth anim
    this.mouth += this.mouthD * dt * 0.008;
    if (this.mouth > 0.4) { this.mouth = 0.4; this.mouthD = -1; }
    if (this.mouth < 0.05) { this.mouth = 0.05; this.mouthD = 1; }

    // Scared timer
    if (this.scaredT > 0) {
      this.scaredT -= dt;
      if (this.scaredT <= 0) {
        this.scaredT = 0;
        for (const g of this.ghosts) g.scared = false;
        this.eatMul = 0;
      }
    }

    // Input (continuous hold)
    if (this.input.isKeyDown("ArrowRight")) this.pNext = 0;
    else if (this.input.isKeyDown("ArrowDown")) this.pNext = 1;
    else if (this.input.isKeyDown("ArrowLeft")) this.pNext = 2;
    else if (this.input.isKeyDown("ArrowUp")) this.pNext = 3;

    // Move Pac-Man
    if (this.pMoving) {
      this.pProg += PAC_SPEED * ds;
      if (this.pProg >= 1) {
        this.pCol = this.wrapC(this.pCol + DX[this.pDir]);
        this.pRow += DY[this.pDir];
        this.pProg = 0;
        this.pMoving = false;
        // Eat
        if (this.dots[this.pRow]?.[this.pCol]) {
          this.dots[this.pRow][this.pCol] = false;
          this.addPts(10); this.eaten++;
        }
        if (this.pows[this.pRow]?.[this.pCol]) {
          this.pows[this.pRow][this.pCol] = false;
          this.addPts(50); this.eaten++;
          this.scaredT = this._scaredMs; this.eatMul = 0;
          for (const g of this.ghosts) if (!g.eaten) g.scared = true;
        }
        if (this.eaten >= this.totalDots) { this.nextLevel(); return; }
      }
    }
    if (!this.pMoving) {
      if (this.canGo(this.pCol, this.pRow, this.pNext)) {
        this.pDir = this.pNext; this.pMoving = true; this.pProg = 0;
      } else if (this.canGo(this.pCol, this.pRow, this.pDir)) {
        this.pMoving = true; this.pProg = 0;
      }
    }

    // Ghosts
    const px = this.pCol + (this.pMoving ? DX[this.pDir] * this.pProg : 0);
    const py = this.pRow + (this.pMoving ? DY[this.pDir] * this.pProg : 0);

    for (const g of this.ghosts) {
      // Waiting to release
      if (g.wait > 0) { g.wait -= dt; if (g.wait <= 0) { g.col = 9; g.row = 7; g.dir = 2; g.progress = 0; } continue; }
      // Eaten ghost returning
      if (g.eaten) { g.wait -= dt; if (g.wait <= 0) { g.eaten = false; g.col = 9; g.row = 7; g.dir = 2; g.progress = 0; } continue; }

      const spd = g.scared ? SCARED_SPEED : this._ghostSpeed;
      g.progress += spd * ds;
      if (g.progress >= 1) {
        g.col = this.wrapC(g.col + DX[g.dir]);
        g.row += DY[g.dir];
        g.progress = 0;
        // Choose direction
        const opp = (g.dir + 2) % 4;
        const valid = [0,1,2,3].filter(d => d !== opp && this.canGo(g.col, g.row, d));
        if (valid.length === 0) {
          if (this.canGo(g.col, g.row, opp)) g.dir = opp;
        } else if (g.scared) {
          g.dir = valid[Math.floor(Math.random() * valid.length)];
        } else {
          let best = valid[0], bestD = Infinity;
          for (const d of valid) {
            const nc = g.col + DX[d], nr = g.row + DY[d];
            const dist = Math.hypot(nc - this.pCol, nr - this.pRow);
            if (dist < bestD) { bestD = dist; best = d; }
          }
          g.dir = best;
        }
      }

      // Collision
      const gx = g.col + DX[g.dir] * g.progress;
      const gy = g.row + DY[g.dir] * g.progress;
      if (Math.hypot(px - gx, py - gy) < 0.8) {
        if (g.scared) {
          this.eatMul++;
          this.addPts(200 * this.eatMul);
          g.eaten = true; g.scared = false; g.wait = 3000;
        } else {
          this.lives--;
          if (this.lives <= 0) { this.gameOver(); return; }
          this.resetPos(); return;
        }
      }
    }
  }

  private nextLevel(): void {
    this.level++;
    this.initDots();
    this.resetPos();
  }

  draw(): void {
    const ctx = this.ctx;

    // Maze walls
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAZE[r][c] !== 1) continue;
        const x = GRID_X + c * CELL, y = GRID_Y + r * CELL;
        ctx.fillStyle = "#1a1a3e";
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = "rgba(108,92,231,0.35)";
        ctx.lineWidth = 1.5;
        if (r > 0 && MAZE[r-1][c] === 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke(); }
        if (r < ROWS-1 && MAZE[r+1][c] === 0) { ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (c > 0 && MAZE[r][c-1] === 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke(); }
        if (c < COLS-1 && MAZE[r][c+1] === 0) { ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
      }
    }

    // Dots & power pellets
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = GRID_X + c * CELL + CELL / 2, cy = GRID_Y + r * CELL + CELL / 2;
        if (this.dots[r][c]) {
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        }
        if (this.pows[r][c]) {
          const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
          ctx.fillStyle = `rgba(255,215,0,${pulse})`;
          ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Pac-Man
    const pcx = GRID_X + (this.pCol + (this.pMoving ? DX[this.pDir] * this.pProg : 0)) * CELL + CELL / 2;
    const pcy = GRID_Y + (this.pRow + (this.pMoving ? DY[this.pDir] * this.pProg : 0)) * CELL + CELL / 2;
    const pa = [0, Math.PI / 2, Math.PI, -Math.PI / 2][this.pDir];
    ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(pcx, pcy, CELL / 2 - 2, pa + this.mouth, pa + Math.PI * 2 - this.mouth);
    ctx.lineTo(pcx, pcy);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    // Ghosts
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      if (g.eaten || g.wait > 0) continue;
      const gx = GRID_X + (g.col + DX[g.dir] * g.progress) * CELL + CELL / 2;
      const gy = GRID_Y + (g.row + DY[g.dir] * g.progress) * CELL + CELL / 2;
      const gr = CELL / 2 - 2;
      let color = GHOST_COLORS[i];
      if (g.scared) color = this.scaredT < 2000 && Math.floor(this.scaredT / 150) % 2 === 0 ? "#fff" : SCARED_COLOR;

      ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(gx, gy - 2, gr, Math.PI, 0);
      const bot = gy + gr - 2;
      ctx.lineTo(gx + gr, bot);
      for (let w = 0; w < 3; w++) {
        const wx = gx + gr - w * (gr * 2 / 3);
        ctx.quadraticCurveTo(wx - gr / 6, bot + 4, wx - gr / 3, bot);
        ctx.quadraticCurveTo(wx - gr / 2, bot - 3, wx - gr * 2 / 3, bot);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      if (!g.scared) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(gx - 4, gy - 3, 4, 0, Math.PI * 2); ctx.arc(gx + 4, gy - 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1a1a2e";
        ctx.beginPath();
        ctx.arc(gx - 4 + DX[g.dir] * 2, gy - 3 + DY[g.dir] * 2, 2, 0, Math.PI * 2);
        ctx.arc(gx + 4 + DX[g.dir] * 2, gy - 3 + DY[g.dir] * 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // UI
    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("SCORE", 20, 24);
    ctx.fillStyle = "#ffd700"; ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(this.score), 20, 48);
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`BEST ${this.best}`, 20, 62);

    ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`LEVEL ${this.level}`, WIDTH / 2, 24);

    ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText("LIVES", WIDTH - 20, 24);
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = "#ffd700";
      ctx.beginPath(); ctx.arc(WIDTH - 30 - i * 22, 44, 7, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(WIDTH - 30 - i * 22, 44); ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Arrow keys to move", WIDTH / 2, HEIGHT - 12);
  }
}
