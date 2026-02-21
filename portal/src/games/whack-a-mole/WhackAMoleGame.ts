import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

const WIDTH = 520;
const HEIGHT = 620;
const BG = "#0a0c14";

const CONFIG = {
  id: "whack-a-mole",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_RX = 52;
const HOLE_RY = 22;
const MOLE_RADIUS = 36;
const GRID_X_START = 90;
const GRID_X_SPACING = 170;
const GRID_Y_START = 150;
const GRID_Y_SPACING = 140;

const GAME_DURATION = 60000; // 60 seconds

type MoleType = "normal" | "golden" | "bomb";

type MoleState = "hidden" | "rising" | "visible" | "whacked" | "hiding";

interface Mole {
  row: number;
  col: number;
  type: MoleType;
  state: MoleState;
  timer: number;
  visibleDuration: number;
  animProgress: number; // 0 = fully hidden, 1 = fully visible
  whackTimer: number;
  blinkTimer: number;
  isBlinking: boolean;
}

interface HitEffect {
  x: number;
  y: number;
  timer: number;
  particles: { angle: number; speed: number; size: number; color: string }[];
  scoreText: string;
  scoreColor: string;
}

interface MissEffect {
  x: number;
  y: number;
  timer: number;
}

interface ScreenFlash {
  timer: number;
  color: string;
}

function holeCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: GRID_X_START + col * GRID_X_SPACING,
    y: GRID_Y_START + row * GRID_Y_SPACING,
  };
}

export class WhackAMoleGame extends BaseGame {
  private moles: Mole[] = [];
  private hitEffects: HitEffect[] = [];
  private missEffects: MissEffect[] = [];
  private screenFlash: ScreenFlash | null = null;
  private timeRemaining = GAME_DURATION;
  private spawnTimer = 0;
  private combo = 0;
  private maxCombo = 0;
  private totalHits = 0;
  private totalMisses = 0;
  private wasMouseDown = false;
  private comboDisplay: { text: string; x: number; y: number; timer: number } | null = null;
  private occupiedHoles: boolean[][] = [];
  private frameCount = 0;
  private _gameDuration = 60000;
  private _visDurMul = 1;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.resetState();
  }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._gameDuration = Math.round(diffValue(d, 75000, 60000, 45000));
    this._visDurMul = diffValue(d, 1.3, 1, 0.7);
    this.moles = [];
    this.hitEffects = [];
    this.missEffects = [];
    this.screenFlash = null;
    this.timeRemaining = this._gameDuration;
    this.spawnTimer = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.wasMouseDown = false;
    this.comboDisplay = null;
    this.frameCount = 0;
    this.occupiedHoles = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      this.occupiedHoles[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        this.occupiedHoles[r][c] = false;
      }
    }
    this.setScore(0);
  }

  reset(): void {
    this.resetState();
  }

  update(dt: number): void {
    this.frameCount++;

    // Update timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.gameOver();
      return;
    }

    const elapsed = this._gameDuration - this.timeRemaining;
    const mouseDown = this.input.isMouseDown(0);
    const mouseClicked = mouseDown && !this.wasMouseDown;
    const mousePos = this.input.getMousePosition();

    // Handle click
    if (mouseClicked) {
      this.handleClick(mousePos.x, mousePos.y);
    }
    this.wasMouseDown = mouseDown;

    // Spawn moles
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.trySpawnMole(elapsed);
      const spawnInterval = this.getSpawnInterval(elapsed);
      this.spawnTimer = spawnInterval;
    }

    // Update moles
    for (let i = this.moles.length - 1; i >= 0; i--) {
      const mole = this.moles[i];
      this.updateMole(mole, dt, mousePos);

      if (mole.state === "hidden") {
        this.occupiedHoles[mole.row][mole.col] = false;
        this.moles.splice(i, 1);
      }
    }

    // Update hit effects
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      this.hitEffects[i].timer -= dt;
      if (this.hitEffects[i].timer <= 0) {
        this.hitEffects.splice(i, 1);
      }
    }

    // Update miss effects
    for (let i = this.missEffects.length - 1; i >= 0; i--) {
      this.missEffects[i].timer -= dt;
      if (this.missEffects[i].timer <= 0) {
        this.missEffects.splice(i, 1);
      }
    }

    // Update screen flash
    if (this.screenFlash) {
      this.screenFlash.timer -= dt;
      if (this.screenFlash.timer <= 0) {
        this.screenFlash = null;
      }
    }

    // Update combo display
    if (this.comboDisplay) {
      this.comboDisplay.timer -= dt;
      if (this.comboDisplay.timer <= 0) {
        this.comboDisplay = null;
      }
    }
  }

  private getSpawnInterval(elapsed: number): number {
    if (elapsed < 20000) return 1500;
    if (elapsed < 40000) return 1000;
    return 700;
  }

  private getVisibleDuration(elapsed: number, type: MoleType): number {
    if (type === "golden") return 800 * this._visDurMul;
    if (elapsed < 20000) return (1500 + Math.random() * 500) * this._visDurMul;
    if (elapsed < 40000) return (1200 + Math.random() * 300) * this._visDurMul;
    return (800 + Math.random() * 200) * this._visDurMul;
  }

  private getMaxActiveMoles(elapsed: number): number {
    if (elapsed < 20000) return 2;
    return 3;
  }

  private trySpawnMole(elapsed: number): void {
    const activeMoles = this.moles.filter(
      (m) => m.state !== "hidden" && m.state !== "hiding"
    ).length;
    const maxActive = this.getMaxActiveMoles(elapsed);
    if (activeMoles >= maxActive) return;

    // Find free holes
    const freeHoles: { row: number; col: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!this.occupiedHoles[r][c]) {
          freeHoles.push({ row: r, col: c });
        }
      }
    }
    if (freeHoles.length === 0) return;

    const hole = freeHoles[Math.floor(Math.random() * freeHoles.length)];

    // Determine type
    let type: MoleType = "normal";
    const rand = Math.random();
    if (rand < 0.10) {
      type = "golden";
    } else if (rand < 0.25) {
      type = "bomb";
    }

    const visibleDuration = this.getVisibleDuration(elapsed, type);

    const mole: Mole = {
      row: hole.row,
      col: hole.col,
      type,
      state: "rising",
      timer: 0,
      visibleDuration,
      animProgress: 0,
      whackTimer: 0,
      blinkTimer: 1000 + Math.random() * 2000,
      isBlinking: false,
    };

    this.moles.push(mole);
    this.occupiedHoles[hole.row][hole.col] = true;
  }

  private updateMole(
    mole: Mole,
    dt: number,
    mousePos: { x: number; y: number }
  ): void {
    switch (mole.state) {
      case "rising":
        mole.animProgress += dt / 200;
        if (mole.animProgress >= 1) {
          mole.animProgress = 1;
          mole.state = "visible";
          mole.timer = mole.visibleDuration;
        }
        break;
      case "visible":
        mole.timer -= dt;
        // Blinking
        mole.blinkTimer -= dt;
        if (mole.blinkTimer <= 0) {
          if (mole.isBlinking) {
            mole.isBlinking = false;
            mole.blinkTimer = 1500 + Math.random() * 2000;
          } else {
            mole.isBlinking = true;
            mole.blinkTimer = 120;
          }
        }
        if (mole.timer <= 0) {
          mole.state = "hiding";
          mole.animProgress = 1;
        }
        break;
      case "whacked":
        mole.whackTimer -= dt;
        if (mole.whackTimer <= 0) {
          mole.state = "hiding";
          mole.animProgress = 1;
        }
        break;
      case "hiding":
        mole.animProgress -= dt / 150;
        if (mole.animProgress <= 0) {
          mole.animProgress = 0;
          mole.state = "hidden";
        }
        break;
    }
  }

  private handleClick(mx: number, my: number): void {
    // Check if any visible mole was clicked
    let hitAny = false;
    for (const mole of this.moles) {
      if (mole.state !== "visible" && mole.state !== "rising") continue;

      const center = holeCenter(mole.row, mole.col);
      const moleY = center.y - 20 - (MOLE_RADIUS * 2) * mole.animProgress * 0.5;
      const moleX = center.x;
      const dx = mx - moleX;
      const dy = my - moleY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOLE_RADIUS + 10) {
        this.whackMole(mole, center.x, moleY);
        hitAny = true;
        break;
      }
    }

    if (!hitAny) {
      // Check if click was in the grid area
      if (my > 80 && my < 520) {
        this.combo = 0;
        this.totalMisses++;
        this.missEffects.push({ x: mx, y: my, timer: 400 });
      }
    }
  }

  private whackMole(mole: Mole, x: number, y: number): void {
    let points = 0;
    let scoreText = "";
    let scoreColor = "";

    if (mole.type === "bomb") {
      points = -20;
      this.timeRemaining = Math.max(0, this.timeRemaining - 3000);
      this.combo = 0;
      scoreText = "-20 & -3s!";
      scoreColor = "#ff4466";
      this.screenFlash = { timer: 300, color: "rgba(255,68,102,0.3)" };
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.totalHits++;

      const comboMultiplier = Math.min(this.combo, 4);

      if (mole.type === "golden") {
        points = 50 * comboMultiplier;
        scoreText = `+${points}`;
        scoreColor = "#ffd700";
      } else {
        points = 10 * comboMultiplier;
        scoreText = `+${points}`;
        scoreColor = "#00d4ff";
      }

      if (this.combo >= 2) {
        this.comboDisplay = {
          text: `x${comboMultiplier}!`,
          x,
          y: y - 30,
          timer: 800,
        };
      }
    }

    this.setScore(Math.max(0, this.score + points));

    mole.state = "whacked";
    mole.whackTimer = 300;

    // Create hit particles
    const particles: HitEffect["particles"] = [];
    const numParticles = mole.type === "bomb" ? 12 : 8;
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles + Math.random() * 0.3;
      const speed = 60 + Math.random() * 80;
      const size = 2 + Math.random() * 3;
      let color: string;
      if (mole.type === "bomb") {
        color = Math.random() > 0.5 ? "#ff4466" : "#ff8844";
      } else if (mole.type === "golden") {
        color = Math.random() > 0.5 ? "#ffd700" : "#ffec80";
      } else {
        color = Math.random() > 0.5 ? "#00d4ff" : "#ffffff";
      }
      particles.push({ angle, speed, size, color });
    }

    this.hitEffects.push({
      x,
      y,
      timer: 500,
      particles,
      scoreText,
      scoreColor,
    });
  }

  draw(): void {
    const ctx = this.ctx;
    const elapsed = this._gameDuration - this.timeRemaining;
    const mousePos = this.input.getMousePosition();

    // Draw title
    ctx.save();
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#00d4ff";
    ctx.fillText("WHACK-A-MOLE", WIDTH / 2, 12);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw score (left)
    ctx.save();
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#8892a0";
    ctx.fillText("SCORE", 20, 10);
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${this.score}`, 20, 32);
    ctx.restore();

    // Draw timer bar (right area)
    this.drawTimerBar(ctx);

    // Draw holes and moles
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.drawHole(ctx, r, c, mousePos);
      }
    }

    // Draw hit effects
    for (const effect of this.hitEffects) {
      this.drawHitEffect(ctx, effect);
    }

    // Draw miss effects
    for (const effect of this.missEffects) {
      this.drawMissEffect(ctx, effect);
    }

    // Draw combo display
    if (this.comboDisplay) {
      this.drawComboDisplay(ctx);
    }

    // Draw screen flash
    if (this.screenFlash) {
      const alpha = this.screenFlash.timer / 300;
      ctx.fillStyle = `rgba(255,68,102,${0.3 * alpha})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Draw bottom stats
    this.drawBottomStats(ctx);
  }

  private drawTimerBar(ctx: CanvasRenderingContext2D): void {
    const barX = 370;
    const barY = 15;
    const barW = 130;
    const barH = 16;
    const progress = this.timeRemaining / this._gameDuration;
    const seconds = Math.ceil(this.timeRemaining / 1000);

    // Background
    ctx.fillStyle = "#1a1c2e";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    // Fill
    let barColor: string;
    if (progress > 0.5) barColor = "#00d4ff";
    else if (progress > 0.25) barColor = "#ffd700";
    else barColor = "#ff4466";

    ctx.save();
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 6;
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Time text
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${seconds}s`, barX + barW, barY + barH + 4);
  }

  private drawHole(
    ctx: CanvasRenderingContext2D,
    row: number,
    col: number,
    mousePos: { x: number; y: number }
  ): void {
    const center = holeCenter(row, col);
    const cx = center.x;
    const cy = center.y;

    // Find mole at this position
    const mole = this.moles.find((m) => m.row === row && m.col === col);

    // Draw hole shadow/depth
    ctx.save();

    // Clip region for mole hiding inside hole
    ctx.save();

    // Draw mole if present (before the hole rim to create "behind" effect)
    if (mole && mole.state !== "hidden") {
      const anim = mole.animProgress;
      const moleBodyY = cy - 10 - (MOLE_RADIUS * 1.6) * anim;

      // Clip: mole should only show above the hole opening
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, WIDTH, cy - HOLE_RY + 2);
      ctx.clip();

      this.drawMoleCharacter(ctx, cx, moleBodyY, mole, mousePos);

      ctx.restore();
    }

    ctx.restore();

    // Draw hole pit (dark ellipse)
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, HOLE_RX);
    gradient.addColorStop(0, "#05060a");
    gradient.addColorStop(0.7, "#0a0d16");
    gradient.addColorStop(1, "#151828");

    ctx.beginPath();
    ctx.ellipse(cx, cy, HOLE_RX, HOLE_RY, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Hole rim (top half arc)
    ctx.beginPath();
    ctx.ellipse(cx, cy, HOLE_RX + 4, HOLE_RY + 3, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = "#2a2e45";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Hole rim highlight
    ctx.beginPath();
    ctx.ellipse(cx, cy, HOLE_RX + 4, HOLE_RY + 3, 0, Math.PI + 0.3, Math.PI * 2 - 0.3);
    ctx.strokeStyle = "#3a3e5a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Front rim (bottom half) - this covers the mole body below hole line
    ctx.beginPath();
    ctx.ellipse(cx, cy, HOLE_RX + 4, HOLE_RY + 3, 0, 0, Math.PI);
    ctx.strokeStyle = "#1e2035";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Front fill to hide mole body below hole
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, HOLE_RX + 6, HOLE_RY + 6, 0, 0, Math.PI);
    ctx.fillStyle = BG;
    ctx.fill();

    ctx.restore();
  }

  private drawMoleCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    mole: Mole,
    mousePos: { x: number; y: number }
  ): void {
    ctx.save();

    const isWhacked = mole.state === "whacked";

    if (mole.type === "bomb") {
      this.drawBomb(ctx, x, y, isWhacked);
    } else {
      this.drawCuteMole(ctx, x, y, mole, mousePos, isWhacked);
    }

    ctx.restore();
  }

  private drawCuteMole(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    mole: Mole,
    mousePos: { x: number; y: number },
    isWhacked: boolean
  ): void {
    const isGolden = mole.type === "golden";
    const bodyColor = isGolden ? "#ffd700" : "#00d4ff";
    const bodyColorDark = isGolden ? "#cc9900" : "#009abb";
    const bodyColorLight = isGolden ? "#ffec80" : "#66e5ff";

    // Body
    ctx.save();
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = isGolden ? 16 : 10;

    // Main body (rounded shape)
    const bodyGrad = ctx.createRadialGradient(x - 5, y - 8, 4, x, y, MOLE_RADIUS);
    bodyGrad.addColorStop(0, bodyColorLight);
    bodyGrad.addColorStop(0.6, bodyColor);
    bodyGrad.addColorStop(1, bodyColorDark);

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, MOLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ears
    const earR = 10;
    const earOffsetX = 24;
    const earOffsetY = -20;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + side * earOffsetX, y + earOffsetY, earR, 0, Math.PI * 2);
      ctx.fillStyle = bodyColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + side * earOffsetX, y + earOffsetY, earR - 3, 0, Math.PI * 2);
      ctx.fillStyle = isGolden ? "#ffb347" : "#0090aa";
      ctx.fill();
    }

    // Eyes
    const eyeOffsetX = 11;
    const eyeY = y - 8;
    const eyeR = 7;

    if (isWhacked) {
      // Dizzy X eyes
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        const ex = x + side * eyeOffsetX;
        ctx.beginPath();
        ctx.moveTo(ex - 4, eyeY - 4);
        ctx.lineTo(ex + 4, eyeY + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex + 4, eyeY - 4);
        ctx.lineTo(ex - 4, eyeY + 4);
        ctx.stroke();
      }
    } else {
      // Eye whites
      for (const side of [-1, 1]) {
        const ex = x + side * eyeOffsetX;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      if (mole.isBlinking) {
        // Closed eyes (line)
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) {
          const ex = x + side * eyeOffsetX;
          ctx.beginPath();
          ctx.moveTo(ex - 5, eyeY);
          ctx.lineTo(ex + 5, eyeY);
          ctx.stroke();
        }
      } else {
        // Pupils - look towards mouse
        const dx = mousePos.x - x;
        const dy = mousePos.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxOffset = 3;
        let pupilDx = 0;
        let pupilDy = 0;
        if (dist > 0) {
          pupilDx = (dx / dist) * maxOffset;
          pupilDy = (dy / dist) * maxOffset;
        }

        // Check if cursor is near - look scared
        const isScared = dist < 100;

        const pupilR = isScared ? 5 : 4;
        for (const side of [-1, 1]) {
          const ex = x + side * eyeOffsetX;
          ctx.beginPath();
          ctx.arc(ex + pupilDx, eyeY + pupilDy, pupilR, 0, Math.PI * 2);
          ctx.fillStyle = "#1a1a2e";
          ctx.fill();

          // Eye shine
          ctx.beginPath();
          ctx.arc(ex + pupilDx + 1.5, eyeY + pupilDy - 1.5, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }

        // Scared expression - raised eyebrows
        if (isScared) {
          ctx.strokeStyle = bodyColorDark;
          ctx.lineWidth = 2;
          for (const side of [-1, 1]) {
            const ex = x + side * eyeOffsetX;
            ctx.beginPath();
            ctx.arc(ex, eyeY - 12, 8, Math.PI + 0.4, Math.PI * 2 - 0.4);
            ctx.stroke();
          }
        }
      }
    }

    // Nose
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = isGolden ? "#cc7700" : "#006688";
    ctx.fill();

    // Mouth
    if (isWhacked) {
      // Wavy/dizzy mouth
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 14);
      ctx.quadraticCurveTo(x - 4, y + 10, x, y + 14);
      ctx.quadraticCurveTo(x + 4, y + 18, x + 8, y + 14);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dizzy stars around head
      const starTime = mole.whackTimer / 300;
      for (let i = 0; i < 3; i++) {
        const angle = starTime * Math.PI * 4 + (i * Math.PI * 2) / 3;
        const sr = 22 + Math.sin(angle * 2) * 4;
        const sx = x + Math.cos(angle) * sr;
        const sy = y - 26 + Math.sin(angle) * 8;
        this.drawStar(ctx, sx, sy, 3, 5, "#ffd700", 0.8);
      }
    } else {
      // Happy smile
      ctx.beginPath();
      ctx.arc(x, y + 8, 8, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = bodyColorDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Cheeks (blush)
    if (!isWhacked) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(x + side * 20, y + 4, 6, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = isGolden
          ? "rgba(255,140,0,0.25)"
          : "rgba(0,160,220,0.2)";
        ctx.fill();
      }
    }

    // Golden sparkle
    if (isGolden && !isWhacked) {
      const sparklePhase = this.frameCount * 0.08;
      for (let i = 0; i < 4; i++) {
        const angle = sparklePhase + (i * Math.PI) / 2;
        const sr = MOLE_RADIUS + 6 + Math.sin(sparklePhase * 2 + i) * 4;
        const sx = x + Math.cos(angle) * sr;
        const sy = y + Math.sin(angle) * sr * 0.7;
        const alpha = 0.5 + Math.sin(sparklePhase + i) * 0.3;
        this.drawStar(ctx, sx, sy, 2, 4, "#ffd700", alpha);
      }
    }

    ctx.restore();
  }

  private drawBomb(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isWhacked: boolean
  ): void {
    ctx.save();

    // Glow
    ctx.shadowColor = "#ff4466";
    ctx.shadowBlur = 14;

    // Main body
    const bombGrad = ctx.createRadialGradient(x - 4, y - 6, 4, x, y, MOLE_RADIUS);
    bombGrad.addColorStop(0, "#ff6688");
    bombGrad.addColorStop(0.5, "#ff4466");
    bombGrad.addColorStop(1, "#aa1133");

    ctx.fillStyle = bombGrad;
    ctx.beginPath();
    ctx.arc(x, y, MOLE_RADIUS - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Spiky protrusions
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (Math.PI * 2 * i) / spikeCount + (isWhacked ? 0 : Math.sin(this.frameCount * 0.1) * 0.1);
      const innerR = MOLE_RADIUS - 4;
      const outerR = MOLE_RADIUS + 10;
      const ix = x + Math.cos(angle) * innerR;
      const iy = y + Math.sin(angle) * innerR;
      const ox = x + Math.cos(angle) * outerR;
      const oy = y + Math.sin(angle) * outerR;

      const perpAngle = angle + Math.PI / 2;
      const baseW = 6;
      const bx1 = ix + Math.cos(perpAngle) * baseW;
      const by1 = iy + Math.sin(perpAngle) * baseW;
      const bx2 = ix - Math.cos(perpAngle) * baseW;
      const by2 = iy - Math.sin(perpAngle) * baseW;

      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.lineTo(ox, oy);
      ctx.lineTo(bx2, by2);
      ctx.fillStyle = "#cc2244";
      ctx.fill();
    }

    // Angry eyes
    if (isWhacked) {
      // X eyes
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        const ex = x + side * 10;
        const ey = y - 6;
        ctx.beginPath();
        ctx.moveTo(ex - 4, ey - 4);
        ctx.lineTo(ex + 4, ey + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex + 4, ey - 4);
        ctx.lineTo(ex - 4, ey + 4);
        ctx.stroke();
      }
    } else {
      // Angry eyebrows
      for (const side of [-1, 1]) {
        const ex = x + side * 10;
        const ey = y - 6;

        // Eye
        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#1a0000";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 1, ey - 1, 1, 0, Math.PI * 2);
        ctx.fillStyle = "#ff6666";
        ctx.fill();

        // Angry eyebrow
        ctx.strokeStyle = "#880022";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ex - side * 6, ey - 10);
        ctx.lineTo(ex + side * 6, ey - 7);
        ctx.stroke();
      }
    }

    // Angry mouth
    ctx.beginPath();
    ctx.arc(x, y + 10, 7, Math.PI + 0.3, -0.3);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fuse on top
    ctx.beginPath();
    ctx.moveTo(x, y - MOLE_RADIUS + 2);
    ctx.quadraticCurveTo(x + 8, y - MOLE_RADIUS - 8, x + 4, y - MOLE_RADIUS - 14);
    ctx.strokeStyle = "#887755";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Fuse spark
    if (!isWhacked) {
      const sparkX = x + 4;
      const sparkY = y - MOLE_RADIUS - 14;
      const sparkAlpha = 0.5 + Math.sin(this.frameCount * 0.3) * 0.5;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,50,${sparkAlpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    innerR: number,
    outerR: number,
    color: string,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      if (i === 0) {
        ctx.moveTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
      } else {
        ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
      }
      const midAngle = angle + Math.PI / 4;
      ctx.lineTo(
        x + Math.cos(midAngle) * innerR,
        y + Math.sin(midAngle) * innerR
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawHitEffect(
    ctx: CanvasRenderingContext2D,
    effect: HitEffect
  ): void {
    const progress = 1 - effect.timer / 500;
    const alpha = 1 - progress;

    // Particles
    for (const p of effect.particles) {
      const px = effect.x + Math.cos(p.angle) * p.speed * progress;
      const py = effect.y + Math.sin(p.angle) * p.speed * progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      this.drawStar(ctx, px, py, p.size * 0.5, p.size, p.color, alpha);
      ctx.restore();
    }

    // Score text floating up
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = effect.scoreColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = effect.scoreColor;
    ctx.fillText(effect.scoreText, effect.x, effect.y - 20 - progress * 40);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawMissEffect(
    ctx: CanvasRenderingContext2D,
    effect: MissEffect
  ): void {
    const progress = 1 - effect.timer / 400;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = "#ff4466";
    ctx.lineWidth = 2;

    // X mark
    const size = 8 + progress * 4;
    ctx.beginPath();
    ctx.moveTo(effect.x - size, effect.y - size);
    ctx.lineTo(effect.x + size, effect.y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(effect.x + size, effect.y - size);
    ctx.lineTo(effect.x - size, effect.y + size);
    ctx.stroke();

    ctx.restore();
  }

  private drawComboDisplay(ctx: CanvasRenderingContext2D): void {
    if (!this.comboDisplay) return;

    const progress = 1 - this.comboDisplay.timer / 800;
    const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
    const scale = 1 + Math.sin(progress * Math.PI) * 0.3;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = `bold ${Math.round(28 * scale)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const comboColor = this.combo >= 4 ? "#ff4466" : this.combo >= 3 ? "#ffd700" : "#00d4ff";
    ctx.shadowColor = comboColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = comboColor;
    ctx.fillText(
      this.comboDisplay.text,
      this.comboDisplay.x,
      this.comboDisplay.y - progress * 20
    );
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawBottomStats(ctx: CanvasRenderingContext2D): void {
    const y = 548;

    // Combo display
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#8892a0";
    ctx.fillText("COMBO", 20, y);

    const comboMultiplier = Math.min(this.combo, 4);
    if (this.combo >= 2) {
      ctx.font = "bold 22px Inter, sans-serif";
      const comboColor =
        comboMultiplier >= 4
          ? "#ff4466"
          : comboMultiplier >= 3
          ? "#ffd700"
          : "#00d4ff";
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 8;
      ctx.fillStyle = comboColor;
      ctx.fillText(`x${comboMultiplier}`, 20, y + 18);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = "bold 22px Inter, sans-serif";
      ctx.fillStyle = "#3a3e55";
      ctx.fillText("x1", 20, y + 18);
    }
    ctx.restore();

    // Hits
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#8892a0";
    ctx.fillText("HITS", WIDTH / 2 - 40, y);
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#00d4ff";
    ctx.fillText(`${this.totalHits}`, WIDTH / 2 - 40, y + 18);
    ctx.restore();

    // Misses
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#8892a0";
    ctx.fillText("MISSES", WIDTH / 2 + 40, y);
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#ff4466";
    ctx.fillText(`${this.totalMisses}`, WIDTH / 2 + 40, y + 18);
    ctx.restore();

    // Best combo
    ctx.save();
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#8892a0";
    ctx.fillText("BEST COMBO", WIDTH - 20, y);
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`x${Math.min(this.maxCombo, 4)}`, WIDTH - 20, y + 18);
    ctx.restore();

    // Decorative line
    ctx.beginPath();
    ctx.moveTo(20, y - 8);
    ctx.lineTo(WIDTH - 20, y - 8);
    ctx.strokeStyle = "#1a1c2e";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
