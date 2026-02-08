import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

// ── Config ──────────────────────────────────────────────────────────
const W = 480;
const H = 680;
const FPS = 60;
const BG = "#0a0c14";

const NEON_CYAN = "#00d4ff";
const NEON_GREEN = "#00ff88";
const CORRECT_GREEN = "#538d4e";
const WRONG_GRAY = "#3a3a3c";
const NEON_RED = "#ff3366";

const MAX_WRONG = 6;
const LETTER_SPACING = 40;

// ── Keyboard layout ─────────────────────────────────────────────────
const KB_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];
const KB_Y = 420;
const KB_KEY_W = 38;
const KB_KEY_H = 44;
const KB_KEY_GAP = 5;
const KB_ROW_GAP = 6;

// ── Word categories ─────────────────────────────────────────────────
interface WordEntry {
  word: string;
  category: string;
}

const WORD_LIST: WordEntry[] = [
  // Animals
  { word: "TIGER", category: "Animal" },
  { word: "EAGLE", category: "Animal" },
  { word: "SHARK", category: "Animal" },
  { word: "WHALE", category: "Animal" },
  { word: "SNAKE", category: "Animal" },
  { word: "HORSE", category: "Animal" },
  { word: "MOUSE", category: "Animal" },
  { word: "PANDA", category: "Animal" },
  { word: "ZEBRA", category: "Animal" },
  { word: "WOLF", category: "Animal" },
  { word: "BEAR", category: "Animal" },
  { word: "DEER", category: "Animal" },
  { word: "LION", category: "Animal" },
  { word: "FROG", category: "Animal" },
  { word: "DUCK", category: "Animal" },
  { word: "GOAT", category: "Animal" },
  { word: "SEAL", category: "Animal" },
  { word: "CROW", category: "Animal" },
  { word: "DOVE", category: "Animal" },
  { word: "MOTH", category: "Animal" },
  { word: "DOLPHIN", category: "Animal" },
  { word: "GIRAFFE", category: "Animal" },
  { word: "PENGUIN", category: "Animal" },
  { word: "LEOPARD", category: "Animal" },
  { word: "PANTHER", category: "Animal" },

  // Food
  { word: "PIZZA", category: "Food" },
  { word: "BREAD", category: "Food" },
  { word: "STEAK", category: "Food" },
  { word: "PASTA", category: "Food" },
  { word: "SALAD", category: "Food" },
  { word: "SUSHI", category: "Food" },
  { word: "GRAPE", category: "Food" },
  { word: "MANGO", category: "Food" },
  { word: "PEACH", category: "Food" },
  { word: "LEMON", category: "Food" },
  { word: "OLIVE", category: "Food" },
  { word: "MELON", category: "Food" },
  { word: "BERRY", category: "Food" },
  { word: "CANDY", category: "Food" },
  { word: "CREAM", category: "Food" },
  { word: "TOAST", category: "Food" },
  { word: "RICE", category: "Food" },
  { word: "CAKE", category: "Food" },
  { word: "SOUP", category: "Food" },
  { word: "TACO", category: "Food" },
  { word: "BACON", category: "Food" },
  { word: "WAFFLE", category: "Food" },
  { word: "CHEESE", category: "Food" },
  { word: "COOKIE", category: "Food" },
  { word: "BURGER", category: "Food" },

  // Country
  { word: "JAPAN", category: "Country" },
  { word: "SPAIN", category: "Country" },
  { word: "INDIA", category: "Country" },
  { word: "CHINA", category: "Country" },
  { word: "BRAZIL", category: "Country" },
  { word: "FRANCE", category: "Country" },
  { word: "EGYPT", category: "Country" },
  { word: "ITALY", category: "Country" },
  { word: "CHILE", category: "Country" },
  { word: "KENYA", category: "Country" },
  { word: "NEPAL", category: "Country" },
  { word: "GHANA", category: "Country" },
  { word: "CUBA", category: "Country" },
  { word: "PERU", category: "Country" },
  { word: "IRAN", category: "Country" },
  { word: "IRAQ", category: "Country" },
  { word: "GERMANY", category: "Country" },
  { word: "FINLAND", category: "Country" },
  { word: "SWEDEN", category: "Country" },
  { word: "NORWAY", category: "Country" },
  { word: "CANADA", category: "Country" },
  { word: "MEXICO", category: "Country" },
  { word: "POLAND", category: "Country" },
  { word: "GREECE", category: "Country" },
  { word: "TURKEY", category: "Country" },

  // Sport
  { word: "RUGBY", category: "Sport" },
  { word: "GOLF", category: "Sport" },
  { word: "SURF", category: "Sport" },
  { word: "POLO", category: "Sport" },
  { word: "BOXING", category: "Sport" },
  { word: "TENNIS", category: "Sport" },
  { word: "SOCCER", category: "Sport" },
  { word: "HOCKEY", category: "Sport" },
  { word: "KARATE", category: "Sport" },
  { word: "FENCING", category: "Sport" },
  { word: "ROWING", category: "Sport" },
  { word: "DIVING", category: "Sport" },
  { word: "RACING", category: "Sport" },
  { word: "SKIING", category: "Sport" },
  { word: "JUDO", category: "Sport" },

  // Color
  { word: "CORAL", category: "Color" },
  { word: "AMBER", category: "Color" },
  { word: "IVORY", category: "Color" },
  { word: "AZURE", category: "Color" },
  { word: "CRIMSON", category: "Color" },
  { word: "INDIGO", category: "Color" },
  { word: "VIOLET", category: "Color" },
  { word: "SCARLET", category: "Color" },
  { word: "MAROON", category: "Color" },
  { word: "SILVER", category: "Color" },

  // Nature
  { word: "RIVER", category: "Nature" },
  { word: "OCEAN", category: "Nature" },
  { word: "STORM", category: "Nature" },
  { word: "CLOUD", category: "Nature" },
  { word: "FLAME", category: "Nature" },
  { word: "FROST", category: "Nature" },
  { word: "STONE", category: "Nature" },
  { word: "CORAL", category: "Nature" },
  { word: "CREEK", category: "Nature" },
  { word: "CLIFF", category: "Nature" },
  { word: "BLOOM", category: "Nature" },
  { word: "FIELD", category: "Nature" },
  { word: "GROVE", category: "Nature" },
  { word: "LAKE", category: "Nature" },
  { word: "CAVE", category: "Nature" },
  { word: "DUNE", category: "Nature" },
  { word: "FOREST", category: "Nature" },
  { word: "VALLEY", category: "Nature" },
  { word: "ISLAND", category: "Nature" },
  { word: "MEADOW", category: "Nature" },

  // Music
  { word: "PIANO", category: "Music" },
  { word: "DRUMS", category: "Music" },
  { word: "FLUTE", category: "Music" },
  { word: "BANJO", category: "Music" },
  { word: "GUITAR", category: "Music" },
  { word: "VIOLIN", category: "Music" },
  { word: "TEMPO", category: "Music" },
  { word: "CHORD", category: "Music" },
  { word: "LYRIC", category: "Music" },
  { word: "OPERA", category: "Music" },
  { word: "SONG", category: "Music" },
  { word: "BASS", category: "Music" },
  { word: "HARP", category: "Music" },
  { word: "JAZZ", category: "Music" },
  { word: "TUNE", category: "Music" },
];

// ── Hangman body part animation ─────────────────────────────────────
interface BodyPartAnim {
  part: number; // 0-5
  startTime: number;
  duration: number;
}

// ── Letter reveal animation ─────────────────────────────────────────
interface LetterReveal {
  index: number;
  startTime: number;
  duration: number;
}

export class HangmanGame extends BaseGame {
  // Game state
  private word = "";
  private category = "";
  private guessedLetters: Set<string> = new Set();
  private wrongGuesses = 0;
  private revealedLetters: boolean[] = [];
  private totalScore = 0;
  private roundOver = false;
  private roundWon = false;
  private roundEndTime = 0;

  // Animations
  private bodyPartAnims: BodyPartAnim[] = [];
  private letterReveals: LetterReveal[] = [];
  private winFlashStart = 0;

  // Mouse click tracking
  private wasMouseDown = false;
  private mouseClicked = false;

  // Keyboard button rects (computed once)
  private keyRects: Map<string, { x: number; y: number; w: number; h: number }> = new Map();

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(
      canvas,
      { id: "hangman", width: W, height: H, fps: FPS, backgroundColor: BG },
      callbacks
    );
  }

  init(): void {
    this.computeKeyboardRects();
    this.resetRound();
  }

  reset(): void {
    this.totalScore = 0;
    this.setScore(0);
    this.resetRound();
  }

  private resetRound(): void {
    const entry = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    this.word = entry.word;
    this.category = entry.category;
    this.guessedLetters.clear();
    this.wrongGuesses = 0;
    this.revealedLetters = Array(this.word.length).fill(false);
    this.roundOver = false;
    this.roundWon = false;
    this.roundEndTime = 0;
    this.bodyPartAnims = [];
    this.letterReveals = [];
    this.winFlashStart = 0;
  }

  private computeKeyboardRects(): void {
    this.keyRects.clear();
    for (let r = 0; r < KB_ROWS.length; r++) {
      const row = KB_ROWS[r];
      const totalW = row.length * KB_KEY_W + (row.length - 1) * KB_KEY_GAP;
      let x = (W - totalW) / 2;
      const y = KB_Y + r * (KB_KEY_H + KB_ROW_GAP);

      for (const key of row) {
        this.keyRects.set(key, { x, y, w: KB_KEY_W, h: KB_KEY_H });
        x += KB_KEY_W + KB_KEY_GAP;
      }
    }
  }

  update(_dt: number): void {
    const now = performance.now();

    // Track mouse click (just pressed)
    const mouseDown = this.input.isMouseDown(0);
    this.mouseClicked = mouseDown && !this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    // Auto-reset after round end
    if (this.roundOver && now - this.roundEndTime > 3000) {
      this.resetRound();
      return;
    }

    if (this.roundOver) return;

    // Check for on-screen keyboard clicks
    if (this.mouseClicked) {
      const mp = this.input.getMousePosition();
      for (const [key, rect] of this.keyRects) {
        if (
          mp.x >= rect.x && mp.x <= rect.x + rect.w &&
          mp.y >= rect.y && mp.y <= rect.y + rect.h
        ) {
          this.guessLetter(key, now);
          break;
        }
      }
    }

    // Physical keyboard input
    for (let i = 0; i < 26; i++) {
      const code = `Key${String.fromCharCode(65 + i)}`;
      if (this.input.isKeyJustPressed(code)) {
        this.guessLetter(String.fromCharCode(65 + i), now);
      }
    }
  }

  private guessLetter(letter: string, now: number): void {
    if (this.roundOver) return;
    if (this.guessedLetters.has(letter)) return;

    this.guessedLetters.add(letter);

    // Check if the letter is in the word
    const indices: number[] = [];
    for (let i = 0; i < this.word.length; i++) {
      if (this.word[i] === letter) {
        indices.push(i);
      }
    }

    if (indices.length > 0) {
      // Correct guess - reveal letters
      for (const idx of indices) {
        this.revealedLetters[idx] = true;
        this.letterReveals.push({
          index: idx,
          startTime: now,
          duration: 300,
        });
      }

      // Check for win
      if (this.revealedLetters.every((r) => r)) {
        this.roundWon = true;
        this.roundOver = true;
        this.roundEndTime = now;
        this.winFlashStart = now;
        const roundScore = (MAX_WRONG + 1 - this.wrongGuesses) * 100;
        this.totalScore += roundScore;
        this.setScore(this.totalScore);
      }
    } else {
      // Wrong guess - add body part
      this.bodyPartAnims.push({
        part: this.wrongGuesses,
        startTime: now,
        duration: 400,
      });
      this.wrongGuesses++;

      // Check for loss
      if (this.wrongGuesses >= MAX_WRONG) {
        this.roundOver = true;
        this.roundEndTime = now;
        // Reveal all letters
        for (let i = 0; i < this.revealedLetters.length; i++) {
          this.revealedLetters[i] = true;
        }
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;
    const now = performance.now();

    // ── Title, Score & Category ──────────────────────────────────
    ctx.textAlign = "left";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`SCORE: ${this.totalScore}`, 16, 32);

    ctx.textAlign = "center";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.save();
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("HANGMAN", W / 2, 32);
    ctx.restore();

    ctx.textAlign = "right";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.save();
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 8;
    ctx.fillStyle = NEON_CYAN;
    ctx.fillText(this.category, W - 16, 32);
    ctx.restore();

    // ── Gallows ─────────────────────────────────────────────────
    this.drawGallows(ctx);

    // ── Hangman figure ──────────────────────────────────────────
    this.drawFigure(ctx, now);

    // ── Word display ────────────────────────────────────────────
    this.drawWord(ctx, now);

    // ── Message area ────────────────────────────────────────────
    this.drawMessage(ctx, now);

    // ── On-screen keyboard ──────────────────────────────────────
    this.drawKeyboard(ctx);

    // ── Round end countdown ─────────────────────────────────────
    if (this.roundOver) {
      const elapsed = now - this.roundEndTime;
      const remaining = Math.ceil((3000 - elapsed) / 1000);
      if (remaining > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Next word in ${remaining}...`, W / 2, H - 10);
      }
    }
  }

  private drawGallows(ctx: CanvasRenderingContext2D): void {
    const baseX = W / 2;
    const baseY = 270;
    const poleX = baseX - 60;
    const beamLen = 80;
    const poleHeight = 200;

    ctx.save();
    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 10;

    // Base
    ctx.beginPath();
    ctx.moveTo(poleX - 50, baseY);
    ctx.lineTo(poleX + 50, baseY);
    ctx.stroke();

    // Vertical pole
    ctx.beginPath();
    ctx.moveTo(poleX, baseY);
    ctx.lineTo(poleX, baseY - poleHeight);
    ctx.stroke();

    // Horizontal beam
    ctx.beginPath();
    ctx.moveTo(poleX, baseY - poleHeight);
    ctx.lineTo(poleX + beamLen, baseY - poleHeight);
    ctx.stroke();

    // Rope
    ctx.beginPath();
    ctx.moveTo(poleX + beamLen, baseY - poleHeight);
    ctx.lineTo(poleX + beamLen, baseY - poleHeight + 25);
    ctx.stroke();

    // Support brace
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(poleX, baseY - poleHeight + 30);
    ctx.lineTo(poleX + 30, baseY - poleHeight);
    ctx.stroke();

    ctx.restore();
  }

  private drawFigure(ctx: CanvasRenderingContext2D, now: number): void {
    const anchorX = W / 2 - 60 + 80; // poleX + beamLen
    const anchorY = 270 - 200 + 25;  // baseY - poleHeight + rope
    const headRadius = 18;
    const bodyLen = 50;
    const limbLen = 35;

    ctx.save();
    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = NEON_CYAN;
    ctx.shadowBlur = 15;

    for (const anim of this.bodyPartAnims) {
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      // Ease out
      const ease = 1 - (1 - progress) * (1 - progress);

      switch (anim.part) {
        case 0: {
          // Head
          ctx.beginPath();
          ctx.arc(
            anchorX,
            anchorY + headRadius,
            headRadius * ease,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          break;
        }
        case 1: {
          // Body
          const endY = anchorY + headRadius * 2 + bodyLen * ease;
          ctx.beginPath();
          ctx.moveTo(anchorX, anchorY + headRadius * 2);
          ctx.lineTo(anchorX, endY);
          ctx.stroke();
          break;
        }
        case 2: {
          // Left arm
          const bodyTop = anchorY + headRadius * 2 + 12;
          const endX = anchorX - limbLen * 0.7 * ease;
          const endY = bodyTop + limbLen * 0.7 * ease;
          ctx.beginPath();
          ctx.moveTo(anchorX, bodyTop);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
        }
        case 3: {
          // Right arm
          const bodyTop = anchorY + headRadius * 2 + 12;
          const endX = anchorX + limbLen * 0.7 * ease;
          const endY = bodyTop + limbLen * 0.7 * ease;
          ctx.beginPath();
          ctx.moveTo(anchorX, bodyTop);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
        }
        case 4: {
          // Left leg
          const bodyBottom = anchorY + headRadius * 2 + bodyLen;
          const endX = anchorX - limbLen * 0.6 * ease;
          const endY = bodyBottom + limbLen * ease;
          ctx.beginPath();
          ctx.moveTo(anchorX, bodyBottom);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
        }
        case 5: {
          // Right leg
          const bodyBottom = anchorY + headRadius * 2 + bodyLen;
          const endX = anchorX + limbLen * 0.6 * ease;
          const endY = bodyBottom + limbLen * ease;
          ctx.beginPath();
          ctx.moveTo(anchorX, bodyBottom);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
        }
      }
    }

    ctx.restore();
  }

  private drawWord(ctx: CanvasRenderingContext2D, now: number): void {
    const wordLen = this.word.length;
    const totalWidth = wordLen * LETTER_SPACING;
    const startX = (W - totalWidth) / 2 + LETTER_SPACING / 2;
    const wordY = 330;

    ctx.save();

    for (let i = 0; i < wordLen; i++) {
      const x = startX + i * LETTER_SPACING;

      if (this.revealedLetters[i]) {
        // Find reveal animation for this letter
        const revealAnim = this.letterReveals.find((a) => a.index === i);
        let scale = 1;
        if (revealAnim) {
          const elapsed = now - revealAnim.startTime;
          if (elapsed < revealAnim.duration) {
            const t = elapsed / revealAnim.duration;
            // Pop: scale up then back down
            scale = 1 + 0.3 * Math.sin(t * Math.PI);
          }
        }

        // Determine letter color
        let letterColor = "#ffffff";
        if (this.roundOver && this.roundWon) {
          // Win flash: alternate between white and green
          const flashElapsed = now - this.winFlashStart;
          const flashPhase = Math.floor(flashElapsed / 200) % 2;
          letterColor = flashPhase === 0 ? NEON_GREEN : "#ffffff";
        } else if (this.roundOver && !this.roundWon) {
          // Loss: show in red
          letterColor = NEON_RED;
        }

        ctx.save();
        ctx.translate(x, wordY);
        ctx.scale(scale, scale);
        ctx.font = "bold 32px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = letterColor === NEON_GREEN ? NEON_GREEN : NEON_CYAN;
        ctx.shadowBlur = 8;
        ctx.fillStyle = letterColor;
        ctx.fillText(this.word[i], 0, 0);
        ctx.restore();
      } else {
        // Draw underscore
        ctx.save();
        ctx.shadowColor = NEON_CYAN;
        ctx.shadowBlur = 4;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 12, wordY + 18);
        ctx.lineTo(x + 12, wordY + 18);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  private drawMessage(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.roundOver) return;

    const msgY = 385;
    const elapsed = now - this.roundEndTime;
    // Fade in over 300ms
    const alpha = Math.min(1, elapsed / 300);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.roundWon) {
      const roundScore = (MAX_WRONG + 1 - this.wrongGuesses) * 100;
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.shadowColor = NEON_GREEN;
      ctx.shadowBlur = 12;
      ctx.fillStyle = NEON_GREEN;
      ctx.fillText(`You got it!  +${roundScore}`, W / 2, msgY);
    } else {
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.shadowColor = NEON_RED;
      ctx.shadowBlur = 12;
      ctx.fillStyle = NEON_RED;
      ctx.fillText(`The word was: ${this.word}`, W / 2, msgY);
    }

    ctx.restore();
  }

  private drawKeyboard(ctx: CanvasRenderingContext2D): void {
    for (const [key, rect] of this.keyRects) {
      const guessed = this.guessedLetters.has(key);
      const isInWord = this.word.includes(key);

      ctx.save();

      if (guessed) {
        if (isInWord) {
          // Correct guess
          ctx.fillStyle = CORRECT_GREEN;
        } else {
          // Wrong guess
          ctx.fillStyle = WRONG_GRAY;
          ctx.globalAlpha = 0.5;
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
      }

      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
      ctx.fill();

      // Letter
      if (guessed && !isInWord) {
        ctx.globalAlpha = 0.3;
      } else {
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(key, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);

      ctx.restore();
    }
  }
}
