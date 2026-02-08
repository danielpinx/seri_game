import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const W = 760, H = 680, BG = "#080816";
const GCOLS = 20, GROWS = 14, CELL = 36;
const GX = 20, GY = 72;

const CONFIG = { id: "tower-defense", width: W, height: H, fps: 60, backgroundColor: BG };

// Path waypoints (grid coords)
const PG: [number, number][] = [
  [-1, 1], [12, 1], [12, 4], [3, 4], [3, 7], [12, 7], [12, 10], [3, 10], [3, 12], [20, 12],
];
// Pixel path
const PP: [number, number][] = PG.map(([c, r]) => [GX + c * CELL + CELL / 2, GY + r * CELL + CELL / 2]);

const TSTATS = [
  { name: "BLASTER", cost: 20, range: 3.2, dmg: 12, rate: 500, color: "#00d4ff", splash: 0, slow: 0 },
  { name: "CANNON", cost: 40, range: 2.8, dmg: 30, rate: 1200, color: "#ff2e97", splash: 1.3, slow: 0 },
  { name: "FROST", cost: 30, range: 3.0, dmg: 5, rate: 800, color: "#6c5ce7", splash: 0, slow: 2000 },
];

const ESTATS = [
  { hp: 60, speed: 65, reward: 8, color: "#ff6b6b", r: 8 },
  { hp: 35, speed: 120, reward: 12, color: "#ffd700", r: 6 },
  { hp: 200, speed: 38, reward: 25, color: "#e94560", r: 12 },
];

interface Tower { col: number; row: number; x: number; y: number; type: number; cd: number; }
interface Enemy { x: number; y: number; hp: number; mhp: number; speed: number; seg: number; type: number; reward: number; slow: number; }
interface Proj { x: number; y: number; tx: number; ty: number; dmg: number; type: number; splash: number; slow: number; }

export class TowerDefenseGame extends BaseGame {
  private pathCells = new Set<string>();
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projs: Proj[] = [];
  private sel = -1; // selected tower type
  private hover = [-1, -1];
  private lives = 20;
  private gold = 100;
  private wave = 0;
  private waveActive = false;
  private spawnQ: number[] = [];
  private spawnTimer = 0;
  private spawnInt = 700;
  private waveDelay = 0;
  private best = 0;
  private pm = false;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) { super(canvas, CONFIG, cb); }

  init(): void {
    try { this.best = parseInt(localStorage.getItem("td-best") || "0", 10); } catch { this.best = 0; }
    this.buildPathCells();
    this.resetState();
  }

  reset(): void { this.resetState(); }

  private buildPathCells(): void {
    this.pathCells.clear();
    for (let i = 0; i < PG.length - 1; i++) {
      const [x1, y1] = PG[i], [x2, y2] = PG[i + 1];
      if (x1 === x2) {
        const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1];
        for (let r = a; r <= b; r++) if (x1 >= 0 && x1 < GCOLS) this.pathCells.add(`${x1},${r}`);
      } else {
        const [a, b] = x1 < x2 ? [x1, x2] : [x2, x1];
        for (let c = a; c <= b; c++) if (c >= 0 && c < GCOLS) this.pathCells.add(`${c},${y1}`);
      }
    }
  }

  private resetState(): void {
    this.towers = []; this.enemies = []; this.projs = [];
    this.sel = -1; this.lives = 20; this.gold = 100;
    this.wave = 0; this.waveActive = false;
    this.spawnQ = []; this.waveDelay = 2000;
    this.setScore(0);
  }

  private startWave(): void {
    this.wave++;
    this.spawnQ = [];
    const bc = 4 + this.wave * 2;
    const fc = this.wave >= 3 ? Math.floor((this.wave - 2) * 1.5) : 0;
    const tc = this.wave >= 6 ? Math.floor((this.wave - 4) / 2) : 0;
    for (let i = 0; i < bc; i++) this.spawnQ.push(0);
    for (let i = 0; i < fc; i++) this.spawnQ.push(1);
    for (let i = 0; i < tc; i++) this.spawnQ.push(2);
    // Shuffle
    for (let i = this.spawnQ.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQ[i], this.spawnQ[j]] = [this.spawnQ[j], this.spawnQ[i]];
    }
    this.spawnInt = Math.max(350, 700 - this.wave * 25);
    this.spawnTimer = 0;
    this.waveActive = true;
  }

  private spawnEnemy(type: number): void {
    const s = ESTATS[type];
    const mul = 1 + (this.wave - 1) * 0.15;
    this.enemies.push({
      x: PP[0][0], y: PP[0][1],
      hp: s.hp * mul, mhp: s.hp * mul,
      speed: s.speed, seg: 0, type, reward: s.reward, slow: 0,
    });
  }

  private hasTower(c: number, r: number): boolean {
    return this.towers.some(t => t.col === c && t.row === r);
  }

  private addPts(n: number): void {
    this.setScore(this.score + n);
    if (this.score > this.best) { this.best = this.score; try { localStorage.setItem("td-best", String(this.best)); } catch {} }
  }

  update(dt: number): void {
    const ds = dt / 1000;
    const m = this.input.getMousePosition();
    const down = this.input.isMouseDown(0);
    const jd = down && !this.pm;
    this.pm = down;

    // Hover grid
    const gc = Math.floor((m.x - GX) / CELL);
    const gr = Math.floor((m.y - GY) / CELL);
    this.hover = (gc >= 0 && gc < GCOLS && gr >= 0 && gr < GROWS) ? [gc, gr] : [-1, -1];

    // Tower selection keys
    if (this.input.isKeyJustPressed("Digit1")) this.sel = this.sel === 0 ? -1 : 0;
    if (this.input.isKeyJustPressed("Digit2")) this.sel = this.sel === 1 ? -1 : 1;
    if (this.input.isKeyJustPressed("Digit3")) this.sel = this.sel === 2 ? -1 : 2;
    if (this.input.isKeyJustPressed("Escape")) this.sel = -1;

    // Click: place tower or select from UI
    if (jd) {
      // UI buttons (bottom)
      const btnY = H - 58;
      const btnW = 130, btnGap = 10;
      const btnStartX = (W - 3 * btnW - 2 * btnGap) / 2;
      for (let i = 0; i < 3; i++) {
        const bx = btnStartX + i * (btnW + btnGap);
        if (m.x >= bx && m.x < bx + btnW && m.y >= btnY && m.y < btnY + 46) {
          this.sel = this.sel === i ? -1 : i;
          break;
        }
      }
      // Place tower
      if (this.sel >= 0 && this.hover[0] >= 0) {
        const [c, r] = this.hover;
        if (!this.pathCells.has(`${c},${r}`) && !this.hasTower(c, r) && this.gold >= TSTATS[this.sel].cost) {
          this.gold -= TSTATS[this.sel].cost;
          this.towers.push({ col: c, row: r, x: GX + c * CELL + CELL / 2, y: GY + r * CELL + CELL / 2, type: this.sel, cd: 0 });
        }
      }
    }

    // Wave management
    if (!this.waveActive) {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0 || this.input.isKeyJustPressed("Space")) this.startWave();
    } else {
      if (this.spawnQ.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnEnemy(this.spawnQ.shift()!);
          this.spawnTimer = this.spawnInt;
        }
      }
      if (this.spawnQ.length === 0 && this.enemies.length === 0) {
        this.waveActive = false;
        this.waveDelay = 4000;
      }
    }

    // Enemy slow timers
    for (const e of this.enemies) if (e.slow > 0) e.slow -= dt;

    // Move enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.seg >= PP.length - 1) { this.lives--; this.enemies.splice(i, 1); if (this.lives <= 0) { this.gameOver(); return; } continue; }
      const [tx, ty] = PP[e.seg + 1];
      const dx = tx - e.x, dy = ty - e.y;
      const dist = Math.hypot(dx, dy);
      const spd = e.speed * (e.slow > 0 ? 0.5 : 1) * ds;
      if (dist <= spd) { e.x = tx; e.y = ty; e.seg++; }
      else { e.x += (dx / dist) * spd; e.y += (dy / dist) * spd; }
    }

    // Tower targeting & shooting
    for (const t of this.towers) {
      t.cd -= dt;
      if (t.cd > 0) continue;
      const ts = TSTATS[t.type];
      const rng = ts.range * CELL;
      let best: Enemy | null = null, bestD = Infinity;
      for (const e of this.enemies) {
        const d = Math.hypot(t.x - e.x, t.y - e.y);
        if (d <= rng && d < bestD) { bestD = d; best = e; }
      }
      if (best) {
        t.cd = ts.rate;
        this.projs.push({ x: t.x, y: t.y, tx: best.x, ty: best.y, dmg: ts.dmg, type: t.type, splash: ts.splash * CELL, slow: ts.slow });
      }
    }

    // Move projectiles
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy);
      const spd = 400 * ds;
      if (dist <= spd) {
        // Hit
        if (p.splash > 0) {
          for (const e of this.enemies) {
            if (Math.hypot(e.x - p.tx, e.y - p.ty) <= p.splash) {
              e.hp -= p.dmg; if (p.slow > 0) e.slow = p.slow;
            }
          }
        } else {
          const target = this.enemies.reduce<Enemy | null>((best, e) => {
            const d = Math.hypot(e.x - p.tx, e.y - p.ty);
            return d < 20 && (!best || d < Math.hypot(best.x - p.tx, best.y - p.ty)) ? e : best;
          }, null);
          if (target) { target.hp -= p.dmg; if (p.slow > 0) target.slow = p.slow; }
        }
        this.projs.splice(i, 1);
      } else {
        p.x += (dx / dist) * spd; p.y += (dy / dist) * spd;
      }
    }

    // Remove dead enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].hp <= 0) {
        this.gold += this.enemies[i].reward;
        this.addPts(this.enemies[i].reward);
        this.enemies.splice(i, 1);
      }
    }
  }

  // ═══════════════ DRAW ═══════════════

  draw(): void {
    const ctx = this.ctx;

    // Grid
    for (let r = 0; r < GROWS; r++) {
      for (let c = 0; c < GCOLS; c++) {
        const x = GX + c * CELL, y = GY + r * CELL;
        const ip = this.pathCells.has(`${c},${r}`);
        ctx.fillStyle = ip ? "#12122a" : "#0a0a1e";
        ctx.fillRect(x, y, CELL, CELL);
        if (!ip) { ctx.strokeStyle = "rgba(255,255,255,0.025)"; ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1); }
      }
    }

    // Path line
    ctx.strokeStyle = "rgba(108,92,231,0.15)";
    ctx.lineWidth = CELL * 0.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(PP[0][0], PP[0][1]);
    for (let i = 1; i < PP.length; i++) ctx.lineTo(PP[i][0], PP[i][1]);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Hover preview
    if (this.sel >= 0 && this.hover[0] >= 0) {
      const [c, r] = this.hover;
      const x = GX + c * CELL, y = GY + r * CELL;
      const valid = !this.pathCells.has(`${c},${r}`) && !this.hasTower(c, r) && this.gold >= TSTATS[this.sel].cost;
      ctx.fillStyle = valid ? `${TSTATS[this.sel].color}25` : "rgba(255,0,0,0.15)";
      ctx.fillRect(x, y, CELL, CELL);
      if (valid) {
        ctx.strokeStyle = `${TSTATS[this.sel].color}30`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, TSTATS[this.sel].range * CELL, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Towers
    for (const t of this.towers) {
      const ts = TSTATS[t.type];
      ctx.shadowColor = ts.color; ctx.shadowBlur = 8;
      ctx.fillStyle = ts.color;
      if (t.type === 0) { // Blaster: circle
        ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI * 2); ctx.fill();
      } else if (t.type === 1) { // Cannon: square
        ctx.fillRect(t.x - 9, t.y - 9, 18, 18);
      } else { // Frost: diamond
        ctx.beginPath(); ctx.moveTo(t.x, t.y - 11); ctx.lineTo(t.x + 9, t.y);
        ctx.lineTo(t.x, t.y + 11); ctx.lineTo(t.x - 9, t.y); ctx.closePath(); ctx.fill();
      }
      ctx.shadowBlur = 0;
      // Inner highlight
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.arc(t.x - 2, t.y - 3, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Enemies
    for (const e of this.enemies) {
      const es = ESTATS[e.type];
      // Shadow/glow
      if (e.slow > 0) { ctx.shadowColor = "#6c5ce7"; ctx.shadowBlur = 8; }
      ctx.fillStyle = es.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, es.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // HP bar
      const bw = es.r * 2.5, bh = 3;
      const bx = e.x - bw / 2, by = e.y - es.r - 6;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.hp / e.mhp > 0.5 ? "#4ecdc4" : e.hp / e.mhp > 0.25 ? "#ffd700" : "#ff2e97";
      ctx.fillRect(bx, by, bw * (e.hp / e.mhp), bh);
    }

    // Projectiles
    for (const p of this.projs) {
      const ts = TSTATS[p.type];
      ctx.fillStyle = ts.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.type === 1 ? 4 : 3, 0, Math.PI * 2); ctx.fill();
    }

    // ── UI Top ──
    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("WAVE", 20, 20);
    ctx.fillStyle = "#00d4ff"; ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.wave), 20, 44);

    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText("LIVES", 100, 20);
    ctx.fillStyle = this.lives > 5 ? "#4ecdc4" : "#ff2e97"; ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.lives), 100, 44);

    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText("GOLD", 180, 20);
    ctx.fillStyle = "#ffd700"; ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.gold), 180, 44);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText("SCORE", W - 20, 20);
    ctx.fillStyle = "#00d4ff"; ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(String(this.score), W - 20, 44);
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`BEST ${this.best}`, W - 20, 58);

    // Wave hint
    if (!this.waveActive) {
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText("Press SPACE for next wave", W / 2, 56);
    }

    // ── UI Bottom: Tower buttons ──
    const btnY = H - 58, btnW = 130, btnH = 46, btnGap = 10;
    const btnSX = (W - 3 * btnW - 2 * btnGap) / 2;
    for (let i = 0; i < 3; i++) {
      const bx = btnSX + i * (btnW + btnGap);
      const ts = TSTATS[i];
      const active = this.sel === i;
      ctx.fillStyle = active ? `${ts.color}30` : "rgba(255,255,255,0.04)";
      ctx.beginPath(); ctx.roundRect(bx, btnY, btnW, btnH, 6); ctx.fill();
      ctx.strokeStyle = active ? ts.color : "rgba(255,255,255,0.1)";
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath(); ctx.roundRect(bx, btnY, btnW, btnH, 6); ctx.stroke();

      // Icon
      ctx.fillStyle = ts.color;
      const ix = bx + 20, iy = btnY + btnH / 2;
      if (i === 0) { ctx.beginPath(); ctx.arc(ix, iy, 6, 0, Math.PI * 2); ctx.fill(); }
      else if (i === 1) { ctx.fillRect(ix - 6, iy - 6, 12, 12); }
      else { ctx.beginPath(); ctx.moveTo(ix, iy - 7); ctx.lineTo(ix + 6, iy); ctx.lineTo(ix, iy + 7); ctx.lineTo(ix - 6, iy); ctx.closePath(); ctx.fill(); }

      // Text
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "bold 11px Inter, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(ts.name, bx + 36, btnY + 18);
      ctx.fillStyle = this.gold >= ts.cost ? "#ffd700" : "rgba(255,100,100,0.6)";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(`${ts.cost}g`, bx + 36, btnY + 34);

      // Key hint
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "9px Inter, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`[${i + 1}]`, bx + btnW - 8, btnY + 18);
    }
  }
}
