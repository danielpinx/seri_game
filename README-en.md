# 🎮 Seri Arcade

Classic arcade games built with Python/Pygame + a Next.js web portal to play 25 games in your browser.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Web Portal](#web-portal)
- [Game List](#game-list)
- [Python Games (Original)](#python-games-original)
- [Installation and Setup](#installation-and-setup)
- [Tech Stack](#tech-stack)
- [License](#license)

## 🗂️ Project Structure

```
seri_game/
├── portal/                     # Next.js web portal (25 games)
│   ├── src/
│   │   ├── app/                # Next.js App Router (pages, layouts)
│   │   ├── engine/             # Shared game engine (BaseGame, InputManager)
│   │   ├── games/              # Individual game implementations (26 dirs)
│   │   │   ├── pong/           #   Pong
│   │   │   ├── snake/          #   Snake
│   │   │   ├── tetris/         #   Tetris
│   │   │   ├── space-invaders/ #   Space Invaders
│   │   │   ├── falling-sand/   #   Falling Sand
│   │   │   ├── breakout/       #   Breakout
│   │   │   ├── 2048/           #   2048
│   │   │   ├── asteroids/      #   Asteroids
│   │   │   ├── pacman/         #   Pac-Man
│   │   │   ├── solitaire/      #   Solitaire
│   │   │   ├── connect4/       #   Connect Four
│   │   │   ├── tower-defense/  #   Tower Defense
│   │   │   ├── rhythm/         #   Rhythm
│   │   │   ├── wordle/         #   Wordle
│   │   │   ├── checkers/       #   Checkers
│   │   │   ├── sudoku/         #   Sudoku
│   │   │   ├── memory-match/   #   Memory Match
│   │   │   ├── hangman/        #   Hangman
│   │   │   ├── bubble-shooter/ #   Bubble Shooter
│   │   │   ├── typing/         #   Type Attack
│   │   │   ├── brick-builder/  #   Brick Builder
│   │   │   ├── sokoban/        #   Sokoban
│   │   │   ├── simon-says/     #   Simon Says
│   │   │   ├── doodle-jump/    #   Doodle Jump
│   │   │   ├── whack-a-mole/   #   Whack-a-Mole
│   │   │   ├── pipe-puzzle/    #   Pipe Puzzle
│   │   │   └── index.ts        #   Game registry
│   │   ├── components/         # UI components
│   │   │   ├── layout/         #   Sidebar, UserPanel, SettingsModal
│   │   │   └── game/           #   GameCanvas, GameOverlay
│   │   ├── config/             # Constants (GP, settings, avatars, etc.)
│   │   ├── store/              # Zustand state management (GP, settings)
│   │   └── lib/                # Utilities (GP system, settings, diffValue)
│   └── public/
│       └── images/avatars/     # Profile avatar images
├── game/                       # Original Python/Pygame games
│   ├── clock/                  #   Clock project (in development)
│   ├── falling_sand/           #   Falling sand simulation
│   ├── ping_pong/              #   AI Ping Pong game
│   ├── snake/                  #   Retro Snake game
│   ├── space_Invaders/         #   Space Invaders game
│   ├── tetris/                 #   Tetris game
│   └── turtle/                 #   Turtle graphics
├── README.md                   # Korean README
└── README-en.md                # English README
```

---

## 🌐 Web Portal

A Next.js 16-based web arcade portal where you can play 25 games directly in your browser.

**Key Features:**
- GP (Game Points) system - 1000 GP daily allowance
- Settings system - nickname, avatar, difficulty adjustment (5 levels)
- Difficulty integration - applied to 20 games (Very Easy ~ Very Hard)
- Responsive glassmorphism UI

**How to Run:**
```bash
cd portal
npm install
npm run dev     # http://localhost:3000
```

---

## 🎯 Game List (25 Games)

### Arcade / Action

| # | Game | Description | Controls | Difficulty |
|---|------|-------------|----------|:----------:|
| 1 | 🏓 **Pong** | Classic paddle battle vs AI | Arrow Up/Down | ✓ |
| 2 | 🐍 **Snake** | Eat, grow, survive | Arrow Keys | ✓ |
| 3 | 👾 **Space Invaders** | Defend Earth from aliens | Left/Right + Space | ✓ |
| 4 | 🧱 **Breakout** | Smash bricks with combos | Left/Right + Space | ✓ |
| 5 | 🚀 **Asteroids** | Destroy asteroids in space | Arrows + Space | ✓ |
| 6 | 👻 **Pac-Man** | Eat dots, avoid ghosts | Arrow Keys | ✓ |
| 7 | 🤠 **Doodle Jump** | Bounce higher and higher | Left/Right + Space | ✓ |
| 8 | 🔨 **Whack-a-Mole** | Whack moles, avoid bombs | Mouse click | ✓ |
| 9 | 🎯 **Bubble Shooter** | Aim, shoot, pop bubbles | Mouse aim + click | ✓ |
| 10 | 🏰 **Tower Defense** | Build towers, stop the waves | Mouse + 1/2/3 keys | ✓ |

### Rhythm / Typing

| # | Game | Description | Controls | Difficulty |
|---|------|-------------|----------|:----------:|
| 11 | 🎵 **Rhythm** | Hit notes to the beat | D / F / J / K | ✓ |
| 12 | ⌨️ **Type Attack** | Type falling words to survive | Keyboard | ✓ |

### Puzzle / Strategy

| # | Game | Description | Controls | Difficulty |
|---|------|-------------|----------|:----------:|
| 13 | 🧩 **Tetris** | Stack blocks, clear lines | Arrows + Space | ✓ |
| 14 | 🔢 **2048** | Merge tiles, reach 2048 | Arrow Keys | - |
| 15 | 🔴 **Connect Four** | Drop discs, connect 4 vs AI | Mouse click | ✓ |
| 16 | ♟️ **Checkers** | Classic draughts vs AI | Mouse click | ✓ |
| 17 | 🔢 **Sudoku** | Fill the 9x9 number grid | Mouse + Number keys | ✓ |
| 18 | 🃏 **Memory Match** | Flip cards, find pairs | Mouse click | ✓ |
| 19 | 💀 **Hangman** | Guess the word, save the man | Keyboard + Mouse | ✓ |
| 20 | 📝 **Wordle** | Guess the 5-letter word | Keyboard + Mouse | ✓ |
| 21 | 📦 **Sokoban** | Push boxes to targets | Arrow Keys + Z/R | - |
| 22 | 🔧 **Pipe Puzzle** | Connect pipes, flow water | Mouse click | - |

### Creative / Sandbox

| # | Game | Description | Controls | Difficulty |
|---|------|-------------|----------|:----------:|
| 23 | 🌊 **Falling Sand** | Particle physics sandbox | Click + 1/2/3/4 keys | - |
| 24 | 🧱 **Brick Builder** | Fit blocks, clear lines | Mouse drag & drop | - |

### Memory / Other

| # | Game | Description | Controls | Difficulty |
|---|------|-------------|----------|:----------:|
| 25 | 🎮 **Simon Says** | Repeat the pattern | Mouse + Q/W/A/S | ✓ |
| - | ♠️ **Solitaire** | Classic Klondike card game | Mouse drag & drop | - |

---

## 🐍 Python Games (Original)

Original Python/Pygame games in the `game/` directory. These served as prototypes for the web portal.

### 1. 🏓 Ping Pong
Classic ping pong game vs AI

```bash
cd game/ping_pong
python pong.py
```
- `↑`/`↓`: Move paddle

---

### 2. 🐍 Snake
Retro version of the classic Snake game

```bash
cd game/snake
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python snake.py
```
- Arrow Keys: Move

---

### 3. 👾 Space Invaders
Shooting game to defend against alien invasion (uses Pygame-CE)

```bash
cd game/space_Invaders
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
- `←`/`→`: Move, `Space`: Fire

---

### 4. 🧱 Tetris
Classic puzzle game

```bash
cd game/tetris
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
- `←`/`→`: Move, `↑`/`Space`: Rotate, `↓`: Fast drop

---

### 5. 🌊 Falling Sand
Physics simulation sandbox

```bash
cd game/falling_sand
source venv/bin/activate
python main.py
```
- Mouse click: Place particles

---

### 6. 🕐 Clock
Pygame-based clock project (in development)

```bash
cd game/clock
python main.py
```

---

## 🚀 Installation and Setup

### Web Portal (Recommended)

```bash
cd portal
npm install
npm run dev
```
> Play all games at http://localhost:3000

### Python Games

**Prerequisites:** Python 3.11+, pip

```bash
cd game/<game_name>
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py  # or the main file for the specific game
```

---

## 🛠️ Tech Stack

### Web Portal
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (glassmorphism theme)
- **State Management**: Zustand
- **Game Engine**: Canvas 2D, custom BaseGame abstract class

### Python Games
- **Language**: Python 3.11+
- **Game Engine**: Pygame / Pygame-CE
- **Paradigm**: OOP (Object-Oriented Programming)

---

## 🎮 Game Feature Summary

| Game | Platform | OOP | Sound | AI | Physics |
|------|:--------:|:---:|:-----:|:--:|:-------:|
| Pong | Web + Python | ✓ | ✗ | ✓ | ✗ |
| Snake | Web + Python | ✓ | ✗ | ✗ | ✗ |
| Space Invaders | Web + Python | ✓ | ✓ | ✗ | ✗ |
| Tetris | Web + Python | ✓ | ✗ | ✗ | ✗ |
| Falling Sand | Web + Python | ✓ | ✗ | ✗ | ✓ |
| Breakout | Web | ✓ | ✗ | ✗ | ✗ |
| 2048 | Web | ✓ | ✗ | ✗ | ✗ |
| Asteroids | Web | ✓ | ✗ | ✗ | ✗ |
| Pac-Man | Web | ✓ | ✗ | ✓ | ✗ |
| Solitaire | Web | ✓ | ✗ | ✗ | ✗ |
| Connect Four | Web | ✓ | ✗ | ✓ | ✗ |
| Tower Defense | Web | ✓ | ✗ | ✓ | ✗ |
| Rhythm | Web | ✓ | ✗ | ✗ | ✗ |
| Wordle | Web | ✓ | ✗ | ✗ | ✗ |
| Checkers | Web | ✓ | ✗ | ✓ | ✗ |
| Sudoku | Web | ✓ | ✗ | ✗ | ✗ |
| Memory Match | Web | ✓ | ✗ | ✗ | ✗ |
| Hangman | Web | ✓ | ✗ | ✗ | ✗ |
| Bubble Shooter | Web | ✓ | ✗ | ✗ | ✗ |
| Type Attack | Web | ✓ | ✗ | ✗ | ✗ |
| Brick Builder | Web | ✓ | ✗ | ✗ | ✗ |
| Sokoban | Web | ✓ | ✗ | ✗ | ✗ |
| Simon Says | Web | ✓ | ✗ | ✗ | ✗ |
| Doodle Jump | Web | ✓ | ✗ | ✗ | ✓ |
| Whack-a-Mole | Web | ✓ | ✗ | ✗ | ✗ |
| Pipe Puzzle | Web | ✓ | ✗ | ✗ | ✗ |

---

## 📝 License

This project follows the GPL-3.0 License. For more details, see the [LICENSE](LICENSE) file.

```
GNU General Public License v3.0
Copyright (c) 2026 Seri1436
```

---

**Happy Game Development! 🎉**
