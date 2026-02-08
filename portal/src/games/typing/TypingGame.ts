import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

/* ---------- constants ---------- */

const W = 640;
const H = 640;
const BG = "#0a0c14";
const DANGER_ZONE_Y = H - 60;
const INPUT_BOX_Y = H - 40;
const INPUT_BOX_H = 32;
const HEADER_H = 50;

const CONFIG = {
  id: "typing",
  width: W,
  height: H,
  fps: 60,
  backgroundColor: BG,
};

/* ---------- word list (200+ common English words, 3-8 letters) ---------- */

const WORDS: string[] = [
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
  "how", "its", "may", "new", "now", "old", "see", "way", "who", "did",
  "boy", "let", "say", "she", "too", "use", "big", "run", "try", "ask",
  "men", "own", "put", "end", "few", "got", "top", "red", "set", "cut",
  "back", "been", "call", "came", "come", "each", "find", "from", "give",
  "good", "hand", "have", "help", "here", "high", "home", "just", "know",
  "last", "life", "like", "line", "long", "look", "made", "make", "many",
  "more", "much", "must", "name", "next", "only", "over", "part", "play",
  "read", "said", "same", "show", "side", "some", "such", "sure", "take",
  "tell", "than", "that", "them", "then", "they", "this", "time", "turn",
  "used", "very", "want", "well", "went", "what", "when", "will", "with",
  "word", "work", "year", "also", "area", "book", "city", "down", "even",
  "face", "form", "game", "head", "keep", "kind", "land", "left", "move",
  "need", "open", "plan", "real", "room", "rule", "seem", "sort", "talk",
  "walk", "wide", "able", "body", "born", "case", "dark", "door", "draw",
  "drop", "east", "edge", "ever", "fact", "fair", "fall", "farm", "fast",
  "felt", "fill", "fish", "five", "flat", "food", "foot", "four", "free",
  "full", "girl", "gold", "gone", "gray", "grew", "grow", "hair", "half",
  "hall", "hard", "hear", "held", "hill", "hold", "hope", "hour", "huge",
  "about", "after", "again", "being", "below", "bring", "build", "carry",
  "cause", "check", "clear", "close", "could", "cover", "cross", "drink",
  "drive", "early", "earth", "eight", "every", "field", "final", "first",
  "force", "front", "green", "group", "happy", "heart", "heavy", "horse",
  "house", "human", "image", "inner", "large", "later", "laugh", "learn",
  "level", "light", "limit", "local", "money", "month", "never", "night",
  "north", "noted", "offer", "order", "other", "paper", "party", "peace",
  "place", "plant", "point", "power", "press", "price", "proud", "queen",
  "quick", "quiet", "radio", "raise", "range", "reach", "ready", "right",
  "river", "round", "royal", "shall", "shape", "share", "short", "shown",
  "sight", "since", "small", "smith", "sound", "south", "space", "speed",
  "spend", "stage", "stand", "start", "state", "steel", "still", "stock",
  "stone", "store", "story", "study", "sugar", "table", "taken", "teach",
  "their", "there", "these", "thick", "thing", "think", "third", "those",
  "three", "times", "title", "today", "total", "touch", "tower", "track",
  "trade", "train", "treat", "trial", "trust", "truth", "twice", "under",
  "union", "unity", "until", "upper", "urban", "usage", "usual", "valid",
  "value", "video", "visit", "vital", "voice", "waste", "watch", "water",
  "while", "white", "whole", "whose", "woman", "world", "would", "write",
  "young", "youth", "brain", "brave", "break", "brief", "brown", "chief",
  "child", "claim", "class", "climb", "cloud", "coach", "coast", "color",
  "cream", "crime", "crowd", "dance", "depth", "doubt", "dozen", "draft",
  "dream", "dress", "enemy", "enjoy", "entry", "equal", "error", "event",
  "exact", "exist", "extra", "faith", "favor", "fewer", "fiber", "fifty",
  "fight", "flame", "flash", "flesh", "float", "flood", "floor", "fluid",
  "focus", "frame", "fresh", "fruit", "giant", "given", "glass", "globe",
  "grace", "grade", "grain", "grand", "grant", "grass", "great", "guard",
  "guess", "guide", "birth", "blade", "blank", "blast", "blaze", "blend",
  "blind", "block", "bloom", "blown", "board", "bonus", "boost", "bound",
];

/* ---------- interfaces ---------- */

interface FallingWord {
  text: string;
  x: number;
  y: number;
  speed: number;      // px per second
  width: number;      // cached text width
  typed: number;      // how many letters already matched
  targeted: boolean;
}

interface ExplodeParticle {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

/* ---------- helpers ---------- */

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ra = (pa >> 16) & 0xff, ga = (pa >> 8) & 0xff, ba = pa & 0xff;
  const rb = (pb >> 16) & 0xff, gb = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ra + (rb - ra) * t);
  const g = Math.round(ga + (gb - ga) * t);
  const bv = Math.round(ba + (bb - ba) * t);
  return `rgb(${r},${g},${bv})`;
}

/* ---------- TypingGame ---------- */

export class TypingGame extends BaseGame {
  /* state */
  private words: FallingWord[] = [];
  private particles: ExplodeParticle[] = [];
  private currentInput = "";
  private lives = 3;
  private level = 1;
  private combo = 0;
  private maxCombo = 0;
  private comboTimer = 0;          // ms remaining for combo display
  private spawnTimer = 0;          // ms until next spawn
  private totalTime = 0;           // ms since game start
  private wordsDestroyed = 0;
  private running = true;

  /* difficulty knobs (recalculated per level) */
  private spawnInterval = 2500;    // ms between spawns
  private baseSpeed = 30;          // px/s base fall speed
  private speedVariance = 15;      // px/s random variance
  private maxWordsOnScreen = 6;
  private minWordLen = 3;
  private maxWordLen = 5;

  /* cached measure context for word widths */
  private wordFont = "bold 18px 'Courier New', monospace";

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  /* ----- lifecycle ----- */

  init(): void {
    this.resetState();
  }

  reset(): void {
    this.resetState();
  }

  private resetState(): void {
    this.words = [];
    this.particles = [];
    this.currentInput = "";
    this.lives = 3;
    this.level = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.spawnTimer = 800;  // short delay before first word
    this.totalTime = 0;
    this.wordsDestroyed = 0;
    this.running = true;
    this.setScore(0);
    this.recalcDifficulty();
  }

  private recalcDifficulty(): void {
    const lvl = this.level;
    this.spawnInterval = Math.max(700, 2500 - (lvl - 1) * 200);
    this.baseSpeed = 30 + (lvl - 1) * 8;
    this.speedVariance = 15 + (lvl - 1) * 4;
    this.maxWordsOnScreen = Math.min(12, 6 + Math.floor((lvl - 1) / 2));
    this.minWordLen = 3;
    this.maxWordLen = clamp(5 + Math.floor((lvl - 1) / 2), 5, 8);
  }

  /* ----- spawning ----- */

  private spawnWord(): void {
    if (this.words.length >= this.maxWordsOnScreen) return;

    // Filter by length
    const pool = WORDS.filter(
      (w) => w.length >= this.minWordLen && w.length <= this.maxWordLen
    );
    // Avoid duplicates on screen
    const onScreen = new Set(this.words.map((w) => w.text));
    const available = pool.filter((w) => !onScreen.has(w));
    if (available.length === 0) return;

    const text = randomPick(available);

    // Measure width
    const ctx = this.ctx;
    ctx.save();
    ctx.font = this.wordFont;
    const width = ctx.measureText(text).width;
    ctx.restore();

    const margin = 20;
    const x = margin + Math.random() * (W - width - margin * 2);
    const speed = this.baseSpeed + Math.random() * this.speedVariance;

    this.words.push({
      text,
      x,
      y: HEADER_H,
      speed,
      width,
      typed: 0,
      targeted: false,
    });
  }

  /* ----- targeting ----- */

  private updateTargeting(): void {
    // Clear all targeting
    for (const w of this.words) w.targeted = false;

    if (this.currentInput.length === 0) return;

    // Find the best match: a word whose beginning matches currentInput
    // Priority: word closest to the bottom (most urgent)
    let bestMatch: FallingWord | null = null;
    let bestY = -1;

    for (const w of this.words) {
      if (w.text.startsWith(this.currentInput.toLowerCase())) {
        if (w.y > bestY) {
          bestY = w.y;
          bestMatch = w;
        }
      }
    }

    if (bestMatch) {
      bestMatch.targeted = true;
      bestMatch.typed = this.currentInput.length;
    }
  }

  /* ----- explode animation ----- */

  private explodeWord(word: FallingWord): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = this.wordFont;

    const colors = ["#00ffcc", "#00d4ff", "#4ecdc4", "#7efff5", "#ffffff"];
    let charX = word.x;

    for (let i = 0; i < word.text.length; i++) {
      const ch = word.text[i];
      const cw = ctx.measureText(ch).width;
      const cx = charX + cw / 2;
      const cy = word.y;

      const angle = (Math.random() - 0.5) * Math.PI * 2;
      const spd = 80 + Math.random() * 160;

      this.particles.push({
        char: ch,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 40,
        life: 1.0,
        color: randomPick(colors),
        size: 16 + Math.random() * 6,
      });

      charX += cw;
    }

    // Extra sparkle particles
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 120;
      this.particles.push({
        char: "",
        x: word.x + word.width / 2,
        y: word.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1.0,
        color: randomPick(colors),
        size: 3 + Math.random() * 3,
      });
    }

    ctx.restore();
  }

  /* ----- key handling via isKeyJustPressed ----- */

  private handleInput(): void {
    // Check A-Z
    for (let i = 0; i < 26; i++) {
      const code = "Key" + String.fromCharCode(65 + i); // KeyA..KeyZ
      if (this.input.isKeyJustPressed(code)) {
        const letter = String.fromCharCode(97 + i); // a..z
        this.currentInput += letter;
        this.checkWordComplete();
        return;
      }
    }

    // Backspace: clear current input
    if (this.input.isKeyJustPressed("Backspace")) {
      if (this.currentInput.length > 0) {
        this.currentInput = this.currentInput.slice(0, -1);
      }
      return;
    }

    // Escape: clear all input
    if (this.input.isKeyJustPressed("Escape")) {
      this.currentInput = "";
      return;
    }

    // Space: clear input (acts as word separator/reset)
    if (this.input.isKeyJustPressed("Space")) {
      this.currentInput = "";
      return;
    }
  }

  private checkWordComplete(): void {
    // See if any word matches the full input
    const input = this.currentInput.toLowerCase();
    const targeted = this.words.find((w) => w.targeted);

    if (targeted && targeted.text === input) {
      // Word destroyed!
      this.destroyWord(targeted);
      this.currentInput = "";
    }
  }

  private destroyWord(word: FallingWord): void {
    // Score
    const comboMultiplier = Math.min(this.combo + 1, 10);
    const pts = word.text.length * 10 * comboMultiplier;
    this.setScore(this.score + pts);

    // Combo
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboTimer = 3000;

    // Level up every 500 points
    const newLevel = Math.floor(this.score / 500) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.recalcDifficulty();
    }

    // Explosion
    this.explodeWord(word);

    // Remove from list
    this.words = this.words.filter((w) => w !== word);
    this.wordsDestroyed++;
  }

  /* ----- update ----- */

  update(dt: number): void {
    // Always update particles
    this.updateParticles(dt);

    if (!this.running) return;

    this.totalTime += dt;

    // Handle keyboard input
    this.handleInput();

    // Update targeting
    this.updateTargeting();

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWord();
      this.spawnTimer = this.spawnInterval;
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Move words
    const dtSec = dt / 1000;
    for (let i = this.words.length - 1; i >= 0; i--) {
      const w = this.words[i];
      w.y += w.speed * dtSec;

      // Word reached danger zone
      if (w.y >= DANGER_ZONE_Y) {
        this.words.splice(i, 1);
        this.lives--;
        this.combo = 0;
        this.comboTimer = 0;
        this.currentInput = "";

        if (this.lives <= 0) {
          this.running = false;
          this.gameOver();
          return;
        }
      }
    }
  }

  private updateParticles(dt: number): void {
    const dtSec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += 120 * dtSec;  // gravity
      p.life -= dtSec * 1.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /* ----- draw ----- */

  draw(): void {
    const ctx = this.ctx;

    // Danger zone gradient at bottom
    this.drawDangerZone(ctx);

    // Header
    this.drawHeader(ctx);

    // Falling words
    this.drawWords(ctx);

    // Particles
    this.drawParticles(ctx);

    // Input box
    this.drawInputBox(ctx);

    // HUD: lives, score, level, combo
    this.drawHUD(ctx);
  }

  private drawDangerZone(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, DANGER_ZONE_Y - 60, 0, DANGER_ZONE_Y);
    grad.addColorStop(0, "rgba(255, 30, 30, 0)");
    grad.addColorStop(1, "rgba(255, 30, 30, 0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, DANGER_ZONE_Y - 60, W, 60);

    // Danger line
    ctx.strokeStyle = "rgba(255, 50, 50, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, DANGER_ZONE_Y);
    ctx.lineTo(W, DANGER_ZONE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    // Title
    ctx.save();
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TYPE ATTACK", W / 2, 25);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Thin separator line
    ctx.strokeStyle = "rgba(0, 212, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, HEADER_H);
    ctx.lineTo(W - 20, HEADER_H);
    ctx.stroke();
  }

  private drawWords(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = this.wordFont;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (const word of this.words) {
      const isTarget = word.targeted;

      if (isTarget) {
        // Background highlight for targeted word
        ctx.fillStyle = "rgba(0, 212, 255, 0.08)";
        const pad = 6;
        ctx.beginPath();
        ctx.roundRect(word.x - pad, word.y - 14, word.width + pad * 2, 28, 4);
        ctx.fill();

        // Underline showing progress
        const typedWidth = ctx.measureText(word.text.substring(0, word.typed)).width;
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00ffcc";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(word.x, word.y + 14);
        ctx.lineTo(word.x + typedWidth, word.y + 14);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw each letter
        let charX = word.x;
        for (let i = 0; i < word.text.length; i++) {
          const ch = word.text[i];
          if (i < word.typed) {
            // Typed letters: bright green with glow
            ctx.shadowColor = "#00ffcc";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#00ffcc";
          } else {
            // Remaining: bright white with glow
            ctx.shadowColor = "#00d4ff";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#ffffff";
          }
          ctx.fillText(ch, charX, word.y);
          ctx.shadowBlur = 0;
          charX += ctx.measureText(ch).width;
        }
      } else {
        // Non-targeted word: subtle cyan glow
        const urgency = clamp((word.y - HEADER_H) / (DANGER_ZONE_Y - HEADER_H), 0, 1);
        const color = lerpColor("#88ddff", "#ff6666", urgency);

        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.fillStyle = color;
        ctx.fillText(word.text, word.x, word.y);
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;

      if (p.char) {
        // Letter particle
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.font = `bold ${p.size}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.char, p.x, p.y);
        ctx.shadowBlur = 0;
      } else {
        // Sparkle particle (small circle)
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * clamp(p.life, 0, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawInputBox(ctx: CanvasRenderingContext2D): void {
    const boxX = 60;
    const boxW = W - 120;
    const boxY = INPUT_BOX_Y;
    const boxH = INPUT_BOX_H;

    // Box background
    ctx.fillStyle = "rgba(0, 212, 255, 0.05)";
    ctx.strokeStyle = "rgba(0, 212, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("TYPE", boxX + 10, boxY + boxH / 2);

    // Input text
    const textX = boxX + 46;
    ctx.save();
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (this.currentInput.length > 0) {
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#00ffcc";
      ctx.fillText(this.currentInput, textX, boxY + boxH / 2);
      ctx.shadowBlur = 0;

      // Cursor after text
      const tw = ctx.measureText(this.currentInput).width;
      const cursorVisible = Math.floor(this.totalTime / 500) % 2 === 0;
      if (cursorVisible) {
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(textX + tw + 2, boxY + 6, 2, boxH - 12);
      }
    } else {
      // Blinking cursor
      const cursorVisible = Math.floor(this.totalTime / 500) % 2 === 0;
      if (cursorVisible && this.running) {
        ctx.fillStyle = "rgba(0, 212, 255, 0.5)";
        ctx.fillRect(textX, boxY + 6, 2, boxH - 12);
      }

      // Placeholder
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "13px Inter, sans-serif";
      ctx.fillText("start typing to attack...", textX + 8, boxY + boxH / 2);
    }

    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Lives (hearts) - top left
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let i = 0; i < 3; i++) {
      const hx = 16 + i * 28;
      const hy = 8;

      if (i < this.lives) {
        this.drawHeart(ctx, hx, hy, 10, "#ff2e6e");
      } else {
        this.drawHeart(ctx, hx, hy, 10, "rgba(255, 255, 255, 0.1)");
      }
    }

    // Score - top right
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("SCORE", W - 16, 6);

    ctx.fillStyle = "#00d4ff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 6;
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText(String(this.score), W - 16, 20);
    ctx.shadowBlur = 0;

    // Level - below score
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`LEVEL ${this.level}`, W - 16, 42);

    // Combo display - center of screen when active
    if (this.combo > 1 && this.comboTimer > 0) {
      const fade = clamp(this.comboTimer / 500, 0, 1);
      ctx.globalAlpha = fade;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Large combo number
      const comboSize = 28 + Math.min(this.combo, 10) * 2;
      ctx.font = `bold ${comboSize}px Inter, sans-serif`;

      // Color based on combo
      let comboColor: string;
      if (this.combo >= 8) comboColor = "#ffd700";
      else if (this.combo >= 5) comboColor = "#ff6b6b";
      else if (this.combo >= 3) comboColor = "#00ffcc";
      else comboColor = "#00d4ff";

      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = comboColor;
      ctx.fillText(`${this.combo}x`, W / 2, H / 2 - 20);
      ctx.shadowBlur = 0;

      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillStyle = comboColor;
      ctx.fillText("COMBO", W / 2, H / 2 + 14);

      ctx.globalAlpha = 1;
    }

    // Speed indicator (WPM approximation)
    if (this.totalTime > 2000 && this.wordsDestroyed > 0) {
      const minutes = this.totalTime / 60000;
      const wpm = Math.round(this.wordsDestroyed / minutes);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(`${wpm} WPM`, 16, 42);
    }

    ctx.restore();
  }

  private drawHeart(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    if (color === "#ff2e6e") {
      ctx.shadowColor = "#ff2e6e";
      ctx.shadowBlur = 8;
    }

    const s = size / 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4 * s);
    ctx.bezierCurveTo(cx, cy + 2 * s, cx - 5 * s, cy - 2 * s, cx - 10 * s, cy + 2 * s);
    ctx.bezierCurveTo(cx - 14 * s, cy + 8 * s, cx, cy + 14 * s, cx, cy + 16 * s);
    ctx.bezierCurveTo(cx, cy + 14 * s, cx + 14 * s, cy + 8 * s, cx + 10 * s, cy + 2 * s);
    ctx.bezierCurveTo(cx + 5 * s, cy - 2 * s, cx, cy + 2 * s, cx, cy + 4 * s);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
