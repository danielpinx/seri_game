import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 560;
const HEIGHT = 620;
const BG = "#0a0c14";

const CONFIG = {
  id: "sokoban",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

// Standard Sokoban encoding:
// '#' wall, ' ' floor, '.' target, '$' box, '@' player, '+' player on target, '*' box on target
const LEVELS: string[][] = [
  // Level 1 - Trivial intro
  [
    "  ####  ",
    "###  ###",
    "#  .$ .#",
    "# $@$  #",
    "#  .# ##",
    "########",
  ],
  // Level 2
  [
    "  ####  ",
    "###  ###",
    "#.  $  #",
    "#  $@$ #",
    "#  .#.##",
    "########",
  ],
  // Level 3
  [
    "#####   ",
    "#   ## #",
    "# $  # #",
    "##$ .#.#",
    " # @   #",
    " #  ####",
    " ####   ",
  ],
  // Level 4
  [
    "  ######",
    "###    #",
    "#  # # #",
    "# .$. .#",
    "#  $$ ##",
    "## @  # ",
    " ######",
  ],
  // Level 5
  [
    "#######",
    "#     #",
    "#.$$$.#",
    "#.$@$.#",
    "#.$$$.#",
    "#     #",
    "#######",
  ],
  // Level 6
  [
    "  ####  ",
    "  #  #  ",
    "  #  #  ",
    "###$ ###",
    "#  $ . #",
    "# @$.  #",
    "#   ####",
    "#####   ",
  ],
  // Level 7
  [
    " ###### ",
    "##    ##",
    "# $ $  #",
    "# .@.  #",
    "##$ $ ##",
    " #...# ",
    " #   # ",
    " ##### ",
  ],
  // Level 8
  [
    "########",
    "#  #   #",
    "# $$ # #",
    "#  ...@#",
    "# $$# ##",
    "#  ...# ",
    "##   ## ",
    " #####  ",
  ],
  // Level 9
  [
    "   #### ",
    "####  # ",
    "#  $  # ",
    "#  .$.##",
    "## .@  #",
    " #$  $ #",
    " #  .###",
    " #####  ",
  ],
  // Level 10
  [
    "  ######",
    "###    #",
    "# $  $ #",
    "# .##. #",
    "# .  . #",
    "##$  $##",
    " # @@ #",
    " ######",
  ],
  // Level 11
  [
    "#####   ",
    "#   ##  ",
    "# # $## ",
    "#   $ ##",
    "##.#$  #",
    " #.  @ #",
    " #. ####",
    " ####   ",
  ],
  // Level 12
  [
    "  ######",
    "  #    #",
    "### ## #",
    "# $  $ #",
    "# .$.  #",
    "# @$# ##",
    "# .  #  ",
    "######  ",
  ],
  // Level 13
  [
    " ####   ",
    " #  ### ",
    "## .  # ",
    "# .$$ # ",
    "#  .$ ##",
    "## .  @#",
    " # $ ###",
    " #####  ",
  ],
  // Level 14
  [
    "#######  ",
    "#     #  ",
    "#.$$$.## ",
    "# #@#  # ",
    "# $.$  # ",
    "#  .  ## ",
    "#######  ",
  ],
  // Level 15
  [
    "  ####   ",
    "  #  ### ",
    "### $  # ",
    "# $  # # ",
    "# .$.  # ",
    "##.@.###",
    " # $ #  ",
    " #####  ",
  ],
  // Level 16
  [
    "########",
    "#      #",
    "# #### #",
    "# #..# #",
    "# $  $ #",
    "#  @$  #",
    "# #..# #",
    "########",
  ],
  // Level 17
  [
    "  #####  ",
    "  #   #  ",
    "###$# ## ",
    "# $  $ # ",
    "# ..@. # ",
    "## # $## ",
    " #   #   ",
    " #####   ",
  ],
  // Level 18
  [
    "#######  ",
    "#  .  ## ",
    "# #$.  # ",
    "#  $@$ # ",
    "## .$.## ",
    " ##   #  ",
    "  #####  ",
  ],
  // Level 19
  [
    "  ######",
    "###    #",
    "# $ #  #",
    "# $ .. #",
    "#   ## #",
    "## $  .#",
    " #  @###",
    " #####  ",
  ],
  // Level 20
  [
    " ########",
    " #  . . #",
    "## #$$# #",
    "#  $ @  #",
    "#  .$$. #",
    "## #  ###",
    " # . #   ",
    " ######  ",
  ],
  // Level 21
  [
    "  ####   ",
    "###  ### ",
    "#  $   # ",
    "# #.## # ",
    "# @$.. # ",
    "## $$ ## ",
    " # . #   ",
    " #####   ",
  ],
  // Level 22
  [
    "#########",
    "#   #   #",
    "# $ . $ #",
    "#  .@.  #",
    "# $ . $ #",
    "#   #   #",
    "#########",
  ],
  // Level 23
  [
    "  ####  ",
    " ##  ## ",
    "## $  ##",
    "#  .@. #",
    "# $.#$ #",
    "##  . ##",
    " ##  ## ",
    "  ####  ",
  ],
  // Level 24
  [
    "  ##### ",
    "###   # ",
    "# $ # ##",
    "# . $  #",
    "# .$@$.#",
    "#  $ . #",
    "## # $ #",
    " #   ###",
    " ##### ",
  ],
  // Level 25
  [
    "#########",
    "#.  #   #",
    "#.$$  $ #",
    "#.  # $ #",
    "#.  @ $ #",
    "#. ##$$ #",
    "#.  #   #",
    "#########",
  ],
];

interface Pos {
  r: number;
  c: number;
}

interface MoveRecord {
  playerFrom: Pos;
  playerTo: Pos;
  boxFrom: Pos | null;
  boxTo: Pos | null;
}

interface AnimState {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  progress: number; // 0 to 1
}

export class SokobanGame extends BaseGame {
  private levelIndex = 0;
  private walls: boolean[][] = [];
  private targets: boolean[][] = [];
  private boxes: boolean[][] = [];
  private player: Pos = { r: 0, c: 0 };
  private rows = 0;
  private cols = 0;
  private cellSize = 0;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private moves = 0;
  private pushes = 0;
  private history: MoveRecord[] = [];

  // Animation
  private playerAnim: AnimState | null = null;
  private boxAnim: AnimState | null = null;
  private animDuration = 100; // ms
  private animTimer = 0;

  // Level complete
  private levelCompleteTimer = 0;
  private levelCompleteShow = false;
  private flashTimer = 0;

  // Player pulse
  private pulseTimer = 0;

  // All levels beaten
  private allComplete = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.levelIndex = 0;
    this.setScore(0);
    this.allComplete = false;
    this.loadLevel(this.levelIndex);
  }

  reset(): void {
    this.levelIndex = 0;
    this.setScore(0);
    this.allComplete = false;
    this.loadLevel(this.levelIndex);
  }

  private loadLevel(index: number): void {
    if (index >= LEVELS.length) {
      this.allComplete = true;
      this.gameOver();
      return;
    }

    const level = LEVELS[index];
    this.rows = level.length;
    this.cols = Math.max(...level.map((r) => r.length));

    this.walls = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.targets = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.boxes = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const ch = c < level[r].length ? level[r][c] : " ";
        switch (ch) {
          case "#":
            this.walls[r][c] = true;
            break;
          case ".":
            this.targets[r][c] = true;
            break;
          case "$":
            this.boxes[r][c] = true;
            break;
          case "@":
            this.player = { r, c };
            break;
          case "+": // player on target
            this.player = { r, c };
            this.targets[r][c] = true;
            break;
          case "*": // box on target
            this.boxes[r][c] = true;
            this.targets[r][c] = true;
            break;
        }
      }
    }

    // Calculate cell size to fit grid area
    const gridAreaW = WIDTH - 40; // 20px padding each side
    const gridAreaH = HEIGHT - 140; // top UI + bottom hints
    const maxCellW = Math.floor(gridAreaW / this.cols);
    const maxCellH = Math.floor(gridAreaH / this.rows);
    this.cellSize = Math.min(maxCellW, maxCellH, 60);

    const totalW = this.cols * this.cellSize;
    const totalH = this.rows * this.cellSize;
    this.gridOffsetX = (WIDTH - totalW) / 2;
    this.gridOffsetY = 80 + (gridAreaH - totalH) / 2;

    this.moves = 0;
    this.pushes = 0;
    this.history = [];
    this.playerAnim = null;
    this.boxAnim = null;
    this.animTimer = 0;
    this.levelCompleteTimer = 0;
    this.levelCompleteShow = false;
    this.flashTimer = 0;
  }

  private isWall(r: number, c: number): boolean {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
    return this.walls[r][c];
  }

  private isBox(r: number, c: number): boolean {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    return this.boxes[r][c];
  }

  private tryMove(dr: number, dc: number): void {
    if (this.animTimer > 0 || this.levelCompleteShow) return;

    const nr = this.player.r + dr;
    const nc = this.player.c + dc;

    if (this.isWall(nr, nc)) return;

    let boxFrom: Pos | null = null;
    let boxTo: Pos | null = null;

    if (this.isBox(nr, nc)) {
      const br = nr + dr;
      const bc = nc + dc;
      if (this.isWall(br, bc) || this.isBox(br, bc)) return;

      // Push box
      boxFrom = { r: nr, c: nc };
      boxTo = { r: br, c: bc };
      this.boxes[nr][nc] = false;
      this.boxes[br][bc] = true;
      this.pushes++;

      this.boxAnim = {
        fromR: nr,
        fromC: nc,
        toR: br,
        toC: bc,
        progress: 0,
      };
    }

    const record: MoveRecord = {
      playerFrom: { ...this.player },
      playerTo: { r: nr, c: nc },
      boxFrom,
      boxTo,
    };
    this.history.push(record);

    // Animate player
    this.playerAnim = {
      fromR: this.player.r,
      fromC: this.player.c,
      toR: nr,
      toC: nc,
      progress: 0,
    };
    this.animTimer = this.animDuration;

    this.player = { r: nr, c: nc };
    this.moves++;

    // Check win after move
    if (this.checkWin()) {
      const levelScore = Math.max(100, 1000 - this.moves * 5);
      this.setScore(this.score + levelScore);
      this.levelCompleteShow = true;
      this.levelCompleteTimer = 2000;
      this.flashTimer = 600;
    }
  }

  private undo(): void {
    if (this.history.length === 0 || this.levelCompleteShow) return;
    if (this.animTimer > 0) return;

    const record = this.history.pop()!;

    this.player = { ...record.playerFrom };
    this.moves--;

    if (record.boxFrom && record.boxTo) {
      this.boxes[record.boxTo.r][record.boxTo.c] = false;
      this.boxes[record.boxFrom.r][record.boxFrom.c] = true;
      this.pushes--;
    }
  }

  private resetLevel(): void {
    if (this.levelCompleteShow) return;
    this.loadLevel(this.levelIndex);
  }

  private checkWin(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.targets[r][c] && !this.boxes[r][c]) return false;
      }
    }
    return true;
  }

  update(dt: number): void {
    this.pulseTimer += dt;

    // Update animation
    if (this.animTimer > 0) {
      this.animTimer -= dt;
      if (this.animTimer <= 0) {
        this.animTimer = 0;
        this.playerAnim = null;
        this.boxAnim = null;
      } else {
        const progress = 1 - this.animTimer / this.animDuration;
        if (this.playerAnim) this.playerAnim.progress = progress;
        if (this.boxAnim) this.boxAnim.progress = progress;
      }
    }

    // Level complete timer
    if (this.levelCompleteShow) {
      this.flashTimer -= dt;
      this.levelCompleteTimer -= dt;
      if (this.levelCompleteTimer <= 0) {
        this.levelCompleteShow = false;
        this.levelIndex++;
        this.loadLevel(this.levelIndex);
      }
      return;
    }

    // Input
    if (this.input.isKeyJustPressed("ArrowUp")) this.tryMove(-1, 0);
    else if (this.input.isKeyJustPressed("ArrowDown")) this.tryMove(1, 0);
    else if (this.input.isKeyJustPressed("ArrowLeft")) this.tryMove(0, -1);
    else if (this.input.isKeyJustPressed("ArrowRight")) this.tryMove(0, 1);
    else if (this.input.isKeyJustPressed("KeyZ")) this.undo();
    else if (this.input.isKeyJustPressed("KeyR")) this.resetLevel();
  }

  draw(): void {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const ox = this.gridOffsetX;
    const oy = this.gridOffsetY;

    // -- Top UI --
    ctx.textBaseline = "alphabetic";

    // Title
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 8;
    ctx.fillText("SOKOBAN", 20, 30);
    ctx.shadowBlur = 0;

    // Level
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Level ${this.levelIndex + 1} / ${LEVELS.length}`, WIDTH / 2, 24);

    // Moves
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText(`${this.moves}`, WIDTH / 2 - 40, 48);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("MOVES", WIDTH / 2 - 40, 62);

    // Pushes
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText(`${this.pushes}`, WIDTH / 2 + 40, 48);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("PUSHES", WIDTH / 2 + 40, 62);

    // Score
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("SCORE", WIDTH - 20, 24);
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(`${this.score}`, WIDTH - 20, 48);

    // -- Grid --
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = ox + c * cs;
        const y = oy + r * cs;

        if (this.walls[r][c]) {
          // Wall with 3D bevel
          this.drawWall(ctx, x, y, cs);
        } else if (this.isFloorOrTarget(r, c)) {
          // Floor: subtle grid line
          ctx.strokeStyle = "rgba(255,255,255,0.04)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cs, cs);

          // Target marker
          if (this.targets[r][c]) {
            this.drawTarget(ctx, x, y, cs);
          }
        }
      }
    }

    // -- Boxes (skip animating box, draw it separately) --
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.boxes[r][c]) continue;

        // Skip if this box is being animated
        if (
          this.boxAnim &&
          this.boxAnim.toR === r &&
          this.boxAnim.toC === c &&
          this.animTimer > 0
        ) {
          continue;
        }

        const x = ox + c * cs;
        const y = oy + r * cs;
        const onTarget = this.targets[r][c];
        this.drawBox(ctx, x, y, cs, onTarget);
      }
    }

    // Animated box
    if (this.boxAnim && this.animTimer > 0) {
      const ba = this.boxAnim;
      const t = this.easeOut(ba.progress);
      const bx = ox + (ba.fromC + (ba.toC - ba.fromC) * t) * cs;
      const by = oy + (ba.fromR + (ba.toR - ba.fromR) * t) * cs;
      const onTarget = this.targets[ba.toR][ba.toC];
      this.drawBox(ctx, bx, by, cs, onTarget);
    }

    // -- Player --
    if (this.playerAnim && this.animTimer > 0) {
      const pa = this.playerAnim;
      const t = this.easeOut(pa.progress);
      const px = ox + (pa.fromC + (pa.toC - pa.fromC) * t) * cs + cs / 2;
      const py = oy + (pa.fromR + (pa.toR - pa.fromR) * t) * cs + cs / 2;
      this.drawPlayer(ctx, px, py, cs);
    } else {
      const px = ox + this.player.c * cs + cs / 2;
      const py = oy + this.player.r * cs + cs / 2;
      this.drawPlayer(ctx, px, py, cs);
    }

    // -- Level complete overlay --
    if (this.levelCompleteShow) {
      this.drawLevelComplete(ctx);
    }

    // -- Bottom hint --
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Z: Undo  |  R: Reset  |  Arrows: Move", WIDTH / 2, HEIGHT - 14);
  }

  private isFloorOrTarget(r: number, c: number): boolean {
    // Check if this cell is reachable (not outer void)
    // A simple check: if it's not a wall, check if surrounded by at least one wall or another floor neighbor
    // For simplicity, consider it a floor if it's within the bounding box of the level and not space outside walls
    if (this.walls[r][c]) return false;
    // Check if this cell is inside the level (not the outer void)
    return this.isCellInside(r, c);
  }

  private isCellInside(r: number, c: number): boolean {
    // Flood fill from player would be ideal, but for performance we do a simple check:
    // A cell is "inside" if we can trace horizontally to find walls on both sides
    let leftWall = false;
    let rightWall = false;
    for (let cc = c - 1; cc >= 0; cc--) {
      if (this.walls[r][cc]) { leftWall = true; break; }
    }
    for (let cc = c + 1; cc < this.cols; cc++) {
      if (this.walls[r][cc]) { rightWall = true; break; }
    }
    if (!leftWall || !rightWall) return false;

    let topWall = false;
    let bottomWall = false;
    for (let rr = r - 1; rr >= 0; rr--) {
      if (this.walls[rr][c]) { topWall = true; break; }
    }
    for (let rr = r + 1; rr < this.rows; rr++) {
      if (this.walls[rr][c]) { bottomWall = true; break; }
    }
    return topWall && bottomWall;
  }

  private drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number): void {
    const pad = 1;

    // Main wall body
    ctx.fillStyle = "#1a1c2e";
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2, 3);
    ctx.fill();

    // Top-left highlight (bevel light)
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(x + pad, y + pad, cs - pad * 2, 2);
    ctx.fillRect(x + pad, y + pad, 2, cs - pad * 2);

    // Bottom-right shadow (bevel dark)
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x + pad, y + cs - pad - 2, cs - pad * 2, 2);
    ctx.fillRect(x + cs - pad - 2, y + pad, 2, cs - pad * 2);

    // Subtle border
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2, 3);
    ctx.stroke();
  }

  private drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number): void {
    const cx = x + cs / 2;
    const cy = y + cs / 2;
    const r = cs * 0.2;

    ctx.save();
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 10;

    // Diamond shape
    ctx.fillStyle = "rgba(255,215,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();

    // Inner dot
    ctx.fillStyle = "rgba(255,215,0,0.6)";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cs: number,
    onTarget: boolean
  ): void {
    const pad = cs * 0.1;
    const bx = x + pad;
    const by = y + pad;
    const bw = cs - pad * 2;
    const bh = cs - pad * 2;

    ctx.save();

    const color = onTarget ? "#4ade80" : "#00d4ff";
    const bgColor = onTarget ? "rgba(74,222,128,0.15)" : "rgba(0,212,255,0.1)";

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = onTarget ? 14 : 6;

    // Box fill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.fill();

    // Box border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Cross detail on box
    const cx = x + cs / 2;
    const cy = y + cs / 2;
    const detailSize = bw * 0.25;
    ctx.strokeStyle = onTarget ? "rgba(74,222,128,0.4)" : "rgba(0,212,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - detailSize, cy - detailSize);
    ctx.lineTo(cx + detailSize, cy + detailSize);
    ctx.moveTo(cx + detailSize, cy - detailSize);
    ctx.lineTo(cx - detailSize, cy + detailSize);
    ctx.stroke();

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, cs: number): void {
    const radius = cs * 0.3;

    // Pulse
    const pulse = Math.sin(this.pulseTimer / 400) * 0.08 + 1;
    const r = radius * pulse;

    ctx.save();

    // Outer glow
    ctx.shadowColor = "#ff6b9d";
    ctx.shadowBlur = 15;

    // Body
    ctx.fillStyle = "#ff6b9d";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Inner highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Border ring
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawLevelComplete(ctx: CanvasRenderingContext2D): void {
    // Flash effect
    if (this.flashTimer > 0) {
      const alpha = Math.max(0, this.flashTimer / 600) * 0.3;
      ctx.fillStyle = `rgba(74,222,128,${alpha})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Overlay
    ctx.fillStyle = "rgba(10,12,20,0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Message
    ctx.save();
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Level ${this.levelIndex + 1} Complete!`, WIDTH / 2, HEIGHT / 2 - 20);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(
      `Moves: ${this.moves}  |  Pushes: ${this.pushes}  |  +${Math.max(100, 1000 - this.moves * 5)} pts`,
      WIDTH / 2,
      HEIGHT / 2 + 20
    );

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px Inter, sans-serif";
    if (this.levelIndex + 1 < LEVELS.length) {
      ctx.fillText("Next level starting...", WIDTH / 2, HEIGHT / 2 + 50);
    } else {
      ctx.fillText("All levels complete!", WIDTH / 2, HEIGHT / 2 + 50);
    }
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
}
