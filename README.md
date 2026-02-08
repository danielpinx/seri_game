# 🎮 Python Game Collection

A collection of classic arcade games built with Python and Pygame. Each game is implemented following Object-Oriented Programming (OOP) principles and is ideal for learning the fundamentals of game development.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Game List](#game-list)
- [Installation and Setup](#installation-and-setup)
- [Tech Stack](#tech-stack)
- [License](#license)

## 🗂️ Project Structure

```
game/
├── clock/              # Clock project (in development)
├── falling_sand/       # Falling sand simulation
├── ping_pong/          # AI Ping Pong game
├── snake/              # Retro Snake game
├── space_Invaders/     # Space Invaders game
└── tetris/             # Tetris game
```

## 🎯 Game List

### 1. 🏓 Ping Pong
A classic ping pong game where you play against an AI opponent.

**Key Features:**
- Play against AI opponent
- Real-time score display
- Smooth ball and paddle animations
- Keyboard arrow key controls

**How to Run:**
```bash
cd game/ping_pong
python pong.py
```

**Controls:**
- `↑` (Up Arrow): Move paddle up
- `↓` (Down Arrow): Move paddle down

---

### 2. 🐍 Snake
A retro version of the classic Snake game.

**Key Features:**
- Snake grows when eating food
- Game over on wall or self-collision
- Score system
- Custom graphics (food images)

**How to Run:**
```bash
cd game/snake
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python snake.py
```

**Controls:**
- `↑`: Move up
- `↓`: Move down
- `←`: Move left
- `→`: Move right

**Reference:**
- [Snake Game in Python Tutorial with pygame 🐍 (OOP)](https://www.youtube.com/watch?v=1zVlRXd8f7g)

---

### 3. 👾 Space Invaders
A shooting game to defend against an alien invasion.

**Key Features:**
- 3 types of aliens
- Mystery spaceship
- Obstacle system
- High score saving
- Sound effects and background music
- Custom fonts

**How to Run:**
```bash
cd game/space_Invaders
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Controls:**
- `←` / `→`: Move spaceship left/right
- `Space`: Fire laser

**Game Elements:**
- **Aliens**: 3 different types (each with different points)
- **Obstacles**: Protection from lasers
- **Mystery Spaceship**: Random appearance, bonus points

**Reference:**
- [Python Space Invaders Game Tutorial with Pygame - Beginner Tutorial (OOP)](https://www.youtube.com/watch?v=PFMoo_dvhyw)

---

### 4. 🧱 Tetris
The classic puzzle game Tetris.

**Key Features:**
- 7 different tetromino blocks
- Line clearing system
- Score system
- Next block preview
- Smooth block rotation
- Colorful block designs

**How to Run:**
```bash
cd game/tetris
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Controls:**
- `←` / `→`: Move block left/right
- `↓`: Fast drop
- `↑` or `Space`: Rotate block

**Reference:**
- [Creating Tetris in Python with pygame - Beginner Tutorial (OOP)](https://www.youtube.com/watch?v=nF_crEtmpBo)

---

### 5. 🌊 Falling Sand
A falling sand game using physics simulation.

**Key Features:**
- Real-time particle simulation
- Mouse interaction
- Grid-based physics engine
- High-performance rendering at 120 FPS

**How to Run:**
```bash
cd game/falling_sand
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

**Structure:**
- `simulation.py`: Simulation logic
- `grid.py`: Grid system
- `particle.py`: Particle class

---

### 6. 🕐 Clock
A Pygame-based clock project (in development)

**How to Run:**
```bash
cd game/clock
python main.py
```

---

## 🚀 Installation and Setup

### Common Prerequisites

- Python 3.11.6 or higher (recommended)
- pip (Python package manager)
- Pygame or Pygame-CE

### General Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd game
```

2. **Navigate to a specific game directory**
```bash
cd game/<game_name>
```

3. **Create and activate virtual environment** (recommended)
```bash
python -m venv .venv
source .venv/bin/activate  # Mac/Linux
# or
.venv\Scripts\activate  # Windows
```

4. **Install dependencies** (if requirements.txt exists)
```bash
pip install -r requirements.txt
```

5. **Run the game**
```bash
python main.py  # or the main file for the specific game
```

6. **Deactivate virtual environment**
```bash
deactivate
```

### Using pyenv (optional)

```bash
pyenv versions
pyenv local 3.11.6
```

---

## 🛠️ Tech Stack

- **Language**: Python 3.11+
- **Game Engine**: Pygame / Pygame-CE
- **Development Paradigm**: Object-Oriented Programming (OOP)
- **Design Patterns**: 
  - Game loop pattern
  - State management
  - Collision detection system
  - Event handling

### Key Libraries

```
pygame        # Ping Pong, Snake, Tetris, Falling Sand
pygame-ce     # Space Invaders (Pygame Community Edition)
```

---

## 🎮 Game Feature Summary

| Game | Difficulty | OOP | Sound | AI | Physics Engine |
|------|------------|-----|-------|----|--------------| 
| Ping Pong | ⭐ | ✓ | ✗ | ✓ | ✗ |
| Snake | ⭐⭐ | ✓ | ✗ | ✗ | ✗ |
| Space Invaders | ⭐⭐⭐ | ✓ | ✓ | ✗ | ✗ |
| Tetris | ⭐⭐⭐ | ✓ | ✗ | ✗ | ✗ |
| Falling Sand | ⭐⭐⭐⭐ | ✓ | ✗ | ✗ | ✓ |

---

## 📝 License

This project follows the MIT License. For more details, see the [LICENSE](LICENSE) file.

```
MIT License
Copyright (c) 2026 Seri1436
```

---

**Happy Game Development! 🎉**
