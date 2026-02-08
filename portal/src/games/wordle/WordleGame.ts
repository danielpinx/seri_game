import { BaseGame } from "@/engine/BaseGame";
import type { GameCallbacks } from "@/engine/types";

// ── Config ──────────────────────────────────────────────────────────
const W = 480;
const H = 680;
const FPS = 60;
const BG = "#0a0c14";

const ROWS = 6;
const COLS = 5;
const TILE_SIZE = 58;
const TILE_GAP = 6;

const GRID_W = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
const GRID_X = (W - GRID_W) / 2;
const GRID_Y = 60;

const GREEN = "#538d4e";
const YELLOW = "#b59f3b";
const GRAY = "#3a3a3c";
const TILE_EMPTY_BORDER = "rgba(255,255,255,0.1)";
const TILE_ACTIVE_BORDER = "rgba(255,255,255,0.4)";

// ── Keyboard layout ─────────────────────────────────────────────────
const KB_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];
const KB_Y = 495;
const KB_KEY_H = 48;
const KB_KEY_GAP = 5;
const KB_ROW_GAP = 6;

// ── Word list (200+ common 5-letter words) ──────────────────────────
const WORDS = [
  "about","above","abuse","actor","acute","admit","adopt","adult","after","again",
  "agent","agree","ahead","alarm","album","alert","alien","align","alive","alley",
  "allow","alone","along","alter","ample","angel","anger","angle","angry","anime",
  "ankle","annex","antic","apple","apply","arena","arise","armor","array","aside",
  "asset","audit","avoid","awake","award","aware","awful","bacon","badge","badly",
  "basic","basin","basis","batch","beach","bears","began","begin","being","belly",
  "below","bench","berry","birth","black","blade","blame","blank","blast","blaze",
  "bleed","blend","bless","blind","block","blood","bloom","blown","board","bonus",
  "boost","booth","bound","brain","brand","brave","bread","break","breed","brick",
  "brief","bring","broad","broke","brown","brush","buddy","build","burst","buyer",
  "cabin","cable","camel","candy","carry","catch","cause","chain","chair","chalk",
  "champ","chaos","charm","chase","cheap","check","cheer","chess","chest","chief",
  "child","chill","chord","chunk","civil","claim","class","clean","clear","climb",
  "cling","clock","clone","close","cloud","coach","coast","color","comic","coral",
  "couch","count","court","cover","crack","craft","crane","crash","crawl","crazy",
  "cream","crime","cross","crowd","crown","crush","curve","cycle","daily","dance",
  "death","debug","decay","demon","depot","depth","derby","devil","diary","dirty",
  "disco","ditch","dizzy","dodge","doing","donor","doubt","dough","draft","drain",
  "drama","drank","drawn","dream","dress","dried","drift","drill","drink","drive",
  "droit","drone","drove","dryer","dully","dummy","dying","eager","eagle","early",
  "earth","eight","elect","elite","email","ember","empty","enemy","enjoy","enter",
  "equal","equip","error","essay","event","every","exact","exile","exist","extra",
  "fable","facet","faith","false","fancy","fatal","fault","feast","fence","ferry",
  "fetch","fever","fiber","field","fifty","fight","final","first","fixed","flame",
  "flash","flesh","float","flood","floor","flour","fluid","flush","focus","force",
  "forge","forth","forum","found","frame","frank","fraud","fresh","front","frost",
  "froze","fruit","fully","funny","genre","ghost","giant","given","glass","globe",
  "gloom","glory","glove","going","grace","grade","grain","grand","grant","graph",
  "grasp","grass","grave","great","green","grief","grill","grind","groan","groom",
  "gross","group","grove","grown","guard","guess","guest","guide","guild","guilt",
  "guise","handy","happy","harsh","hasn","haven","heart","heavy","hence","herbs",
  "honor","horse","hotel","house","human","humor","hurry","ideal","image","imply",
  "index","indie","inner","input","intro","issue","ivory","jewel","joint","joker",
  "judge","juice","kebab","knack","knelt","knife","knock","known","label","large",
  "laser","later","laugh","layer","learn","least","leave","legal","lemon","level",
  "light","limit","linen","liver","local","lodge","logic","login","looks","loose",
  "lotus","lover","lower","loyal","lucky","lunch","lying","magic","major","maker",
  "manor","maple","march","match","maybe","mayor","medal","media","mercy","merge",
  "merit","metal","meter","might","minor","minus","mixed","model","money","month",
  "moral","mount","mouse","mouth","movie","music","naive","nerve","never","night",
  "noble","noise","north","noted","novel","nurse","occur","ocean","offer","often",
  "olive","onset","opera","orbit","order","other","outer","owned","owner","oxide",
  "ozone","paint","panel","panic","paper","party","pasta","patch","pause","peace",
  "peach","pearl","penny","phase","phone","photo","piano","piece","pilot","pinch",
  "pitch","pixel","pizza","place","plain","plane","plant","plate","plaza","plead",
  "pluck","plumb","plume","point","polar","porch","poser","power","press","price",
  "pride","prime","prince","print","prior","prize","probe","proof","proud","prove",
  "psalm","pulse","punch","pupil","purse","queen","quest","queue","quick","quiet",
  "quite","quota","quote","radar","radio","raise","rally","ranch","range","rapid",
  "ratio","reach","react","realm","rebel","reign","relax","relay","reset","rider",
  "ridge","rifle","right","rigid","risky","rival","river","robot","rocky","rogue",
  "round","route","rover","royal","rugby","rumor","rural","sadly","saint","salad",
  "sales","sauce","scale","scare","scene","scope","scout","scrap","seize","sense",
  "serve","setup","seven","shade","shake","shall","shame","shape","share","sharp",
  "sheer","sheet","shelf","shell","shift","shine","shirt","shock","shore","short",
  "shout","sight","since","sixth","sixty","sized","skill","skull","slave","sleep",
  "slice","slide","slope","smart","smell","smile","smoke","snake","solar","solid",
  "solve","sonic","sorry","sound","south","space","spare","spark","speak","speed",
  "spell","spend","spice","spine","spite","split","spoke","spoon","spray","squad",
  "stack","staff","stage","stain","stake","stale","stall","stamp","stand","stare",
  "stark","start","state","stays","steak","steal","steam","steel","steep","steer",
  "stern","stick","stiff","still","stock","stone","stood","store","storm","story",
  "stove","strap","straw","strip","stuck","study","stuff","style","sugar","suite",
  "sunny","super","surge","swamp","swear","sweet","swept","swift","swing","swirl",
  "sword","swore","swung","table","taken","taste","teach","teeth","thank","theme",
  "there","thick","thief","thing","think","third","those","three","threw","throw",
  "thumb","tiger","tight","timer","tired","title","today","token","total","touch",
  "tough","tower","toxic","trace","track","trade","trail","train","trait","trash",
  "treat","trend","trial","tribe","trick","troop","truck","truly","trump","trunk",
  "trust","truth","tumor","tweak","twice","twist","ultra","uncle","under","union",
  "unite","unity","until","upper","upset","urban","usage","usual","utter","valid",
  "value","valve","vapor","vault","venue","verse","video","vigor","viral","virus",
  "visit","vista","vital","vivid","vocal","vodka","voice","voter","vouch","vowel",
  "wages","waste","watch","water","weary","weave","wedge","weird","wheat","wheel",
  "where","which","while","white","whole","whose","widen","wider","widow","width",
  "witch","women","world","worry","worse","worst","worth","would","wound","wrath",
  "write","wrong","wrote","yield","young","yours","youth","zeros","zones",
];

// ── Tile state ──────────────────────────────────────────────────────
interface TileState {
  letter: string;
  color: string; // "" = not evaluated yet
}

interface AnimTile {
  row: number;
  col: number;
  startTime: number;
  duration: number;
}

export class WordleGame extends BaseGame {
  // Game state
  private board: TileState[][] = [];
  private currentRow = 0;
  private currentCol = 0;
  private answer = "";
  private totalScore = 0;
  private roundOver = false;
  private roundWon = false;
  private roundEndTime = 0;
  private message = "";
  private messageTime = 0;

  // Keyboard color map
  private keyColors: Map<string, string> = new Map();

  // Animations
  private flipAnims: AnimTile[] = [];
  private shakeRow = -1;
  private shakeStart = 0;
  private popTile: { row: number; col: number; start: number } | null = null;

  // Mouse click tracking
  private wasMouseDown = false;
  private mouseClicked = false;

  // Keyboard button rects (computed once)
  private keyRects: Map<string, { x: number; y: number; w: number; h: number }> = new Map();

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    super(
      canvas,
      { id: "wordle", width: W, height: H, fps: FPS, backgroundColor: BG },
      callbacks
    );
  }

  init(): void {
    this.computeKeyboardRects();
    this.resetBoard();
  }

  reset(): void {
    this.totalScore = 0;
    this.setScore(0);
    this.resetBoard();
  }

  private resetBoard(): void {
    this.board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: "", color: "" }))
    );
    this.currentRow = 0;
    this.currentCol = 0;
    this.answer = WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase();
    this.roundOver = false;
    this.roundWon = false;
    this.roundEndTime = 0;
    this.message = "";
    this.messageTime = 0;
    this.flipAnims = [];
    this.shakeRow = -1;
    this.popTile = null;
    this.keyColors.clear();
  }

  private computeKeyboardRects(): void {
    this.keyRects.clear();
    for (let r = 0; r < KB_ROWS.length; r++) {
      const row = KB_ROWS[r];
      const normalKeyW = 38;
      const wideKeyW = 56;

      // Calculate total row width
      let totalW = 0;
      for (const key of row) {
        totalW += (key === "ENTER" || key === "⌫") ? wideKeyW : normalKeyW;
      }
      totalW += (row.length - 1) * KB_KEY_GAP;

      let x = (W - totalW) / 2;
      const y = KB_Y + r * (KB_KEY_H + KB_ROW_GAP);

      for (const key of row) {
        const kw = (key === "ENTER" || key === "⌫") ? wideKeyW : normalKeyW;
        this.keyRects.set(key, { x, y, w: kw, h: KB_KEY_H });
        x += kw + KB_KEY_GAP;
      }
    }
  }

  update(_dt: number): void {
    const now = performance.now();

    // Track mouse click (just pressed)
    const mouseDown = this.input.isMouseDown(0);
    this.mouseClicked = mouseDown && !this.wasMouseDown;
    this.wasMouseDown = mouseDown;

    // Auto-reset after round end
    if (this.roundOver && now - this.roundEndTime > 3000) {
      this.resetBoard();
      return;
    }

    if (this.roundOver) return;

    // Check for on-screen keyboard clicks
    if (this.mouseClicked) {
      const mp = this.input.getMousePosition();
      for (const [key, rect] of this.keyRects) {
        if (
          mp.x >= rect.x && mp.x <= rect.x + rect.w &&
          mp.y >= rect.y && mp.y <= rect.y + rect.h
        ) {
          if (key === "ENTER") {
            this.submitGuess(now);
          } else if (key === "⌫") {
            this.deleteLetter();
          } else {
            this.typeLetter(key, now);
          }
          break;
        }
      }
    }

    // Physical keyboard input
    for (let i = 0; i < 26; i++) {
      const code = `Key${String.fromCharCode(65 + i)}`;
      if (this.input.isKeyJustPressed(code)) {
        this.typeLetter(String.fromCharCode(65 + i), now);
      }
    }

    if (this.input.isKeyJustPressed("Backspace")) {
      this.deleteLetter();
    }

    if (this.input.isKeyJustPressed("Enter")) {
      this.submitGuess(now);
    }
  }

  private typeLetter(letter: string, now: number): void {
    if (this.roundOver) return;
    if (this.currentCol >= COLS) return;
    this.board[this.currentRow][this.currentCol].letter = letter;
    this.popTile = { row: this.currentRow, col: this.currentCol, start: now };
    this.currentCol++;
  }

  private deleteLetter(): void {
    if (this.roundOver) return;
    if (this.currentCol <= 0) return;
    this.currentCol--;
    this.board[this.currentRow][this.currentCol].letter = "";
  }

  private submitGuess(now: number): void {
    if (this.roundOver) return;

    // Not enough letters
    if (this.currentCol < COLS) {
      this.shakeRow = this.currentRow;
      this.shakeStart = now;
      this.showMessage("Not enough letters", now);
      return;
    }

    // Build guess word
    const guess = this.board[this.currentRow]
      .map((t) => t.letter)
      .join("")
      .toLowerCase();

    // Check if word is in list
    if (!WORDS.includes(guess)) {
      this.shakeRow = this.currentRow;
      this.shakeStart = now;
      this.showMessage("Not in word list", now);
      return;
    }

    // Evaluate colors
    const colors = this.evaluateGuess(guess.toUpperCase(), this.answer);
    for (let c = 0; c < COLS; c++) {
      this.board[this.currentRow][c].color = colors[c];

      // Start flip animation with staggered delay
      this.flipAnims.push({
        row: this.currentRow,
        col: c,
        startTime: now + c * 100,
        duration: 300,
      });
    }

    // Update keyboard colors
    for (let c = 0; c < COLS; c++) {
      const letter = this.board[this.currentRow][c].letter;
      const newColor = colors[c];
      const existing = this.keyColors.get(letter);

      // Priority: green > yellow > gray
      if (!existing || newColor === GREEN) {
        this.keyColors.set(letter, newColor);
      } else if (newColor === YELLOW && existing !== GREEN) {
        this.keyColors.set(letter, newColor);
      }
    }

    // Check win
    if (guess.toUpperCase() === this.answer) {
      this.roundWon = true;
      this.roundOver = true;
      this.roundEndTime = now;
      const roundScore = (7 - (this.currentRow + 1)) * 100;
      this.totalScore += roundScore;
      this.setScore(this.totalScore);
      const messages = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];
      this.showMessage(messages[this.currentRow] || "Nice!", now);
      this.currentRow++;
      return;
    }

    this.currentRow++;
    this.currentCol = 0;

    // Check loss
    if (this.currentRow >= ROWS) {
      this.roundOver = true;
      this.roundEndTime = now;
      this.showMessage(this.answer, now);
    }
  }

  private evaluateGuess(guess: string, answer: string): string[] {
    const colors: string[] = Array(COLS).fill(GRAY);
    const answerChars = answer.split("");
    const guessChars = guess.split("");

    // First pass: greens
    for (let i = 0; i < COLS; i++) {
      if (guessChars[i] === answerChars[i]) {
        colors[i] = GREEN;
        answerChars[i] = ""; // consumed
        guessChars[i] = ""; // consumed
      }
    }

    // Second pass: yellows
    for (let i = 0; i < COLS; i++) {
      if (guessChars[i] === "") continue;
      const idx = answerChars.indexOf(guessChars[i]);
      if (idx !== -1) {
        colors[i] = YELLOW;
        answerChars[idx] = ""; // consumed
      }
    }

    return colors;
  }

  private showMessage(text: string, now: number): void {
    this.message = text;
    this.messageTime = now;
  }

  draw(): void {
    const ctx = this.ctx;
    const now = performance.now();

    // ── Title & Score ─────────────────────────────────────────────
    ctx.textAlign = "left";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`SCORE: ${this.totalScore}`, 16, 32);

    ctx.textAlign = "center";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("WORDLE", W / 2, 38);

    // ── Tile grid ─────────────────────────────────────────────────
    for (let r = 0; r < ROWS; r++) {
      // Shake offset
      let shakeOff = 0;
      if (this.shakeRow === r && now - this.shakeStart < 400) {
        const t = (now - this.shakeStart) / 400;
        shakeOff = Math.sin(t * Math.PI * 4) * 6 * (1 - t);
      } else if (this.shakeRow === r && now - this.shakeStart >= 400) {
        this.shakeRow = -1;
      }

      for (let c = 0; c < COLS; c++) {
        const tile = this.board[r][c];
        const x = GRID_X + c * (TILE_SIZE + TILE_GAP) + shakeOff;
        const y = GRID_Y + r * (TILE_SIZE + TILE_GAP);

        // Check flip animation
        const flipAnim = this.flipAnims.find(
          (a) => a.row === r && a.col === c
        );
        let flipProgress = -1; // -1 = no animation
        if (flipAnim) {
          const elapsed = now - flipAnim.startTime;
          if (elapsed >= 0 && elapsed < flipAnim.duration) {
            flipProgress = elapsed / flipAnim.duration;
          } else if (elapsed >= flipAnim.duration) {
            flipProgress = 1; // done
          }
        }

        // Pop animation
        let scale = 1;
        if (
          this.popTile &&
          this.popTile.row === r &&
          this.popTile.col === c
        ) {
          const elapsed = now - this.popTile.start;
          if (elapsed < 100) {
            scale = 1 + 0.1 * Math.sin((elapsed / 100) * Math.PI);
          }
        }

        // Determine if we should show color (after flip midpoint)
        const showColor = tile.color !== "" && (flipProgress === -1 || flipProgress >= 0.5);

        ctx.save();
        ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);

        // Apply flip scale (vertical squeeze)
        if (flipProgress >= 0 && flipProgress < 1) {
          const scaleY = flipProgress < 0.5
            ? 1 - flipProgress * 2
            : (flipProgress - 0.5) * 2;
          ctx.scale(scale, scaleY);
        } else {
          ctx.scale(scale, 1);
        }

        const halfTile = TILE_SIZE / 2;

        if (showColor) {
          // Filled tile
          ctx.fillStyle = tile.color;
          ctx.beginPath();
          ctx.roundRect(-halfTile, -halfTile, TILE_SIZE, TILE_SIZE, 4);
          ctx.fill();
        } else {
          // Empty/active tile
          ctx.strokeStyle =
            r === this.currentRow && tile.letter !== ""
              ? TILE_ACTIVE_BORDER
              : TILE_EMPTY_BORDER;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-halfTile, -halfTile, TILE_SIZE, TILE_SIZE, 4);
          ctx.stroke();
        }

        // Letter
        if (tile.letter !== "" && (flipProgress === -1 || flipProgress < 0.3 || flipProgress >= 0.7)) {
          ctx.fillStyle = showColor ? "#ffffff" : "rgba(255,255,255,0.9)";
          ctx.font = "bold 30px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tile.letter, 0, 2);
        }

        ctx.restore();
      }
    }

    // ── Message ──────────────────────────────────────────────────
    if (this.message !== "") {
      const elapsed = now - this.messageTime;
      const fadeDuration = this.roundOver ? 3000 : 2000;
      if (elapsed < fadeDuration) {
        const alpha = elapsed < fadeDuration - 500
          ? 1
          : 1 - (elapsed - (fadeDuration - 500)) / 500;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Message background pill
        const textW = ctx.measureText(this.message).width;
        const pillW = textW + 32;
        const pillH = 36;
        const pillX = W / 2 - pillW / 2;
        const pillY = 462;

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 18);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillText(this.message, W / 2, pillY + pillH / 2 + 1);
        ctx.restore();
      } else {
        this.message = "";
      }
    }

    // ── On-screen keyboard ──────────────────────────────────────
    for (const [key, rect] of this.keyRects) {
      const color = this.keyColors.get(key);

      if (color) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
      }

      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 5);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (key === "ENTER") {
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("ENTER", rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
      } else if (key === "⌫") {
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.fillText("⌫", rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
      } else {
        ctx.font = "bold 15px Inter, sans-serif";
        ctx.fillText(key, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
      }
    }

    // ── Round end countdown hint ─────────────────────────────────
    if (this.roundOver) {
      const elapsed = now - this.roundEndTime;
      const remaining = Math.ceil((3000 - elapsed) / 1000);
      if (remaining > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Next word in ${remaining}...`, W / 2, H - 10);
      }
    }
  }
}
