import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

const WIDTH = 900;
const HEIGHT = 640;
const BG = "#0a0c1a";

const PADDLE_W = 120;
const PADDLE_H = 14;
const PADDLE_Y = HEIGHT - 45;
const PADDLE_SPEED = 13;

const BALL_R = 8;
const BALL_SPEED = 10;

const BRICK_ROWS = 7;
const BRICK_COLS = 12;
const BRICK_W = 62;
const BRICK_H = 22;
const BRICK_GAP = 4;
const BRICK_OFFSET_X = (WIDTH - BRICK_COLS * (BRICK_W + BRICK_GAP) + BRICK_GAP) / 2;
const BRICK_OFFSET_Y = 70;

const ROW_COLORS = [
  "#ff2e97", // magenta
  "#ff6b6b", // coral
  "#ffd700", // gold
  "#4ecdc4", // teal
  "#45b7d1", // sky
  "#6c5ce7", // purple
  "#00d4ff", // cyan
];

const ROW_POINTS = [70, 60, 50, 40, 30, 20, 10];

const CONFIG = {
  id: "breakout",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

interface Brick {
  x: number;
  y: number;
  row: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class BreakoutGame extends BaseGame {
  private _ballSpeed = 10;
  private _paddleW = 120;

  private paddleX = 0;

  private ballX = 0;
  private ballY = 0;
  private ballVX = 0;
  private ballVY = 0;
  private ballLaunched = false;

  private bricks: Brick[] = [];
  private particles: Particle[] = [];

  private lives = 3;
  private level = 1;
  private running = true;
  private best = 0;

  private combo = 0;
  private comboTimer = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.loadBest();
    this.resetState();
  }

  reset(): void {
    this.level = 1;
    this.resetState();
  }

  private loadBest(): void {
    try {
      this.best = parseInt(localStorage.getItem("breakout-best") || "0", 10);
    } catch { this.best = 0; }
  }

  private saveBest(): void {
    try { localStorage.setItem("breakout-best", String(this.best)); }
    catch { /* ignore */ }
  }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._ballSpeed = diffValue(d, 7, 10, 14);
    this._paddleW = Math.round(diffValue(d, 150, 120, 90));

    this.paddleX = WIDTH / 2 - this._paddleW / 2;
    this.ballLaunched = false;
    this.lives = 3;
    this.running = true;
    this.combo = 0;
    this.comboTimer = 0;
    this.particles = [];
    this.setScore(0);
    this.resetBall();
    this.createBricks();
  }

  private resetBall(): void {
    this.ballX = WIDTH / 2;
    this.ballY = PADDLE_Y - BALL_R - 1;
    this.ballVX = 0;
    this.ballVY = 0;
    this.ballLaunched = false;
  }

  private launchBall(): void {
    const angle = (Math.random() - 0.5) * 1.2 - Math.PI / 2;
    const speed = this._ballSpeed + (this.level - 1) * 0.5;
    this.ballVX = speed * Math.cos(angle);
    this.ballVY = speed * Math.sin(angle);
    this.ballLaunched = true;
  }

  private createBricks(): void {
    this.bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        this.bricks.push({
          x: BRICK_OFFSET_X + col * (BRICK_W + BRICK_GAP),
          y: BRICK_OFFSET_Y + row * (BRICK_H + BRICK_GAP),
          row,
          alive: true,
        });
      }
    }
  }

  private nextLevel(): void {
    this.level++;
    this.resetBall();
    this.createBricks();
  }

  private spawnParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
      });
    }
  }

  private addScore(pts: number): void {
    this.setScore(this.score + pts);
    if (this.score > this.best) {
      this.best = this.score;
      this.saveBest();
    }
  }

  update(dt: number): void {
    // Particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 0.003;
      return p.life > 0;
    });

    // Combo timer
    if (this.comboTimer > 0) this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = 0;

    if (!this.running) return;

    // Paddle movement
    if (this.input.isKeyDown("ArrowLeft")) {
      this.paddleX -= PADDLE_SPEED;
      if (this.paddleX < 10) this.paddleX = 10;
    }
    if (this.input.isKeyDown("ArrowRight")) {
      this.paddleX += PADDLE_SPEED;
      if (this.paddleX + this._paddleW > WIDTH - 10) this.paddleX = WIDTH - 10 - this._paddleW;
    }

    // Launch ball
    if (!this.ballLaunched) {
      this.ballX = this.paddleX + this._paddleW / 2;
      this.ballY = PADDLE_Y - BALL_R - 1;
      if (this.input.isKeyJustPressed("Space")) {
        this.launchBall();
      }
      return;
    }

    // Move ball
    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    // Wall collisions
    if (this.ballX - BALL_R <= 10) {
      this.ballX = 10 + BALL_R;
      this.ballVX = Math.abs(this.ballVX);
    }
    if (this.ballX + BALL_R >= WIDTH - 10) {
      this.ballX = WIDTH - 10 - BALL_R;
      this.ballVX = -Math.abs(this.ballVX);
    }
    if (this.ballY - BALL_R <= 10) {
      this.ballY = 10 + BALL_R;
      this.ballVY = Math.abs(this.ballVY);
    }

    // Ball out bottom
    if (this.ballY > HEIGHT + BALL_R) {
      this.lives--;
      this.combo = 0;
      if (this.lives <= 0) {
        this.running = false;
        this.gameOver();
        return;
      }
      this.resetBall();
      return;
    }

    // Paddle collision
    if (
      this.ballVY > 0 &&
      this.ballY + BALL_R >= PADDLE_Y &&
      this.ballY + BALL_R <= PADDLE_Y + PADDLE_H + 4 &&
      this.ballX >= this.paddleX - BALL_R &&
      this.ballX <= this.paddleX + this._paddleW + BALL_R
    ) {
      this.ballY = PADDLE_Y - BALL_R;
      const hitPos = (this.ballX - this.paddleX) / this._paddleW;
      const angle = (hitPos - 0.5) * 2.4 - Math.PI / 2;
      const speed = Math.sqrt(this.ballVX ** 2 + this.ballVY ** 2);
      this.ballVX = speed * Math.cos(angle);
      this.ballVY = speed * Math.sin(angle);
      // Ensure ball goes up
      if (this.ballVY > -2) this.ballVY = -2;
    }

    // Brick collision
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      const bx = brick.x;
      const by = brick.y;

      if (
        this.ballX + BALL_R > bx &&
        this.ballX - BALL_R < bx + BRICK_W &&
        this.ballY + BALL_R > by &&
        this.ballY - BALL_R < by + BRICK_H
      ) {
        brick.alive = false;

        // Determine bounce direction
        const overlapLeft = this.ballX + BALL_R - bx;
        const overlapRight = bx + BRICK_W - (this.ballX - BALL_R);
        const overlapTop = this.ballY + BALL_R - by;
        const overlapBottom = by + BRICK_H - (this.ballY - BALL_R);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          this.ballVY *= -1;
        } else {
          this.ballVX *= -1;
        }

        // Score with combo
        this.combo++;
        this.comboTimer = 2000;
        const pts = ROW_POINTS[brick.row] * Math.min(this.combo, 5);
        this.addScore(pts);

        // Particles
        this.spawnParticles(bx + BRICK_W / 2, by + BRICK_H / 2, ROW_COLORS[brick.row]);
        break;
      }
    }

    // Check level clear
    if (this.bricks.every((b) => !b.alive)) {
      this.nextLevel();
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Border
    ctx.strokeStyle = "rgba(108, 92, 231, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(9, 9, WIDTH - 18, HEIGHT - 18);

    // Bricks
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      const color = ROW_COLORS[brick.row];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, BRICK_W, BRICK_H, 4);
      ctx.fill();

      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_W - 4, 3);
    }

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // Paddle
    ctx.shadowColor = "#6c5ce7";
    ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(this.paddleX, 0, this.paddleX + this._paddleW, 0);
    grad.addColorStop(0, "#6c5ce7");
    grad.addColorStop(1, "#00d4ff");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.paddleX, PADDLE_Y, this._paddleW, PADDLE_H, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Launch hint
    if (!this.ballLaunched && this.running) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Press SPACE to launch", WIDTH / 2, PADDLE_Y + 50);
    }

    // UI - Score
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", 20, 28);
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.score), 20, 52);

    // Best
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`BEST ${this.best}`, 20, 68);

    // Level
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`LEVEL ${this.level}`, WIDTH / 2, 28);

    // Combo
    if (this.combo > 1 && this.comboTimer > 0) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillText(`${this.combo}x COMBO`, WIDTH / 2, 52);
    }

    // Lives
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("LIVES", WIDTH - 20, 28);
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = i < this.lives ? "#ff2e97" : "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.arc(WIDTH - 30 - i * 22, 48, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
