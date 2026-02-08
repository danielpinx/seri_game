import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const W = 640, H = 700, BG = "#0a0c14";
const BOARD = 8;
const CELL = 72;
const BX = Math.floor((W - BOARD * CELL) / 2); // board left
const BY = 80; // board top
const PRAD = 28; // piece radius

const CONFIG = { id: "checkers", width: W, height: H, fps: 60, backgroundColor: BG };

const EMPTY = 0, PLAYER = 1, PLAYER_K = 2, AI_P = 3, AI_K = 4;

const PLAYER_COLOR = "#00d4ff";
const AI_COLOR = "#ff4466";
const KING_COLOR = "#ffd700";

interface Pos { r: number; c: number; }
interface Move { from: Pos; to: Pos; captures: Pos[]; }
interface FadeAnim { r: number; c: number; piece: number; alpha: number; }

function isPlayer(p: number): boolean { return p === PLAYER || p === PLAYER_K; }
function isAI(p: number): boolean { return p === AI_P || p === AI_K; }
function isKing(p: number): boolean { return p === PLAYER_K || p === AI_K; }
function owner(p: number): number { return isPlayer(p) ? 1 : isAI(p) ? 2 : 0; }

export class CheckersGame extends BaseGame {
  private board: number[][] = [];
  private selected: Pos | null = null;
  private validMoves: Move[] = [];
  private turn: "player" | "ai" = "player";
  private aiTimer = 0;
  private lastMove: Move | null = null;
  private fades: FadeAnim[] = [];
  private pm = false; // previous mouse state
  private gameEnded = false;
  private multiJumpPiece: Pos | null = null; // for forced multi-jumps
  private statusText = "Your Turn";
  private totalScore = 0;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) { super(canvas, CONFIG, cb); }

  init(): void { this.resetBoard(); }
  reset(): void { this.resetBoard(); }

  private resetBoard(): void {
    this.board = Array.from({ length: BOARD }, () => Array(BOARD).fill(EMPTY));
    // AI pieces on rows 0-2 (top)
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < BOARD; c++)
        if ((r + c) % 2 === 1) this.board[r][c] = AI_P;
    // Player pieces on rows 5-7 (bottom)
    for (let r = 5; r < 8; r++)
      for (let c = 0; c < BOARD; c++)
        if ((r + c) % 2 === 1) this.board[r][c] = PLAYER;

    this.selected = null;
    this.validMoves = [];
    this.turn = "player";
    this.aiTimer = 0;
    this.lastMove = null;
    this.fades = [];
    this.gameEnded = false;
    this.multiJumpPiece = null;
    this.statusText = "Your Turn";
  }

  // ──────────────────────────────────────
  //  MOVE GENERATION
  // ──────────────────────────────────────

  private getMovesForPiece(board: number[][], r: number, c: number): Move[] {
    const piece = board[r][c];
    if (piece === EMPTY) return [];
    const king = isKing(piece);
    const isP = isPlayer(piece);
    const dirs: [number, number][] = king
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : isP
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    const moves: Move[] = [];

    // Captures
    const captures = this.getCapturesFrom(board, r, c, piece, dirs);
    for (const cap of captures) moves.push(cap);

    // Simple moves (only if no captures exist - we check later at filtering level)
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= BOARD || nc < 0 || nc >= BOARD) continue;
      if (board[nr][nc] !== EMPTY) continue;
      moves.push({ from: { r, c }, to: { r: nr, c: nc }, captures: [] });
    }

    return moves;
  }

  private getCapturesFrom(board: number[][], r: number, c: number, piece: number, dirs: [number, number][]): Move[] {
    const results: Move[] = [];

    for (const [dr, dc] of dirs) {
      const mr = r + dr, mc = c + dc; // middle (captured piece)
      const lr = r + dr * 2, lc = c + dc * 2; // landing
      if (lr < 0 || lr >= BOARD || lc < 0 || lc >= BOARD) continue;
      if (board[mr][mc] === EMPTY || owner(board[mr][mc]) === owner(piece)) continue;
      if (board[lr][lc] !== EMPTY) continue;

      // Found a capture; check for multi-jump
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = EMPTY;
      newBoard[mr][mc] = EMPTY;

      // Check if piece becomes king upon landing
      let landedPiece = piece;
      if (!isKing(piece)) {
        if (isPlayer(piece) && lr === 0) landedPiece = PLAYER_K;
        if (isAI(piece) && lr === 7) landedPiece = AI_K;
      }
      newBoard[lr][lc] = landedPiece;

      const landedKing = isKing(landedPiece);
      const nextDirs: [number, number][] = landedKing
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : isPlayer(landedPiece)
          ? [[-1, -1], [-1, 1]]
          : [[1, -1], [1, 1]];

      // Only continue multi-jump if piece didn't just become king (standard rule: promotion ends turn)
      const justPromoted = !isKing(piece) && isKing(landedPiece);
      const continuations = justPromoted ? [] : this.getCapturesFrom(newBoard, lr, lc, landedPiece, nextDirs);

      if (continuations.length === 0) {
        results.push({ from: { r, c }, to: { r: lr, c: lc }, captures: [{ r: mr, c: mc }] });
      } else {
        for (const cont of continuations) {
          results.push({
            from: { r, c },
            to: cont.to,
            captures: [{ r: mr, c: mc }, ...cont.captures],
          });
        }
      }
    }

    return results;
  }

  private getAllMoves(board: number[][], forPlayer: boolean): Move[] {
    const moves: Move[] = [];
    for (let r = 0; r < BOARD; r++)
      for (let c = 0; c < BOARD; c++) {
        const p = board[r][c];
        if (p === EMPTY) continue;
        if (forPlayer && !isPlayer(p)) continue;
        if (!forPlayer && !isAI(p)) continue;
        moves.push(...this.getMovesForPiece(board, r, c));
      }

    // Mandatory captures: if any capture exists, filter out non-captures
    const hasCapture = moves.some(m => m.captures.length > 0);
    if (hasCapture) return moves.filter(m => m.captures.length > 0);
    return moves;
  }

  private getMovesForSelected(): Move[] {
    if (!this.selected) return [];
    const all = this.getAllMoves(this.board, true);
    return all.filter(m => m.from.r === this.selected!.r && m.from.c === this.selected!.c);
  }

  // ──────────────────────────────────────
  //  AI (MINIMAX WITH ALPHA-BETA)
  // ──────────────────────────────────────

  private evaluateBoard(board: number[][]): number {
    let score = 0;
    for (let r = 0; r < BOARD; r++) {
      for (let c = 0; c < BOARD; c++) {
        const p = board[r][c];
        if (p === EMPTY) continue;
        if (p === AI_P) {
          score += 10;
          score += r; // prefer advancing
          // Prefer center columns
          if (c >= 2 && c <= 5) score += 1;
        } else if (p === AI_K) {
          score += 25;
          if (c >= 2 && c <= 5) score += 2;
          // Kings prefer center rows
          if (r >= 2 && r <= 5) score += 2;
        } else if (p === PLAYER) {
          score -= 10;
          score -= (7 - r); // penalize opponent advancement
          if (c >= 2 && c <= 5) score -= 1;
        } else if (p === PLAYER_K) {
          score -= 25;
          if (c >= 2 && c <= 5) score -= 2;
          if (r >= 2 && r <= 5) score -= 2;
        }
      }
    }
    return score;
  }

  private applyMove(board: number[][], move: Move): number[][] {
    const b = board.map(row => [...row]);
    const piece = b[move.from.r][move.from.c];
    b[move.from.r][move.from.c] = EMPTY;
    for (const cap of move.captures) b[cap.r][cap.c] = EMPTY;

    // Promotion
    let landedPiece = piece;
    if (piece === PLAYER && move.to.r === 0) landedPiece = PLAYER_K;
    if (piece === AI_P && move.to.r === 7) landedPiece = AI_K;
    b[move.to.r][move.to.c] = landedPiece;
    return b;
  }

  private minimax(board: number[][], depth: number, alpha: number, beta: number, maximizing: boolean): number {
    const aiMoves = this.getAllMoves(board, false);
    const plMoves = this.getAllMoves(board, true);

    // Terminal conditions
    if (aiMoves.length === 0) return -10000 + (5 - depth); // AI loses
    if (plMoves.length === 0) return 10000 - (5 - depth); // Player loses
    if (depth === 0) return this.evaluateBoard(board);

    if (maximizing) {
      let best = -Infinity;
      for (const move of aiMoves) {
        const nb = this.applyMove(board, move);
        const val = this.minimax(nb, depth - 1, alpha, beta, false);
        best = Math.max(best, val);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const move of plMoves) {
        const nb = this.applyMove(board, move);
        const val = this.minimax(nb, depth - 1, alpha, beta, true);
        best = Math.min(best, val);
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private getBestAIMove(): Move | null {
    const moves = this.getAllMoves(this.board, false);
    if (moves.length === 0) return null;

    // Adaptive depth: fewer pieces = deeper search
    let totalPieces = 0;
    for (let r = 0; r < BOARD; r++)
      for (let c = 0; c < BOARD; c++)
        if (this.board[r][c] !== EMPTY) totalPieces++;

    const depth = totalPieces <= 8 ? 6 : totalPieces <= 12 ? 5 : 4;

    let bestScore = -Infinity;
    let bestMove = moves[0];

    // Shuffle moves for variety when scores are equal
    const shuffled = [...moves].sort(() => Math.random() - 0.5);

    for (const move of shuffled) {
      const nb = this.applyMove(this.board, move);
      const val = this.minimax(nb, depth - 1, -Infinity, Infinity, false);
      if (val > bestScore) {
        bestScore = val;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // ──────────────────────────────────────
  //  EXECUTE MOVE
  // ──────────────────────────────────────

  private executeMove(move: Move): void {
    const piece = this.board[move.from.r][move.from.c];
    this.board[move.from.r][move.from.c] = EMPTY;

    // Animate captured pieces
    for (const cap of move.captures) {
      this.fades.push({ r: cap.r, c: cap.c, piece: this.board[cap.r][cap.c], alpha: 1.0 });
      this.board[cap.r][cap.c] = EMPTY;
    }

    // Promotion
    let landedPiece = piece;
    if (piece === PLAYER && move.to.r === 0) landedPiece = PLAYER_K;
    if (piece === AI_P && move.to.r === 7) landedPiece = AI_K;
    this.board[move.to.r][move.to.c] = landedPiece;

    this.lastMove = move;

    // Score for captures
    if (move.captures.length > 0 && isPlayer(piece)) {
      this.totalScore += move.captures.length * 10;
      this.setScore(this.totalScore);
    }

    this.selected = null;
    this.validMoves = [];
    this.multiJumpPiece = null;
  }

  private checkGameEnd(): boolean {
    const aiMoves = this.getAllMoves(this.board, false);
    const plMoves = this.getAllMoves(this.board, true);

    let aiPieces = 0, plPieces = 0;
    for (let r = 0; r < BOARD; r++)
      for (let c = 0; c < BOARD; c++) {
        if (isAI(this.board[r][c])) aiPieces++;
        if (isPlayer(this.board[r][c])) plPieces++;
      }

    if (aiPieces === 0 || aiMoves.length === 0) {
      // Player wins
      this.totalScore += 50;
      this.setScore(this.totalScore);
      this.statusText = "You Win!";
      this.gameEnded = true;
      return true;
    }
    if (plPieces === 0 || plMoves.length === 0) {
      // AI wins
      this.statusText = "AI Wins!";
      this.gameEnded = true;
      return true;
    }
    return false;
  }

  // ──────────────────────────────────────
  //  UPDATE
  // ──────────────────────────────────────

  update(dt: number): void {
    const m = this.input.getMousePosition();
    const down = this.input.isMouseDown(0);
    const clicked = down && !this.pm;
    this.pm = down;

    // Update fade animations
    for (let i = this.fades.length - 1; i >= 0; i--) {
      this.fades[i].alpha -= dt / 300;
      if (this.fades[i].alpha <= 0) this.fades.splice(i, 1);
    }

    // Game ended - wait for click to restart
    if (this.gameEnded) {
      if (clicked) {
        this.resetBoard();
        this.setScore(this.totalScore); // keep cumulative score
      }
      return;
    }

    // AI turn
    if (this.turn === "ai") {
      this.statusText = "AI Thinking...";
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        const move = this.getBestAIMove();
        if (move) {
          this.executeMove(move);
        }
        if (!this.checkGameEnd()) {
          this.turn = "player";
          this.statusText = "Your Turn";
        }
      }
      return;
    }

    // Player turn
    if (!clicked) return;

    // Convert mouse to board position
    const bc = Math.floor((m.x - BX) / CELL);
    const br = Math.floor((m.y - BY) / CELL);
    if (br < 0 || br >= BOARD || bc < 0 || bc >= BOARD) {
      // Clicked outside board - deselect
      if (!this.multiJumpPiece) {
        this.selected = null;
        this.validMoves = [];
      }
      return;
    }

    // Check if clicking a valid destination
    const clickedMove = this.validMoves.find(mv => mv.to.r === br && mv.to.c === bc);
    if (clickedMove) {
      this.executeMove(clickedMove);

      if (this.checkGameEnd()) return;

      this.turn = "ai";
      this.aiTimer = 300;
      this.statusText = "AI Thinking...";
      return;
    }

    // If in a forced multi-jump, don't allow selecting other pieces
    if (this.multiJumpPiece) return;

    // Check if clicking a player piece
    const clickedPiece = this.board[br][bc];
    if (isPlayer(clickedPiece)) {
      // Check if this piece has valid moves
      const allMoves = this.getAllMoves(this.board, true);
      const pieceMoves = allMoves.filter(mv => mv.from.r === br && mv.from.c === bc);
      if (pieceMoves.length > 0) {
        this.selected = { r: br, c: bc };
        this.validMoves = pieceMoves;
      } else {
        // This piece has no legal moves (captures may be forced elsewhere)
        this.selected = null;
        this.validMoves = [];
      }
    } else {
      // Clicked empty or AI piece - deselect
      this.selected = null;
      this.validMoves = [];
    }
  }

  // ──────────────────────────────────────
  //  DRAW
  // ──────────────────────────────────────

  draw(): void {
    const ctx = this.ctx;

    // Status text
    ctx.textAlign = "center";
    ctx.font = "bold 14px Inter, sans-serif";
    const statusColor = this.turn === "player" ? PLAYER_COLOR : AI_COLOR;
    ctx.fillStyle = this.gameEnded ? "#ffd700" : statusColor;
    ctx.shadowColor = this.gameEnded ? "#ffd700" : statusColor;
    ctx.shadowBlur = 10;
    ctx.fillText(this.statusText, W / 2, 35);
    ctx.shadowBlur = 0;

    if (this.gameEnded) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("Click to play again", W / 2, 55);
    }

    // Score
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("SCORE", 20, 30);
    ctx.fillStyle = PLAYER_COLOR;
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(this.totalScore), 20, 54);

    // Piece counts
    let aiCount = 0, plCount = 0;
    for (let r = 0; r < BOARD; r++)
      for (let c = 0; c < BOARD; c++) {
        if (isAI(this.board[r][c])) aiCount++;
        if (isPlayer(this.board[r][c])) plCount++;
      }

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("PIECES", W - 20, 24);

    // Player count
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(W - 55, 44, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillText(String(plCount), W - 20, 49);

    // AI count
    ctx.fillStyle = AI_COLOR;
    ctx.beginPath();
    ctx.arc(W - 55, 62, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(String(aiCount), W - 20, 67);

    // Board background with subtle glow
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.beginPath();
    ctx.roundRect(BX - 6, BY - 6, BOARD * CELL + 12, BOARD * CELL + 12, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(BX - 6, BY - 6, BOARD * CELL + 12, BOARD * CELL + 12, 8);
    ctx.stroke();

    // Draw board squares
    for (let r = 0; r < BOARD; r++) {
      for (let c = 0; c < BOARD; c++) {
        const x = BX + c * CELL;
        const y = BY + r * CELL;
        const isDark = (r + c) % 2 === 1;

        ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
        ctx.fillRect(x, y, CELL, CELL);

        // Highlight last move squares
        if (this.lastMove) {
          if ((this.lastMove.from.r === r && this.lastMove.from.c === c) ||
            (this.lastMove.to.r === r && this.lastMove.to.c === c)) {
            ctx.fillStyle = "rgba(108,92,231,0.12)";
            ctx.fillRect(x, y, CELL, CELL);
          }
        }
      }
    }

    // Highlight selected piece square
    if (this.selected) {
      const sx = BX + this.selected.c * CELL;
      const sy = BY + this.selected.r * CELL;
      ctx.fillStyle = `${PLAYER_COLOR}25`;
      ctx.fillRect(sx, sy, CELL, CELL);
    }

    // Draw valid move indicators
    for (const move of this.validMoves) {
      const cx = BX + move.to.c * CELL + CELL / 2;
      const cy = BY + move.to.r * CELL + CELL / 2;
      if (move.captures.length > 0) {
        // Capture: ring
        ctx.strokeStyle = `${PLAYER_COLOR}70`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, PRAD - 4, 0, Math.PI * 2);
        ctx.stroke();

        // Highlight captured pieces
        for (const cap of move.captures) {
          const capX = BX + cap.c * CELL;
          const capY = BY + cap.r * CELL;
          ctx.fillStyle = "rgba(255,68,102,0.15)";
          ctx.fillRect(capX, capY, CELL, CELL);
        }
      } else {
        // Simple move: dot
        ctx.fillStyle = `${PLAYER_COLOR}50`;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw fading captured pieces
    for (const fade of this.fades) {
      const cx = BX + fade.c * CELL + CELL / 2;
      const cy = BY + fade.r * CELL + CELL / 2;
      const color = isAI(fade.piece) ? AI_COLOR : PLAYER_COLOR;
      ctx.globalAlpha = fade.alpha * 0.6;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15 * fade.alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, PRAD * (0.5 + fade.alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }

    // Draw pieces
    for (let r = 0; r < BOARD; r++) {
      for (let c = 0; c < BOARD; c++) {
        const piece = this.board[r][c];
        if (piece === EMPTY) continue;

        const cx = BX + c * CELL + CELL / 2;
        const cy = BY + r * CELL + CELL / 2;
        const isSelected = this.selected && this.selected.r === r && this.selected.c === c;

        this.drawPiece(ctx, cx, cy, piece, !!isSelected);
      }
    }

    // Bottom hint
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click a piece to select, then click a destination to move", W / 2, H - 14);
  }

  private drawPiece(ctx: CanvasRenderingContext2D, cx: number, cy: number, piece: number, selected: boolean): void {
    const isP = isPlayer(piece);
    const king = isKing(piece);
    const color = isP ? PLAYER_COLOR : AI_COLOR;

    // Outer glow for selected piece
    if (selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
    }

    // Base shadow / 3D effect - darker circle beneath
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 3, PRAD, 0, Math.PI * 2);
    ctx.fill();

    // Main piece body with radial gradient
    const grad = ctx.createRadialGradient(cx - 4, cy - 6, 2, cx, cy, PRAD);
    if (isP) {
      grad.addColorStop(0, "#60efff");
      grad.addColorStop(0.6, PLAYER_COLOR);
      grad.addColorStop(1, "#009dbb");
    } else {
      grad.addColorStop(0, "#ff8899");
      grad.addColorStop(0.6, AI_COLOR);
      grad.addColorStop(1, "#bb2244");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, PRAD, 0, Math.PI * 2);
    ctx.fill();

    // Edge ring
    ctx.strokeStyle = selected ? "#ffffff" : `${color}80`;
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, PRAD - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Inner shine highlight
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 8, PRAD * 0.45, PRAD * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // King indicator: gold ring + crown symbol
    if (king) {
      ctx.strokeStyle = KING_COLOR;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = KING_COLOR;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, PRAD * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Crown symbol
      ctx.fillStyle = KING_COLOR;
      ctx.shadowColor = KING_COLOR;
      ctx.shadowBlur = 4;
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u265A", cx, cy + 1); // chess king symbol
      ctx.shadowBlur = 0;
      ctx.textBaseline = "alphabetic";
    }
  }
}
