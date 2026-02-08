import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const W = 660, H = 900, BG = "#0a0c14";
const CW = 80, CH = 112;
const SP = 12;
const COL = CW + SP; // 92
const MX = 14, MY = 15;
const TAB_Y = MY + CH + 20;
const FDG = 18, FUG = 26;

const CONFIG = { id: "solitaire", width: W, height: H, fps: 60, backgroundColor: BG };

// 0=hearts 1=diamonds 2=spades 3=clubs
const SC = ["#ff2e97", "#ff6b6b", "#00d4ff", "#6c5ce7"];
const RED = [true, true, false, false];
const RK = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

interface Card { s: number; r: number; up: boolean; }
interface Drag {
  cards: Card[];
  src: string;
  offX: number; offY: number;
  mx: number; my: number;
  sx: number; sy: number;
}

export class SolitaireGame extends BaseGame {
  private stock: Card[] = [];
  private waste: Card[] = [];
  private fnd: Card[][] = [[], [], [], []];
  private tab: Card[][] = [[], [], [], [], [], [], []];
  private drag: Drag | null = null;
  private pm = false;
  private moves = 0;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) { super(canvas, CONFIG, cb); }
  init(): void { this.deal(); }
  reset(): void { this.deal(); }

  private deal(): void {
    const d: Card[] = [];
    for (let s = 0; s < 4; s++)
      for (let r = 1; r <= 13; r++)
        d.push({ s, r, up: false });
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    this.tab = [[], [], [], [], [], [], []];
    let idx = 0;
    for (let c = 0; c < 7; c++)
      for (let row = 0; row <= c; row++) {
        const card = d[idx++];
        card.up = row === c;
        this.tab[c].push(card);
      }
    this.stock = d.slice(idx).reverse();
    this.waste = [];
    this.fnd = [[], [], [], []];
    this.drag = null;
    this.moves = 0;
    this.setScore(0);
  }

  private tx(i: number) { return MX + i * COL; }
  private fx(i: number) { return MX + (3 + i) * COL; }
  private tcY(ci: number, j: number) {
    let y = TAB_Y;
    for (let i = 0; i < j; i++) y += this.tab[ci][i].up ? FUG : FDG;
    return y;
  }

  private canTab(card: Card, col: number): boolean {
    const c = this.tab[col];
    if (c.length === 0) return card.r === 13;
    const t = c[c.length - 1];
    return t.up && RED[card.s] !== RED[t.s] && card.r === t.r - 1;
  }

  private canFnd(card: Card, fi: number): boolean {
    const p = this.fnd[fi];
    if (p.length === 0) return card.r === 1;
    const t = p[p.length - 1];
    return card.s === t.s && card.r === t.r + 1;
  }

  private flipTops(): void {
    for (const c of this.tab)
      if (c.length > 0 && !c[c.length - 1].up) c[c.length - 1].up = true;
  }

  private returnCards(): void {
    if (!this.drag) return;
    const s = this.drag.src;
    if (s === "w") this.waste.push(...this.drag.cards);
    else if (s[0] === "f") this.fnd[+s[1]].push(...this.drag.cards);
    else if (s[0] === "t") this.tab[+s[1]].push(...this.drag.cards);
  }

  update(dt: number): void {
    const m = this.input.getMousePosition();
    const down = this.input.isMouseDown(0);
    const jd = down && !this.pm;
    const ju = !down && this.pm;
    this.pm = down;

    // ── Dragging ──
    if (this.drag) {
      this.drag.mx = m.x; this.drag.my = m.y;
      if (!ju) return;

      const dist = Math.hypot(m.x - this.drag.sx, m.y - this.drag.sy);
      const fc = this.drag.cards[0];
      let placed = false;

      // Click (small drag) → auto-move to foundation
      if (dist < 5 && this.drag.cards.length === 1) {
        for (let i = 0; i < 4; i++) {
          if (this.canFnd(fc, i)) {
            this.fnd[i].push(fc); placed = true; break;
          }
        }
      }

      // Try drop on foundations
      if (!placed && this.drag.cards.length === 1) {
        for (let i = 0; i < 4; i++) {
          const x = this.fx(i);
          if (m.x >= x && m.x < x + CW && m.y >= MY && m.y < MY + CH && this.canFnd(fc, i)) {
            this.fnd[i].push(fc); placed = true; break;
          }
        }
      }

      // Try drop on tableau
      if (!placed) {
        for (let c = 0; c < 7; c++) {
          const x = this.tx(c);
          const col = this.tab[c];
          const bot = col.length === 0 ? TAB_Y + CH : this.tcY(c, col.length - 1) + CH;
          if (m.x >= x && m.x < x + CW && m.y >= TAB_Y - 10 && m.y < bot + 30 && this.canTab(fc, c)) {
            this.tab[c].push(...this.drag.cards); placed = true; break;
          }
        }
      }

      if (placed) { this.moves++; this.setScore(this.score + (this.drag.src[0] === "t" ? 5 : 15)); this.flipTops(); }
      else this.returnCards();
      this.drag = null;
      if (this.fnd.every(f => f.length === 13)) this.gameOver();
      return;
    }

    if (!jd) return;

    // ── Stock click ──
    if (m.x >= MX && m.x < MX + CW && m.y >= MY && m.y < MY + CH) {
      if (this.stock.length > 0) {
        const c = this.stock.pop()!; c.up = true; this.waste.push(c);
      } else if (this.waste.length > 0) {
        this.stock = this.waste.reverse().map(c => ({ ...c, up: false }));
        this.waste = [];
      }
      return;
    }

    // ── Waste drag ──
    if (this.waste.length > 0 && m.x >= MX + COL && m.x < MX + COL + CW && m.y >= MY && m.y < MY + CH) {
      this.drag = { cards: [this.waste.pop()!], src: "w", offX: m.x - (MX + COL), offY: m.y - MY, mx: m.x, my: m.y, sx: m.x, sy: m.y };
      return;
    }

    // ── Foundation drag ──
    for (let i = 0; i < 4; i++) {
      const x = this.fx(i);
      if (this.fnd[i].length > 0 && m.x >= x && m.x < x + CW && m.y >= MY && m.y < MY + CH) {
        this.drag = { cards: [this.fnd[i].pop()!], src: `f${i}`, offX: m.x - x, offY: m.y - MY, mx: m.x, my: m.y, sx: m.x, sy: m.y };
        return;
      }
    }

    // ── Tableau drag ──
    for (let c = 0; c < 7; c++) {
      const x = this.tx(c);
      if (m.x < x || m.x >= x + CW) continue;
      for (let j = this.tab[c].length - 1; j >= 0; j--) {
        const cy = this.tcY(c, j);
        const h = j === this.tab[c].length - 1 ? CH : (this.tab[c][j].up ? FUG : FDG);
        if (m.y >= cy && m.y < cy + h && this.tab[c][j].up) {
          this.drag = { cards: this.tab[c].splice(j), src: `t${c}`, offX: m.x - x, offY: m.y - cy, mx: m.x, my: m.y, sx: m.x, sy: m.y };
          return;
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  //  DRAW
  // ═══════════════════════════════════════════

  draw(): void {
    const ctx = this.ctx;

    // Stock
    if (this.stock.length > 0) this.drawBack(ctx, MX, MY);
    else this.drawSlot(ctx, MX, MY, "↻");

    // Waste
    if (this.waste.length > 0) this.drawFace(ctx, this.waste[this.waste.length - 1], MX + COL, MY);

    // Foundations
    for (let i = 0; i < 4; i++) {
      const x = this.fx(i);
      if (this.fnd[i].length > 0) this.drawFace(ctx, this.fnd[i][this.fnd[i].length - 1], x, MY);
      else this.drawSlot(ctx, x, MY);
    }

    // Tableau
    for (let c = 0; c < 7; c++) {
      const x = this.tx(c);
      if (this.tab[c].length === 0) { this.drawSlot(ctx, x, TAB_Y); continue; }
      for (let j = 0; j < this.tab[c].length; j++) {
        const cy = this.tcY(c, j);
        if (this.tab[c][j].up) this.drawFace(ctx, this.tab[c][j], x, cy);
        else this.drawBack(ctx, x, cy);
      }
    }

    // Dragged cards
    if (this.drag) {
      const dx = this.drag.mx - this.drag.offX;
      const dy = this.drag.my - this.drag.offY;
      for (let i = 0; i < this.drag.cards.length; i++)
        this.drawFace(ctx, this.drag.cards[i], dx, dy + i * FUG, true);
    }

    // UI
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`MOVES  ${this.moves}`, 20, H - 18);
    ctx.textAlign = "right";
    ctx.fillText(`SCORE  ${this.score}`, W - 20, H - 18);
  }

  // ─── Card Face ─────────────────────────────

  private drawFace(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, glow = false) {
    const color = SC[card.s];

    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 18; }

    // Body
    const g = ctx.createLinearGradient(x, y, x, y + CH);
    g.addColorStop(0, "#1e1e3a");
    g.addColorStop(1, "#141428");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 8); ctx.fill();

    // Border
    ctx.strokeStyle = glow ? color : `${color}50`;
    ctx.lineWidth = glow ? 2 : 1;
    ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 8); ctx.stroke();
    ctx.shadowBlur = 0;

    // Top highlight
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x + 4, y + 2, CW - 8, 28);

    // ── Top-left rank + suit ──
    ctx.fillStyle = color;
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(RK[card.r], x + 7, y + 20);
    this.drawSuit(ctx, card.s, x + 14, y + 34, 7);

    // ── Bottom-right rank + suit ──
    ctx.fillStyle = color;
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(RK[card.r], x + CW - 7, y + CH - 10);
    this.drawSuit(ctx, card.s, x + CW - 14, y + CH - 34, 7);

    // ── Center ──
    if (card.r >= 11) {
      // Face card: decorative borders + letter
      ctx.strokeStyle = `${color}18`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x + 8, y + 8, CW - 16, CH - 16, 5); ctx.stroke();
      ctx.strokeStyle = `${color}10`;
      ctx.beginPath(); ctx.roundRect(x + 12, y + 12, CW - 24, CH - 24, 3); ctx.stroke();

      ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.font = "bold 32px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(RK[card.r], x + CW / 2, y + CH / 2 + 4);
      ctx.shadowBlur = 0;
      this.drawSuit(ctx, card.s, x + CW / 2, y + CH / 2 + 22, 8);
    } else if (card.r === 1) {
      // Ace: large glowing suit
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      this.drawSuit(ctx, card.s, x + CW / 2, y + CH / 2, 24);
      ctx.shadowBlur = 0;
    } else {
      // Number cards: center suit
      ctx.shadowColor = color; ctx.shadowBlur = 6;
      this.drawSuit(ctx, card.s, x + CW / 2, y + CH / 2, 16);
      ctx.shadowBlur = 0;
    }
  }

  // ─── Card Back ─────────────────────────────

  private drawBack(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const g = ctx.createLinearGradient(x, y, x, y + CH);
    g.addColorStop(0, "#181834");
    g.addColorStop(1, "#101028");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 8); ctx.fill();

    ctx.strokeStyle = "rgba(108,92,231,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 8); ctx.stroke();

    // Inner border
    ctx.strokeStyle = "rgba(108,92,231,0.18)";
    ctx.beginPath(); ctx.roundRect(x + 5, y + 5, CW - 10, CH - 10, 5); ctx.stroke();

    // Diamond grid
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x + 6, y + 6, CW - 12, CH - 12, 4); ctx.clip();
    ctx.strokeStyle = "rgba(108,92,231,0.1)";
    ctx.lineWidth = 0.8;
    for (let py = y + 8; py <= y + CH - 8; py += 10) {
      for (let px = x + 8; px <= x + CW - 8; px += 10) {
        ctx.beginPath();
        ctx.moveTo(px, py - 4); ctx.lineTo(px + 4, py);
        ctx.lineTo(px, py + 4); ctx.lineTo(px - 4, py);
        ctx.closePath(); ctx.stroke();
      }
    }
    ctx.restore();

    // Center emblem
    const cx = x + CW / 2, cy = y + CH / 2;
    ctx.strokeStyle = "rgba(108,92,231,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18); ctx.lineTo(cx + 13, cy);
    ctx.lineTo(cx, cy + 18); ctx.lineTo(cx - 13, cy);
    ctx.closePath(); ctx.stroke();

    ctx.strokeStyle = "rgba(108,92,231,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 7, cy);
    ctx.closePath(); ctx.stroke();
  }

  // ─── Empty Slot ────────────────────────────

  private drawSlot(ctx: CanvasRenderingContext2D, x: number, y: number, label?: string) {
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 8); ctx.stroke();
    ctx.setLineDash([]);
    if (label) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "20px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x + CW / 2, y + CH / 2 + 7);
    }
  }

  // ─── Suit Symbols (Vector) ─────────────────

  private drawSuit(ctx: CanvasRenderingContext2D, suit: number, cx: number, cy: number, s: number) {
    ctx.fillStyle = SC[suit];
    switch (suit) {
      case 0: this.drawHeart(ctx, cx, cy, s); break;
      case 1: this.drawDiam(ctx, cx, cy, s); break;
      case 2: this.drawSpade(ctx, cx, cy, s); break;
      case 3: this.drawClub(ctx, cx, cy, s); break;
    }
  }

  private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.55);
    ctx.bezierCurveTo(cx - s * 1.0, cy + s * 0.05, cx - s * 0.65, cy - s * 0.8, cx, cy - s * 0.25);
    ctx.bezierCurveTo(cx + s * 0.65, cy - s * 0.8, cx + s * 1.0, cy + s * 0.05, cx, cy + s * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  private drawDiam(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.8);
    ctx.lineTo(cx + s * 0.5, cy);
    ctx.lineTo(cx, cy + s * 0.8);
    ctx.lineTo(cx - s * 0.5, cy);
    ctx.closePath();
    ctx.fill();
  }

  private drawSpade(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.7);
    ctx.bezierCurveTo(cx - s * 1.0, cy - s * 0.05, cx - s * 0.6, cy + s * 0.65, cx - s * 0.1, cy + s * 0.15);
    ctx.lineTo(cx, cy + s * 0.15);
    ctx.lineTo(cx + s * 0.1, cy + s * 0.15);
    ctx.bezierCurveTo(cx + s * 0.6, cy + s * 0.65, cx + s * 1.0, cy - s * 0.05, cx, cy - s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - s * 0.1, cy + s * 0.1, s * 0.2, s * 0.45);
  }

  private drawClub(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    const r = s * 0.28;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 1.3, r, 0, Math.PI * 2);
    ctx.arc(cx - r * 1.15, cy + r * 0.25, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 1.15, cy + r * 0.25, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - s * 0.1, cy + r * 0.1, s * 0.2, s * 0.45);
  }
}
