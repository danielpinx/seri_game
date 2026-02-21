import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

// ── Config ──────────────────────────────────────────────────────────
const W = 540;
const H = 700;
const BG = "#0a0c14";
const FPS = 60;

const GRID_SIZE = 9;
const CELL = 52;
const GRID_PX = GRID_SIZE * CELL; // 468
const GX = Math.floor((W - GRID_PX) / 2); // grid left
const GY = 60; // grid top

const THIN = 1;
const THICK = 3;

// Colors
const CLR_FIXED = "#ffffff";
const CLR_PLAYER = "#00d4ff";
const CLR_CONFLICT = "#ff4466";
const CLR_SELECT_BG = "rgba(0,212,255,0.18)";
const CLR_SAME_BG = "rgba(0,212,255,0.08)";
const CLR_CONFLICT_BG = "rgba(255,68,102,0.2)";
const CLR_GRID_LINE = "rgba(255,255,255,0.12)";
const CLR_BOX_LINE = "rgba(0,212,255,0.5)";
const CLR_GRID_BG = "rgba(255,255,255,0.03)";

// Number pad
const PAD_Y = GY + GRID_PX + 30;
const PAD_CELL = 48;
const PAD_GAP = 6;
const PAD_TOTAL = 9 * PAD_CELL + 8 * PAD_GAP;
const PAD_X = Math.floor((W - PAD_TOTAL) / 2);

const REMOVE_COUNT = 40; // cells to remove for medium difficulty

const CONFIG = { id: "sudoku", width: W, height: H, fps: FPS, backgroundColor: BG };

export class SudokuGame extends BaseGame {
  // Puzzle state
  private solution: number[][] = [];
  private puzzle: number[][] = [];    // 0 = empty
  private fixed: boolean[][] = [];    // true = original clue
  private player: number[][] = [];    // player-entered values (0 = empty)

  // Selection
  private selRow = -1;
  private selCol = -1;

  // Stats
  private mistakes = 0;
  private startTime = 0;
  private elapsed = 0; // ms

  // Win state
  private won = false;
  private winTime = 0;

  // Mouse tracking
  private wasMouseDown = false;

  private _removeCount = 40;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    super(canvas, CONFIG, cb);
  }

  init(): void {
    this.newGame();
  }

  reset(): void {
    this.newGame();
  }

  private newGame(): void {
    const d = useSettingsStore.getState().difficulty;
    this._removeCount = Math.round(diffValue(d, 28, 40, 52));
    this.solution = this.generateSolution();
    this.puzzle = this.solution.map(r => [...r]);
    this.fixed = Array.from({ length: 9 }, () => Array(9).fill(true));
    this.player = Array.from({ length: 9 }, () => Array(9).fill(0));

    this.removeClues(this._removeCount);

    this.selRow = -1;
    this.selCol = -1;
    this.mistakes = 0;
    this.startTime = performance.now();
    this.elapsed = 0;
    this.won = false;
    this.winTime = 0;
    this.setScore(0);
  }

  // ── Puzzle Generation ───────────────────────────────────────────────

  private generateSolution(): number[][] {
    const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.fillGrid(grid);
    return grid;
  }

  private fillGrid(grid: number[][]): boolean {
    const empty = this.findEmpty(grid);
    if (!empty) return true;
    const [row, col] = empty;

    const nums = this.shuffledNums();
    for (const n of nums) {
      if (this.isValid(grid, row, col, n)) {
        grid[row][col] = n;
        if (this.fillGrid(grid)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  private findEmpty(grid: number[][]): [number, number] | null {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (grid[r][c] === 0) return [r, c];
    return null;
  }

  private isValid(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let c = 0; c < 9; c++)
      if (grid[row][c] === num) return false;
    // Check column
    for (let r = 0; r < 9; r++)
      if (grid[r][col] === num) return false;
    // Check 3x3 box
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (grid[r][c] === num) return false;
    return true;
  }

  private shuffledNums(): number[] {
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private removeClues(count: number): void {
    const cells: [number, number][] = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        cells.push([r, c]);

    // Shuffle cells
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    let removed = 0;
    for (const [r, c] of cells) {
      if (removed >= count) break;
      this.puzzle[r][c] = 0;
      this.fixed[r][c] = false;
      removed++;
    }
  }

  // ── Conflict Detection ─────────────────────────────────────────────

  private hasConflict(row: number, col: number, num: number): boolean {
    if (num === 0) return false;

    // Check row
    for (let c = 0; c < 9; c++) {
      if (c === col) continue;
      if (this.getCellValue(row, c) === num) return true;
    }
    // Check column
    for (let r = 0; r < 9; r++) {
      if (r === row) continue;
      if (this.getCellValue(r, col) === num) return true;
    }
    // Check 3x3 box
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++) {
        if (r === row && c === col) continue;
        if (this.getCellValue(r, c) === num) return true;
      }
    return false;
  }

  private getCellValue(r: number, c: number): number {
    if (this.fixed[r][c]) return this.puzzle[r][c];
    return this.player[r][c];
  }

  // ── Completion Check ───────────────────────────────────────────────

  private checkWin(): boolean {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const v = this.getCellValue(r, c);
        if (v === 0) return false;
        if (v !== this.solution[r][c]) return false;
      }
    return true;
  }

  // ── Update ─────────────────────────────────────────────────────────

  update(dt: number): void {
    if (this.won) {
      this.winTime += dt;
      if (this.winTime >= 3000) {
        this.newGame();
      }
      return;
    }

    this.elapsed = performance.now() - this.startTime;

    const mouseDown = this.input.isMouseDown(0);
    const mouseClicked = mouseDown && !this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    if (mouseClicked) {
      const { x, y } = this.input.getMousePosition();
      this.handleClick(x, y);
    }

    // Keyboard number input
    for (let n = 1; n <= 9; n++) {
      if (this.input.isKeyJustPressed(`Digit${n}`)) {
        this.enterNumber(n);
      }
      if (this.input.isKeyJustPressed(`Numpad${n}`)) {
        this.enterNumber(n);
      }
    }

    // Clear cell
    if (this.input.isKeyJustPressed("Backspace") || this.input.isKeyJustPressed("Delete") || this.input.isKeyJustPressed("Digit0") || this.input.isKeyJustPressed("Numpad0")) {
      this.enterNumber(0);
    }

    // Arrow key navigation
    if (this.input.isKeyJustPressed("ArrowUp") && this.selRow > 0) this.selRow--;
    if (this.input.isKeyJustPressed("ArrowDown") && this.selRow < 8) this.selRow++;
    if (this.input.isKeyJustPressed("ArrowLeft") && this.selCol > 0) this.selCol--;
    if (this.input.isKeyJustPressed("ArrowRight") && this.selCol < 8) this.selCol++;

    // If arrows pressed and no cell selected yet, select center
    if ((this.input.isKeyJustPressed("ArrowUp") || this.input.isKeyJustPressed("ArrowDown") ||
         this.input.isKeyJustPressed("ArrowLeft") || this.input.isKeyJustPressed("ArrowRight")) &&
        this.selRow === -1) {
      this.selRow = 4;
      this.selCol = 4;
    }
  }

  private handleClick(x: number, y: number): void {
    // Check grid click
    if (x >= GX && x < GX + GRID_PX && y >= GY && y < GY + GRID_PX) {
      const col = Math.floor((x - GX) / CELL);
      const row = Math.floor((y - GY) / CELL);
      if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        this.selRow = row;
        this.selCol = col;
      }
      return;
    }

    // Check number pad click
    if (y >= PAD_Y && y < PAD_Y + PAD_CELL) {
      for (let n = 0; n < 9; n++) {
        const px = PAD_X + n * (PAD_CELL + PAD_GAP);
        if (x >= px && x < px + PAD_CELL) {
          this.enterNumber(n + 1);
          return;
        }
      }
    }
  }

  private enterNumber(num: number): void {
    if (this.selRow < 0 || this.selCol < 0) return;
    if (this.fixed[this.selRow][this.selCol]) return;
    if (this.won) return;

    if (num === 0) {
      this.player[this.selRow][this.selCol] = 0;
      return;
    }

    this.player[this.selRow][this.selCol] = num;

    // Check if wrong
    if (num !== this.solution[this.selRow][this.selCol]) {
      this.mistakes++;
    }

    // Check win
    if (this.checkWin()) {
      this.won = true;
      this.winTime = 0;
      const finalScore = Math.max(0, 1000 - this.mistakes * 50);
      this.setScore(finalScore);
    }
  }

  // ── Draw ───────────────────────────────────────────────────────────

  draw(): void {
    const ctx = this.ctx;

    this.drawHeader(ctx);
    this.drawGrid(ctx);
    this.drawNumberPad(ctx);

    if (this.won) {
      this.drawWinOverlay(ctx);
    }
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    // Title
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillStyle = CLR_PLAYER;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SUDOKU", W / 2, 25);

    // Mistakes
    ctx.font = "14px Inter, sans-serif";
    ctx.fillStyle = this.mistakes > 0 ? CLR_CONFLICT : "rgba(255,255,255,0.5)";
    ctx.textAlign = "left";
    ctx.fillText(`Mistakes: ${this.mistakes}`, GX, 48);

    // Timer
    const totalSec = Math.floor(this.elapsed / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const timeStr = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    ctx.font = "14px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "right";
    ctx.fillText(timeStr, GX + GRID_PX, 48);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const selVal = (this.selRow >= 0 && this.selCol >= 0) ? this.getCellValue(this.selRow, this.selCol) : 0;

    // Draw grid background
    ctx.fillStyle = CLR_GRID_BG;
    ctx.beginPath();
    ctx.roundRect(GX - 4, GY - 4, GRID_PX + 8, GRID_PX + 8, 8);
    ctx.fill();

    // Draw cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = GX + c * CELL;
        const y = GY + r * CELL;
        const val = this.getCellValue(r, c);
        const isSelected = r === this.selRow && c === this.selCol;
        const isSameNumber = selVal > 0 && val === selVal && !isSelected;
        const isConflict = !this.fixed[r][c] && this.player[r][c] > 0 && this.hasConflict(r, c, this.player[r][c]);
        const isSameRowCol = this.selRow >= 0 && (r === this.selRow || c === this.selCol);
        const isSameBox = this.selRow >= 0 &&
          Math.floor(r / 3) === Math.floor(this.selRow / 3) &&
          Math.floor(c / 3) === Math.floor(this.selCol / 3);

        // Cell background
        if (isSelected) {
          ctx.fillStyle = CLR_SELECT_BG;
          ctx.fillRect(x, y, CELL, CELL);
        } else if (isConflict) {
          ctx.fillStyle = CLR_CONFLICT_BG;
          ctx.fillRect(x, y, CELL, CELL);
        } else if (isSameNumber) {
          ctx.fillStyle = CLR_SAME_BG;
          ctx.fillRect(x, y, CELL, CELL);
        } else if (isSameRowCol || isSameBox) {
          ctx.fillStyle = "rgba(255,255,255,0.02)";
          ctx.fillRect(x, y, CELL, CELL);
        }

        // Cell value
        if (val > 0) {
          if (this.fixed[r][c]) {
            ctx.font = "bold 22px Inter, sans-serif";
            ctx.fillStyle = CLR_FIXED;
          } else {
            ctx.font = "22px Inter, sans-serif";
            ctx.fillStyle = isConflict ? CLR_CONFLICT : CLR_PLAYER;
          }
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(val), x + CELL / 2, y + CELL / 2 + 1);
        }
      }
    }

    // Draw thin grid lines (cell borders)
    ctx.strokeStyle = CLR_GRID_LINE;
    ctx.lineWidth = THIN;
    for (let i = 1; i < 9; i++) {
      if (i % 3 === 0) continue; // skip box borders for now
      // Vertical
      const vx = GX + i * CELL;
      ctx.beginPath();
      ctx.moveTo(vx, GY);
      ctx.lineTo(vx, GY + GRID_PX);
      ctx.stroke();
      // Horizontal
      const hy = GY + i * CELL;
      ctx.beginPath();
      ctx.moveTo(GX, hy);
      ctx.lineTo(GX + GRID_PX, hy);
      ctx.stroke();
    }

    // Draw thick box lines (3x3 borders)
    ctx.strokeStyle = CLR_BOX_LINE;
    ctx.lineWidth = THICK;
    for (let i = 0; i <= 3; i++) {
      // Vertical
      const vx = GX + i * 3 * CELL;
      ctx.beginPath();
      ctx.moveTo(vx, GY);
      ctx.lineTo(vx, GY + GRID_PX);
      ctx.stroke();
      // Horizontal
      const hy = GY + i * 3 * CELL;
      ctx.beginPath();
      ctx.moveTo(GX, hy);
      ctx.lineTo(GX + GRID_PX, hy);
      ctx.stroke();
    }

    // Draw selected cell highlight border
    if (this.selRow >= 0 && this.selCol >= 0) {
      const sx = GX + this.selCol * CELL;
      const sy = GY + this.selRow * CELL;
      ctx.strokeStyle = CLR_PLAYER;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, CELL - 2, CELL - 2);
    }
  }

  private drawNumberPad(ctx: CanvasRenderingContext2D): void {
    for (let n = 0; n < 9; n++) {
      const x = PAD_X + n * (PAD_CELL + PAD_GAP);
      const num = n + 1;

      // Count how many of this number are placed
      let placed = 0;
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (this.getCellValue(r, c) === num) placed++;

      const completed = placed >= 9;

      // Button background
      ctx.fillStyle = completed ? "rgba(255,255,255,0.03)" : "rgba(0,212,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(x, PAD_Y, PAD_CELL, PAD_CELL, 8);
      ctx.fill();

      // Button border
      ctx.strokeStyle = completed ? "rgba(255,255,255,0.05)" : "rgba(0,212,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, PAD_Y, PAD_CELL, PAD_CELL, 8);
      ctx.stroke();

      // Number text
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillStyle = completed ? "rgba(255,255,255,0.15)" : CLR_PLAYER;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(num), x + PAD_CELL / 2, PAD_Y + PAD_CELL / 2 + 1);
    }

    // Instructions
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.textAlign = "center";
    ctx.fillText("Click cell + press 1-9 | Backspace to clear", W / 2, PAD_Y + PAD_CELL + 24);
  }

  private drawWinOverlay(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(10,12,20,0.7)";
    ctx.fillRect(0, 0, W, H);

    // Win box
    const bw = 300, bh = 140;
    const bx = (W - bw) / 2, by = (H - bh) / 2;

    ctx.fillStyle = "rgba(0,212,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 16);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,212,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 16);
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = CLR_PLAYER;
    ctx.shadowBlur = 20;
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillStyle = CLR_PLAYER;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PUZZLE COMPLETE!", W / 2, by + 45);
    ctx.shadowBlur = 0;

    const totalSec = Math.floor(this.elapsed / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const timeStr = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    ctx.font = "16px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`Time: ${timeStr}  |  Score: ${this.score}`, W / 2, by + 85);

    ctx.font = "13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("New puzzle in a moment...", W / 2, by + 115);
  }
}
