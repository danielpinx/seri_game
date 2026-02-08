import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

// ── Constants ──────────────────────────────────────────────────────────
const WIDTH = 520;
const HEIGHT = 700;
const BG = "#0a0c14";
const BOARD_SIZE = 10;
const CELL = 42;
const CELL_GAP = 2;
const BOARD_PX = BOARD_SIZE * CELL;
const BOARD_X = (WIDTH - BOARD_PX) / 2;
const BOARD_Y = 80;
const PIECE_AREA_Y = BOARD_Y + BOARD_PX + 20;
const PIECE_CELL = 22;
const PIECE_GAP = 1;
const HEADER_Y = 10;

const CONFIG = {
  id: "brick-builder",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

// ── Neon colors ────────────────────────────────────────────────────────
const PIECE_COLORS = [
  "#00d4ff", // cyan
  "#a855f7", // purple
  "#ff2e97", // pink
  "#22c55e", // green
  "#ffd700", // gold
  "#ff8c00", // orange
];

// ── Piece shapes as 2D boolean arrays ──────────────────────────────────
type Shape = boolean[][];

const SHAPES: Shape[] = [
  // 1x1 dot
  [[true]],
  // 1x2 horizontal
  [[true, true]],
  // 1x3 horizontal
  [[true, true, true]],
  // 1x4 horizontal
  [[true, true, true, true]],
  // 1x5 horizontal
  [[true, true, true, true, true]],
  // 2x1 vertical
  [[true], [true]],
  // 3x1 vertical
  [[true], [true], [true]],
  // 2x2 square
  [
    [true, true],
    [true, true],
  ],
  // 3x3 square
  [
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ],
  // L-shape (bottom-left)
  [
    [true, false],
    [true, false],
    [true, true],
  ],
  // L-shape (bottom-right)
  [
    [false, true],
    [false, true],
    [true, true],
  ],
  // L-shape (top-right, rotated)
  [
    [true, true],
    [true, false],
    [true, false],
  ],
  // T-shape
  [
    [true, true, true],
    [false, true, false],
  ],
  // S-shape
  [
    [false, true, true],
    [true, true, false],
  ],
  // Z-shape
  [
    [true, true, false],
    [false, true, true],
  ],
  // 2x3 rectangle
  [
    [true, true, true],
    [true, true, true],
  ],
  // 3x2 rectangle
  [
    [true, true],
    [true, true],
    [true, true],
  ],
];

interface Piece {
  shape: Shape;
  color: string;
  rows: number;
  cols: number;
  cellCount: number;
}

interface ClearAnim {
  cells: [number, number][];
  timer: number;
  duration: number;
}

function makePiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
  const rows = shape.length;
  const cols = shape[0].length;
  let cellCount = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (shape[r][c]) cellCount++;
  return { shape, color, rows, cols, cellCount };
}

function shapeWidth(piece: Piece): number {
  return piece.cols * PIECE_CELL + (piece.cols - 1) * PIECE_GAP;
}

function shapeHeight(piece: Piece): number {
  return piece.rows * PIECE_CELL + (piece.rows - 1) * PIECE_GAP;
}

// Hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Game class ─────────────────────────────────────────────────────────
export class BrickBuilderGame extends BaseGame {
  private board: (string | null)[][] = [];
  private pieces: (Piece | null)[] = [null, null, null];
  private dragging: number = -1; // index into pieces
  private dragOffX = 0;
  private dragOffY = 0;
  private wasMouseDown = false;
  private clearAnims: ClearAnim[] = [];
  private streak = 0;
  private bestStreak = 0;
  private hoverIndex = -1;

  // Ghost placement position (board coords)
  private ghostRow = -1;
  private ghostCol = -1;
  private ghostValid = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.resetState();
  }

  reset(): void {
    this.resetState();
  }

  private resetState(): void {
    this.board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null)
    );
    this.pieces = [makePiece(), makePiece(), makePiece()];
    this.dragging = -1;
    this.clearAnims = [];
    this.streak = 0;
    this.bestStreak = 0;
    this.hoverIndex = -1;
    this.ghostRow = -1;
    this.ghostCol = -1;
    this.ghostValid = false;
    this.wasMouseDown = false;
    this.setScore(0);
  }

  // Check if a piece fits at board position (row, col)
  private canPlace(piece: Piece, row: number, col: number): boolean {
    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (!piece.shape[r][c]) continue;
        const br = row + r;
        const bc = col + c;
        if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE) return false;
        if (this.board[br][bc] !== null) return false;
      }
    }
    return true;
  }

  // Check if piece can be placed anywhere
  private canPlaceAnywhere(piece: Piece): boolean {
    for (let r = 0; r <= BOARD_SIZE - piece.rows; r++) {
      for (let c = 0; c <= BOARD_SIZE - piece.cols; c++) {
        if (this.canPlace(piece, r, c)) return true;
      }
    }
    return false;
  }

  // Place piece on board
  private placePiece(piece: Piece, row: number, col: number): void {
    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (piece.shape[r][c]) {
          this.board[row + r][col + c] = piece.color;
        }
      }
    }
  }

  // Check for and clear full rows/columns
  private checkClears(): number {
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      let full = true;
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.board[r][c] === null) { full = false; break; }
      }
      if (full) rowsToClear.push(r);
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
      let full = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (this.board[r][c] === null) { full = false; break; }
      }
      if (full) colsToClear.push(c);
    }

    if (rowsToClear.length === 0 && colsToClear.length === 0) return 0;

    // Collect unique cells to clear
    const cellSet = new Set<string>();
    const cells: [number, number][] = [];
    for (const r of rowsToClear) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const key = `${r},${c}`;
        if (!cellSet.has(key)) {
          cellSet.add(key);
          cells.push([r, c]);
        }
      }
    }
    for (const c of colsToClear) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        const key = `${r},${c}`;
        if (!cellSet.has(key)) {
          cellSet.add(key);
          cells.push([r, c]);
        }
      }
    }

    // Start clear animation
    this.clearAnims.push({ cells, timer: 0, duration: 300 });

    const lineCount = rowsToClear.length + colsToClear.length;
    return lineCount;
  }

  // Get piece tray positions (centered)
  private getPieceTrayPositions(): { x: number; y: number; w: number; h: number }[] {
    const positions: { x: number; y: number; w: number; h: number }[] = [];
    const activePieces = this.pieces.filter((p) => p !== null) as Piece[];
    const count = activePieces.length;
    if (count === 0) return positions;

    const totalWidth = activePieces.reduce((sum, p) => sum + shapeWidth(p), 0);
    const spacing = 30;
    const fullWidth = totalWidth + spacing * (count - 1);
    let startX = (WIDTH - fullWidth) / 2;
    const trayY = PIECE_AREA_Y + 30;

    let pieceIdx = 0;
    for (let i = 0; i < 3; i++) {
      const p = this.pieces[i];
      if (p === null) continue;
      const w = shapeWidth(p);
      const h = shapeHeight(p);
      const y = trayY + (50 - h) / 2;
      positions.push({ x: startX, y, w, h });
      startX += w + spacing;
      pieceIdx++;
    }
    return positions;
  }

  // Map tray position index to pieces array index
  private getTrayToPieceMap(): number[] {
    const map: number[] = [];
    for (let i = 0; i < 3; i++) {
      if (this.pieces[i] !== null) map.push(i);
    }
    return map;
  }

  update(dt: number): void {
    const mouse = this.input.getMousePosition();
    const mouseDown = this.input.isMouseDown(0);
    const mouseClicked = mouseDown && !this.wasMouseDown;
    const mouseReleased = !mouseDown && this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    // Update clear animations
    for (let i = this.clearAnims.length - 1; i >= 0; i--) {
      this.clearAnims[i].timer += dt;
      if (this.clearAnims[i].timer >= this.clearAnims[i].duration) {
        // Actually clear the cells now
        for (const [r, c] of this.clearAnims[i].cells) {
          this.board[r][c] = null;
        }
        this.clearAnims.splice(i, 1);
      }
    }

    // Don't allow interaction during animations
    if (this.clearAnims.length > 0) return;

    // Compute hover over tray pieces
    this.hoverIndex = -1;
    if (this.dragging === -1) {
      const positions = this.getPieceTrayPositions();
      const map = this.getTrayToPieceMap();
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const pad = 8;
        if (
          mouse.x >= pos.x - pad &&
          mouse.x <= pos.x + pos.w + pad &&
          mouse.y >= pos.y - pad &&
          mouse.y <= pos.y + pos.h + pad
        ) {
          this.hoverIndex = map[i];
          break;
        }
      }
    }

    // Start drag
    if (mouseClicked && this.dragging === -1 && this.hoverIndex !== -1) {
      const piece = this.pieces[this.hoverIndex]!;
      this.dragging = this.hoverIndex;
      // Center the piece on the cursor (at board scale)
      this.dragOffX = -(piece.cols * CELL) / 2;
      this.dragOffY = -(piece.rows * CELL) / 2 - 40; // offset above finger
    }

    // Update ghost position while dragging
    if (this.dragging !== -1) {
      const piece = this.pieces[this.dragging]!;
      const pieceScreenX = mouse.x + this.dragOffX;
      const pieceScreenY = mouse.y + this.dragOffY;

      // Convert to board coords (snap to nearest cell)
      const boardCol = Math.round((pieceScreenX - BOARD_X) / CELL);
      const boardRow = Math.round((pieceScreenY - BOARD_Y) / CELL);

      this.ghostRow = boardRow;
      this.ghostCol = boardCol;
      this.ghostValid = this.canPlace(piece, boardRow, boardCol);
    }

    // Release / drop
    if (mouseReleased && this.dragging !== -1) {
      const piece = this.pieces[this.dragging]!;
      if (this.ghostValid) {
        // Place the piece
        this.placePiece(piece, this.ghostRow, this.ghostCol);

        // Score for cells placed
        let gained = piece.cellCount;

        // Check for line clears
        const linesCleared = this.checkClears();
        if (linesCleared > 0) {
          this.streak++;
          if (this.streak > this.bestStreak) this.bestStreak = this.streak;
          // Base line clear points + combo multiplier + streak bonus
          const comboMultiplier = linesCleared;
          const linePoints = 10 * linesCleared * comboMultiplier;
          const streakBonus = (this.streak - 1) * 5;
          gained += linePoints + streakBonus;
        } else {
          this.streak = 0;
        }

        this.setScore(this.score + gained);

        // Remove piece from tray
        this.pieces[this.dragging] = null;

        // If all 3 pieces used, spawn new set
        if (this.pieces.every((p) => p === null)) {
          this.pieces = [makePiece(), makePiece(), makePiece()];
        }

        // Check game over
        if (this.isGameOver()) {
          this.gameOver();
        }
      }

      this.dragging = -1;
      this.ghostRow = -1;
      this.ghostCol = -1;
      this.ghostValid = false;
    }
  }

  private isGameOver(): boolean {
    for (let i = 0; i < 3; i++) {
      const p = this.pieces[i];
      if (p !== null && this.canPlaceAnywhere(p)) return false;
    }
    return true;
  }

  draw(): void {
    const ctx = this.ctx;

    // ── Header ─────────────────────────────────────────────────────────
    this.drawHeader(ctx);

    // ── Board ──────────────────────────────────────────────────────────
    this.drawBoard(ctx);

    // ── Ghost preview ──────────────────────────────────────────────────
    if (this.dragging !== -1 && this.ghostRow !== -1) {
      this.drawGhost(ctx);
    }

    // ── Clear animations ───────────────────────────────────────────────
    this.drawClearAnimations(ctx);

    // ── Piece tray ─────────────────────────────────────────────────────
    this.drawPieceTray(ctx);

    // ── Dragging piece ─────────────────────────────────────────────────
    if (this.dragging !== -1) {
      this.drawDraggingPiece(ctx);
    }
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    // Title
    ctx.save();
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 10;
    ctx.fillText("BRICK BUILDER", WIDTH / 2, HEADER_Y + 18);
    ctx.shadowBlur = 0;

    // Score
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#8888aa";
    ctx.fillText("SCORE", BOARD_X, HEADER_Y + 48);
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(this.score), BOARD_X, HEADER_Y + 70);

    // Streak
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#8888aa";
    const rightEdge = BOARD_X + BOARD_PX;
    ctx.fillText("STREAK", rightEdge, HEADER_Y + 48);
    ctx.font = "bold 22px Inter, sans-serif";
    if (this.streak > 0) {
      ctx.fillStyle = "#ffd700";
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillText(`${this.streak}x`, rightEdge, HEADER_Y + 70);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = BOARD_X + c * CELL;
        const y = BOARD_Y + r * CELL;
        const cellColor = this.board[r][c];

        if (cellColor !== null) {
          // Filled cell
          ctx.fillStyle = cellColor;
          ctx.shadowColor = cellColor;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.roundRect(x + CELL_GAP, y + CELL_GAP, CELL - CELL_GAP * 2, CELL - CELL_GAP * 2, 4);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner glow highlight
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.roundRect(x + CELL_GAP + 2, y + CELL_GAP + 2, CELL - CELL_GAP * 2 - 4, (CELL - CELL_GAP * 2) / 3, 3);
          ctx.fill();
        } else {
          // Empty cell
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.beginPath();
          ctx.roundRect(x + CELL_GAP, y + CELL_GAP, CELL - CELL_GAP * 2, CELL - CELL_GAP * 2, 4);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  private drawGhost(ctx: CanvasRenderingContext2D): void {
    const piece = this.pieces[this.dragging]!;
    ctx.save();
    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (!piece.shape[r][c]) continue;
        const br = this.ghostRow + r;
        const bc = this.ghostCol + c;
        if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE) continue;
        const x = BOARD_X + bc * CELL;
        const y = BOARD_Y + br * CELL;

        if (this.ghostValid) {
          ctx.fillStyle = hexToRgba(piece.color, 0.35);
          ctx.strokeStyle = hexToRgba(piece.color, 0.6);
        } else {
          ctx.fillStyle = "rgba(255,50,50,0.25)";
          ctx.strokeStyle = "rgba(255,50,50,0.5)";
        }

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x + CELL_GAP, y + CELL_GAP, CELL - CELL_GAP * 2, CELL - CELL_GAP * 2, 4);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawClearAnimations(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const anim of this.clearAnims) {
      const progress = anim.timer / anim.duration;
      // Flash white then fade out
      let alpha: number;
      if (progress < 0.3) {
        // Flash white phase
        alpha = 1.0;
      } else {
        // Fade out phase
        alpha = 1.0 - (progress - 0.3) / 0.7;
      }

      for (const [r, c] of anim.cells) {
        const x = BOARD_X + c * CELL;
        const y = BOARD_Y + r * CELL;
        const cellColor = this.board[r][c];

        if (progress < 0.3) {
          // White flash
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 12;
        } else {
          // Fade the original color
          if (cellColor) {
            ctx.fillStyle = hexToRgba(cellColor, alpha * 0.8);
            ctx.shadowColor = cellColor;
            ctx.shadowBlur = 8 * alpha;
          } else {
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
            ctx.shadowBlur = 0;
          }
        }

        // Scale down slightly as it fades
        const scale = progress < 0.3 ? 1.0 : 1.0 - (progress - 0.3) * 0.3;
        const inset = CELL_GAP + (1 - scale) * (CELL / 2 - CELL_GAP);
        const size = (CELL - CELL_GAP * 2) * scale;
        ctx.beginPath();
        ctx.roundRect(x + inset, y + inset, size, size, 4 * scale);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  private drawPieceTray(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Tray label
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DRAG A PIECE ONTO THE BOARD", WIDTH / 2, PIECE_AREA_Y + 8);

    const positions = this.getPieceTrayPositions();
    const map = this.getTrayToPieceMap();

    for (let i = 0; i < positions.length; i++) {
      const pieceIdx = map[i];
      if (pieceIdx === this.dragging) continue; // Don't draw the one being dragged
      const piece = this.pieces[pieceIdx]!;
      const pos = positions[i];
      const isHover = this.hoverIndex === pieceIdx;

      // Draw highlight behind hovered piece
      if (isHover) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.roundRect(pos.x - 10, pos.y - 10, pos.w + 20, pos.h + 20, 8);
        ctx.fill();
      }

      // Draw piece cells
      for (let r = 0; r < piece.rows; r++) {
        for (let c = 0; c < piece.cols; c++) {
          if (!piece.shape[r][c]) continue;
          const x = pos.x + c * (PIECE_CELL + PIECE_GAP);
          const y = pos.y + r * (PIECE_CELL + PIECE_GAP);

          const alpha = isHover ? 1.0 : 0.7;
          ctx.fillStyle = hexToRgba(piece.color, alpha);
          if (isHover) {
            ctx.shadowColor = piece.color;
            ctx.shadowBlur = 6;
          }
          ctx.beginPath();
          ctx.roundRect(x, y, PIECE_CELL, PIECE_CELL, 3);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore();
  }

  private drawDraggingPiece(ctx: CanvasRenderingContext2D): void {
    const piece = this.pieces[this.dragging]!;
    const mouse = this.input.getMousePosition();
    const baseX = mouse.x + this.dragOffX;
    const baseY = mouse.y + this.dragOffY;

    ctx.save();
    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (!piece.shape[r][c]) continue;
        const x = baseX + c * CELL;
        const y = baseY + r * CELL;

        ctx.fillStyle = piece.color;
        ctx.shadowColor = piece.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(x + CELL_GAP, y + CELL_GAP, CELL - CELL_GAP * 2, CELL - CELL_GAP * 2, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner highlight
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.roundRect(x + CELL_GAP + 2, y + CELL_GAP + 2, CELL - CELL_GAP * 2 - 4, (CELL - CELL_GAP * 2) / 3, 3);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
