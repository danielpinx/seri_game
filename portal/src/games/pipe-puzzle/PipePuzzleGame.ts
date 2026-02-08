import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

const WIDTH = 520;
const HEIGHT = 640;
const BG = "#0a0c14";

const CONFIG = {
  id: "pipe-puzzle",
  width: WIDTH,
  height: HEIGHT,
  fps: 60,
  backgroundColor: BG,
};

// Directions: 0=top, 1=right, 2=bottom, 3=left
const DIR_TOP = 0;
const DIR_RIGHT = 1;
const DIR_BOTTOM = 2;
const DIR_LEFT = 3;

const DX = [0, 1, 0, -1]; // col offsets for top, right, bottom, left
const DY = [-1, 0, 1, 0]; // row offsets

function oppositeDir(d: number): number {
  return (d + 2) % 4;
}

// Pipe type definitions: each is an array of connected directions
// Stored as base orientation; rotation shifts directions
type PipeType = "straight" | "elbow" | "tee" | "cross" | "dead";

interface PipeTypeInfo {
  baseDirs: number[]; // connected directions at rotation=0
}

const PIPE_TYPES: Record<PipeType, PipeTypeInfo> = {
  straight: { baseDirs: [DIR_LEFT, DIR_RIGHT] },
  elbow: { baseDirs: [DIR_TOP, DIR_RIGHT] },
  tee: { baseDirs: [DIR_TOP, DIR_RIGHT, DIR_BOTTOM] },
  cross: { baseDirs: [DIR_TOP, DIR_RIGHT, DIR_BOTTOM, DIR_LEFT] },
  dead: { baseDirs: [DIR_RIGHT] },
};

function rotateDir(d: number, rotations: number): number {
  return (d + rotations) % 4;
}

function getConnectedDirs(type: PipeType, rotation: number): number[] {
  return PIPE_TYPES[type].baseDirs.map((d) => rotateDir(d, rotation));
}

interface Cell {
  type: PipeType;
  rotation: number; // 0-3, number of 90-degree clockwise rotations
  isSource: boolean;
  isDrain: boolean;
  connected: boolean;
  animRotation: number; // current visual rotation (for smooth animation)
  targetRotation: number; // cumulative target rotation (can exceed 3)
  flowProgress: number; // 0-1, for flow animation
  flowOrder: number; // order in which flow reaches this cell
}

export class PipePuzzleGame extends BaseGame {
  private grid: Cell[][] = [];
  private gridSize = 5;
  private cellSize = 0;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private level = 1;
  private clicks = 0;
  private parClicks = 0;
  private totalScore = 0;
  private solved = false;
  private wasMouseDown = false;
  private hoverCol = -1;
  private hoverRow = -1;
  private sourceRow = 0;
  private sourceCol = 0;
  private drainRow = 0;
  private drainCol = 0;
  private flowAnimating = false;
  private flowAnimStart = 0;
  private maxFlowOrder = 0;
  private levelCompleteTimer = 0;
  private particleTime = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(canvas, CONFIG, callbacks);
  }

  init(): void {
    this.level = 1;
    this.totalScore = 0;
    this.setScore(0);
    this.startLevel();
  }

  private getGridSize(): number {
    if (this.level <= 3) return 5;
    if (this.level <= 6) return 6;
    return 7;
  }

  private startLevel(): void {
    this.gridSize = this.getGridSize();
    this.solved = false;
    this.flowAnimating = false;
    this.clicks = 0;
    this.levelCompleteTimer = 0;

    // Calculate cell size and offsets to center the grid
    const topAreaHeight = 60;
    const bottomAreaHeight = 50;
    const availableWidth = WIDTH - 40;
    const availableHeight = HEIGHT - topAreaHeight - bottomAreaHeight - 20;
    this.cellSize = Math.floor(
      Math.min(availableWidth / this.gridSize, availableHeight / this.gridSize)
    );
    this.gridOffsetX = Math.floor(
      (WIDTH - this.cellSize * this.gridSize) / 2
    );
    this.gridOffsetY = Math.floor(
      topAreaHeight +
        (availableHeight - this.cellSize * this.gridSize) / 2
    );

    this.generatePuzzle();

    // Calculate par clicks
    this.parClicks = this.gridSize * this.gridSize; // reasonable par
  }

  private generatePuzzle(): void {
    const size = this.gridSize;

    // Place source and drain on opposite edges
    this.sourceRow = Math.floor(Math.random() * size);
    this.sourceCol = 0;
    this.drainRow = Math.floor(Math.random() * size);
    this.drainCol = size - 1;

    // Generate a valid path from source to drain using random walk
    const solutionPath = this.generatePath();

    // Initialize grid with empty cells
    this.grid = [];
    for (let r = 0; r < size; r++) {
      this.grid[r] = [];
      for (let c = 0; c < size; c++) {
        this.grid[r][c] = {
          type: "dead",
          rotation: 0,
          isSource: false,
          isDrain: false,
          connected: false,
          animRotation: 0,
          targetRotation: 0,
          flowProgress: 0,
          flowOrder: -1,
        };
      }
    }

    // Place pipes along solution path
    for (let i = 0; i < solutionPath.length; i++) {
      const [r, c] = solutionPath[i];
      const connections: number[] = [];

      if (i > 0) {
        const [pr, pc] = solutionPath[i - 1];
        const dr = r - pr;
        const dc = c - pc;
        if (dr === -1) connections.push(DIR_TOP);
        if (dr === 1) connections.push(DIR_BOTTOM);
        if (dc === -1) connections.push(DIR_LEFT);
        if (dc === 1) connections.push(DIR_RIGHT);
      } else {
        // Source: connect from left edge
        connections.push(DIR_LEFT);
      }

      if (i < solutionPath.length - 1) {
        const [nr, nc] = solutionPath[i + 1];
        const dr = nr - r;
        const dc = nc - c;
        if (dr === -1) connections.push(DIR_TOP);
        if (dr === 1) connections.push(DIR_BOTTOM);
        if (dc === -1) connections.push(DIR_LEFT);
        if (dc === 1) connections.push(DIR_RIGHT);
      } else {
        // Drain: connect to right edge
        connections.push(DIR_RIGHT);
      }

      // Find pipe type and rotation that matches connections
      const { type, rotation } = this.findPipeFor(connections);
      this.grid[r][c].type = type;
      this.grid[r][c].rotation = rotation;
    }

    // Mark source and drain
    this.grid[this.sourceRow][this.sourceCol].isSource = true;
    this.grid[this.drainRow][this.drainCol].isDrain = true;

    // Fill remaining cells with random pipes
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const onPath = solutionPath.some(([pr, pc]) => pr === r && pc === c);
        if (!onPath) {
          const types: PipeType[] = ["straight", "elbow", "tee", "dead"];
          // Occasionally add cross pieces
          if (Math.random() < 0.1) types.push("cross");
          this.grid[r][c].type =
            types[Math.floor(Math.random() * types.length)];
          this.grid[r][c].rotation = Math.floor(Math.random() * 4);
        }
      }
    }

    // Store the solution rotations, then scramble
    const solutionRotations: number[][] = [];
    for (let r = 0; r < size; r++) {
      solutionRotations[r] = [];
      for (let c = 0; c < size; c++) {
        solutionRotations[r][c] = this.grid[r][c].rotation;
      }
    }

    // Scramble all non-source, non-drain cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.grid[r][c].isSource || this.grid[r][c].isDrain) continue;
        if (this.grid[r][c].type === "cross") continue; // cross is rotation-invariant
        const randomRot = Math.floor(Math.random() * 4);
        this.grid[r][c].rotation = randomRot;
        this.grid[r][c].animRotation = randomRot;
        this.grid[r][c].targetRotation = randomRot;
      }
    }

    // Make sure it's actually scrambled (not accidentally solved)
    let isSolved = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.grid[r][c].rotation !== solutionRotations[r][c]) {
          isSolved = false;
          break;
        }
      }
      if (!isSolved) break;
    }
    if (isSolved) {
      // Rotate at least one path cell
      for (let i = 1; i < solutionPath.length - 1; i++) {
        const [r, c] = solutionPath[i];
        if (this.grid[r][c].type !== "cross") {
          this.grid[r][c].rotation = (solutionRotations[r][c] + 1) % 4;
          this.grid[r][c].animRotation = this.grid[r][c].rotation;
          this.grid[r][c].targetRotation = this.grid[r][c].rotation;
          break;
        }
      }
    }

    // Set initial animRotation
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        this.grid[r][c].animRotation = this.grid[r][c].rotation;
        this.grid[r][c].targetRotation = this.grid[r][c].rotation;
      }
    }

    this.updateConnections();
  }

  private generatePath(): number[][] {
    const size = this.gridSize;
    const start = [this.sourceRow, this.sourceCol];
    const end = [this.drainRow, this.drainCol];

    // BFS-based random path generation
    // Use randomized DFS to get an interesting path
    const visited = new Set<string>();
    const path: number[][] = [];

    const key = (r: number, c: number) => `${r},${c}`;

    const dfs = (r: number, c: number): boolean => {
      if (r === end[0] && c === end[1]) {
        path.push([r, c]);
        return true;
      }

      visited.add(key(r, c));
      path.push([r, c]);

      // Shuffle directions with bias towards the drain
      const dirs = [0, 1, 2, 3];
      // Bias: prefer moving towards drain
      dirs.sort(() => {
        const bias = Math.random() - 0.3; // slight random bias
        return bias;
      });

      // Strongly prefer rightward movement to ensure we reach the drain
      dirs.sort((a, b) => {
        const aTowardsDrain =
          (DX[a] > 0 ? 2 : 0) + (DY[a] === Math.sign(end[0] - r) ? 1 : 0);
        const bTowardsDrain =
          (DX[b] > 0 ? 2 : 0) + (DY[b] === Math.sign(end[0] - r) ? 1 : 0);
        return bTowardsDrain - aTowardsDrain + (Math.random() - 0.5) * 3;
      });

      for (const d of dirs) {
        const nr = r + DY[d];
        const nc = c + DX[d];
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          !visited.has(key(nr, nc))
        ) {
          // Limit path length to avoid very long paths
          if (path.length < size * size * 0.6 || (nr === end[0] && nc === end[1])) {
            if (dfs(nr, nc)) return true;
          }
        }
      }

      path.pop();
      return false;
    };

    dfs(start[0], start[1]);

    // Fallback: if no path found, create a simple direct path
    if (path.length === 0) {
      return this.generateSimplePath();
    }

    return path;
  }

  private generateSimplePath(): number[][] {
    const path: number[][] = [];
    let r = this.sourceRow;
    let c = this.sourceCol;

    path.push([r, c]);

    // Move right first, adjusting row as needed
    while (c < this.drainCol) {
      if (r !== this.drainRow && Math.random() < 0.4) {
        r += r < this.drainRow ? 1 : -1;
      } else {
        c++;
      }
      path.push([r, c]);
    }

    // Adjust row if needed
    while (r !== this.drainRow) {
      r += r < this.drainRow ? 1 : -1;
      path.push([r, c]);
    }

    return path;
  }

  private findPipeFor(connections: number[]): {
    type: PipeType;
    rotation: number;
  } {
    const connSet = new Set(connections);
    const numConn = connSet.size;

    if (numConn === 4)
      return { type: "cross", rotation: 0 };

    if (numConn === 1) {
      const dir = [...connSet][0];
      // Dead end base connects RIGHT (dir 1)
      // rotation needed = dir - 1
      return { type: "dead", rotation: (dir - DIR_RIGHT + 4) % 4 };
    }

    if (numConn === 3) {
      // Tee: missing one direction. Base tee has [TOP, RIGHT, BOTTOM], missing LEFT
      const missing = [0, 1, 2, 3].find((d) => !connSet.has(d))!;
      // Base tee missing direction is LEFT (3)
      // We need rotation such that the missing direction maps to LEFT
      // If base missing is LEFT (3), and actual missing is `missing`,
      // rotation = (missing - 3 + 4) % 4
      return { type: "tee", rotation: (missing - DIR_LEFT + 4) % 4 };
    }

    if (numConn === 2) {
      const dirs = [...connSet].sort((a, b) => a - b);
      const [d1, d2] = dirs;

      // Check if straight (opposite directions)
      if ((d1 + 2) % 4 === d2) {
        // Straight: base connects LEFT-RIGHT (3,1)
        // If d1=0,d2=2 (top-bottom), rotation = 1
        // If d1=1,d2=3 (right-left), rotation = 0
        if (
          (d1 === DIR_LEFT && d2 === DIR_RIGHT) ||
          (d1 === DIR_RIGHT && d2 === DIR_LEFT)
        )
          return { type: "straight", rotation: 0 };
        return { type: "straight", rotation: 1 };
      }

      // Elbow: base connects TOP-RIGHT (0,1)
      // Find rotation: base dirs are {0,1}
      // We need rotation r such that {(0+r)%4, (1+r)%4} = connSet
      for (let rot = 0; rot < 4; rot++) {
        const rd1 = (DIR_TOP + rot) % 4;
        const rd2 = (DIR_RIGHT + rot) % 4;
        if (connSet.has(rd1) && connSet.has(rd2)) {
          return { type: "elbow", rotation: rot };
        }
      }
    }

    // Fallback
    return { type: "straight", rotation: 0 };
  }

  private updateConnections(): void {
    const size = this.gridSize;

    // Reset connections
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        this.grid[r][c].connected = false;
        this.grid[r][c].flowOrder = -1;
      }
    }

    // BFS from source
    const queue: [number, number][] = [];
    const sr = this.sourceRow;
    const sc = this.sourceCol;

    // Source always connects from left edge
    this.grid[sr][sc].connected = true;
    this.grid[sr][sc].flowOrder = 0;
    queue.push([sr, sc]);

    let order = 1;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const cell = this.grid[r][c];
      const dirs = getConnectedDirs(cell.type, cell.rotation);

      for (const d of dirs) {
        const nr = r + DY[d];
        const nc = c + DX[d];

        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (this.grid[nr][nc].connected) continue;

        const neighbor = this.grid[nr][nc];
        const neighborDirs = getConnectedDirs(neighbor.type, neighbor.rotation);

        // Check if neighbor connects back
        if (neighborDirs.includes(oppositeDir(d))) {
          neighbor.connected = true;
          neighbor.flowOrder = order++;
          queue.push([nr, nc]);
        }
      }
    }

    this.maxFlowOrder = order - 1;

    // Check if drain is connected
    const drainConnected = this.grid[this.drainRow][this.drainCol].connected;

    if (drainConnected && !this.solved) {
      this.solved = true;
      this.flowAnimating = true;
      this.flowAnimStart = 0;

      // Calculate score
      const baseScore = Math.max(100, 500 - this.clicks * 10);
      const timeBonus = this.clicks <= this.parClicks ? 200 : 0;
      const levelScore = baseScore + timeBonus;
      this.totalScore += levelScore;
      this.setScore(this.totalScore);
    }
  }

  update(dt: number): void {
    if (this.status !== "running") return;

    const dtSec = dt / 1000;
    this.particleTime += dtSec;

    // Handle rotation animations
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        if (cell.animRotation !== cell.targetRotation) {
          const diff = cell.targetRotation - cell.animRotation;
          const speed = 6.67; // ~150ms per 90 degrees
          const step = speed * dtSec;
          if (Math.abs(diff) <= step) {
            cell.animRotation = cell.targetRotation;
          } else {
            cell.animRotation += Math.sign(diff) * step;
          }
        }
      }
    }

    // Flow animation
    if (this.flowAnimating) {
      this.flowAnimStart += dtSec;
      const flowSpeed = 4.0; // cells per second
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          const cell = this.grid[r][c];
          if (cell.connected && cell.flowOrder >= 0) {
            const targetProgress = Math.max(
              0,
              Math.min(1, (this.flowAnimStart * flowSpeed - cell.flowOrder) * 1.0)
            );
            cell.flowProgress = targetProgress;
          }
        }
      }

      // Level complete after flow animation finishes
      if (this.flowAnimStart > (this.maxFlowOrder + 1) / 4 + 0.5) {
        this.levelCompleteTimer += dtSec;
        if (this.levelCompleteTimer > 1.5) {
          this.level++;
          this.startLevel();
        }
      }
    }

    // Mouse input
    const mouseDown = this.input.isMouseDown(0);
    const mouseClicked = mouseDown && !this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    const mouse = this.input.getMousePosition();
    this.hoverCol = Math.floor((mouse.x - this.gridOffsetX) / this.cellSize);
    this.hoverRow = Math.floor((mouse.y - this.gridOffsetY) / this.cellSize);

    if (
      this.hoverCol < 0 ||
      this.hoverCol >= this.gridSize ||
      this.hoverRow < 0 ||
      this.hoverRow >= this.gridSize
    ) {
      this.hoverCol = -1;
      this.hoverRow = -1;
    }

    if (mouseClicked && !this.solved && this.hoverRow >= 0 && this.hoverCol >= 0) {
      const cell = this.grid[this.hoverRow][this.hoverCol];
      if (!cell.isSource && !cell.isDrain && cell.type !== "cross") {
        cell.rotation = (cell.rotation + 1) % 4;
        cell.targetRotation += 1;
        this.clicks++;
        this.updateConnections();
      }
    }
  }

  draw(): void {
    const ctx = this.ctx;
    const size = this.gridSize;

    // Title and HUD
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("PIPE PUZZLE", WIDTH / 2, 25);

    ctx.font = "14px Inter, sans-serif";
    ctx.fillStyle = "#00d4ff";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${this.totalScore}`, 15, 25);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`Level ${this.level}`, WIDTH - 15, 25);

    // Draw grid cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = this.grid[r][c];
        const x = this.gridOffsetX + c * this.cellSize;
        const y = this.gridOffsetY + r * this.cellSize;

        // Cell background
        const isHover = r === this.hoverRow && c === this.hoverCol;
        ctx.fillStyle = isHover
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.02)";
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2, 4);
        ctx.fill();

        // Cell border
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2, 4);
        ctx.stroke();

        // Draw pipe
        this.drawPipe(ctx, cell, x, y);
      }
    }

    // Draw source indicator (left edge)
    this.drawSource(ctx);

    // Draw drain indicator (right edge)
    this.drawDrain(ctx);

    // Bottom HUD
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(
      `Clicks: ${this.clicks}   |   Par: ${this.parClicks}`,
      WIDTH / 2,
      HEIGHT - 35
    );

    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(
      "Click pipes to rotate. Connect source to drain.",
      WIDTH / 2,
      HEIGHT - 15
    );

    // Solved message
    if (this.solved && this.levelCompleteTimer > 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 28px Inter, sans-serif";
      ctx.shadowColor = "#00d4ff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#00d4ff";
      ctx.fillText("LEVEL COMPLETE!", WIDTH / 2, HEIGHT - 60);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private drawPipe(
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    x: number,
    y: number
  ): void {
    const cs = this.cellSize;
    const cx = x + cs / 2;
    const cy = y + cs / 2;
    const hw = cs * 0.12; // half pipe width
    const connLen = cs / 2 - 2; // length from center to edge

    // Determine color and glow based on connection state
    let pipeColor: string;
    let glowColor: string;
    let glowAmount: number;

    if (cell.isSource) {
      pipeColor = "#4ade80";
      glowColor = "#4ade80";
      glowAmount = 10;
    } else if (cell.isDrain) {
      pipeColor = "#ffd700";
      glowColor = "#ffd700";
      glowAmount = 10;
    } else if (cell.connected) {
      if (this.flowAnimating && cell.flowProgress > 0) {
        // Animated flow: lerp from cyan to brighter cyan
        const p = cell.flowProgress;
        const r = Math.round(0 + p * 20);
        const g = Math.round(180 + p * 32);
        const b = Math.round(255);
        pipeColor = `rgb(${r},${g},${b})`;
        glowColor = "#00d4ff";
        glowAmount = 8 + p * 10;
      } else {
        pipeColor = "#00d4ff";
        glowColor = "#00d4ff";
        glowAmount = 8;
      }
    } else {
      pipeColor = "rgba(255,255,255,0.2)";
      glowColor = "transparent";
      glowAmount = 0;
    }

    ctx.save();
    ctx.translate(cx, cy);

    // Apply rotation animation
    const rotAngle = cell.animRotation * (Math.PI / 2);
    ctx.rotate(rotAngle);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = hw * 2;
    ctx.strokeStyle = pipeColor;

    if (glowAmount > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowAmount;
    }

    const baseDirs = PIPE_TYPES[cell.type].baseDirs;

    ctx.beginPath();

    switch (cell.type) {
      case "straight":
        // Horizontal line (base: left-right)
        ctx.moveTo(-connLen, 0);
        ctx.lineTo(connLen, 0);
        break;

      case "elbow":
        // Base: connects top and right
        ctx.moveTo(0, -connLen);
        ctx.lineTo(0, 0);
        ctx.lineTo(connLen, 0);
        break;

      case "tee":
        // Base: connects top, right, bottom (missing left)
        ctx.moveTo(0, -connLen);
        ctx.lineTo(0, connLen);
        ctx.moveTo(0, 0);
        ctx.lineTo(connLen, 0);
        break;

      case "cross":
        ctx.moveTo(-connLen, 0);
        ctx.lineTo(connLen, 0);
        ctx.moveTo(0, -connLen);
        ctx.lineTo(0, connLen);
        break;

      case "dead":
        // Base: connects right only
        ctx.moveTo(0, 0);
        ctx.lineTo(connLen, 0);
        // Draw a cap/dot at center
        break;
    }

    ctx.stroke();

    // Draw center dot for dead end
    if (cell.type === "dead") {
      ctx.fillStyle = pipeColor;
      ctx.beginPath();
      ctx.arc(0, 0, hw * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw center connector dot for junctions
    if (
      cell.type === "elbow" ||
      cell.type === "tee" ||
      cell.type === "cross"
    ) {
      ctx.fillStyle = pipeColor;
      ctx.beginPath();
      ctx.arc(0, 0, hw * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flow particles
    if (
      this.flowAnimating &&
      cell.connected &&
      cell.flowProgress >= 1 &&
      !cell.isSource &&
      !cell.isDrain
    ) {
      ctx.shadowBlur = 0;
      const particleSpeed = this.particleTime * 3;
      for (const d of baseDirs) {
        let dirX = 0;
        let dirY = 0;
        if (d === DIR_TOP) dirY = -1;
        if (d === DIR_BOTTOM) dirY = 1;
        if (d === DIR_LEFT) dirX = -1;
        if (d === DIR_RIGHT) dirX = 1;

        const len = connLen * 0.8;
        for (let p = 0; p < 2; p++) {
          const t = ((particleSpeed + p * 0.5) % 1);
          const px = dirX * len * t;
          const py = dirY * len * t;
          ctx.fillStyle = `rgba(0, 212, 255, ${0.6 * (1 - t)})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  private drawSource(ctx: CanvasRenderingContext2D): void {
    const x = this.gridOffsetX - 12;
    const y =
      this.gridOffsetY +
      this.sourceRow * this.cellSize +
      this.cellSize / 2;

    ctx.save();
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright dot
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#bbf7d0";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Arrow/pipe connector
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(this.gridOffsetX + 1, y);
    ctx.stroke();
    ctx.restore();

    // Label
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.fillStyle = "#4ade80";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SRC", x, y - 16);
  }

  private drawDrain(ctx: CanvasRenderingContext2D): void {
    const x =
      this.gridOffsetX + this.gridSize * this.cellSize + 12;
    const y =
      this.gridOffsetY +
      this.drainRow * this.cellSize +
      this.cellSize / 2;

    ctx.save();
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Target rings
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#fff5cc";
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Pipe connector
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(
      this.gridOffsetX + this.gridSize * this.cellSize - 1,
      y
    );
    ctx.lineTo(x - 8, y);
    ctx.stroke();
    ctx.restore();

    // Label
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.fillStyle = "#ffd700";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("END", x, y - 16);
  }

  reset(): void {
    this.init();
  }
}
