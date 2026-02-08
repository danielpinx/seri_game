import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 800;
const HEIGHT = 800;
const BG = "#060610";
const YELLOW = "#ffd700";
const SHIP_Y_OFFSET = 60; // from bottom

const CONFIG = {
  id: "space-invaders",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Alien {
  type: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
}

interface Laser {
  x: number;
  y: number;
  speed: number;
  w: number;
  h: number;
}

interface ObstacleBlock {
  x: number;
  y: number;
  alive: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  speed: number;
}

const OBSTACLE_GRID = [
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
];

export class SpaceInvadersGame extends BaseGame {
  // Ship
  private shipX = 0;
  private shipW = 48;
  private shipH = 32;
  private shipSpeed = 6;

  // Lasers
  private playerLasers: Laser[] = [];
  private alienLasers: Laser[] = [];
  private laserReady = true;
  private laserTimer = 0;
  private laserDelay = 250;

  // Aliens
  private aliens: Alien[] = [];
  private alienDir = 1;
  private alienShootTimer = 0;
  private alienMoveSpeed = 1;

  // Mystery
  private mystery: { x: number; speed: number } | null = null;
  private mysteryTimer = 0;
  private mysteryInterval = 5000;

  // Obstacles
  private obstacles: ObstacleBlock[][] = [];

  // Stars
  private stars: Star[] = [];

  // State
  private lives = 3;
  private running = true;
  private highscore = 0;
  private level = 1;

  // Play area
  private readonly playLeft = 30;
  private readonly playRight = WIDTH - 30;
  private readonly playBottom = HEIGHT - SHIP_Y_OFFSET;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.loadHighscore();
    this.createStars();
    this.resetState();
  }

  reset(): void {
    this.resetState();
  }

  private createStars(): void {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.15 + 0.05,
      });
    }
  }

  private resetState(): void {
    this.shipX = WIDTH / 2 - this.shipW / 2;
    this.playerLasers = [];
    this.alienLasers = [];
    this.laserReady = true;
    this.laserTimer = 0;
    this.alienDir = 1;
    this.alienShootTimer = 0;
    this.alienMoveSpeed = 1 + (this.level - 1) * 0.2;
    this.mystery = null;
    this.mysteryTimer = 0;
    this.mysteryInterval = 4000 + Math.random() * 4000;
    this.lives = 3;
    this.running = true;
    this.setScore(0);
    this.createAliens();
    this.createObstacles();
  }

  private nextLevel(): void {
    this.level++;
    this.alienMoveSpeed = 1 + (this.level - 1) * 0.2;
    this.playerLasers = [];
    this.alienLasers = [];
    this.mystery = null;
    this.createAliens();
    this.createObstacles();
  }

  private createAliens(): void {
    this.aliens = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        const type = row === 0 ? 3 : row <= 2 ? 2 : 1;
        this.aliens.push({
          type,
          x: 75 + col * 55,
          y: 120 + row * 50,
          w: 36,
          h: 26,
          alive: true,
        });
      }
    }
  }

  private createObstacles(): void {
    this.obstacles = [];
    const obstW = OBSTACLE_GRID[0].length * 3;
    const totalW = 4 * obstW;
    const gap = (WIDTH - 60 - totalW) / 5;
    for (let i = 0; i < 4; i++) {
      const ox = 30 + (i + 1) * gap + i * obstW;
      const blocks: ObstacleBlock[] = [];
      for (let r = 0; r < OBSTACLE_GRID.length; r++) {
        for (let c = 0; c < OBSTACLE_GRID[0].length; c++) {
          if (OBSTACLE_GRID[r][c]) {
            blocks.push({ x: ox + c * 3, y: this.playBottom - 110 + r * 3, alive: true });
          }
        }
      }
      this.obstacles.push(blocks);
    }
  }

  private loadHighscore(): void {
    try {
      this.highscore = parseInt(localStorage.getItem("si-highscore") || "0", 10);
    } catch {
      this.highscore = 0;
    }
  }

  private saveHighscore(): void {
    try {
      localStorage.setItem("si-highscore", String(this.highscore));
    } catch { /* ignore */ }
  }

  private rectsCollide(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private addScore(pts: number): void {
    this.setScore(this.score + pts);
    if (this.score > this.highscore) {
      this.highscore = this.score;
      this.saveHighscore();
    }
  }

  update(dt: number): void {
    // Animate stars
    for (const s of this.stars) {
      s.y += s.speed;
      if (s.y > HEIGHT) {
        s.y = 0;
        s.x = Math.random() * WIDTH;
      }
    }

    if (!this.running) return;

    // Ship movement
    if (this.input.isKeyDown("ArrowLeft")) {
      this.shipX -= this.shipSpeed;
      if (this.shipX < this.playLeft) this.shipX = this.playLeft;
    }
    if (this.input.isKeyDown("ArrowRight")) {
      this.shipX += this.shipSpeed;
      if (this.shipX + this.shipW > this.playRight) this.shipX = this.playRight - this.shipW;
    }

    // Shooting
    this.laserTimer += dt;
    if (this.input.isKeyDown("Space") && this.laserReady) {
      const shipTop = this.playBottom - this.shipH;
      this.playerLasers.push({
        x: this.shipX + this.shipW / 2 - 2,
        y: shipTop,
        speed: 7,
        w: 4,
        h: 15,
      });
      this.laserReady = false;
      this.laserTimer = 0;
    }
    if (!this.laserReady && this.laserTimer >= this.laserDelay) {
      this.laserReady = true;
    }

    // Update player lasers
    this.playerLasers = this.playerLasers.filter((l) => {
      l.y -= l.speed;
      return l.y > 0;
    });

    // Alien shooting
    this.alienShootTimer += dt;
    const shootInterval = Math.max(400 - this.level * 30, 150);
    if (this.alienShootTimer >= shootInterval) {
      this.alienShootTimer -= shootInterval;
      const alive = this.aliens.filter((a) => a.alive);
      if (alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        this.alienLasers.push({
          x: shooter.x + shooter.w / 2 - 2,
          y: shooter.y + shooter.h,
          speed: 5 + this.level * 0.3,
          w: 4,
          h: 15,
        });
      }
    }

    // Update alien lasers
    this.alienLasers = this.alienLasers.filter((l) => {
      l.y += l.speed;
      return l.y < HEIGHT;
    });

    // Move aliens
    let hitEdge = false;
    for (const a of this.aliens) {
      if (!a.alive) continue;
      a.x += this.alienDir * this.alienMoveSpeed;
      if (a.x + a.w >= this.playRight || a.x <= this.playLeft) hitEdge = true;
    }
    if (hitEdge) {
      this.alienDir *= -1;
      for (const a of this.aliens) {
        if (a.alive) a.y += 3;
      }
    }

    // Mystery ship
    this.mysteryTimer += dt;
    if (!this.mystery && this.mysteryTimer >= this.mysteryInterval) {
      this.mysteryTimer = 0;
      this.mysteryInterval = 4000 + Math.random() * 4000;
      const fromLeft = Math.random() > 0.5;
      this.mystery = {
        x: fromLeft ? this.playLeft : this.playRight - 50,
        speed: fromLeft ? 3 : -3,
      };
    }
    if (this.mystery) {
      this.mystery.x += this.mystery.speed;
      if (this.mystery.x > this.playRight || this.mystery.x + 50 < 0) {
        this.mystery = null;
      }
    }

    // Collisions: player lasers vs aliens
    for (const laser of this.playerLasers) {
      const lr: Rect = { x: laser.x, y: laser.y, w: laser.w, h: laser.h };
      for (const alien of this.aliens) {
        if (!alien.alive) continue;
        if (this.rectsCollide(lr, { x: alien.x, y: alien.y, w: alien.w, h: alien.h })) {
          alien.alive = false;
          laser.y = -100;
          this.addScore(alien.type * 100);
        }
      }
      // vs mystery
      if (this.mystery && this.rectsCollide(lr, { x: this.mystery.x, y: 90, w: 50, h: 25 })) {
        this.mystery = null;
        laser.y = -100;
        this.addScore(500);
      }
      // vs obstacles
      for (const obs of this.obstacles) {
        for (const block of obs) {
          if (!block.alive) continue;
          if (this.rectsCollide(lr, { x: block.x, y: block.y, w: 3, h: 3 })) {
            block.alive = false;
            laser.y = -100;
          }
        }
      }
    }

    // Ship collision rect (matches visual triangle bounding box)
    const shipTop = this.playBottom - this.shipH;
    const shipRect: Rect = { x: this.shipX, y: shipTop, w: this.shipW, h: this.shipH };

    // Collisions: alien lasers vs ship
    for (const laser of this.alienLasers) {
      if (this.rectsCollide({ x: laser.x, y: laser.y, w: laser.w, h: laser.h }, shipRect)) {
        laser.y = HEIGHT + 100;
        this.lives--;
        if (this.lives <= 0) {
          this.running = false;
          this.gameOver();
          return;
        }
      }
      // vs obstacles
      for (const obs of this.obstacles) {
        for (const block of obs) {
          if (!block.alive) continue;
          if (this.rectsCollide({ x: laser.x, y: laser.y, w: laser.w, h: laser.h }, { x: block.x, y: block.y, w: 3, h: 3 })) {
            block.alive = false;
            laser.y = HEIGHT + 100;
          }
        }
      }
    }

    // Aliens hitting obstacles or ship
    for (const alien of this.aliens) {
      if (!alien.alive) continue;
      for (const obs of this.obstacles) {
        for (const block of obs) {
          if (block.alive && this.rectsCollide({ x: alien.x, y: alien.y, w: alien.w, h: alien.h }, { x: block.x, y: block.y, w: 3, h: 3 })) {
            block.alive = false;
          }
        }
      }
      if (this.rectsCollide({ x: alien.x, y: alien.y, w: alien.w, h: alien.h }, shipRect)) {
        this.running = false;
        this.gameOver();
        return;
      }
    }

    // Check if all aliens dead → next level
    if (this.aliens.every((a) => !a.alive)) {
      this.nextLevel();
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Stars
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Border
    ctx.strokeStyle = "rgba(255, 215, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(25, 75, WIDTH - 50, HEIGHT - 100, 8);
    ctx.stroke();

    // Bottom line
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(30, this.playBottom + 5);
    ctx.lineTo(this.playRight, this.playBottom + 5);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ship (triangle shape with glow)
    const shipTop = this.playBottom - this.shipH;
    ctx.shadowColor = YELLOW;
    ctx.shadowBlur = 12;
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.moveTo(this.shipX + this.shipW / 2, shipTop);
    ctx.lineTo(this.shipX + 4, this.playBottom);
    ctx.lineTo(this.shipX + this.shipW - 4, this.playBottom);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ship cockpit
    ctx.fillStyle = "#fff8e0";
    ctx.beginPath();
    ctx.arc(this.shipX + this.shipW / 2, shipTop + this.shipH * 0.45, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player lasers
    ctx.shadowColor = YELLOW;
    ctx.shadowBlur = 6;
    ctx.fillStyle = YELLOW;
    for (const l of this.playerLasers) {
      ctx.fillRect(l.x, l.y, l.w, l.h);
    }
    ctx.shadowBlur = 0;

    // Alien lasers
    ctx.shadowColor = "#FF6B6B";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#FF6B6B";
    for (const l of this.alienLasers) {
      ctx.fillRect(l.x, l.y, l.w, l.h);
    }
    ctx.shadowBlur = 0;

    // Aliens
    const alienColors = ["", "#4ECDC4", "#45B7D1", "#F38181"];
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const color = alienColors[a.type];
      ctx.fillStyle = color;
      // Body
      ctx.fillRect(a.x + 4, a.y, a.w - 8, a.h);
      ctx.fillRect(a.x, a.y + 5, a.w, a.h - 10);
      // Eyes
      ctx.fillStyle = BG;
      ctx.fillRect(a.x + 8, a.y + 8, 5, 5);
      ctx.fillRect(a.x + a.w - 13, a.y + 8, 5, 5);
      // Eye pupils
      ctx.fillStyle = "#fff";
      ctx.fillRect(a.x + 9, a.y + 9, 2, 2);
      ctx.fillRect(a.x + a.w - 12, a.y + 9, 2, 2);
    }

    // Mystery ship
    if (this.mystery) {
      ctx.shadowColor = "#FF2E97";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#FF2E97";
      ctx.fillRect(this.mystery.x + 10, 90, 30, 12);
      ctx.fillRect(this.mystery.x, 96, 50, 8);
      ctx.fillRect(this.mystery.x + 5, 104, 40, 5);
      ctx.shadowBlur = 0;

      // Mystery points label
      ctx.fillStyle = "#FF2E97";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("500", this.mystery.x + 25, 85);
    }

    // Obstacles
    ctx.fillStyle = "#4ECDC4";
    for (const obs of this.obstacles) {
      for (const block of obs) {
        if (block.alive) {
          ctx.fillRect(block.x, block.y, 3, 3);
        }
      }
    }

    // UI - Score
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", 40, 30);
    ctx.fillStyle = YELLOW;
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(this.score).padStart(5, "0"), 40, 58);

    // High Score
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("HIGH-SCORE", WIDTH - 40, 30);
    ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(this.highscore).padStart(5, "0"), WIDTH - 40, 58);

    // Level
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`LEVEL ${this.level}`, WIDTH / 2, 30);

    // Lives
    ctx.fillStyle = YELLOW;
    for (let i = 0; i < this.lives; i++) {
      const lx = 40 + i * 35;
      const ly = this.playBottom + 20;
      ctx.beginPath();
      ctx.moveTo(lx + 8, ly);
      ctx.lineTo(lx, ly + 14);
      ctx.lineTo(lx + 16, ly + 14);
      ctx.closePath();
      ctx.fill();
    }

    // Status
    ctx.textAlign = "right";
    ctx.font = "12px Inter, sans-serif";
    if (!this.running) {
      ctx.fillStyle = "#FF6B6B";
      ctx.fillText("GAME OVER", WIDTH - 40, this.playBottom + 32);
    }
  }
}
