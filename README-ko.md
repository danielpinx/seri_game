# 🎮 Python 게임 컬렉션

Python과 Pygame을 활용하여 만든 클래식 아케이드 게임 모음집입니다. 각 게임은 객체지향 프로그래밍(OOP) 원칙을 따라 구현되었으며, 게임 개발의 기초를 학습하기에 적합합니다.

## 📋 목차

- [프로젝트 구조](#프로젝트-구조)
- [게임 목록](#게임-목록)
- [설치 및 실행](#설치-및-실행)
- [기술 스택](#기술-스택)
- [라이선스](#라이선스)

## 🗂️ 프로젝트 구조

```
game/
├── clock/              # 시계 프로젝트 (개발 중)
├── falling_sand/       # 낙하 모래 시뮬레이션
├── ping_pong/          # AI 핑퐁 게임
├── snake/              # 레트로 스네이크 게임
├── space_Invaders/     # 스페이스 인베이더 게임
└── tetris/             # 테트리스 게임
```

## 🎯 게임 목록

### 1. 🏓 핑퐁 (Ping Pong)
AI와 대결하는 클래식 핑퐁 게임입니다.

**주요 기능:**
- AI 상대방과 대전
- 실시간 점수 표시
- 부드러운 공 및 패들 애니메이션
- 키보드 방향키로 조작

**실행 방법:**
```bash
cd game/ping_pong
python pong.py
```

**조작법:**
- `↑` (위 화살표): 패들 위로 이동
- `↓` (아래 화살표): 패들 아래로 이동

---

### 2. 🐍 스네이크 (Snake)
고전적인 스네이크 게임의 레트로 버전입니다.

**주요 기능:**
- 음식을 먹으면 뱀이 길어짐
- 벽 또는 자기 몸과 충돌 시 게임 오버
- 점수 시스템
- 커스텀 그래픽 (음식 이미지)

**실행 방법:**
```bash
cd game/snake
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python snake.py
```

**조작법:**
- `↑`: 위로 이동
- `↓`: 아래로 이동
- `←`: 왼쪽으로 이동
- `→`: 오른쪽으로 이동

**참고 자료:**
- [Snake Game in Python Tutorial with pygame 🐍 (OOP)](https://www.youtube.com/watch?v=1zVlRXd8f7g)

---

### 3. 👾 스페이스 인베이더 (Space Invaders)
외계인의 침공을 막는 슈팅 게임입니다.

**주요 기능:**
- 3종류의 외계인
- 미스터리 우주선
- 장애물 시스템
- 최고 점수 저장
- 사운드 효과 및 배경 음악
- 커스텀 폰트

**실행 방법:**
```bash
cd game/space_Invaders
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**조작법:**
- `←` / `→`: 우주선 좌우 이동
- `Space`: 레이저 발사

**게임 요소:**
- **외계인**: 3가지 종류 (각기 다른 점수)
- **장애물**: 레이저로부터 보호
- **미스터리 우주선**: 랜덤 출현, 보너스 점수

**참고 자료:**
- [Python Space Invaders Game Tutorial with Pygame - Beginner Tutorial (OOP)](https://www.youtube.com/watch?v=PFMoo_dvhyw)

---

### 4. 🧱 테트리스 (Tetris)
클래식 퍼즐 게임 테트리스입니다.

**주요 기능:**
- 7가지 테트로미노 블록
- 줄 제거 시스템
- 점수 시스템
- 다음 블록 미리보기
- 부드러운 블록 회전
- 컬러풀한 블록 디자인

**실행 방법:**
```bash
cd game/tetris
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**조작법:**
- `←` / `→`: 블록 좌우 이동
- `↓`: 블록 빠르게 낙하
- `↑` 또는 `Space`: 블록 회전

**참고 자료:**
- [Creating Tetris in Python with pygame - Beginner Tutorial (OOP)](https://www.youtube.com/watch?v=nF_crEtmpBo)

---

### 5. 🌊 낙하 모래 (Falling Sand)
물리 시뮬레이션을 이용한 모래 낙하 게임입니다.

**주요 기능:**
- 실시간 파티클 시뮬레이션
- 마우스 인터랙션
- 격자 기반 물리 엔진
- 120 FPS 고성능 렌더링

**실행 방법:**
```bash
cd game/falling_sand
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

**구조:**
- `simulation.py`: 시뮬레이션 로직
- `grid.py`: 격자 시스템
- `particle.py`: 파티클 클래스

---

### 6. 🕐 시계 (Clock)
Pygame 기반 시계 프로젝트 (개발 진행 중)

**실행 방법:**
```bash
cd game/clock
python main.py
```

---

## 🚀 설치 및 실행

### 공통 사전 요구사항

- Python 3.11.6 이상 (권장)
- pip (Python 패키지 관리자)
- Pygame 또는 Pygame-CE

### 일반적인 설치 절차

1. **저장소 클론**
```bash
git clone <repository-url>
cd game
```

2. **특정 게임 디렉토리로 이동**
```bash
cd game/<게임_이름>
```

3. **가상 환경 생성 및 활성화** (권장)
```bash
python -m venv .venv
source .venv/bin/activate  # Mac/Linux
# 또는
.venv\Scripts\activate  # Windows
```

4. **의존성 설치** (requirements.txt가 있는 경우)
```bash
pip install -r requirements.txt
```

5. **게임 실행**
```bash
python main.py  # 또는 해당 게임의 메인 파일
```

6. **가상 환경 비활성화**
```bash
deactivate
```

### pyenv 사용 시 (선택사항)

```bash
pyenv versions
pyenv local 3.11.6
```

---

## 🛠️ 기술 스택

- **언어**: Python 3.11+
- **게임 엔진**: Pygame / Pygame-CE
- **개발 패러다임**: 객체지향 프로그래밍 (OOP)
- **디자인 패턴**: 
  - 게임 루프 패턴
  - 상태 관리
  - 충돌 감지 시스템
  - 이벤트 핸들링

### 주요 라이브러리

```
pygame        # 핑퐁, 스네이크, 테트리스, 낙하 모래
pygame-ce     # 스페이스 인베이더 (Pygame Community Edition)
```

---

## 🎮 게임별 특징 요약

| 게임 | 난이도 | OOP | 사운드 | AI | 물리 엔진 |
|------|--------|-----|--------|----|---------| 
| 핑퐁 | ⭐ | ✓ | ✗ | ✓ | ✗ |
| 스네이크 | ⭐⭐ | ✓ | ✗ | ✗ | ✗ |
| 스페이스 인베이더 | ⭐⭐⭐ | ✓ | ✓ | ✗ | ✗ |
| 테트리스 | ⭐⭐⭐ | ✓ | ✗ | ✗ | ✗ |
| 낙하 모래 | ⭐⭐⭐⭐ | ✓ | ✗ | ✗ | ✓ |

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

```
MIT License
Copyright (c) 2026 Seri1436
```

---

**즐거운 게임 개발 되세요! 🎉**
