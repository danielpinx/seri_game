# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of classic arcade games built with Python and Pygame, each in its own independent subdirectory under `game/`. There is no shared code between games -- each is self-contained with its own dependencies and entry point.

## Running Games

Each game lives in `game/<name>/` and is run independently. Most require a virtual environment:

```bash
# General pattern (snake, space_Invaders, tetris):
cd game/<name>
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py  # or snake.py (snake), pong.py (ping_pong)

# Falling sand uses `venv/` not `.venv/`:
cd game/falling_sand
source venv/bin/activate
python main.py

# Ping pong has no requirements.txt (uses system pygame):
cd game/ping_pong
python pong.py
```

## Key Dependencies

- **Most games**: `pygame`
- **Space Invaders**: `pygame-ce` (Pygame Community Edition) -- not interchangeable with `pygame`
- **Turtle**: `turtle` (Python stdlib, but listed in requirements.txt)

## Architecture Patterns

All games follow the same Pygame loop structure: event handling -> state update -> draw -> display update -> clock tick.

**OOP games** (tetris, space_Invaders, falling_sand): `main.py` instantiates a `Game`/`Simulation` class that encapsulates state. Supporting classes are in sibling modules (e.g., `block.py`, `grid.py`, `alien.py`, `spaceship.py`).

**Procedural games** (ping_pong, snake): All logic in a single file with functions and global state.

Space Invaders uses `pygame.sprite.Sprite` and `pygame.sprite.Group` for entities. Tetris and falling_sand use custom grid-based rendering without sprites.

## Entry Points by Game

| Game | Entry point | Style |
|------|------------|-------|
| ping_pong | `pong.py` | Procedural |
| snake | `snake.py` | Procedural |
| space_Invaders | `main.py` | OOP + Sprites |
| tetris | `main.py` | OOP + Grid |
| falling_sand | `main.py` | OOP + Grid |
| clock | `main.py` | In development |
| turtle | `basic/` subdirectory | Python turtle graphics |
