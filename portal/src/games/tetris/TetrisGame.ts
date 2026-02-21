import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { BLOCKS, COLORS, type BlockDef, type Pos } from "./blocks";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

const ROWS = 20;
const COLS = 10;
const CELL = 30;
const GRID_X = 15;
const GRID_Y = 15;
const WIDTH = 520;
const HEIGHT = 640;
const DROP_INTERVAL = 215;
const BG = "#0a0c1a";
const GRID_LINE = "rgba(100, 120, 180, 0.08)";

const CONFIG = {
  id: "tetris",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

interface ActiveBlock {
  def: BlockDef;
  rotation: number;
  rowOffset: number;
  colOffset: number;
}

export class TetrisGame extends BaseGame {
  private _dropInterval = 215;
  private grid: number[][] = [];
  private current!: ActiveBlock;
  private next!: ActiveBlock;
  private bag: BlockDef[] = [];
  private dropTimer = 0;
  private isGameOver = false;
  private linesCleared = 0;
  private level = 1;
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
      this.best = parseInt(localStorage.getItem("tetris-best") || "0", 10);
    } catch {
      this.best = 0;
    }
  }

  private saveBest(): void {
    try {
      localStorage.setItem("tetris-best", String(this.best));
    } catch { /* ignore */ }
  }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._dropInterval = Math.round(diffValue(d, 350, 215, 120));

    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.bag = [];
    this.current = this.spawnBlock();
    this.next = this.spawnBlock();
    this.dropTimer = 0;
    this.isGameOver = false;
    this.linesCleared = 0;
    this.level = 1;
    this.setScore(0);
  }

  private shuffleBag(): BlockDef[] {
    const arr = [...BLOCKS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private spawnBlock(): ActiveBlock {
    if (this.bag.length === 0) this.bag = this.shuffleBag();
    const def = this.bag.pop()!;
    return { def, rotation: 0, rowOffset: 0, colOffset: def.colOffset };
  }

  private getCells(block: ActiveBlock): Pos[] {
    return block.def.cells[block.rotation].map((p) => ({
      row: p.row + block.rowOffset,
      col: p.col + block.colOffset,
    }));
  }

  private isInside(row: number, col: number): boolean {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  private fits(block: ActiveBlock): boolean {
    return this.getCells(block).every(
      (p) => this.isInside(p.row, p.col) && this.grid[p.row][p.col] === 0
    );
  }

  private getGhostRow(): number {
    let ghostOffset = this.current.rowOffset;
    const test = { ...this.current };
    while (true) {
      test.rowOffset = ghostOffset + 1;
      if (!this.fits(test)) break;
      ghostOffset++;
    }
    return ghostOffset;
  }

  private lockBlock(): void {
    for (const p of this.getCells(this.current)) {
      this.grid[p.row][p.col] = this.current.def.id;
    }
    const cleared = this.clearRows();
    this.linesCleared += cleared;
    this.level = Math.floor(this.linesCleared / 10) + 1;

    // Standard scoring
    const points = [0, 100, 300, 500, 800];
    this.setScore(this.score + (points[cleared] || 0));

    if (this.score > this.best) {
      this.best = this.score;
      this.saveBest();
    }

    this.current = this.next;
    this.next = this.spawnBlock();

    if (!this.fits(this.current)) {
      this.isGameOver = true;
      this.gameOver();
    }
  }

  private clearRows(): number {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every((c) => c !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // re-check same index
      }
    }
    return cleared;
  }

  private moveBlock(dr: number, dc: number): boolean {
    this.current.rowOffset += dr;
    this.current.colOffset += dc;
    if (!this.fits(this.current)) {
      this.current.rowOffset -= dr;
      this.current.colOffset -= dc;
      return false;
    }
    return true;
  }

  private rotateBlock(): void {
    const prev = this.current.rotation;
    this.current.rotation = (this.current.rotation + 1) % 4;
    if (!this.fits(this.current)) {
      // Wall kick: try shifting left/right
      this.current.colOffset += 1;
      if (this.fits(this.current)) return;
      this.current.colOffset -= 2;
      if (this.fits(this.current)) return;
      this.current.colOffset += 1;
      this.current.rotation = prev;
    }
  }

  private hardDrop(): void {
    let rows = 0;
    while (this.moveBlock(1, 0)) {
      rows++;
    }
    this.setScore(this.score + rows * 2);
    this.lockBlock();
  }

  update(dt: number): void {
    if (this.isGameOver) return;

    if (this.input.isKeyJustPressed("ArrowLeft")) this.moveBlock(0, -1);
    if (this.input.isKeyJustPressed("ArrowRight")) this.moveBlock(0, 1);
    if (this.input.isKeyJustPressed("ArrowUp")) this.rotateBlock();
    if (this.input.isKeyJustPressed("ArrowDown")) {
      if (this.moveBlock(1, 0)) this.setScore(this.score + 1);
    }
    if (this.input.isKeyJustPressed("Space")) {
      this.hardDrop();
      return;
    }

    const speed = Math.max(this._dropInterval - (this.level - 1) * 15, 80);
    this.dropTimer += dt;
    if (this.dropTimer >= speed) {
      this.dropTimer -= speed;
      if (!this.moveBlock(1, 0)) {
        this.lockBlock();
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;
    const gridW = COLS * CELL;
    const gridH = ROWS * CELL;

    // Grid background
    ctx.fillStyle = "#0d1025";
    ctx.beginPath();
    ctx.roundRect(GRID_X - 2, GRID_Y - 2, gridW + 4, gridH + 4, 4);
    ctx.fill();

    // Grid cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GRID_X + c * CELL;
        const y = GRID_Y + r * CELL;
        if (this.grid[r][c] !== 0) {
          ctx.fillStyle = COLORS[this.grid[r][c]];
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
          // Highlight
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
        } else {
          ctx.fillStyle = GRID_LINE;
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = "#0d1025";
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Ghost piece
    const ghostRow = this.getGhostRow();
    if (ghostRow !== this.current.rowOffset) {
      const ghostBlock = { ...this.current, rowOffset: ghostRow };
      const ghostCells = this.getCells(ghostBlock);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeStyle = `${COLORS[this.current.def.id]}44`;
      ctx.lineWidth = 1;
      for (const p of ghostCells) {
        const x = GRID_X + p.col * CELL;
        const y = GRID_Y + p.row * CELL;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      }
    }

    // Current block
    const color = COLORS[this.current.def.id];
    ctx.fillStyle = color;
    for (const p of this.getCells(this.current)) {
      const x = GRID_X + p.col * CELL;
      const y = GRID_Y + p.row * CELL;
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
      ctx.fillStyle = color;
    }

    // Side panel
    const panelX = GRID_X + gridW + 20;

    // Score
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCORE", panelX + 80, 30);

    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(this.score), panelX + 80, 58);

    // Best
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`BEST ${this.best}`, panelX + 80, 78);

    // Level
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("LEVEL", panelX + 80, 110);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText(String(this.level), panelX + 80, 135);

    // Lines
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("LINES", panelX + 80, 165);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText(String(this.linesCleared), panelX + 80, 188);

    // Next label
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("NEXT", panelX + 80, 230);

    // Next panel bg
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.roundRect(panelX + 15, 245, 130, 120, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Next block preview
    const nextCells = this.next.def.cells[0];
    ctx.fillStyle = COLORS[this.next.def.id];
    const previewCell = 22;
    // Center the preview
    let minC = 10, maxC = 0, minR = 10, maxR = 0;
    for (const p of nextCells) {
      if (p.col < minC) minC = p.col;
      if (p.col > maxC) maxC = p.col;
      if (p.row < minR) minR = p.row;
      if (p.row > maxR) maxR = p.row;
    }
    const pw = (maxC - minC + 1) * previewCell;
    const ph = (maxR - minR + 1) * previewCell;
    const pox = panelX + 80 - pw / 2;
    const poy = 305 - ph / 2;
    for (const p of nextCells) {
      ctx.fillRect(
        pox + (p.col - minC) * previewCell,
        poy + (p.row - minR) * previewCell,
        previewCell - 2,
        previewCell - 2
      );
    }

    // Controls hint
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText("SPACE = Drop", panelX + 80, gridH - 5);
  }
}
