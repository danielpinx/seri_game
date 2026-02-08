import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

// ── Config ─────────────────────────────────────
const WIDTH = 480;
const HEIGHT = 560;
const BG = "#0a0c14";

const CONFIG = {
  id: "simon-says",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

// ── Phases ─────────────────────────────────────
type Phase = "SHOWING" | "PLAYER_TURN" | "SUCCESS" | "GAME_OVER";

// ── Button definitions ─────────────────────────
interface SimonButton {
  label: string;
  color: string;        // full bright color
  dimColor: string;     // dimmed version
  glowColor: string;    // glow tint
  x: number;
  y: number;
  w: number;
  h: number;
  keyCodes: string[];   // keyboard codes that activate this button
}

const BTN_SIZE = 180;
const BTN_GAP = 20;
const GRID_LEFT = (WIDTH - BTN_SIZE * 2 - BTN_GAP) / 2;
const GRID_TOP = 80;

const BUTTON_DEFS: Array<{
  label: string;
  color: string;
  dimColor: string;
  glowColor: string;
  gridCol: number;
  gridRow: number;
  keyCodes: string[];
}> = [
  {
    label: "G",
    color: "#4ade80",
    dimColor: "#1a5c34",
    glowColor: "#4ade80",
    gridCol: 0,
    gridRow: 0,
    keyCodes: ["KeyQ", "ArrowUp"],
  },
  {
    label: "R",
    color: "#ff4466",
    dimColor: "#5c1a26",
    glowColor: "#ff4466",
    gridCol: 1,
    gridRow: 0,
    keyCodes: ["KeyW", "ArrowRight"],
  },
  {
    label: "Y",
    color: "#fbbf24",
    dimColor: "#5c4a0e",
    glowColor: "#fbbf24",
    gridCol: 0,
    gridRow: 1,
    keyCodes: ["KeyA", "ArrowLeft"],
  },
  {
    label: "B",
    color: "#00d4ff",
    dimColor: "#0a4a5c",
    glowColor: "#00d4ff",
    gridCol: 1,
    gridRow: 1,
    keyCodes: ["KeyS", "ArrowDown"],
  },
];

// ── Speed tiers ────────────────────────────────
function getShowTiming(round: number): { lightMs: number; gapMs: number } {
  if (round <= 5) return { lightMs: 400, gapMs: 200 };
  if (round <= 10) return { lightMs: 350, gapMs: 150 };
  if (round <= 15) return { lightMs: 300, gapMs: 100 };
  return { lightMs: 250, gapMs: 80 };
}

// ── Main class ─────────────────────────────────
export class SimonSaysGame extends BaseGame {
  // Buttons (built once in init)
  private buttons: SimonButton[] = [];

  // Sequence
  private sequence: number[] = [];
  private playerIndex = 0;
  private round = 1;
  private bestRound = 0;

  // Phase
  private phase: Phase = "SHOWING";

  // Show-phase timers
  private showIndex = 0;          // which step in sequence we're showing
  private showTimer = 0;          // counts down ms
  private showingLit = true;      // true = light on, false = gap

  // Button highlight state (per button, ms remaining of highlight)
  private buttonLitTimers: number[] = [0, 0, 0, 0];

  // Success phase timer
  private successTimer = 0;
  private readonly SUCCESS_DISPLAY_MS = 800;

  // Game-over flash
  private gameOverTimer = 0;
  private gameOverFlashOn = false;
  private readonly GAME_OVER_FLASH_MS = 1500;

  // Wrong-press flash
  private wrongFlashTimer = 0;
  private readonly WRONG_FLASH_MS = 400;

  // Player click detection
  private wasMouseDown = false;

  // Running score (cumulative)
  private totalScore = 0;

  // Center circle animation
  private centerPulse = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  // ── Lifecycle ──────────────────────────────────

  init(): void {
    this.buildButtons();
    this.resetGameState();
  }

  reset(): void {
    this.resetGameState();
  }

  private buildButtons(): void {
    this.buttons = BUTTON_DEFS.map((def) => ({
      label: def.label,
      color: def.color,
      dimColor: def.dimColor,
      glowColor: def.glowColor,
      x: GRID_LEFT + def.gridCol * (BTN_SIZE + BTN_GAP),
      y: GRID_TOP + def.gridRow * (BTN_SIZE + BTN_GAP),
      w: BTN_SIZE,
      h: BTN_SIZE,
      keyCodes: def.keyCodes,
    }));
  }

  private resetGameState(): void {
    this.sequence = [];
    this.playerIndex = 0;
    this.round = 1;
    this.bestRound = 0;
    this.totalScore = 0;
    this.buttonLitTimers = [0, 0, 0, 0];
    this.wasMouseDown = false;
    this.successTimer = 0;
    this.gameOverTimer = 0;
    this.wrongFlashTimer = 0;
    this.centerPulse = 0;
    this.setScore(0);

    this.startNewRound();
  }

  // ── Round management ───────────────────────────

  private startNewRound(): void {
    // Add one random button to the sequence
    this.sequence.push(Math.floor(Math.random() * 4));
    this.playerIndex = 0;
    this.phase = "SHOWING";
    this.showIndex = 0;
    this.showingLit = false;
    // Start with a brief gap before showing first light
    const timing = getShowTiming(this.round);
    this.showTimer = timing.gapMs;
    this.showingLit = false;
    this.buttonLitTimers = [0, 0, 0, 0];
  }

  // ── Update ─────────────────────────────────────

  update(dt: number): void {
    this.centerPulse += dt * 0.003;

    // Decrement button highlight timers
    for (let i = 0; i < 4; i++) {
      if (this.buttonLitTimers[i] > 0) {
        this.buttonLitTimers[i] = Math.max(0, this.buttonLitTimers[i] - dt);
      }
    }

    // Decrement wrong flash
    if (this.wrongFlashTimer > 0) {
      this.wrongFlashTimer = Math.max(0, this.wrongFlashTimer - dt);
    }

    switch (this.phase) {
      case "SHOWING":
        this.updateShowing(dt);
        break;
      case "PLAYER_TURN":
        this.updatePlayerTurn(dt);
        break;
      case "SUCCESS":
        this.updateSuccess(dt);
        break;
      case "GAME_OVER":
        this.updateGameOver(dt);
        break;
    }

    // Track mouse state for click detection
    this.wasMouseDown = this.input.isMouseDown(0);
  }

  private updateShowing(dt: number): void {
    this.showTimer -= dt;

    if (this.showTimer <= 0) {
      if (!this.showingLit) {
        // Start lighting up the current step
        if (this.showIndex < this.sequence.length) {
          const timing = getShowTiming(this.round);
          this.showingLit = true;
          this.showTimer = timing.lightMs;
          // Light up the button
          const btnIdx = this.sequence[this.showIndex];
          this.buttonLitTimers[btnIdx] = timing.lightMs;
        }
      } else {
        // Light just turned off, move to next step or end
        this.showingLit = false;
        this.showIndex++;

        if (this.showIndex >= this.sequence.length) {
          // Done showing, player's turn
          this.phase = "PLAYER_TURN";
          this.playerIndex = 0;
        } else {
          const timing = getShowTiming(this.round);
          this.showTimer = timing.gapMs;
        }
      }
    }
  }

  private updatePlayerTurn(_dt: number): void {
    // Check keyboard input
    for (let i = 0; i < 4; i++) {
      for (const code of this.buttons[i].keyCodes) {
        if (this.input.isKeyJustPressed(code)) {
          this.handlePlayerInput(i);
          return;
        }
      }
    }

    // Check mouse click
    const mouseDown = this.input.isMouseDown(0);
    const mouseClicked = mouseDown && !this.wasMouseDown;

    if (mouseClicked) {
      const pos = this.input.getMousePosition();
      for (let i = 0; i < 4; i++) {
        const btn = this.buttons[i];
        if (
          pos.x >= btn.x &&
          pos.x <= btn.x + btn.w &&
          pos.y >= btn.y &&
          pos.y <= btn.y + btn.h
        ) {
          this.handlePlayerInput(i);
          return;
        }
      }
    }
  }

  private handlePlayerInput(btnIndex: number): void {
    // Light up pressed button
    this.buttonLitTimers[btnIndex] = 200;

    const expected = this.sequence[this.playerIndex];

    if (btnIndex !== expected) {
      // Wrong!
      this.wrongFlashTimer = this.WRONG_FLASH_MS;
      this.phase = "GAME_OVER";
      this.gameOverTimer = this.GAME_OVER_FLASH_MS;
      this.gameOverFlashOn = true;
      // Best round is what they completed (round - 1 since they failed this round)
      this.bestRound = Math.max(this.bestRound, this.round - 1);
      return;
    }

    // Correct
    this.playerIndex++;

    if (this.playerIndex >= this.sequence.length) {
      // Completed the round
      this.totalScore += this.round * 10;
      this.setScore(this.totalScore);
      this.bestRound = Math.max(this.bestRound, this.round);
      this.phase = "SUCCESS";
      this.successTimer = this.SUCCESS_DISPLAY_MS;
    }
  }

  private updateSuccess(dt: number): void {
    this.successTimer -= dt;
    if (this.successTimer <= 0) {
      this.round++;
      this.startNewRound();
    }
  }

  private updateGameOver(dt: number): void {
    this.gameOverTimer -= dt;

    // Flash effect
    const flashRate = 150; // ms per flash toggle
    this.gameOverFlashOn = Math.floor(this.gameOverTimer / flashRate) % 2 === 0;

    if (this.gameOverTimer <= 0) {
      this.gameOver();
    }
  }

  // ── Draw ───────────────────────────────────────

  draw(): void {
    const ctx = this.ctx;

    // Background is cleared by BaseGame loop

    this.drawHeader(ctx);
    this.drawButtons(ctx);
    this.drawCenterCircle(ctx);
    this.drawFooter(ctx);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    // Title
    ctx.save();
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 12;
    ctx.fillText("SIMON SAYS", WIDTH / 2, 14);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Score (left)
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#a0a0c0";
    ctx.fillText("SCORE", 20, 12);
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 8;
    ctx.fillText(`${this.totalScore}`, 20, 32);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Best round (right)
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#a0a0c0";
    ctx.fillText("BEST", WIDTH - 20, 12);
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillStyle = "#00d4ff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 8;
    ctx.fillText(`R${this.bestRound}`, WIDTH - 20, 32);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Thin separator line
    ctx.save();
    ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 62);
    ctx.lineTo(WIDTH - 20, 62);
    ctx.stroke();
    ctx.restore();
  }

  private drawButtons(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 4; i++) {
      const btn = this.buttons[i];
      const isLit = this.buttonLitTimers[i] > 0;
      const isWrongFlash = this.wrongFlashTimer > 0 && this.phase === "GAME_OVER";
      const isGameOverFlash = this.phase === "GAME_OVER" && this.gameOverFlashOn;

      ctx.save();

      // Determine button color
      let fillColor: string;
      let glowAmount: number;

      if (isGameOverFlash || isWrongFlash) {
        // Flash red during game over / wrong press
        fillColor = "#ff2244";
        glowAmount = 30;
      } else if (isLit) {
        fillColor = btn.color;
        // Intensity based on remaining lit time
        glowAmount = 35;
      } else {
        fillColor = btn.dimColor;
        glowAmount = 0;
      }

      // Scale up slightly when lit
      const scale = isLit && !isGameOverFlash ? 1.03 : 1.0;
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;

      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      // Shadow / glow
      if (glowAmount > 0) {
        ctx.shadowColor = isGameOverFlash || isWrongFlash ? "#ff2244" : btn.glowColor;
        ctx.shadowBlur = glowAmount;
      }

      // Draw rounded rect
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 16);
      ctx.fill();

      // Inner highlight when lit
      if (isLit && !isGameOverFlash && !isWrongFlash) {
        ctx.shadowBlur = 0;
        // Radial gradient overlay for depth
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, btn.w * 0.55);
        grad.addColorStop(0, "rgba(255,255,255,0.25)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 16);
        ctx.fill();
      }

      // Subtle border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isLit
        ? "rgba(255,255,255,0.3)"
        : "rgba(255,255,255,0.08)";
      ctx.lineWidth = isLit ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 16);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawCenterCircle(ctx: CanvasRenderingContext2D): void {
    const cx = WIDTH / 2;
    const cy = GRID_TOP + BTN_SIZE + BTN_GAP / 2;
    const radius = 42;

    // Pulsing glow
    const pulse = 0.5 + 0.5 * Math.sin(this.centerPulse);

    ctx.save();

    // Dark circle background
    ctx.fillStyle = "#0d0f1a";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Text inside
    let mainText: string;
    let subText: string;
    let mainColor: string;

    switch (this.phase) {
      case "SHOWING":
        mainText = `${this.round}`;
        subText = "WATCH";
        mainColor = "#a855f7";
        break;
      case "PLAYER_TURN":
        mainText = `${this.round}`;
        subText = "YOUR TURN";
        mainColor = "#4ade80";
        break;
      case "SUCCESS":
        mainText = `${this.round}`;
        subText = "NICE!";
        mainColor = "#fbbf24";
        break;
      case "GAME_OVER":
        mainText = `${this.round}`;
        subText = "OVER";
        mainColor = "#ff4466";
        break;
    }

    // Round number
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = mainColor;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 10;
    ctx.fillText(mainText, cx, cy - 6);
    ctx.shadowBlur = 0;

    // Sub label
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(subText, cx, cy + 16);

    ctx.restore();
  }

  private drawFooter(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Current streak / round info
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    if (this.phase === "GAME_OVER") {
      ctx.fillStyle = "#ff4466";
      ctx.shadowColor = "#ff4466";
      ctx.shadowBlur = 10;
      ctx.fillText(`Game Over! Round ${this.round}`, WIDTH / 2, 475);
      ctx.shadowBlur = 0;
    } else if (this.phase === "SUCCESS") {
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 10;
      ctx.fillText(`Round ${this.round} Complete!`, WIDTH / 2, 475);
      ctx.shadowBlur = 0;
    } else if (this.phase === "PLAYER_TURN") {
      // Show progress dots
      const dotRadius = 5;
      const dotGap = 14;
      const totalDots = this.sequence.length;
      const totalWidth = totalDots * dotRadius * 2 + (totalDots - 1) * (dotGap - dotRadius * 2);
      const startX = WIDTH / 2 - totalWidth / 2 + dotRadius;

      for (let i = 0; i < totalDots; i++) {
        const dx = startX + i * dotGap;
        const dy = 480;

        ctx.beginPath();
        ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);

        if (i < this.playerIndex) {
          // Completed
          ctx.fillStyle = "#4ade80";
          ctx.shadowColor = "#4ade80";
          ctx.shadowBlur = 8;
        } else if (i === this.playerIndex) {
          // Current
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 6;
        } else {
          // Not yet
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else {
      // SHOWING phase
      ctx.fillStyle = "#a855f7";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 8;
      ctx.fillText("Watch carefully...", WIDTH / 2, 475);
      ctx.shadowBlur = 0;
    }

    // Hint text
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.fillText("Q/W/A/S or Arrow Keys or Click", WIDTH / 2, 530);

    ctx.restore();
  }
}
