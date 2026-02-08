import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 560;
const HEIGHT = 640;
const BG = "#0a0c14";

const CONFIG = {
  id: "memory-match",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

// ── Level definitions ──────────────────────────
interface LevelDef {
  cols: number;
  rows: number;
  flipBackMs: number;
}

const LEVELS: LevelDef[] = [
  { cols: 4, rows: 4, flipBackMs: 800 },
  { cols: 5, rows: 4, flipBackMs: 800 },
  { cols: 6, rows: 4, flipBackMs: 800 },
  // After level 3 we loop back with shorter flip-back times
  { cols: 4, rows: 4, flipBackMs: 600 },
  { cols: 5, rows: 4, flipBackMs: 600 },
  { cols: 6, rows: 4, flipBackMs: 600 },
  { cols: 4, rows: 4, flipBackMs: 450 },
  { cols: 5, rows: 4, flipBackMs: 450 },
  { cols: 6, rows: 4, flipBackMs: 450 },
];

// ── Symbol pool ────────────────────────────────
const SYMBOLS = [
  { glyph: "\u2605", color: "#ffd700" },    // star
  { glyph: "\u2665", color: "#ff2e97" },    // heart
  { glyph: "\u2666", color: "#ff6b6b" },    // diamond
  { glyph: "\u263D", color: "#b8c0ff" },    // moon
  { glyph: "\u2600", color: "#ffb347" },    // sun
  { glyph: "\u26A1", color: "#00d4ff" },    // lightning
  { glyph: "\u266B", color: "#6c5ce7" },    // music note
  { glyph: "\u2740", color: "#ff69b4" },    // flower
  { glyph: "\u2655", color: "#ffd700" },    // crown (queen)
  { glyph: "\u25C6", color: "#00ffcc" },    // gem
  { glyph: "\u2708", color: "#ff8c42" },    // rocket/plane
  { glyph: "\u2302", color: "#9b59b6" },    // house
  { glyph: "\u2622", color: "#2ecc71" },    // atom-like
  { glyph: "\u2744", color: "#74b9ff" },    // snowflake
  { glyph: "\u2764", color: "#e74c3c" },    // solid heart
  { glyph: "\u269B", color: "#00cec9" },    // atom
];

const CARD_GAP = 12;
const HEADER_H = 70;

const FLIP_DURATION = 300; // ms

// ── Card state ─────────────────────────────────
interface Card {
  symbolIndex: number;
  faceUp: boolean;
  matched: boolean;
  // Animation state
  flipProgress: number;    // 0 = face down, 1 = face up, in between = animating
  flipDirection: number;   // 1 = flipping to face up, -1 = flipping to face down
  flipping: boolean;
  // Match animation
  matchGlow: number;       // timer in ms, counts down from peak
  matchScale: number;
}

export class MemoryMatchGame extends BaseGame {
  private cards: Card[] = [];
  private cols = 4;
  private rows = 4;
  private cardW = 110;
  private cardH = 130;
  private gridX = 0;
  private gridY = 0;

  private firstPick = -1;
  private secondPick = -1;
  private flipBackTimer = 0;
  private flipBackMs = 800;
  private matchCheckTimer = 0;
  private lockInput = false;

  private moves = 0;
  private combo = 0;
  private level = 0;
  private totalMatches = 0;
  private pairsInLevel = 0;
  private matchesInLevel = 0;

  private wasMouseDown = false;

  // Level transition
  private levelTransition = 0;       // timer ms, counts down
  private levelTransitionText = "";

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.level = 0;
    this.setScore(0);
    this.moves = 0;
    this.combo = 0;
    this.totalMatches = 0;
    this.setupLevel();
  }

  reset(): void {
    this.level = 0;
    this.setScore(0);
    this.moves = 0;
    this.combo = 0;
    this.totalMatches = 0;
    this.levelTransition = 0;
    this.setupLevel();
  }

  // ── Level setup ──────────────────────────────

  private setupLevel(): void {
    const def = LEVELS[this.level % LEVELS.length];
    this.cols = def.cols;
    this.rows = def.rows;
    this.flipBackMs = def.flipBackMs;

    const totalCards = this.cols * this.rows;
    this.pairsInLevel = totalCards / 2;
    this.matchesInLevel = 0;

    // Compute card size to fit canvas
    const availW = WIDTH - CARD_GAP;
    const availH = HEIGHT - HEADER_H - CARD_GAP;
    this.cardW = Math.floor((availW - CARD_GAP * this.cols) / this.cols);
    this.cardH = Math.floor((availH - CARD_GAP * this.rows) / this.rows);
    // Cap card size
    if (this.cardW > 110) this.cardW = 110;
    if (this.cardH > 130) this.cardH = 130;

    const gridW = this.cols * this.cardW + (this.cols - 1) * CARD_GAP;
    const gridH = this.rows * this.cardH + (this.rows - 1) * CARD_GAP;
    this.gridX = Math.floor((WIDTH - gridW) / 2);
    this.gridY = HEADER_H + Math.floor((HEIGHT - HEADER_H - gridH) / 2);

    // Build shuffled pairs
    const shuffledSymbols = this.shuffleArray([...Array(SYMBOLS.length).keys()]);
    const pairSymbols = shuffledSymbols.slice(0, this.pairsInLevel);

    const deck: number[] = [];
    for (const si of pairSymbols) {
      deck.push(si, si);
    }
    const shuffledDeck = this.shuffleArray(deck);

    this.cards = shuffledDeck.map((si) => ({
      symbolIndex: si,
      faceUp: false,
      matched: false,
      flipProgress: 0,
      flipDirection: 0,
      flipping: false,
      matchGlow: 0,
      matchScale: 1,
    }));

    this.firstPick = -1;
    this.secondPick = -1;
    this.flipBackTimer = 0;
    this.matchCheckTimer = 0;
    this.lockInput = false;
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Card position helpers ────────────────────

  private cardX(col: number): number {
    return this.gridX + col * (this.cardW + CARD_GAP);
  }

  private cardY(row: number): number {
    return this.gridY + row * (this.cardH + CARD_GAP);
  }

  private cardIndex(row: number, col: number): number {
    return row * this.cols + col;
  }

  private cardRowCol(index: number): { row: number; col: number } {
    return { row: Math.floor(index / this.cols), col: index % this.cols };
  }

  // ── Update ───────────────────────────────────

  update(dt: number): void {
    // Always track mouse state to prevent phantom clicks after timers
    const mouseDown = this.input.isMouseDown(0);
    const clicked = mouseDown && !this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    // Update level transition
    if (this.levelTransition > 0) {
      this.levelTransition -= dt;
      if (this.levelTransition <= 0) {
        this.levelTransition = 0;
        this.setupLevel();
      }
      return;
    }

    // Update flip animations
    for (const card of this.cards) {
      if (card.flipping) {
        const speed = dt / FLIP_DURATION;
        card.flipProgress += card.flipDirection * speed;
        if (card.flipDirection > 0 && card.flipProgress >= 1) {
          card.flipProgress = 1;
          card.flipping = false;
          card.faceUp = true;
        } else if (card.flipDirection < 0 && card.flipProgress <= 0) {
          card.flipProgress = 0;
          card.flipping = false;
          card.faceUp = false;
        }
      }
      // Update match glow
      if (card.matchGlow > 0) {
        card.matchGlow -= dt;
        if (card.matchGlow < 0) card.matchGlow = 0;
        // Scale pulse: 1 -> 1.08 -> 1 over 400ms
        const t = 1 - card.matchGlow / 400;
        card.matchScale = t < 0.5 ? 1 + 0.08 * (t * 2) : 1 + 0.08 * (1 - (t - 0.5) * 2);
      } else {
        card.matchScale = 1;
      }
    }

    // Match check timer: wait for flip animation to complete before checking
    if (this.matchCheckTimer > 0) {
      this.matchCheckTimer -= dt;
      if (this.matchCheckTimer <= 0) {
        this.matchCheckTimer = 0;
        this.checkMatch();
      }
      return;
    }

    // Flip-back timer for mismatched pair
    if (this.flipBackTimer > 0) {
      this.flipBackTimer -= dt;
      if (this.flipBackTimer <= 0) {
        this.flipBackTimer = 0;
        // Flip both cards back
        if (this.firstPick >= 0) this.startFlip(this.firstPick, false);
        if (this.secondPick >= 0) this.startFlip(this.secondPick, false);
        this.firstPick = -1;
        this.secondPick = -1;
        this.lockInput = false;
      }
      return;
    }

    // Mouse input
    if (!clicked || this.lockInput) return;

    const mouse = this.input.getMousePosition();
    const hitIndex = this.hitTest(mouse.x, mouse.y);
    if (hitIndex < 0) return;

    const card = this.cards[hitIndex];
    if (card.matched || card.faceUp || card.flipping) return;

    if (this.firstPick < 0) {
      // First card
      this.firstPick = hitIndex;
      this.startFlip(hitIndex, true);
    } else if (this.secondPick < 0 && hitIndex !== this.firstPick) {
      // Second card
      this.secondPick = hitIndex;
      this.startFlip(hitIndex, true);
      this.moves++;

      // Lock input and schedule match check after flip animation
      this.lockInput = true;
      this.matchCheckTimer = FLIP_DURATION + 50;
    }
  }

  private checkMatch(): void {
    if (this.firstPick < 0 || this.secondPick < 0) return;

    const c1 = this.cards[this.firstPick];
    const c2 = this.cards[this.secondPick];

    if (c1.symbolIndex === c2.symbolIndex) {
      // Match found
      c1.matched = true;
      c2.matched = true;
      c1.matchGlow = 400;
      c2.matchGlow = 400;

      this.combo++;
      this.matchesInLevel++;
      this.totalMatches++;

      // Score: 100 base * combo multiplier
      const matchScore = 100 * this.combo;
      this.setScore(this.score + matchScore);

      this.firstPick = -1;
      this.secondPick = -1;
      this.lockInput = false;

      // Check level complete
      if (this.matchesInLevel >= this.pairsInLevel) {
        this.onLevelComplete();
      }
    } else {
      // No match -- flip back after delay
      this.combo = 0;
      this.flipBackTimer = this.flipBackMs;
      // lockInput stays true until cards flip back
    }
  }

  private onLevelComplete(): void {
    // Level completion bonus: 500 - moves * 10, min 100
    const bonus = Math.max(100, 500 - this.moves * 10);
    this.setScore(this.score + bonus);

    this.level++;
    this.levelTransition = 1500; // 1.5 second transition
    this.levelTransitionText = `Level ${this.level + 1}`;
  }

  private startFlip(index: number, toFaceUp: boolean): void {
    const card = this.cards[index];
    card.flipping = true;
    card.flipDirection = toFaceUp ? 1 : -1;
    if (toFaceUp) {
      card.flipProgress = 0;
    } else {
      card.flipProgress = 1;
    }
  }

  private hitTest(mx: number, my: number): number {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.cardX(c);
        const y = this.cardY(r);
        if (mx >= x && mx < x + this.cardW && my >= y && my < y + this.cardH) {
          return this.cardIndex(r, c);
        }
      }
    }
    return -1;
  }

  // ── Draw ─────────────────────────────────────

  draw(): void {
    const ctx = this.ctx;

    // Header
    this.drawHeader(ctx);

    // Level transition overlay
    if (this.levelTransition > 0) {
      this.drawLevelTransition(ctx);
      return;
    }

    // Cards
    for (let i = 0; i < this.cards.length; i++) {
      const { row, col } = this.cardRowCol(i);
      const x = this.cardX(col);
      const y = this.cardY(row);
      this.drawCard(ctx, this.cards[i], x, y);
    }

    // Hint
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Click cards to find matching pairs", WIDTH / 2, HEIGHT - 10);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    // Title
    ctx.save();
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("MEMORY MATCH", WIDTH / 2, 12);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Level
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("LEVEL", 20, 14);
    ctx.fillStyle = "#6c5ce7";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.level + 1), 20, 30);

    // Moves
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("MOVES", 20, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillText(String(this.moves), 70, 49);

    // Score
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("SCORE", WIDTH - 20, 14);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.score), WIDTH - 20, 30);

    // Combo
    if (this.combo > 1) {
      ctx.fillStyle = "#ff2e97";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`x${this.combo} COMBO`, WIDTH - 20, 52);
    }

    // Separator line
    ctx.strokeStyle = "rgba(0,212,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, HEADER_H - 4);
    ctx.lineTo(WIDTH - 20, HEADER_H - 4);
    ctx.stroke();
  }

  private drawCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number): void {
    const cx = x + this.cardW / 2;
    const cy = y + this.cardH / 2;

    // Flip animation: scale horizontally based on flipProgress
    // 0 -> face-down full width
    // 0.5 -> zero width (edge)
    // 1 -> face-up full width
    let showFace: boolean;
    let scaleX: number;

    if (card.flipping) {
      if (card.flipProgress <= 0.5) {
        // Shrinking: still showing original side
        scaleX = 1 - card.flipProgress * 2; // 1 -> 0
        showFace = card.flipDirection > 0 ? false : true;
      } else {
        // Expanding: showing new side
        scaleX = (card.flipProgress - 0.5) * 2; // 0 -> 1
        showFace = card.flipDirection > 0 ? true : false;
      }
    } else {
      scaleX = 1;
      showFace = card.faceUp;
    }

    // Ease the scale for smoothness
    scaleX = Math.max(0.02, scaleX);

    const scale = card.matchScale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX * scale, scale);
    ctx.translate(-cx, -cy);

    if (showFace) {
      this.drawCardFace(ctx, card, x, y);
    } else {
      this.drawCardBack(ctx, x, y);
    }

    ctx.restore();
  }

  private drawCardBack(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Card body
    const g = ctx.createLinearGradient(x, y, x, y + this.cardH);
    g.addColorStop(0, "#12142a");
    g.addColorStop(1, "#0c0e1e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardW, this.cardH, 10);
    ctx.fill();

    // Neon border
    ctx.strokeStyle = "rgba(0,212,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardW, this.cardH, 10);
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = "rgba(108,92,231,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 6, this.cardW - 12, this.cardH - 12, 6);
    ctx.stroke();

    // Center diamond pattern
    const centerX = x + this.cardW / 2;
    const centerY = y + this.cardH / 2;

    ctx.strokeStyle = "rgba(0,212,255,0.15)";
    ctx.lineWidth = 1;
    // Diamond
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX + 14, centerY);
    ctx.lineTo(centerX, centerY + 20);
    ctx.lineTo(centerX - 14, centerY);
    ctx.closePath();
    ctx.stroke();

    // Inner diamond
    ctx.strokeStyle = "rgba(108,92,231,0.25)";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX + 7, centerY);
    ctx.lineTo(centerX, centerY + 10);
    ctx.lineTo(centerX - 7, centerY);
    ctx.closePath();
    ctx.stroke();

    // Corner dots
    const dotR = 2;
    ctx.fillStyle = "rgba(0,212,255,0.2)";
    ctx.beginPath();
    ctx.arc(x + 14, y + 14, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + this.cardW - 14, y + 14, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 14, y + this.cardH - 14, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + this.cardW - 14, y + this.cardH - 14, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCardFace(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number): void {
    const sym = SYMBOLS[card.symbolIndex];

    // Card body
    const g = ctx.createLinearGradient(x, y, x, y + this.cardH);
    g.addColorStop(0, "#1a1c32");
    g.addColorStop(1, "#10121e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardW, this.cardH, 10);
    ctx.fill();

    // Border color based on matched state
    if (card.matched) {
      // Matched: glowing border
      ctx.save();
      ctx.shadowColor = sym.color;
      ctx.shadowBlur = card.matchGlow > 0 ? 18 : 10;
      ctx.strokeStyle = sym.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardW, this.cardH, 10);
      ctx.stroke();
      ctx.restore();

      // Slight overlay to show it's matched
      ctx.fillStyle = `${sym.color}10`;
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardW, this.cardH, 10);
      ctx.fill();
    } else {
      ctx.strokeStyle = `${sym.color}60`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardW, this.cardH, 10);
      ctx.stroke();
    }

    // Symbol
    const centerX = x + this.cardW / 2;
    const centerY = y + this.cardH / 2;

    ctx.save();
    if (!card.matched || card.matchGlow > 0) {
      ctx.shadowColor = sym.color;
      ctx.shadowBlur = card.matchGlow > 0 ? 20 : 8;
    }
    ctx.fillStyle = sym.color;
    ctx.font = `${Math.min(this.cardW, this.cardH) * 0.42}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sym.glyph, centerX, centerY + 2);
    ctx.restore();

    // Matched cards: reduced opacity overlay
    if (card.matched && card.matchGlow <= 0) {
      ctx.fillStyle = "rgba(10,12,20,0.35)";
      ctx.beginPath();
      ctx.roundRect(x, y, this.cardW, this.cardH, 10);
      ctx.fill();
    }
  }

  private drawLevelTransition(ctx: CanvasRenderingContext2D): void {
    // Fade factor: 1 at start, 0 at end
    const t = this.levelTransition / 1500;
    const alpha = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1;

    // Background overlay
    ctx.fillStyle = `rgba(10,12,20,${0.8 * alpha})`;
    ctx.fillRect(0, HEADER_H, WIDTH, HEIGHT - HEADER_H);

    // Level text
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);
    ctx.shadowColor = "#6c5ce7";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#6c5ce7";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LEVEL COMPLETE", WIDTH / 2, HEIGHT / 2 - 30);

    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 36px Inter, sans-serif";
    ctx.fillText(this.levelTransitionText, WIDTH / 2, HEIGHT / 2 + 10);

    // Bonus text
    const bonus = Math.max(100, 500 - this.moves * 10);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText(`+${bonus} BONUS`, WIDTH / 2, HEIGHT / 2 + 50);

    ctx.restore();
  }
}
