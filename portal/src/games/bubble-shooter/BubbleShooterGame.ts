import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { diffValue } from "@/lib/settings";

// ── Canvas & Layout ──────────────────────────────────────────────────
const WIDTH = 480;
const HEIGHT = 700;
const BG = "#0a0c14";

// ── Bubble Grid ──────────────────────────────────────────────────────
const BUBBLE_R = 16;
const BUBBLE_D = BUBBLE_R * 2;
const GRID_COLS = 13;
const GRID_OFFSET_X = (WIDTH - GRID_COLS * BUBBLE_D) / 2 + BUBBLE_R;
const GRID_TOP = 60;
const ROW_HEIGHT = BUBBLE_D * 0.866; // sqrt(3)/2 for hex packing

// ── Shooter ──────────────────────────────────────────────────────────
const SHOOTER_Y = HEIGHT - 60;
const SHOOTER_X = WIDTH / 2;
const SHOOT_SPEED = 12;
const MIN_ANGLE = Math.PI * 0.05;
const MAX_ANGLE = Math.PI * 0.95;

// ── Danger line ──────────────────────────────────────────────────────
const DANGER_Y = HEIGHT - 120;

// ── Colors ───────────────────────────────────────────────────────────
const BUBBLE_COLORS = [
  "#ff4466", // Red
  "#00d4ff", // Blue
  "#4ade80", // Green
  "#fbbf24", // Yellow
  "#a855f7", // Purple
  "#fb923c", // Orange
];

const CONFIG = {
  id: "bubble-shooter",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

// ── Types ────────────────────────────────────────────────────────────
interface GridBubble {
  row: number;
  col: number;
  colorIdx: number;
}

interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIdx: number;
}

interface PopAnim {
  x: number;
  y: number;
  colorIdx: number;
  scale: number;
  alpha: number;
}

interface FallAnim {
  x: number;
  y: number;
  vy: number;
  colorIdx: number;
  alpha: number;
}

// ── Helpers ──────────────────────────────────────────────────────────
function gridToPixel(row: number, col: number, ceilingOffset: number): { x: number; y: number } {
  const offsetX = row % 2 === 1 ? BUBBLE_R : 0;
  return {
    x: GRID_OFFSET_X + col * BUBBLE_D + offsetX,
    y: GRID_TOP + row * ROW_HEIGHT + ceilingOffset,
  };
}

function maxColsForRow(row: number): number {
  return row % 2 === 1 ? GRID_COLS - 1 : GRID_COLS;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// ── Game Class ───────────────────────────────────────────────────────
export class BubbleShooterGame extends BaseGame {
  private grid: (GridBubble | null)[][] = [];
  private maxRows = 20;

  private flyingBubble: FlyingBubble | null = null;
  private currentColor = 0;
  private nextColor = 0;

  private aimAngle = Math.PI / 2;
  private wasMouseDown = false;

  private popAnims: PopAnim[] = [];
  private fallAnims: FallAnim[] = [];

  private shotCount = 0;
  private ceilingOffset = 0;
  private ceilingDropRows = 0;

  private running = true;
  private _shootSpeed = 12;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  // ── Lifecycle ────────────────────────────────────────────────────
  init(): void {
    this.resetState();
  }

  reset(): void {
    this.resetState();
  }

  private resetState(): void {
    const d = useSettingsStore.getState().difficulty;
    this._shootSpeed = Math.round(diffValue(d, 10, 12, 15));
    this.grid = [];
    for (let r = 0; r < this.maxRows; r++) {
      const cols = maxColsForRow(r);
      this.grid[r] = new Array(cols).fill(null);
    }
    this.flyingBubble = null;
    this.popAnims = [];
    this.fallAnims = [];
    this.shotCount = 0;
    this.ceilingOffset = 0;
    this.ceilingDropRows = 0;
    this.running = true;
    this.aimAngle = Math.PI / 2;
    this.wasMouseDown = false;
    this.setScore(0);

    this.fillInitialRows(7);
    this.pickColors();
  }

  private fillInitialRows(numRows: number): void {
    for (let r = 0; r < numRows; r++) {
      const cols = maxColsForRow(r);
      for (let c = 0; c < cols; c++) {
        this.grid[r][c] = {
          row: r,
          col: c,
          colorIdx: Math.floor(Math.random() * BUBBLE_COLORS.length),
        };
      }
    }
  }

  private pickColors(): void {
    const active = this.getActiveColorIndices();
    if (active.length === 0) {
      this.currentColor = Math.floor(Math.random() * BUBBLE_COLORS.length);
      this.nextColor = Math.floor(Math.random() * BUBBLE_COLORS.length);
    } else {
      this.currentColor = active[Math.floor(Math.random() * active.length)];
      this.nextColor = active[Math.floor(Math.random() * active.length)];
    }
  }

  private getActiveColorIndices(): number[] {
    const set = new Set<number>();
    for (let r = 0; r < this.maxRows; r++) {
      for (let c = 0; c < maxColsForRow(r); c++) {
        const b = this.grid[r][c];
        if (b) set.add(b.colorIdx);
      }
    }
    return Array.from(set);
  }

  private advanceColor(): void {
    const active = this.getActiveColorIndices();
    this.currentColor = this.nextColor;
    if (active.length === 0) {
      this.nextColor = Math.floor(Math.random() * BUBBLE_COLORS.length);
    } else {
      this.nextColor = active[Math.floor(Math.random() * active.length)];
    }
  }

  // ── Update ───────────────────────────────────────────────────────
  update(dt: number): void {
    // Animate pops
    this.popAnims = this.popAnims.filter((p) => {
      p.scale += dt * 0.004;
      p.alpha -= dt * 0.004;
      return p.alpha > 0;
    });

    // Animate falls
    this.fallAnims = this.fallAnims.filter((f) => {
      f.vy += dt * 0.025; // gravity
      f.y += f.vy;
      f.alpha -= dt * 0.0015;
      return f.alpha > 0 && f.y < HEIGHT + 50;
    });

    if (!this.running) return;

    // Aim
    const mouse = this.input.getMousePosition();
    const dx = mouse.x - SHOOTER_X;
    const dy = SHOOTER_Y - mouse.y; // flip y so up is positive
    if (dy > 0) {
      this.aimAngle = Math.atan2(dy, dx);
      // Clamp angle
      if (this.aimAngle < MIN_ANGLE) this.aimAngle = MIN_ANGLE;
      if (this.aimAngle > MAX_ANGLE) this.aimAngle = MAX_ANGLE;
    }

    // Shoot on click
    const mouseDown = this.input.isMouseDown(0);
    const mouseClicked = mouseDown && !this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    if (mouseClicked && !this.flyingBubble) {
      this.flyingBubble = {
        x: SHOOTER_X,
        y: SHOOTER_Y,
        vx: Math.cos(this.aimAngle) * this._shootSpeed,
        vy: -Math.sin(this.aimAngle) * this._shootSpeed,
        colorIdx: this.currentColor,
      };
      this.advanceColor();
      this.shotCount++;
    }

    // Move flying bubble
    if (this.flyingBubble) {
      const fb = this.flyingBubble;
      fb.x += fb.vx;
      fb.y += fb.vy;

      // Wall bounce
      if (fb.x - BUBBLE_R < 0) {
        fb.x = BUBBLE_R;
        fb.vx = Math.abs(fb.vx);
      }
      if (fb.x + BUBBLE_R > WIDTH) {
        fb.x = WIDTH - BUBBLE_R;
        fb.vx = -Math.abs(fb.vx);
      }

      // Top wall snap
      if (fb.y - BUBBLE_R <= GRID_TOP + this.ceilingOffset) {
        this.snapBubble(fb);
        return;
      }

      // Grid collision
      let snapped = false;
      for (let r = 0; r < this.maxRows && !snapped; r++) {
        for (let c = 0; c < maxColsForRow(r) && !snapped; c++) {
          const cell = this.grid[r][c];
          if (!cell) continue;
          const pos = gridToPixel(r, c, this.ceilingOffset);
          if (dist(fb.x, fb.y, pos.x, pos.y) < BUBBLE_D - 2) {
            this.snapBubble(fb);
            snapped = true;
          }
        }
      }
    }

    // Ceiling drop every 10 shots without clearing
    if (this.shotCount > 0 && this.shotCount % 10 === 0) {
      this.dropCeiling();
      this.shotCount++; // prevent repeated drop on same count
    }
  }

  // ── Snap & Match ─────────────────────────────────────────────────
  private snapBubble(fb: FlyingBubble): void {
    // Find the closest empty grid cell
    let bestRow = 0;
    let bestCol = 0;
    let bestDist = Infinity;

    for (let r = 0; r < this.maxRows; r++) {
      for (let c = 0; c < maxColsForRow(r); c++) {
        if (this.grid[r][c]) continue;
        const pos = gridToPixel(r, c, this.ceilingOffset);
        const d = dist(fb.x, fb.y, pos.x, pos.y);
        if (d < bestDist) {
          bestDist = d;
          bestRow = r;
          bestCol = c;
        }
      }
    }

    // Place bubble
    this.grid[bestRow][bestCol] = {
      row: bestRow,
      col: bestCol,
      colorIdx: fb.colorIdx,
    };
    this.flyingBubble = null;

    // Find matches
    const matches = this.findConnectedSameColor(bestRow, bestCol, fb.colorIdx);

    if (matches.length >= 3) {
      // Pop them
      let popPoints = 0;
      for (const [r, c] of matches) {
        const pos = gridToPixel(r, c, this.ceilingOffset);
        this.popAnims.push({
          x: pos.x,
          y: pos.y,
          colorIdx: this.grid[r][c]!.colorIdx,
          scale: 1,
          alpha: 1,
        });
        this.grid[r][c] = null;
        popPoints += 10;
      }

      // Find orphans (not connected to top)
      const orphans = this.findOrphans();
      for (const [r, c] of orphans) {
        const pos = gridToPixel(r, c, this.ceilingOffset);
        this.fallAnims.push({
          x: pos.x,
          y: pos.y,
          vy: 0,
          colorIdx: this.grid[r][c]!.colorIdx,
          alpha: 1,
        });
        this.grid[r][c] = null;
        popPoints += 5;
      }

      this.setScore(this.score + popPoints);

      // Check if board clear -> generate new rows (endless)
      if (this.isBoardEmpty()) {
        this.fillInitialRows(5);
        this.pickColors();
      }
    }

    // Check game over - any bubble past danger line
    this.checkGameOver();
  }

  private findConnectedSameColor(startRow: number, startCol: number, colorIdx: number): [number, number][] {
    const visited = new Set<string>();
    const result: [number, number][] = [];
    const queue: [number, number][] = [[startRow, startCol]];
    visited.add(`${startRow},${startCol}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const cell = this.grid[r][c];
      if (!cell || cell.colorIdx !== colorIdx) continue;
      result.push([r, c]);

      for (const [nr, nc] of this.getNeighbors(r, c)) {
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        visited.add(key);
        const n = this.grid[nr]?.[nc];
        if (n && n.colorIdx === colorIdx) {
          queue.push([nr, nc]);
        }
      }
    }
    return result;
  }

  private getNeighbors(row: number, col: number): [number, number][] {
    const neighbors: [number, number][] = [];
    // Same row neighbors
    if (col > 0) neighbors.push([row, col - 1]);
    if (col < maxColsForRow(row) - 1) neighbors.push([row, col + 1]);

    // Adjacent rows
    const isOdd = row % 2 === 1;
    // For odd rows: neighbors in even rows are at (col, col+1)
    // For even rows: neighbors in odd rows are at (col-1, col)
    if (row > 0) {
      if (isOdd) {
        // Odd row -> even row above
        if (col < maxColsForRow(row - 1)) neighbors.push([row - 1, col]);
        if (col + 1 < maxColsForRow(row - 1)) neighbors.push([row - 1, col + 1]);
      } else {
        // Even row -> odd row above
        if (col - 1 >= 0) neighbors.push([row - 1, col - 1]);
        if (col < maxColsForRow(row - 1)) neighbors.push([row - 1, col]);
      }
    }
    if (row < this.maxRows - 1) {
      if (isOdd) {
        if (col < maxColsForRow(row + 1)) neighbors.push([row + 1, col]);
        if (col + 1 < maxColsForRow(row + 1)) neighbors.push([row + 1, col + 1]);
      } else {
        if (col - 1 >= 0) neighbors.push([row + 1, col - 1]);
        if (col < maxColsForRow(row + 1)) neighbors.push([row + 1, col]);
      }
    }
    return neighbors;
  }

  private findOrphans(): [number, number][] {
    // BFS from top row: any bubble connected to row 0 is anchored
    const anchored = new Set<string>();
    const queue: [number, number][] = [];

    // Seed from row 0
    for (let c = 0; c < maxColsForRow(0); c++) {
      if (this.grid[0][c]) {
        queue.push([0, c]);
        anchored.add(`0,${c}`);
      }
    }

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      for (const [nr, nc] of this.getNeighbors(r, c)) {
        const key = `${nr},${nc}`;
        if (anchored.has(key)) continue;
        if (this.grid[nr]?.[nc]) {
          anchored.add(key);
          queue.push([nr, nc]);
        }
      }
    }

    // Anything not anchored is an orphan
    const orphans: [number, number][] = [];
    for (let r = 0; r < this.maxRows; r++) {
      for (let c = 0; c < maxColsForRow(r); c++) {
        if (this.grid[r][c] && !anchored.has(`${r},${c}`)) {
          orphans.push([r, c]);
        }
      }
    }
    return orphans;
  }

  private isBoardEmpty(): boolean {
    for (let r = 0; r < this.maxRows; r++) {
      for (let c = 0; c < maxColsForRow(r); c++) {
        if (this.grid[r][c]) return false;
      }
    }
    return true;
  }

  private checkGameOver(): void {
    for (let r = 0; r < this.maxRows; r++) {
      for (let c = 0; c < maxColsForRow(r); c++) {
        if (!this.grid[r][c]) continue;
        const pos = gridToPixel(r, c, this.ceilingOffset);
        if (pos.y + BUBBLE_R >= DANGER_Y) {
          this.running = false;
          this.gameOver();
          return;
        }
      }
    }
  }

  private dropCeiling(): void {
    this.ceilingDropRows++;
    this.ceilingOffset = this.ceilingDropRows * ROW_HEIGHT;
    this.checkGameOver();
  }

  // ── Draw ─────────────────────────────────────────────────────────
  draw(): void {
    const ctx = this.ctx;

    // ── Header ──
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "3px";
    ctx.fillText("BUBBLE SHOOTER", WIDTH / 2, 22);
    ctx.restore();

    // Score display
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(this.score), 16, 44);

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("SCORE", 16, 22);

    // Shot counter
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`SHOTS: ${this.shotCount}`, WIDTH - 16, 22);

    // ── Danger line ──
    const dangerPulse = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    ctx.strokeStyle = `rgba(255, 50, 50, ${dangerPulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(10, DANGER_Y);
    ctx.lineTo(WIDTH - 10, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint "DANGER" text
    ctx.fillStyle = `rgba(255, 50, 50, ${dangerPulse * 0.6})`;
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("DANGER", WIDTH - 16, DANGER_Y - 5);

    // ── Grid bubbles ──
    for (let r = 0; r < this.maxRows; r++) {
      for (let c = 0; c < maxColsForRow(r); c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        const pos = gridToPixel(r, c, this.ceilingOffset);
        // Only draw if in visible area
        if (pos.y < GRID_TOP - BUBBLE_R * 2 || pos.y > DANGER_Y + BUBBLE_R * 2) continue;
        this.drawBubble(ctx, pos.x, pos.y, cell.colorIdx, 1, 1);
      }
    }

    // ── Pop animations ──
    for (const p of this.popAnims) {
      this.drawBubble(ctx, p.x, p.y, p.colorIdx, p.alpha, p.scale);
    }

    // ── Fall animations ──
    for (const f of this.fallAnims) {
      this.drawBubble(ctx, f.x, f.y, f.colorIdx, f.alpha, 1);
    }

    // ── Flying bubble ──
    if (this.flyingBubble) {
      this.drawBubble(ctx, this.flyingBubble.x, this.flyingBubble.y, this.flyingBubble.colorIdx, 1, 1);
    }

    // ── Aim line (dotted) ──
    if (!this.flyingBubble && this.running) {
      const cosA = Math.cos(this.aimAngle);
      const sinA = -Math.sin(this.aimAngle); // negative because canvas y is down
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);

      // Trace the aim line with wall bounces (for preview)
      const lineLen = 350;
      let lx = SHOOTER_X;
      let ly = SHOOTER_Y;
      let ldx = cosA;
      let ldy = sinA;

      ctx.beginPath();
      ctx.moveTo(lx, ly);

      let remaining = lineLen;
      while (remaining > 0) {
        // Find next wall hit or end
        let stepX = remaining;

        if (ldx < 0 && lx > BUBBLE_R) {
          stepX = (lx - BUBBLE_R) / Math.abs(ldx);
        } else if (ldx > 0 && lx < WIDTH - BUBBLE_R) {
          stepX = (WIDTH - BUBBLE_R - lx) / Math.abs(ldx);
        } else {
          stepX = remaining;
        }

        const step = Math.min(stepX, remaining);
        lx += ldx * step;
        ly += ldy * step;
        remaining -= step;

        ctx.lineTo(lx, ly);

        // If hit wall, bounce
        if (lx <= BUBBLE_R + 0.5 || lx >= WIDTH - BUBBLE_R - 0.5) {
          ldx = -ldx;
        }

        // If reached top, stop
        if (ly <= GRID_TOP + this.ceilingOffset) break;

        // Prevent infinite loop
        if (step < 0.1) break;
      }

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ── Shooter base ──
    ctx.save();
    // Shooter platform
    ctx.fillStyle = "rgba(100, 100, 140, 0.3)";
    ctx.beginPath();
    ctx.roundRect(SHOOTER_X - 40, SHOOTER_Y + 10, 80, 8, 4);
    ctx.fill();

    // Shooter arrow / triangle
    ctx.translate(SHOOTER_X, SHOOTER_Y);
    ctx.rotate(-this.aimAngle + Math.PI / 2);

    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#0e1525";
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Current bubble at shooter ──
    if (!this.flyingBubble && this.running) {
      this.drawBubble(ctx, SHOOTER_X, SHOOTER_Y, this.currentColor, 1, 1);
    }

    // ── Next bubble preview ──
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NEXT", SHOOTER_X + 60, SHOOTER_Y - 18);
    this.drawBubble(ctx, SHOOTER_X + 60, SHOOTER_Y, this.nextColor, 0.7, 0.7);

    // ── Side borders ──
    ctx.strokeStyle = "rgba(0, 212, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);
  }

  // ── Bubble rendering ─────────────────────────────────────────────
  private drawBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIdx: number,
    alpha: number,
    scale: number
  ): void {
    const color = BUBBLE_COLORS[colorIdx];
    const r = BUBBLE_R * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * scale;

    // Radial gradient fill
    const grad = ctx.createRadialGradient(
      x - r * 0.3,
      y - r * 0.3,
      r * 0.1,
      x,
      y,
      r
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, this.darkenColor(color, 0.5));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  }
}
