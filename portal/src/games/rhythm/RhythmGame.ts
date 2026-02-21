import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

/* ------------------------------------------------------------------ */
/*  CONFIG                                                             */
/* ------------------------------------------------------------------ */
const CW = 520;
const CH = 700;

const LANE_COUNT = 4;
const LANE_W = 90;
const TOTAL_LANE_W = LANE_COUNT * LANE_W; // 360
const LANE_X0 = (CW - TOTAL_LANE_W) / 2; // 80

const HIT_Y = 580;
const NOTE_W = 70;
const NOTE_H = 18;
const NOTE_SPEED = 0.5; // px per ms
const NOTE_SPAWN_Y = -20;

const LANE_KEYS = ["KeyD", "KeyF", "KeyJ", "KeyK"] as const;
const LANE_LABELS = ["D", "F", "J", "K"] as const;
const LANE_COLORS = ["#00d4ff", "#ff2e97", "#ffd700", "#6c5ce7"] as const;

const PERFECT_WINDOW = 40; // ms (±)
const GOOD_WINDOW = 90;

const PERFECT_SCORE = 100;
const GOOD_SCORE = 50;

const MAX_HP = 10;
const HP_MISS_PENALTY = 1;
const HP_PERFECT_HEAL = 0.1;

const LEVEL_UP_INTERVAL = 30_000; // ms
const BASE_BPM = 120;
const BPM_INCREMENT = 10;

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
interface Note {
  lane: number;
  spawnTime: number; // ms since game start
  y: number;
  hit: boolean;
}

type PatternType = "single" | "alternating" | "stairs" | "double";

interface JudgmentFx {
  text: string;
  color: string;
  x: number;
  y: number;
  alpha: number;
  age: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  age: number;
}

/* ------------------------------------------------------------------ */
/*  GAME                                                               */
/* ------------------------------------------------------------------ */
export class RhythmGame extends BaseGame {
  private _noteSpeed = 0.5;
  private _perfectWindow = 40;
  private _maxHp = 10;

  /* state */
  private notes: Note[] = [];
  private judgments: JudgmentFx[] = [];
  private particles: Particle[] = [];

  private elapsed = 0; // total elapsed ms
  private combo = 0;
  private maxCombo = 0;
  private hp = MAX_HP;
  private level = 1;
  private nextLevelAt = LEVEL_UP_INTERVAL;

  /* note generation */
  private nextNoteTime = 0;
  private patternQueue: number[] = []; // lane indices queued
  private lastPatternType: PatternType = "single";

  /* lane glow flash (0-1, decays) */
  private laneFlash: number[] = [0, 0, 0, 0];

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(
      canvas,
      { id: "rhythm", width: CW, height: CH, fps: 60, backgroundColor: "#0a0c14" },
      callbacks,
    );
  }

  /* ---- lifecycle ------------------------------------------------- */
  init(): void {
    this.resetState();
  }

  reset(): void {
    this.resetState();
    this.start();
  }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._noteSpeed = diffValue(d, 0.35, 0.5, 0.7);
    this._perfectWindow = Math.round(diffValue(d, 55, 40, 28));
    this._maxHp = Math.round(diffValue(d, 14, 10, 7));

    this.notes = [];
    this.judgments = [];
    this.particles = [];
    this.elapsed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hp = this._maxHp;
    this.level = 1;
    this.nextLevelAt = LEVEL_UP_INTERVAL;
    this.nextNoteTime = 1000; // 1s grace period
    this.patternQueue = [];
    this.lastPatternType = "single";
    this.laneFlash = [0, 0, 0, 0];
    this.setScore(0);
  }

  /* ---- update ---------------------------------------------------- */
  update(dt: number): void {
    this.elapsed += dt;

    // Level up
    if (this.elapsed >= this.nextLevelAt) {
      this.level++;
      this.nextLevelAt += LEVEL_UP_INTERVAL;
    }

    // Generate notes
    this.generateNotes();

    // Move notes
    for (const n of this.notes) {
      n.y += this._noteSpeed * dt;
    }

    // Check input
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      if (this.input.isKeyJustPressed(LANE_KEYS[lane])) {
        this.laneFlash[lane] = 1;
        this.handleHit(lane);
      }
    }

    // Check misses (notes past hit zone)
    for (const n of this.notes) {
      if (!n.hit && n.y > HIT_Y + GOOD_WINDOW * this._noteSpeed + NOTE_H) {
        n.hit = true;
        this.onMiss(n.lane);
      }
    }

    // Prune off-screen notes
    this.notes = this.notes.filter((n) => n.y < CH + 50);

    // Update fx
    this.updateFx(dt);

    // Decay lane flashes
    for (let i = 0; i < LANE_COUNT; i++) {
      this.laneFlash[i] = Math.max(0, this.laneFlash[i] - dt * 0.004);
    }

    // HP check
    if (this.hp <= 0) {
      this.hp = 0;
      this.gameOver();
    }
  }

  /* ---- note generation ------------------------------------------- */
  private get currentBPM(): number {
    return BASE_BPM + (this.level - 1) * BPM_INCREMENT;
  }

  private get beatInterval(): number {
    return 60_000 / this.currentBPM;
  }

  private generateNotes(): void {
    while (this.elapsed >= this.nextNoteTime) {
      if (this.patternQueue.length > 0) {
        // Spawn from queued pattern
        const lane = this.patternQueue.shift()!;
        this.spawnNote(lane, this.nextNoteTime);
        if (this.patternQueue.length === 0) {
          this.nextNoteTime += this.beatInterval;
        } else {
          // Stairs: slight delay between each
          this.nextNoteTime += this.beatInterval * 0.25;
        }
      } else {
        // Pick a new pattern
        const pattern = this.pickPattern();
        this.lastPatternType = pattern;
        switch (pattern) {
          case "single": {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            this.spawnNote(lane, this.nextNoteTime);
            this.nextNoteTime += this.beatInterval;
            break;
          }
          case "alternating": {
            const a = Math.random() < 0.5 ? 0 : 2; // left or right pair
            this.spawnNote(a, this.nextNoteTime);
            this.patternQueue.push(a + 1);
            this.nextNoteTime += this.beatInterval * 0.5;
            break;
          }
          case "stairs": {
            const start = Math.random() < 0.5 ? 0 : 3;
            const dir = start === 0 ? 1 : -1;
            this.spawnNote(start, this.nextNoteTime);
            this.patternQueue.push(start + dir, start + dir * 2, start + dir * 3);
            this.nextNoteTime += this.beatInterval * 0.25;
            break;
          }
          case "double": {
            const l1 = Math.floor(Math.random() * LANE_COUNT);
            let l2 = Math.floor(Math.random() * (LANE_COUNT - 1));
            if (l2 >= l1) l2++;
            this.spawnNote(l1, this.nextNoteTime);
            this.spawnNote(l2, this.nextNoteTime);
            this.nextNoteTime += this.beatInterval;
            break;
          }
        }
      }
    }
  }

  private pickPattern(): PatternType {
    const r = Math.random();
    const doubleChance = Math.min(0.3, 0.05 + this.level * 0.03);
    const stairsChance = 0.15;
    const altChance = 0.2;

    if (r < doubleChance) return "double";
    if (r < doubleChance + stairsChance) return "stairs";
    if (r < doubleChance + stairsChance + altChance) return "alternating";
    return "single";
  }

  private spawnNote(lane: number, time: number): void {
    // time = when the note should appear at the top of screen
    // Adjust y for any slight delay between scheduled time and actual spawn
    const y = NOTE_SPAWN_Y + (this.elapsed - time) * this._noteSpeed;
    this.notes.push({ lane, spawnTime: time, y, hit: false });
  }

  /* ---- hit detection --------------------------------------------- */
  private handleHit(lane: number): void {
    // Find closest unhit note in this lane within GOOD_WINDOW
    let best: Note | null = null;
    let bestDist = Infinity;

    for (const n of this.notes) {
      if (n.hit || n.lane !== lane) continue;
      const dist = Math.abs(n.y - HIT_Y);
      // Convert pixel distance to time distance
      const timeDist = dist / this._noteSpeed;
      if (timeDist <= GOOD_WINDOW && dist < bestDist) {
        best = n;
        bestDist = dist;
      }
    }

    if (!best) return; // no note to hit

    best.hit = true;
    const timeDist = bestDist / this._noteSpeed;

    const laneX = LANE_X0 + lane * LANE_W + LANE_W / 2;

    if (timeDist <= this._perfectWindow) {
      this.onPerfect(lane, laneX);
    } else {
      this.onGood(lane, laneX);
    }
  }

  private get multiplier(): number {
    return Math.min(3, 1 + Math.floor(this.combo / 10) * 0.5);
  }

  private onPerfect(lane: number, x: number): void {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    const pts = Math.round(PERFECT_SCORE * this.multiplier);
    this.setScore(this.score + pts);
    this.hp = Math.min(this._maxHp, this.hp + HP_PERFECT_HEAL);
    this.spawnJudgment("PERFECT!", LANE_COLORS[lane], x);
    this.spawnParticles(x, HIT_Y, LANE_COLORS[lane]);
  }

  private onGood(lane: number, x: number): void {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    const pts = Math.round(GOOD_SCORE * this.multiplier);
    this.setScore(this.score + pts);
    this.spawnJudgment("GOOD", "#ffffff", x);
    this.spawnParticles(x, HIT_Y, LANE_COLORS[lane]);
  }

  private onMiss(lane: number): void {
    this.combo = 0;
    this.hp -= HP_MISS_PENALTY;
    const x = LANE_X0 + lane * LANE_W + LANE_W / 2;
    this.spawnJudgment("MISS", "#ff4444", x);
  }

  /* ---- visual fx ------------------------------------------------- */
  private spawnJudgment(text: string, color: string, x: number): void {
    this.judgments.push({ text, color, x, y: HIT_Y - 40, alpha: 1, age: 0 });
  }

  private spawnParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 0.15,
        vy: Math.sin(angle) * 0.15,
        color,
        alpha: 1,
        age: 0,
      });
    }
  }

  private updateFx(dt: number): void {
    for (const j of this.judgments) {
      j.age += dt;
      j.y -= dt * 0.03;
      j.alpha = Math.max(0, 1 - j.age / 500);
    }
    this.judgments = this.judgments.filter((j) => j.alpha > 0);

    for (const p of this.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.age / 300);
    }
    this.particles = this.particles.filter((p) => p.alpha > 0);
  }

  /* ---- draw ------------------------------------------------------ */
  draw(): void {
    const ctx = this.ctx;

    this.drawLanes(ctx);
    this.drawHitZone(ctx);
    this.drawNotes(ctx);
    this.drawFx(ctx);
    this.drawUI(ctx);
  }

  private drawLanes(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < LANE_COUNT; i++) {
      const x = LANE_X0 + i * LANE_W;

      // Lane background stripe
      ctx.fillStyle = `rgba(255,255,255,0.03)`;
      ctx.fillRect(x, 0, LANE_W, CH);

      // Lane separator
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CH);
      ctx.stroke();

      // Lane flash on key press
      if (this.laneFlash[i] > 0) {
        const col = LANE_COLORS[i];
        ctx.fillStyle = this.withAlpha(col, this.laneFlash[i] * 0.15);
        ctx.fillRect(x, 0, LANE_W, CH);
      }
    }
    // Right edge
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(LANE_X0 + TOTAL_LANE_W, 0);
    ctx.lineTo(LANE_X0 + TOTAL_LANE_W, CH);
    ctx.stroke();
  }

  private drawHitZone(ctx: CanvasRenderingContext2D): void {
    // Glow line
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LANE_X0, HIT_Y);
    ctx.lineTo(LANE_X0 + TOTAL_LANE_W, HIT_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Target markers per lane
    for (let i = 0; i < LANE_COUNT; i++) {
      const cx = LANE_X0 + i * LANE_W + LANE_W / 2;
      const flash = this.laneFlash[i];
      const baseAlpha = 0.25 + flash * 0.5;

      ctx.beginPath();
      ctx.arc(cx, HIT_Y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = this.withAlpha(LANE_COLORS[i], baseAlpha);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner glow on press
      if (flash > 0.3) {
        ctx.beginPath();
        ctx.arc(cx, HIT_Y, 12, 0, Math.PI * 2);
        ctx.fillStyle = this.withAlpha(LANE_COLORS[i], flash * 0.4);
        ctx.fill();
      }
    }

    // Key labels below hit zone
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < LANE_COUNT; i++) {
      const cx = LANE_X0 + i * LANE_W + LANE_W / 2;
      ctx.fillStyle = this.withAlpha(LANE_COLORS[i], 0.6);
      ctx.fillText(LANE_LABELS[i], cx, HIT_Y + 35);
    }
  }

  private drawNotes(ctx: CanvasRenderingContext2D): void {
    for (const n of this.notes) {
      if (n.hit) continue;
      const col = LANE_COLORS[n.lane];
      const cx = LANE_X0 + n.lane * LANE_W + LANE_W / 2;
      const nx = cx - NOTE_W / 2;

      // Glow
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;

      // Rounded rect
      this.roundRect(ctx, nx, n.y - NOTE_H / 2, NOTE_W, NOTE_H, 6);
      ctx.fillStyle = col;
      ctx.fill();

      // Inner highlight
      this.roundRect(ctx, nx + 2, n.y - NOTE_H / 2 + 2, NOTE_W - 4, NOTE_H / 2 - 2, 4);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  private drawFx(ctx: CanvasRenderingContext2D): void {
    // Judgment text
    ctx.textAlign = "center";
    for (const j of this.judgments) {
      ctx.globalAlpha = j.alpha;
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.shadowColor = j.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = j.color;
      ctx.fillText(j.text, j.x, j.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  private drawUI(ctx: CanvasRenderingContext2D): void {
    // Score (top left)
    ctx.textAlign = "left";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("SCORE", 20, 28);
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.score.toLocaleString(), 20, 52);

    // Combo (top center)
    ctx.textAlign = "center";
    if (this.combo > 0) {
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("COMBO", CW / 2, 28);

      const comboScale = this.combo >= 10 ? 1.1 : 1;
      ctx.font = `bold ${Math.round(26 * comboScale)}px Inter, sans-serif`;
      const comboColor = this.multiplier >= 3 ? "#ffd700" : this.multiplier >= 2 ? "#00d4ff" : "#ffffff";
      ctx.fillStyle = comboColor;
      ctx.fillText(`${this.combo}`, CW / 2, 55);

      // Multiplier
      if (this.multiplier > 1) {
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillStyle = comboColor;
        ctx.fillText(`x${this.multiplier.toFixed(1)}`, CW / 2, 72);
      }
    }

    // HP bar (top right)
    const hpBarW = 100;
    const hpBarH = 8;
    const hpX = CW - hpBarW - 20;
    const hpY = 36;

    ctx.textAlign = "right";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("HP", CW - 20, 28);

    // Background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    this.roundRect(ctx, hpX, hpY, hpBarW, hpBarH, 4);
    ctx.fill();

    // Fill
    const hpFrac = this.hp / this._maxHp;
    const hpColor = hpFrac > 0.5 ? "#00d4ff" : hpFrac > 0.25 ? "#ffd700" : "#ff2e97";
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 6;
    this.roundRect(ctx, hpX, hpY, hpBarW * hpFrac, hpBarH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Level indicator
    ctx.textAlign = "left";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(`LV.${this.level}  BPM ${this.currentBPM}`, 20, CH - 15);

    // Bottom hint
    ctx.textAlign = "center";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText("D  F  J  K  to play", CW / 2, CH - 15);
  }

  /* ---- helpers --------------------------------------------------- */
  private withAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    if (w <= 0 || h <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
