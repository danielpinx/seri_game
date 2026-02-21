# 🎮 Seri Arcade

Python/Pygame으로 만든 클래식 아케이드 게임 + Next.js 웹 포털에서 25개 게임을 플레이할 수 있는 프로젝트입니다.

## 📋 목차

- [프로젝트 구조](#프로젝트-구조)
- [웹 포털](#웹-포털)
- [게임 목록](#게임-목록)
- [Python 게임 (원본)](#python-게임-원본)
- [설치 및 실행](#설치-및-실행)
- [기술 스택](#기술-스택)
- [라이선스](#라이선스)

## 🗂️ 프로젝트 구조

```
seri_game/
├── portal/                     # Next.js 웹 포털 (25개 게임)
│   ├── src/
│   │   ├── app/                # Next.js App Router (페이지, 레이아웃)
│   │   ├── engine/             # 공통 게임 엔진 (BaseGame, InputManager)
│   │   ├── games/              # 각 게임 구현 (26개 디렉토리)
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
│   │   │   └── index.ts        #   게임 레지스트리
│   │   ├── components/         # UI 컴포넌트
│   │   │   ├── layout/         #   Sidebar, UserPanel, SettingsModal
│   │   │   └── game/           #   GameCanvas, GameOverlay
│   │   ├── config/             # 상수 (GP, 설정, 아바타 등)
│   │   ├── store/              # Zustand 상태 관리 (GP, 설정)
│   │   └── lib/                # 유틸리티 (GP 시스템, 설정, diffValue)
│   └── public/
│       └── images/avatars/     # 프로필 아바타 이미지
├── game/                       # 원본 Python/Pygame 게임
│   ├── clock/                  #   시계 프로젝트 (개발 중)
│   ├── falling_sand/           #   낙하 모래 시뮬레이션
│   ├── ping_pong/              #   AI 핑퐁 게임
│   ├── snake/                  #   레트로 스네이크 게임
│   ├── space_Invaders/         #   스페이스 인베이더 게임
│   ├── tetris/                 #   테트리스 게임
│   └── turtle/                 #   터틀 그래픽
├── README.md                   # 한국어 README
└── README-en.md                # English README
```

---

## 🌐 웹 포털

Next.js 16 기반의 웹 아케이드 포털로, 브라우저에서 25개 게임을 바로 플레이할 수 있습니다.

**주요 기능:**
- GP(Game Points) 시스템 - 매일 1000GP 지급
- 설정 시스템 - 닉네임, 아바타, 난이도 조절 (5단계)
- 난이도 연동 - 20개 게임에 실제 적용 (Very Easy ~ Very Hard)
- 반응형 글래스모피즘 UI

**실행 방법:**
```bash
cd portal
npm install
npm run dev     # http://localhost:3000
```

---

## 🎯 게임 목록 (25개)

### 아케이드 / 액션

| # | 게임 | 설명 | 조작 | 난이도 조절 |
|---|------|------|------|:-----------:|
| 1 | 🏓 **Pong** | AI 상대 패들 배틀 | Arrow Up/Down | ✓ |
| 2 | 🐍 **Snake** | 먹고, 자라고, 생존 | Arrow Keys | ✓ |
| 3 | 👾 **Space Invaders** | 외계인 침공 방어 | Left/Right + Space | ✓ |
| 4 | 🧱 **Breakout** | 벽돌 부수기 콤보 | Left/Right + Space | ✓ |
| 5 | 🚀 **Asteroids** | 우주에서 소행성 파괴 | Arrows + Space | ✓ |
| 6 | 👻 **Pac-Man** | 점 먹기, 유령 피하기 | Arrow Keys | ✓ |
| 7 | 🤠 **Doodle Jump** | 끝없이 높이 점프 | Left/Right + Space | ✓ |
| 8 | 🔨 **Whack-a-Mole** | 두더지 잡기, 폭탄 주의 | Mouse click | ✓ |
| 9 | 🎯 **Bubble Shooter** | 버블 쏘고 터트리기 | Mouse aim + click | ✓ |
| 10 | 🏰 **Tower Defense** | 타워 건설, 웨이브 방어 | Mouse + 1/2/3 keys | ✓ |

### 리듬 / 타이핑

| # | 게임 | 설명 | 조작 | 난이도 조절 |
|---|------|------|------|:-----------:|
| 11 | 🎵 **Rhythm** | 비트에 맞춰 노트 히트 | D / F / J / K | ✓ |
| 12 | ⌨️ **Type Attack** | 떨어지는 단어 타이핑 | Keyboard | ✓ |

### 퍼즐 / 전략

| # | 게임 | 설명 | 조작 | 난이도 조절 |
|---|------|------|------|:-----------:|
| 13 | 🧩 **Tetris** | 블록 쌓기, 줄 제거 | Arrows + Space | ✓ |
| 14 | 🔢 **2048** | 타일 합치기, 2048 달성 | Arrow Keys | - |
| 15 | 🔴 **Connect Four** | AI 상대 4목 대결 | Mouse click | ✓ |
| 16 | ♟️ **Checkers** | AI 상대 체커 | Mouse click | ✓ |
| 17 | 🔢 **Sudoku** | 9x9 숫자 퍼즐 | Mouse + Number keys | ✓ |
| 18 | 🃏 **Memory Match** | 카드 뒤집기, 짝 찾기 | Mouse click | ✓ |
| 19 | 💀 **Hangman** | 단어 맞추기 | Keyboard + Mouse | ✓ |
| 20 | 📝 **Wordle** | 5글자 단어 추측 | Keyboard + Mouse | ✓ |
| 21 | 📦 **Sokoban** | 상자 밀어 목표로 | Arrow Keys + Z/R | - |
| 22 | 🔧 **Pipe Puzzle** | 파이프 연결, 물 흘리기 | Mouse click | - |

### 창작 / 샌드박스

| # | 게임 | 설명 | 조작 | 난이도 조절 |
|---|------|------|------|:-----------:|
| 23 | 🌊 **Falling Sand** | 입자 물리 시뮬레이션 | Click + 1/2/3/4 keys | - |
| 24 | 🧱 **Brick Builder** | 블록 배치, 줄 제거 | Mouse drag & drop | - |

### 기억력 / 기타

| # | 게임 | 설명 | 조작 | 난이도 조절 |
|---|------|------|------|:-----------:|
| 25 | 🎮 **Simon Says** | 패턴 기억하고 반복 | Mouse + Q/W/A/S | ✓ |
| - | ♠️ **Solitaire** | 클래식 클론다이크 카드 | Mouse drag & drop | - |

---

## 🐍 Python 게임 (원본)

`game/` 디렉토리에 있는 원본 Python/Pygame 게임입니다. 웹 포털의 기반이 된 프로토타입입니다.

### 1. 🏓 핑퐁 (Ping Pong)
AI와 대결하는 클래식 핑퐁 게임

```bash
cd game/ping_pong
python pong.py
```
- `↑`/`↓`: 패들 이동

---

### 2. 🐍 스네이크 (Snake)
고전적인 스네이크 게임

```bash
cd game/snake
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python snake.py
```
- Arrow Keys: 이동

---

### 3. 👾 스페이스 인베이더 (Space Invaders)
외계인 침공을 막는 슈팅 게임 (Pygame-CE 사용)

```bash
cd game/space_Invaders
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
- `←`/`→`: 이동, `Space`: 발사

---

### 4. 🧱 테트리스 (Tetris)
클래식 퍼즐 게임

```bash
cd game/tetris
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
- `←`/`→`: 이동, `↑`/`Space`: 회전, `↓`: 빠른 낙하

---

### 5. 🌊 낙하 모래 (Falling Sand)
물리 시뮬레이션 샌드박스

```bash
cd game/falling_sand
source venv/bin/activate
python main.py
```
- 마우스 클릭: 파티클 배치

---

### 6. 🕐 시계 (Clock)
Pygame 기반 시계 프로젝트 (개발 중)

```bash
cd game/clock
python main.py
```

---

## 🚀 설치 및 실행

### 웹 포털 (권장)

```bash
cd portal
npm install
npm run dev
```
> http://localhost:3000 에서 모든 게임 플레이 가능

### Python 게임

**공통 요구사항:** Python 3.11+, pip

```bash
cd game/<게임_이름>
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py  # 또는 해당 게임의 메인 파일
```

---

## 🛠️ 기술 스택

### 웹 포털
- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4 (글래스모피즘 테마)
- **상태 관리**: Zustand
- **게임 엔진**: Canvas 2D, 커스텀 BaseGame 추상 클래스

### Python 게임
- **언어**: Python 3.11+
- **게임 엔진**: Pygame / Pygame-CE
- **패러다임**: OOP (객체지향 프로그래밍)

---

## 🎮 게임별 특징 요약

| 게임 | 플랫폼 | OOP | 사운드 | AI | 물리 엔진 |
|------|:------:|:---:|:------:|:--:|:---------:|
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

## 📝 라이선스

이 프로젝트는 GPL-3.0 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

```
GNU General Public License v3.0
Copyright (c) 2026 Seri1436
```

---

**즐거운 게임 개발 되세요! 🎉**
