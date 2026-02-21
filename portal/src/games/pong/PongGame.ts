import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

const WIDTH = 1280;
const HEIGHT = 800;
const BALL_SIZE = 16;
const PADDLE_W = 14;
const PADDLE_H = 110;
const BALL_SPEED = 15;
const PADDLE_SPEED = 7;
const WIN_SCORE = 7;

const CONFIG = {
  id: "pong",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: "#0a0a1a",
};

// Neon colors
const CYAN = "#00d4ff";
const MAGENTA = "#ff2e97";
const BALL_COLOR = "#ffffff";

export class PongGame extends BaseGame {
  private _ballSpeed = 15;
  private _paddleH = 110;
  private _paddleSpeed = 7;

  private ballX = 0;
  private ballY = 0;
  private ballSpeedX = BALL_SPEED;
  private ballSpeedY = BALL_SPEED;
  private trail: { x: number; y: number; age: number }[] = [];

  private playerY = 0;
  private playerSpeed = 0;

  private cpuY = 0;
  private cpuTargetY = HEIGHT / 2;
  private cpuReactionTimer = 0;

  private cpuScore = 0;
  private playerScore = 0;

  private flashTimer = 0;
  private flashSide: "left" | "right" | null = null;

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
    const d = useSettingsStore.getState().difficulty;
    this._ballSpeed = diffValue(d, 10, 15, 22);
    this._paddleH = Math.round(diffValue(d, 140, 110, 80));
    this._paddleSpeed = diffValue(d, 9, 7, 5);

    this.playerY = HEIGHT / 2 - this._paddleH / 2;
    this.cpuY = HEIGHT / 2 - this._paddleH / 2;
    this.cpuTargetY = HEIGHT / 2;
    this.playerSpeed = 0;
    this.cpuScore = 0;
    this.playerScore = 0;
    this.trail = [];
    this.flashTimer = 0;
    this.flashSide = null;
    this.setScore(0);
    this.resetBall();
  }

  private resetBall(): void {
    this.ballX = WIDTH / 2 - BALL_SIZE / 2;
    this.ballY = HEIGHT / 2 - BALL_SIZE / 2 + (Math.random() - 0.5) * 200;
    this.trail = [];
    const angle = (Math.random() - 0.5) * 1.2;
    const dir = Math.random() > 0.5 ? 1 : -1;
    this.ballSpeedX = this._ballSpeed * dir * Math.cos(angle);
    this.ballSpeedY = this._ballSpeed * Math.sin(angle);
  }

  update(dt: number): void {
    // Flash timer
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Player input
    if (this.input.isKeyDown("ArrowUp")) {
      this.playerSpeed = -this._paddleSpeed;
    } else if (this.input.isKeyDown("ArrowDown")) {
      this.playerSpeed = this._paddleSpeed;
    } else {
      this.playerSpeed = 0;
    }

    // Move ball
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;

    // Trail
    this.trail.push({ x: this.ballX + BALL_SIZE / 2, y: this.ballY + BALL_SIZE / 2, age: 0 });
    if (this.trail.length > 12) this.trail.shift();
    for (const t of this.trail) t.age += dt;

    // Ball top/bottom bounce
    if (this.ballY + BALL_SIZE >= HEIGHT) {
      this.ballY = HEIGHT - BALL_SIZE;
      this.ballSpeedY = -Math.abs(this.ballSpeedY);
    }
    if (this.ballY <= 0) {
      this.ballY = 0;
      this.ballSpeedY = Math.abs(this.ballSpeedY);
    }

    // Ball out right → CPU scores
    if (this.ballX + BALL_SIZE >= WIDTH) {
      this.cpuScore++;
      this.flashSide = "right";
      this.flashTimer = 300;
      if (this.cpuScore >= WIN_SCORE) {
        this.gameOver();
        return;
      }
      this.resetBall();
    }

    // Ball out left → Player scores
    if (this.ballX <= 0) {
      this.playerScore++;
      this.setScore(this.playerScore);
      this.flashSide = "left";
      this.flashTimer = 300;
      if (this.playerScore >= WIN_SCORE) {
        this.gameOver();
        return;
      }
      this.resetBall();
    }

    // Paddle collision with proper push-out
    const playerPaddleX = WIDTH - PADDLE_W - 20;
    const cpuPaddleX = 20;

    // Player paddle (right)
    if (
      this.ballSpeedX > 0 &&
      this.ballX + BALL_SIZE >= playerPaddleX &&
      this.ballX < playerPaddleX + PADDLE_W &&
      this.ballY + BALL_SIZE > this.playerY &&
      this.ballY < this.playerY + this._paddleH
    ) {
      this.ballX = playerPaddleX - BALL_SIZE;
      const hitPos = (this.ballY + BALL_SIZE / 2 - this.playerY) / this._paddleH;
      const angle = (hitPos - 0.5) * 1.4;
      const speed = Math.sqrt(this.ballSpeedX ** 2 + this.ballSpeedY ** 2) + 0.3;
      this.ballSpeedX = -speed * Math.cos(angle);
      this.ballSpeedY = speed * Math.sin(angle);
    }

    // CPU paddle (left)
    if (
      this.ballSpeedX < 0 &&
      this.ballX <= cpuPaddleX + PADDLE_W &&
      this.ballX + BALL_SIZE > cpuPaddleX &&
      this.ballY + BALL_SIZE > this.cpuY &&
      this.ballY < this.cpuY + this._paddleH
    ) {
      this.ballX = cpuPaddleX + PADDLE_W;
      const hitPos = (this.ballY + BALL_SIZE / 2 - this.cpuY) / this._paddleH;
      const angle = (hitPos - 0.5) * 1.4;
      const speed = Math.sqrt(this.ballSpeedX ** 2 + this.ballSpeedY ** 2) + 0.3;
      this.ballSpeedX = speed * Math.cos(angle);
      this.ballSpeedY = speed * Math.sin(angle);
    }

    // Move player
    this.playerY += this.playerSpeed;
    if (this.playerY < 0) this.playerY = 0;
    if (this.playerY + this._paddleH > HEIGHT) this.playerY = HEIGHT - this._paddleH;

    // CPU AI - imperfect tracking with reaction delay
    this.cpuReactionTimer += dt;
    if (this.cpuReactionTimer >= 150) {
      this.cpuReactionTimer = 0;
      const ballCenterY = this.ballY + BALL_SIZE / 2;
      this.cpuTargetY = ballCenterY + (Math.random() - 0.5) * 60 - this._paddleH / 2;
    }
    const cpuCenter = this.cpuY + this._paddleH / 2;
    const targetCenter = this.cpuTargetY + this._paddleH / 2;
    const diff = targetCenter - cpuCenter;
    const cpuMoveSpeed = this._paddleSpeed * 0.85;
    if (Math.abs(diff) > 4) {
      this.cpuY += diff > 0 ? cpuMoveSpeed : -cpuMoveSpeed;
    }
    if (this.cpuY < 0) this.cpuY = 0;
    if (this.cpuY + this._paddleH > HEIGHT) this.cpuY = HEIGHT - this._paddleH;
  }

  draw(): void {
    const ctx = this.ctx;

    // Score flash effect
    if (this.flashTimer > 0 && this.flashSide) {
      const alpha = (this.flashTimer / 300) * 0.15;
      ctx.fillStyle = this.flashSide === "left"
        ? `rgba(0, 212, 255, ${alpha})`
        : `rgba(255, 46, 151, ${alpha})`;
      const fx = this.flashSide === "left" ? 0 : WIDTH / 2;
      ctx.fillRect(fx, 0, WIDTH / 2, HEIGHT);
    }

    // Center line
    ctx.setLineDash([8, 16]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ball trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.3;
      const size = BALL_SIZE * 0.3 + (i / this.trail.length) * BALL_SIZE * 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball glow
    const bx = this.ballX + BALL_SIZE / 2;
    const by = this.ballY + BALL_SIZE / 2;
    const glow = ctx.createRadialGradient(bx, by, BALL_SIZE / 2, bx, by, BALL_SIZE * 2.5);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.25)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(bx - BALL_SIZE * 3, by - BALL_SIZE * 3, BALL_SIZE * 6, BALL_SIZE * 6);

    // Ball
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(bx, by, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // CPU paddle (left) - Cyan
    const cpuPaddleX = 20;
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 15;
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.roundRect(cpuPaddleX, this.cpuY, PADDLE_W, this._paddleH, 7);
    ctx.fill();

    // Player paddle (right) - Magenta
    const playerPaddleX = WIDTH - PADDLE_W - 20;
    ctx.shadowColor = MAGENTA;
    ctx.shadowBlur = 15;
    ctx.fillStyle = MAGENTA;
    ctx.beginPath();
    ctx.roundRect(playerPaddleX, this.playerY, PADDLE_W, this._paddleH, 7);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Scores
    ctx.font = "bold 72px Inter, sans-serif";
    ctx.textAlign = "center";

    ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
    ctx.fillText(String(this.cpuScore), WIDTH / 4, 100);

    ctx.fillStyle = "rgba(255, 46, 151, 0.6)";
    ctx.fillText(String(this.playerScore), (3 * WIDTH) / 4, 100);

    // Labels
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("CPU", WIDTH / 4, 130);
    ctx.fillText("YOU", (3 * WIDTH) / 4, 130);

    // Ball speed
    const speed = Math.round(Math.sqrt(this.ballSpeedX ** 2 + this.ballSpeedY ** 2) * 10);
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`Ball Speed: ${speed}`, 20, 30);

    // Win target
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText(`First to ${WIN_SCORE}`, WIDTH / 2, HEIGHT - 20);
  }
}
