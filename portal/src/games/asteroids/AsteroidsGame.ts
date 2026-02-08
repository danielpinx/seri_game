import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 800;
const HEIGHT = 800;
const BG = "#060610";

const CONFIG = {
  id: "asteroids",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

const SHIP_SIZE = 18;
const TURN_SPEED = 0.065;
const THRUST = 0.12;
const FRICTION = 0.992;
const MAX_SPEED = 7;

const BULLET_SPEED = 9;
const BULLET_LIFE = 700; // ms
const FIRE_COOLDOWN = 150; // ms

const ASTEROID_SPEED = 1.5;

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // 3=large, 2=medium, 1=small
  radius: number;
  vertices: number[]; // angular offsets for irregular shape
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const SIZE_RADIUS = { 3: 40, 2: 22, 1: 12 };
const SIZE_POINTS = { 3: 20, 2: 50, 1: 100 };

export class AsteroidsGame extends BaseGame {
  private shipX = 0;
  private shipY = 0;
  private shipAngle = 0;
  private shipVX = 0;
  private shipVY = 0;
  private thrusting = false;

  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];

  private fireCooldown = 0;
  private lives = 3;
  private level = 1;
  private best = 0;
  private invincible = 0; // ms of invincibility after respawn

  // Stars
  private stars: { x: number; y: number; brightness: number }[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.loadBest();
    this.createStars();
    this.resetState();
  }

  reset(): void {
    this.level = 1;
    this.resetState();
  }

  private loadBest(): void {
    try {
      this.best = parseInt(localStorage.getItem("asteroids-best") || "0", 10);
    } catch { this.best = 0; }
  }

  private saveBest(): void {
    try { localStorage.setItem("asteroids-best", String(this.best)); }
    catch { /* ignore */ }
  }

  private createStars(): void {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        brightness: Math.random() * 0.4 + 0.1,
      });
    }
  }

  private resetState(): void {
    this.shipX = WIDTH / 2;
    this.shipY = HEIGHT / 2;
    this.shipAngle = -Math.PI / 2;
    this.shipVX = 0;
    this.shipVY = 0;
    this.thrusting = false;
    this.bullets = [];
    this.particles = [];
    this.fireCooldown = 0;
    this.lives = 3;
    this.invincible = 2000;
    this.setScore(0);
    this.spawnAsteroids();
  }

  private spawnAsteroids(): void {
    this.asteroids = [];
    const count = 3 + this.level;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      // Spawn away from ship
      do {
        x = Math.random() * WIDTH;
        y = Math.random() * HEIGHT;
      } while (Math.hypot(x - this.shipX, y - this.shipY) < 150);
      this.asteroids.push(this.createAsteroid(x, y, 3));
    }
  }

  private createAsteroid(x: number, y: number, size: number): Asteroid {
    const angle = Math.random() * Math.PI * 2;
    const speed = ASTEROID_SPEED * (1 + Math.random() * 0.5) * (4 - size) * 0.5;
    const radius = SIZE_RADIUS[size as 1 | 2 | 3];
    const verts: number[] = [];
    const numVerts = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numVerts; i++) {
      verts.push(0.7 + Math.random() * 0.6); // radius multiplier
    }
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      radius,
      vertices: verts,
    };
  }

  private wrap(val: number, max: number): number {
    if (val < -50) return max + 50;
    if (val > max + 50) return -50;
    return val;
  }

  private addScore(pts: number): void {
    this.setScore(this.score + pts);
    if (this.score > this.best) {
      this.best = this.score;
      this.saveBest();
    }
  }

  private spawnExplosion(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
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

  private respawnShip(): void {
    this.shipX = WIDTH / 2;
    this.shipY = HEIGHT / 2;
    this.shipAngle = -Math.PI / 2;
    this.shipVX = 0;
    this.shipVY = 0;
    this.invincible = 2000;
  }

  update(dt: number): void {
    // Particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 0.002;
      return p.life > 0;
    });

    // Invincibility timer
    if (this.invincible > 0) this.invincible -= dt;

    // Fire cooldown
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // Ship rotation
    if (this.input.isKeyDown("ArrowLeft")) {
      this.shipAngle -= TURN_SPEED;
    }
    if (this.input.isKeyDown("ArrowRight")) {
      this.shipAngle += TURN_SPEED;
    }

    // Thrust
    this.thrusting = this.input.isKeyDown("ArrowUp");
    if (this.thrusting) {
      this.shipVX += Math.cos(this.shipAngle) * THRUST;
      this.shipVY += Math.sin(this.shipAngle) * THRUST;
      const speed = Math.hypot(this.shipVX, this.shipVY);
      if (speed > MAX_SPEED) {
        this.shipVX = (this.shipVX / speed) * MAX_SPEED;
        this.shipVY = (this.shipVY / speed) * MAX_SPEED;
      }
    }

    // Friction
    this.shipVX *= FRICTION;
    this.shipVY *= FRICTION;

    // Move ship
    this.shipX += this.shipVX;
    this.shipY += this.shipVY;
    this.shipX = this.wrap(this.shipX, WIDTH);
    this.shipY = this.wrap(this.shipY, HEIGHT);

    // Shoot
    if (this.input.isKeyJustPressed("Space") && this.fireCooldown <= 0) {
      this.fireCooldown = FIRE_COOLDOWN;
      this.bullets.push({
        x: this.shipX + Math.cos(this.shipAngle) * SHIP_SIZE,
        y: this.shipY + Math.sin(this.shipAngle) * SHIP_SIZE,
        vx: Math.cos(this.shipAngle) * BULLET_SPEED + this.shipVX * 0.3,
        vy: Math.sin(this.shipAngle) * BULLET_SPEED + this.shipVY * 0.3,
        life: BULLET_LIFE,
      });
    }

    // Move bullets
    this.bullets = this.bullets.filter((b) => {
      b.x += b.vx;
      b.y += b.vy;
      b.x = this.wrap(b.x, WIDTH);
      b.y = this.wrap(b.y, HEIGHT);
      b.life -= dt;
      return b.life > 0;
    });

    // Move asteroids
    for (const a of this.asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.x = this.wrap(a.x, WIDTH);
      a.y = this.wrap(a.y, HEIGHT);
    }

    // Bullet-asteroid collision
    const newAsteroids: Asteroid[] = [];
    this.bullets = this.bullets.filter((b) => {
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < a.radius) {
          // Hit!
          this.addScore(SIZE_POINTS[a.size as 1 | 2 | 3]);
          this.spawnExplosion(a.x, a.y, a.size * 6, a.size === 3 ? "#00d4ff" : a.size === 2 ? "#4ecdc4" : "#ffd700");
          // Split
          if (a.size > 1) {
            for (let j = 0; j < 2; j++) {
              newAsteroids.push(this.createAsteroid(a.x, a.y, a.size - 1));
            }
          }
          this.asteroids.splice(i, 1);
          return false; // remove bullet
        }
      }
      return true;
    });
    this.asteroids.push(...newAsteroids);

    // Ship-asteroid collision
    if (this.invincible <= 0) {
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(this.shipX - a.x, this.shipY - a.y);
        if (dist < a.radius + SHIP_SIZE * 0.6) {
          this.lives--;
          this.spawnExplosion(this.shipX, this.shipY, 20, "#ff2e97");
          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
          this.respawnShip();
          break;
        }
      }
    }

    // Level clear
    if (this.asteroids.length === 0) {
      this.level++;
      this.spawnAsteroids();
    }
  }

  draw(): void {
    const ctx = this.ctx;

    // Stars
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.fillRect(s.x, s.y, 1.5, 1.5);
    }

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // Asteroids
    for (const a of this.asteroids) {
      ctx.strokeStyle = "rgba(0, 212, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const numVerts = a.vertices.length;
      for (let i = 0; i <= numVerts; i++) {
        const angle = (i / numVerts) * Math.PI * 2;
        const r = a.radius * a.vertices[i % numVerts];
        const px = a.x + Math.cos(angle) * r;
        const py = a.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Ship (draw only if alive)
    if (this.lives > 0) {
      const blinkOff = this.invincible > 0 && Math.floor(this.invincible / 100) % 2 === 0;
      if (!blinkOff) {
        const cos = Math.cos(this.shipAngle);
        const sin = Math.sin(this.shipAngle);
        const nose = { x: this.shipX + cos * SHIP_SIZE, y: this.shipY + sin * SHIP_SIZE };
        const left = {
          x: this.shipX + Math.cos(this.shipAngle + 2.4) * SHIP_SIZE * 0.85,
          y: this.shipY + Math.sin(this.shipAngle + 2.4) * SHIP_SIZE * 0.85,
        };
        const right = {
          x: this.shipX + Math.cos(this.shipAngle - 2.4) * SHIP_SIZE * 0.85,
          y: this.shipY + Math.sin(this.shipAngle - 2.4) * SHIP_SIZE * 0.85,
        };

        ctx.shadowColor = "#ff2e97";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#ff2e97";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nose.x, nose.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(this.shipX - cos * 6, this.shipY - sin * 6);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Thrust flame
        if (this.thrusting) {
          const flameLen = SHIP_SIZE * (0.6 + Math.random() * 0.4);
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(left.x * 0.6 + right.x * 0.4, left.y * 0.6 + right.y * 0.4);
          ctx.lineTo(
            this.shipX - cos * flameLen,
            this.shipY - sin * flameLen
          );
          ctx.lineTo(left.x * 0.4 + right.x * 0.6, left.y * 0.4 + right.y * 0.6);
          ctx.stroke();
        }
      }
    }

    // Bullets
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#fff";
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // UI - Score
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", 20, 28);
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 22px Inter, sans-serif";
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

    // Lives
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("LIVES", WIDTH - 20, 28);
    for (let i = 0; i < this.lives; i++) {
      const lx = WIDTH - 30 - i * 24;
      const ly = 48;
      ctx.strokeStyle = "#ff2e97";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 8);
      ctx.lineTo(lx - 5, ly + 5);
      ctx.lineTo(lx + 5, ly + 5);
      ctx.closePath();
      ctx.stroke();
    }

    // Controls hint
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Arrows to move, Space to shoot", WIDTH / 2, HEIGHT - 15);
  }
}
