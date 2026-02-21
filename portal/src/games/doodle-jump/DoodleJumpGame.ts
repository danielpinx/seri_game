import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

// ── Canvas & Config ────────────────────────────────────────────────
const W = 400;
const H = 700;
const BG = "#0a0c14";

const CONFIG = {
  id: "doodle-jump",
  width: W,
  height: H,
  fps: 60,
  backgroundColor: BG,
};

// ── Physics ────────────────────────────────────────────────────────
const GRAVITY = 0.45;
const JUMP_FORCE = -12.5;
const SPRING_FORCE = JUMP_FORCE * 1.5;
const MOVE_SPEED = 5.5;

// ── Player ─────────────────────────────────────────────────────────
const PLAYER_W = 30;
const PLAYER_H = 30;
const TRAIL_LENGTH = 6;

// ── Platform ───────────────────────────────────────────────────────
const PLAT_W = 70;
const PLAT_H = 12;
const PLAT_GAP_MIN = 50;
const PLAT_GAP_MAX = 130;
const MOVING_SPEED = 1.8;
const INITIAL_PLATFORM_COUNT = 12;

// ── Projectile ─────────────────────────────────────────────────────
const PROJ_SPEED = 10;
const PROJ_SIZE = 5;

// ── Monster ────────────────────────────────────────────────────────
const MONSTER_W = 32;
const MONSTER_H = 28;
const MONSTER_SCORE_THRESHOLD = 1000;
const MONSTER_SPAWN_CHANCE = 0.08;
const MONSTER_KILL_POINTS = 50;

// ── Stars (background) ────────────────────────────────────────────
const STAR_COUNT = 80;

// ── Types ──────────────────────────────────────────────────────────
type PlatformType = "normal" | "moving" | "breakable" | "spring" | "fake";

interface Platform {
  x: number;
  y: number; // world-Y (grows upward, so higher = smaller numbers)
  w: number;
  type: PlatformType;
  movingDir: number; // 1 or -1 for moving platforms
  broken: boolean;
  breakTimer: number; // ms since break started
  fakeTimer: number; // ms since fake activated
  springBounced: boolean; // visual feedback
  springTimer: number;
}

interface Projectile {
  x: number;
  y: number; // world-Y
  active: boolean;
}

interface Monster {
  x: number;
  y: number; // world-Y
  w: number;
  h: number;
  alive: boolean;
  bobPhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Star {
  x: number;
  y: number; // 0-1 parallax layer
  size: number;
  brightness: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

// ── Helpers ────────────────────────────────────────────────────────
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
// ── Color constants ────────────────────────────────────────────────
const COL_NORMAL = "#4ade80";
const COL_MOVING = "#00d4ff";
const COL_BREAKABLE = "#fb923c";
const COL_SPRING = "#fbbf24";
const COL_FAKE = "#ff4466";
const COL_PLAYER = "#a78bfa";
const COL_PLAYER_EYE = "#ffffff";
const COL_PROJECTILE = "#facc15";
const COL_MONSTER = "#ff6b9d";

// ════════════════════════════════════════════════════════════════════
export class DoodleJumpGame extends BaseGame {
  private _monsterSpawnChance = 0.08;
  private _platGapMax = 130;

  // Player state
  private px = 0;
  private py = 0;
  private pvx = 0;
  private pvy = 0;
  private facingRight = true;
  private trail: TrailPoint[] = [];

  // Camera
  private cameraY = 0; // world-Y of the top of the viewport
  private maxHeight = 0; // highest point reached (world coords, lower = higher)

  // World
  private platforms: Platform[] = [];
  private projectiles: Projectile[] = [];
  private monsters: Monster[] = [];
  private particles: Particle[] = [];
  private stars: Star[] = [];

  // Generation tracking
  private highestPlatformY = 0; // world-Y of the highest generated platform
  private platformsGenerated = 0;

  // Score
  private displayScore = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  // ── Init ─────────────────────────────────────────────────────────
  init(): void {
    this.resetState();
  }

  reset(): void {
    this.resetState();
  }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._monsterSpawnChance = diffValue(d, 0.04, 0.08, 0.14);
    this._platGapMax = Math.round(diffValue(d, 100, 130, 170));

    this.px = W / 2;
    this.py = H - 80;
    this.pvx = 0;
    this.pvy = 0;
    this.facingRight = true;
    this.trail = [];

    this.cameraY = 0;
    this.maxHeight = this.py;

    this.platforms = [];
    this.projectiles = [];
    this.monsters = [];
    this.particles = [];
    this.platformsGenerated = 0;

    this.displayScore = 0;
    this.score = 0;
    this.setScore(0);

    // Generate stars
    this.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random(),
        size: rand(0.5, 2),
        brightness: rand(0.2, 0.7),
      });
    }

    // Generate initial platforms
    // Ground platform
    this.platforms.push(this.createPlatform(W / 2 - PLAT_W / 2, H - 40, "normal"));

    // Platforms going upward
    let y = H - 40;
    for (let i = 0; i < INITIAL_PLATFORM_COUNT; i++) {
      y -= rand(PLAT_GAP_MIN, this._platGapMax);
      const x = rand(10, W - PLAT_W - 10);
      this.platforms.push(this.createPlatform(x, y, this.pickPlatformType(0)));
    }
    this.highestPlatformY = y;
  }

  private createPlatform(x: number, y: number, type: PlatformType): Platform {
    return {
      x,
      y,
      w: type === "spring" ? PLAT_W + 10 : rand(60, 80),
      type,
      movingDir: Math.random() < 0.5 ? 1 : -1,
      broken: false,
      breakTimer: 0,
      fakeTimer: 0,
      springBounced: false,
      springTimer: 0,
    };
  }

  private pickPlatformType(difficulty: number): PlatformType {
    // difficulty is based on score
    const r = Math.random();
    if (difficulty < 500) {
      // Easy: mostly normal
      if (r < 0.65) return "normal";
      if (r < 0.80) return "moving";
      if (r < 0.90) return "spring";
      if (r < 0.97) return "breakable";
      return "fake";
    } else if (difficulty < 2000) {
      // Medium
      if (r < 0.40) return "normal";
      if (r < 0.60) return "moving";
      if (r < 0.75) return "spring";
      if (r < 0.90) return "breakable";
      return "fake";
    } else {
      // Hard
      if (r < 0.25) return "normal";
      if (r < 0.45) return "moving";
      if (r < 0.60) return "spring";
      if (r < 0.80) return "breakable";
      return "fake";
    }
  }

  // ── Update ───────────────────────────────────────────────────────
  update(dt: number): void {
    const dtSec = dt / 1000;

    // ── Input ──────────────────────────────────────────────────────
    if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
      this.pvx = -MOVE_SPEED;
      this.facingRight = false;
    } else if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      this.pvx = MOVE_SPEED;
      this.facingRight = true;
    } else {
      this.pvx = 0;
    }

    // Shoot
    if (this.input.isKeyJustPressed("Space")) {
      this.projectiles.push({
        x: this.px + PLAYER_W / 2,
        y: this.py,
        active: true,
      });
    }

    // ── Player physics ─────────────────────────────────────────────
    this.pvy += GRAVITY;
    this.px += this.pvx;
    this.py += this.pvy;

    // Screen wrap
    if (this.px + PLAYER_W < 0) this.px = W;
    if (this.px > W) this.px = -PLAYER_W;

    // ── Trail ──────────────────────────────────────────────────────
    this.trail.push({ x: this.px + PLAYER_W / 2, y: this.py + PLAYER_H / 2 });
    if (this.trail.length > TRAIL_LENGTH) {
      this.trail.shift();
    }

    // ── Platform collision (only when falling) ─────────────────────
    if (this.pvy > 0) {
      for (const plat of this.platforms) {
        if (plat.broken) continue;
        if (plat.type === "fake" && plat.fakeTimer > 0) continue;

        // Check collision: player bottom hitting platform top
        const playerBottom = this.py + PLAYER_H;
        const playerPrevBottom = playerBottom - this.pvy;

        if (
          playerBottom >= plat.y &&
          playerPrevBottom <= plat.y + PLAT_H &&
          this.px + PLAYER_W > plat.x + 5 &&
          this.px < plat.x + plat.w - 5
        ) {
          // Handle by type
          if (plat.type === "fake") {
            plat.fakeTimer = 1; // start falling
            continue;
          }
          if (plat.type === "breakable") {
            plat.broken = true;
            plat.breakTimer = 1;
            this.spawnBreakParticles(plat);
            this.pvy = JUMP_FORCE;
            this.py = plat.y - PLAYER_H;
            continue;
          }
          if (plat.type === "spring") {
            this.pvy = SPRING_FORCE;
            plat.springBounced = true;
            plat.springTimer = 300;
          } else {
            this.pvy = JUMP_FORCE;
          }
          this.py = plat.y - PLAYER_H;
        }
      }
    }

    // ── Camera scroll ──────────────────────────────────────────────
    const playerScreenY = this.py - this.cameraY;
    if (playerScreenY < H * 0.4) {
      this.cameraY = this.py - H * 0.4;
    }

    // ── Score ──────────────────────────────────────────────────────
    if (this.py < this.maxHeight) {
      this.maxHeight = this.py;
    }
    const startY = H - 80;
    const rawScore = Math.max(0, Math.floor((startY - this.maxHeight) / 10));
    if (rawScore > this.displayScore) {
      this.displayScore = rawScore;
      this.setScore(this.displayScore);
    }

    // ── Platform updates ───────────────────────────────────────────
    for (const plat of this.platforms) {
      // Moving platforms
      if (plat.type === "moving" && !plat.broken) {
        plat.x += MOVING_SPEED * plat.movingDir;
        if (plat.x <= 0) plat.movingDir = 1;
        if (plat.x + plat.w >= W) plat.movingDir = -1;
      }
      // Break animation
      if (plat.broken && plat.breakTimer > 0) {
        plat.breakTimer += dt;
      }
      // Fake platform falling
      if (plat.type === "fake" && plat.fakeTimer > 0) {
        plat.fakeTimer += dt;
        plat.y += 3;
      }
      // Spring timer
      if (plat.springBounced && plat.springTimer > 0) {
        plat.springTimer -= dt;
        if (plat.springTimer <= 0) {
          plat.springBounced = false;
        }
      }
    }

    // ── Generate new platforms ──────────────────────────────────────
    while (this.highestPlatformY > this.cameraY - 200) {
      const gap = rand(PLAT_GAP_MIN, Math.min(this._platGapMax, PLAT_GAP_MIN + this.displayScore * 0.02 + 40));
      this.highestPlatformY -= gap;
      const x = rand(10, W - PLAT_W - 10);
      const type = this.pickPlatformType(this.displayScore);
      const plat = this.createPlatform(x, this.highestPlatformY, type);
      this.platforms.push(plat);
      this.platformsGenerated++;

      // Maybe spawn a monster
      if (
        this.displayScore >= MONSTER_SCORE_THRESHOLD &&
        Math.random() < this._monsterSpawnChance &&
        type === "normal"
      ) {
        this.monsters.push({
          x: x + plat.w / 2 - MONSTER_W / 2,
          y: this.highestPlatformY - MONSTER_H,
          w: MONSTER_W,
          h: MONSTER_H,
          alive: true,
          bobPhase: Math.random() * Math.PI * 2,
        });
      }
    }

    // ── Cleanup off-screen platforms ───────────────────────────────
    const bottomCull = this.cameraY + H + 200;
    this.platforms = this.platforms.filter(
      (p) => p.y < bottomCull && (!p.broken || p.breakTimer < 600)
    );

    // ── Projectiles ────────────────────────────────────────────────
    for (const proj of this.projectiles) {
      if (!proj.active) continue;
      proj.y -= PROJ_SPEED;

      // Check monster collision
      for (const mon of this.monsters) {
        if (!mon.alive) continue;
        if (
          proj.x > mon.x &&
          proj.x < mon.x + mon.w &&
          proj.y > mon.y &&
          proj.y < mon.y + mon.h
        ) {
          mon.alive = false;
          proj.active = false;
          this.displayScore += MONSTER_KILL_POINTS;
          this.setScore(this.displayScore);
          this.spawnMonsterDeathParticles(mon);
        }
      }

      // Cull off-screen projectiles
      if (proj.y < this.cameraY - 50) {
        proj.active = false;
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.active);

    // ── Monsters ───────────────────────────────────────────────────
    for (const mon of this.monsters) {
      if (!mon.alive) continue;
      mon.bobPhase += dtSec * 3;

      // Kill player on contact
      if (
        this.px + PLAYER_W > mon.x + 4 &&
        this.px < mon.x + mon.w - 4 &&
        this.py + PLAYER_H > mon.y + 4 &&
        this.py < mon.y + mon.h - 4
      ) {
        // If falling onto monster, kill it (stomp)
        if (this.pvy > 0 && this.py + PLAYER_H < mon.y + mon.h / 2) {
          mon.alive = false;
          this.pvy = JUMP_FORCE;
          this.displayScore += MONSTER_KILL_POINTS;
          this.setScore(this.displayScore);
          this.spawnMonsterDeathParticles(mon);
        } else {
          // Player dies
          this.gameOver();
          return;
        }
      }
    }
    this.monsters = this.monsters.filter(
      (m) => m.alive && m.y < bottomCull
    );

    // ── Particles ──────────────────────────────────────────────────
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // ── Game over check ────────────────────────────────────────────
    if (this.py - this.cameraY > H + 50) {
      this.gameOver();
    }
  }

  // ── Particle spawners ────────────────────────────────────────────
  private spawnBreakParticles(plat: Platform): void {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: plat.x + Math.random() * plat.w,
        y: plat.y + PLAT_H / 2,
        vx: rand(-2, 2),
        vy: rand(-2, 1),
        life: 400,
        maxLife: 400,
        color: COL_BREAKABLE,
      });
    }
  }

  private spawnMonsterDeathParticles(mon: Monster): void {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: mon.x + mon.w / 2,
        y: mon.y + mon.h / 2,
        vx: rand(-3, 3),
        vy: rand(-3, 1),
        life: 500,
        maxLife: 500,
        color: COL_MONSTER,
      });
    }
  }

  // ── Draw ─────────────────────────────────────────────────────────
  draw(): void {
    const ctx = this.ctx;
    const camY = this.cameraY;

    // ── Background stars ───────────────────────────────────────────
    for (const star of this.stars) {
      const parallax = 0.1 + star.y * 0.3;
      const sy = ((star.y * H * 5 - camY * parallax) % H + H) % H;
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(star.x, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Height meter (right side) ──────────────────────────────────
    this.drawHeightMeter(ctx);

    // ── Platforms ──────────────────────────────────────────────────
    for (const plat of this.platforms) {
      const screenY = plat.y - camY;
      if (screenY < -30 || screenY > H + 30) continue;
      if (plat.broken && plat.breakTimer > 300) continue;

      this.drawPlatform(ctx, plat, screenY);
    }

    // ── Monsters ──────────────────────────────────────────────────
    for (const mon of this.monsters) {
      if (!mon.alive) continue;
      const screenY = mon.y - camY + Math.sin(mon.bobPhase) * 3;
      if (screenY < -50 || screenY > H + 50) continue;
      this.drawMonster(ctx, mon.x, screenY, mon.w, mon.h);
    }

    // ── Projectiles ───────────────────────────────────────────────
    for (const proj of this.projectiles) {
      const screenY = proj.y - camY;
      if (screenY < -20 || screenY > H + 20) continue;

      ctx.save();
      ctx.shadowColor = COL_PROJECTILE;
      ctx.shadowBlur = 8;
      ctx.fillStyle = COL_PROJECTILE;
      ctx.beginPath();
      ctx.arc(proj.x, screenY, PROJ_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Particles ─────────────────────────────────────────────────
    for (const p of this.particles) {
      const screenY = p.y - camY;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, screenY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Player trail ──────────────────────────────────────────────
    for (let i = 0; i < this.trail.length - 1; i++) {
      const t = this.trail[i];
      const alpha = (i + 1) / this.trail.length * 0.3;
      const screenY = t.y - camY;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COL_PLAYER;
      ctx.beginPath();
      ctx.arc(t.x, screenY, PLAYER_W / 2 * (0.3 + 0.7 * (i / this.trail.length)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Player ────────────────────────────────────────────────────
    this.drawPlayer(ctx, this.px, this.py - camY);

    // ── Score ─────────────────────────────────────────────────────
    this.drawScore(ctx);
  }

  // ── Draw helpers ─────────────────────────────────────────────────
  private drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, screenY: number): void {
    ctx.save();

    const color = this.getPlatformColor(plat.type);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Break animation fade
    if (plat.broken) {
      ctx.globalAlpha = Math.max(0, 1 - plat.breakTimer / 300);
    }

    // Fake platform: dashed border
    if (plat.type === "fake") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(plat.x, screenY, plat.w, PLAT_H, 4);
      ctx.stroke();
      ctx.setLineDash([]);
      // Slight fill
      ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(plat.x, screenY, plat.w, PLAT_H, 4);
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(plat.x, screenY, plat.w, PLAT_H, 4);
      ctx.fill();

      // Highlight line on top
      ctx.shadowBlur = 0;
      ctx.globalAlpha = (plat.broken ? Math.max(0, 1 - plat.breakTimer / 300) : 1) * 0.4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(plat.x + 4, screenY + 2, plat.w - 8, 3, 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Spring visual
    if (plat.type === "spring") {
      this.drawSpring(ctx, plat.x + plat.w / 2, screenY, plat.springBounced);
    }

    ctx.restore();
  }

  private drawSpring(ctx: CanvasRenderingContext2D, cx: number, topY: number, bounced: boolean): void {
    const springH = bounced ? 4 : 10;
    const baseY = topY;
    const coils = 3;
    const coilW = 10;

    ctx.save();
    ctx.strokeStyle = COL_SPRING;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = COL_SPRING;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    for (let i = 0; i < coils; i++) {
      const segH = springH / coils;
      const y1 = baseY - (i * segH) - segH * 0.33;
      const y2 = baseY - (i * segH) - segH * 0.66;
      const y3 = baseY - ((i + 1) * segH);
      ctx.quadraticCurveTo(cx - coilW, y1, cx, y2);
      ctx.quadraticCurveTo(cx + coilW, y3, cx, y3);
    }
    ctx.stroke();

    // Top cap
    ctx.fillStyle = COL_SPRING;
    ctx.beginPath();
    ctx.roundRect(cx - 8, baseY - springH - 3, 16, 4, 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, x: number, screenY: number): void {
    ctx.save();

    // Body glow
    ctx.shadowColor = COL_PLAYER;
    ctx.shadowBlur = 14;

    // Body (rounded rect)
    ctx.fillStyle = COL_PLAYER;
    ctx.beginPath();
    ctx.roundRect(x + 2, screenY + 2, PLAYER_W - 4, PLAYER_H - 4, 8);
    ctx.fill();

    // Clear shadow for details
    ctx.shadowBlur = 0;

    // Eyes
    const eyeOffsetX = this.facingRight ? 5 : -5;
    const eyeY = screenY + PLAYER_H * 0.35;
    const leftEyeX = x + PLAYER_W / 2 - 5 + eyeOffsetX;
    const rightEyeX = x + PLAYER_W / 2 + 5 + eyeOffsetX;

    ctx.fillStyle = COL_PLAYER_EYE;
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    const pupilOff = this.facingRight ? 1.2 : -1.2;
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilOff, eyeY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilOff, eyeY, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Little feet when falling
    if (this.pvy > 2) {
      ctx.fillStyle = COL_PLAYER;
      ctx.beginPath();
      ctx.roundRect(x + 4, screenY + PLAYER_H - 4, 8, 5, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x + PLAYER_W - 12, screenY + PLAYER_H - 4, 8, 5, 3);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMonster(
    ctx: CanvasRenderingContext2D,
    x: number,
    screenY: number,
    w: number,
    h: number
  ): void {
    ctx.save();

    ctx.shadowColor = COL_MONSTER;
    ctx.shadowBlur = 10;

    // Body
    ctx.fillStyle = COL_MONSTER;
    ctx.beginPath();
    ctx.roundRect(x, screenY, w, h, 6);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Spikes on top
    const spikes = 4;
    ctx.fillStyle = COL_MONSTER;
    for (let i = 0; i < spikes; i++) {
      const sx = x + (w / (spikes + 1)) * (i + 1);
      ctx.beginPath();
      ctx.moveTo(sx - 4, screenY);
      ctx.lineTo(sx, screenY - 7);
      ctx.lineTo(sx + 4, screenY);
      ctx.fill();
    }

    // Eyes (angry)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + w * 0.35, screenY + h * 0.45, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.65, screenY + h * 0.45, 4, 0, Math.PI * 2);
    ctx.fill();

    // Red pupils
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(x + w * 0.35, screenY + h * 0.45, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.65, screenY + h * 0.45, 2, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, screenY + h * 0.25);
    ctx.lineTo(x + w * 0.45, screenY + h * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.8, screenY + h * 0.25);
    ctx.lineTo(x + w * 0.55, screenY + h * 0.35);
    ctx.stroke();

    ctx.restore();
  }

  private drawHeightMeter(ctx: CanvasRenderingContext2D): void {
    const meterX = W - 14;
    const meterH = H - 40;
    const meterTop = 20;

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(meterX - 2, meterTop, 6, meterH, 3);
    ctx.fill();

    // Fill level based on score (cap visual at 10000)
    const fill = Math.min(1, this.displayScore / 10000);
    const fillH = meterH * fill;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = COL_PLAYER;
    ctx.beginPath();
    ctx.roundRect(meterX - 2, meterTop + meterH - fillH, 6, fillH, 3);
    ctx.fill();

    ctx.restore();
  }

  private drawScore(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Score background pill
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(10, 10, 120, 32, 8);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`${this.displayScore}m`, 22, 27);

    // Small arrow up icon
    ctx.strokeStyle = COL_NORMAL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 30);
    ctx.lineTo(114, 20);
    ctx.lineTo(118, 30);
    ctx.stroke();

    ctx.restore();
  }

  private getPlatformColor(type: PlatformType): string {
    switch (type) {
      case "normal":
        return COL_NORMAL;
      case "moving":
        return COL_MOVING;
      case "breakable":
        return COL_BREAKABLE;
      case "spring":
        return COL_SPRING;
      case "fake":
        return COL_FAKE;
    }
  }
}
