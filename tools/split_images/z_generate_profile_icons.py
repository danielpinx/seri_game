#!/usr/bin/env python3
"""
게임 포털 사이트용 창의적 프로필 아이콘 100장 생성기
Pillow를 사용하여 각각 다른 디자인의 아이콘을 생성합니다.
"""

import os
import math
import random
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow가 필요합니다. 설치: pip install Pillow")
    exit(1)

# 출력 폴더
OUTPUT_DIR = Path(__file__).parent / "profile_icons"
SIZE = 256
ICON_COUNT = 100


def random_color(palette: list | None = None) -> tuple[int, int, int]:
    """랜덤 색상 또는 팔레트에서 선택"""
    palettes = [
        [(255, 99, 71), (255, 165, 0), (255, 215, 0), (50, 205, 50), (30, 144, 255)],
        [(138, 43, 226), (255, 105, 180), (0, 191, 255), (255, 69, 0), (124, 252, 0)],
        [(255, 20, 147), (0, 255, 127), (135, 206, 250), (255, 140, 0), (147, 112, 219)],
        [(34, 139, 34), (255, 0, 255), (0, 206, 209), (255, 127, 80), (218, 165, 32)],
        [(72, 61, 139), (220, 20, 60), (0, 128, 128), (255, 218, 185), (70, 130, 180)],
        [(255, 228, 196), (127, 255, 0), (210, 105, 30), (64, 224, 208), (255, 160, 122)],
    ]
    palette = palette or random.choice(palettes)
    return random.choice(palette)


def gradient_background(draw: ImageDraw.ImageDraw, size: int, colors: list[tuple]) -> None:
    """그라데이션 배경"""
    for y in range(size):
        ratio = y / size
        r = int(colors[0][0] * (1 - ratio) + colors[1][0] * ratio)
        g = int(colors[0][1] * (1 - ratio) + colors[1][1] * ratio)
        b = int(colors[0][2] * (1 - ratio) + colors[1][2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))


def create_geometric_avatar(seed: int) -> Image.Image:
    """기하학적 패턴 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (240, 240, 245))
    draw = ImageDraw.Draw(img)
    
    colors = [random_color() for _ in range(4)]
    gradient_background(draw, SIZE, [colors[0], colors[1]])
    
    # 중앙 원
    center = SIZE // 2
    for i in range(4, 0, -1):
        r = center - 10 * i
        draw.ellipse([center - r, center - r, center + r, center + r], 
                     outline=colors[i % len(colors)], width=4)
    
    # 대각선 패턴
    for _ in range(6):
        x1, y1 = random.randint(0, SIZE), random.randint(0, SIZE)
        x2, y2 = random.randint(0, SIZE), random.randint(0, SIZE)
        draw.line([(x1, y1), (x2, y2)], fill=random_color(), width=2)
    
    return img


def create_pixel_style_avatar(seed: int) -> Image.Image:
    """픽셀 스타일 게임 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (30, 30, 40))
    draw = ImageDraw.Draw(img)
    
    pixel_size = SIZE // 8
    colors = [random_color() for _ in range(3)]
    
    # 랜덤 픽셀 아트 패턴
    for row in range(8):
        for col in range(8):
            if random.random() > 0.3:
                x1, y1 = col * pixel_size, row * pixel_size
                x2, y2 = x1 + pixel_size, y1 + pixel_size
                draw.rectangle([x1, y1, x2, y2], fill=random.choice(colors))
    
    return img


def create_abstract_shape_avatar(seed: int) -> Image.Image:
    """추상 도형 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (25, 25, 35))
    draw = ImageDraw.ImageDraw(img)
    
    center = SIZE // 2
    num_shapes = random.randint(5, 12)
    
    for _ in range(num_shapes):
        n_sides = random.choice([3, 4, 5, 6, 8])
        radius = random.randint(30, 100)
        angle_offset = random.random() * 2 * math.pi
        
        points = []
        for i in range(n_sides):
            angle = angle_offset + (2 * math.pi * i / n_sides)
            x = center + radius * math.cos(angle)
            y = center + radius * math.sin(angle)
            points.append((x, y))
        
        if len(points) >= 2:
            draw.polygon(points, outline=random_color(), fill=None, width=3)
    
    return img


def create_gradient_circle_avatar(seed: int) -> Image.Image:
    """그라데이션 원형 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    colors = [random_color() for _ in range(2)]
    gradient_background(draw, SIZE, colors)
    
    # 여러 겹의 원
    center = SIZE // 2
    for r in range(110, 20, -15):
        alpha = 128 + random.randint(0, 127)
        overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        c = random_color()
        overlay_draw.ellipse([center - r, center - r, center + r, center + r], 
                            fill=(*c, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(img)
    
    return img


def create_star_burst_avatar(seed: int) -> Image.Image:
    """별 모양 터짐 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (15, 15, 25))
    draw = ImageDraw.Draw(img)
    
    center = SIZE // 2
    colors = [random_color() for _ in range(3)]
    
    for i in range(12):
        angle = (2 * math.pi * i / 12) + random.random() * 0.2
        length = 80 + random.randint(0, 40)
        x2 = center + length * math.cos(angle)
        y2 = center + length * math.sin(angle)
        draw.line([(center, center), (x2, y2)], fill=random.choice(colors), width=4)
    
    draw.ellipse([center - 25, center - 25, center + 25, center + 25], 
                 fill=random.choice(colors))
    
    return img


def create_dice_avatar(seed: int) -> Image.Image:
    """주사위/게임 스타일"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (245, 245, 250))
    draw = ImageDraw.Draw(img)
    
    bg_color = random_color()
    draw.rectangle([0, 0, SIZE, SIZE], fill=bg_color)
    
    # 둥근 모서리 효과를 위한 원들
    dot_color = random_color()
    positions = [
        [(SIZE//4, SIZE//4), (SIZE*3//4, SIZE*3//4)],
        [(SIZE//4, SIZE//2), (SIZE*3//4, SIZE//2)],
        [(SIZE//2, SIZE//4), (SIZE//2, SIZE*3//4)],
        [(SIZE//4, SIZE//4), (SIZE*3//4, SIZE//4), (SIZE//2, SIZE//2)],
    ]
    pos_set = random.choice(positions)
    for pos in pos_set:
        x, y = pos
        r = 20 + random.randint(0, 15)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=dot_color)
    
    return img


def create_hexagon_avatar(seed: int) -> Image.Image:
    """육각형 패턴 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (20, 20, 30))
    draw = ImageDraw.Draw(img)
    
    center = SIZE // 2
    colors = [random_color() for _ in range(4)]
    
    for ring in range(1, 4):
        radius = 30 * ring
        for i in range(6):
            angle = math.pi / 6 + (math.pi / 3 * i)
            x = center + radius * math.cos(angle)
            y = center + radius * math.sin(angle)
            points = []
            for j in range(6):
                a = angle + (math.pi / 3 * j)
                px = x + 15 * math.cos(a)
                py = y + 15 * math.sin(a)
                points.append((px, py))
            if len(points) >= 3:
                draw.polygon(points, outline=random.choice(colors), fill=None, width=2)
    
    draw.ellipse([center - 20, center - 20, center + 20, center + 20], 
                 fill=random.choice(colors))
    
    return img


def create_wave_avatar(seed: int) -> Image.Image:
    """물결 패턴 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (250, 250, 255))
    draw = ImageDraw.Draw(img)
    
    colors = [random_color() for _ in range(2)]
    gradient_background(draw, SIZE, colors)
    
    # 사인파 형태의 곡선
    for wave in range(3):
        points = []
        for x in range(0, SIZE + 1, 4):
            y = SIZE // 2 + 30 * math.sin(x * 0.05 + wave * 2) + random.randint(-10, 10)
            points.append((x, y))
        if len(points) >= 2:
            draw.line(points, fill=random_color(), width=3)
    
    return img


def create_retro_game_avatar(seed: int) -> Image.Image:
    """레트로 게임 스타일 (8비트 느낌)"""
    random.seed(seed)
    block_size = SIZE // 16
    img = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), 
               (255, 0, 255), (0, 255, 255), (255, 128, 0)]
    
    # 심플한 캐릭터/아이템 형태
    patterns = [
        lambda r, c: (r + c) % 2 == 0,
        lambda r, c: r < 8 and c < 8,
        lambda r, c: abs(r - 7.5) + abs(c - 7.5) < 8,
        lambda r, c: (r - 8) ** 2 + (c - 8) ** 2 < 64,
    ]
    pattern = random.choice(patterns)
    
    for row in range(16):
        for col in range(16):
            if pattern(row, col) and random.random() > 0.2:
                x1, y1 = col * block_size, row * block_size
                x2, y2 = x1 + block_size, y1 + block_size
                draw.rectangle([x1, y1, x2, y2], fill=random.choice(palette))
    
    return img


def create_emoji_style_avatar(seed: int) -> Image.Image:
    """이모지/캐릭터 스타일 (눈, 입 있는 얼굴)"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (255, 230, 200))
    draw = ImageDraw.Draw(img)
    
    # 얼굴 원
    face_color = (
        255 - random.randint(0, 30),
        220 - random.randint(0, 40),
        180 - random.randint(0, 30)
    )
    draw.ellipse([20, 20, SIZE - 20, SIZE - 20], fill=face_color, outline=(100, 80, 60))
    
    # 눈
    eye_y = SIZE // 2 - 20
    left_eye_x = SIZE // 2 - 35
    right_eye_x = SIZE // 2 + 35
    eye_color = (50, 50, 50)
    draw.ellipse([left_eye_x - 12, eye_y - 12, left_eye_x + 12, eye_y + 12], fill=eye_color)
    draw.ellipse([right_eye_x - 12, eye_y - 12, right_eye_x + 12, eye_y + 12], fill=eye_color)
    
    # 입 (다양한 스타일)
    mouth_styles = [
        lambda: draw.arc([SIZE//2 - 40, SIZE//2, SIZE//2 + 40, SIZE//2 + 60], 0, 180, fill=(100, 50, 50), width=4),
        lambda: draw.ellipse([SIZE//2 - 20, SIZE//2 + 30, SIZE//2 + 20, SIZE//2 + 50], fill=(150, 80, 80)),
    ]
    random.choice(mouth_styles)()
    
    return img


def create_glow_orb_avatar(seed: int) -> Image.Image:
    """빛나는 구체 아바타"""
    random.seed(seed)
    img = Image.new("RGB", (SIZE, SIZE), (10, 10, 20))
    draw = ImageDraw.Draw(img)
    
    base_color = random_color()
    center = SIZE // 2
    
    # 발광 효과 (여러 겹의 반투명 원)
    for r in range(120, 10, -10):
        factor = 1 - (r / 120) * 0.7
        c = (int(base_color[0] * factor), int(base_color[1] * factor), int(base_color[2] * factor))
        draw.ellipse([center - r, center - r, center + r, center + r], fill=c)
    
    # 중앙 하이라이트
    highlight = (min(255, base_color[0] + 80), min(255, base_color[1] + 80), min(255, base_color[2] + 80))
    draw.ellipse([center - 30, center - 30, center + 30, center + 30], fill=highlight)
    
    return img


# 모든 아바타 생성 함수
AVATAR_GENERATORS = [
    create_geometric_avatar,
    create_pixel_style_avatar,
    create_abstract_shape_avatar,
    create_star_burst_avatar,
    create_dice_avatar,
    create_hexagon_avatar,
    create_wave_avatar,
    create_retro_game_avatar,
    create_emoji_style_avatar,
    create_glow_orb_avatar,
]


def add_rounded_mask(img: Image.Image) -> Image.Image:
    """원형 마스크 적용 (프로필 아이콘처럼)"""
    mask = Image.new("L", (SIZE, SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, SIZE, SIZE], fill=255)
    
    output = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)
    return output


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"게임 포털용 프로필 아이콘 {ICON_COUNT}개 생성 중...")
    print(f"저장 위치: {OUTPUT_DIR.absolute()}")
    
    for i in range(ICON_COUNT):
        generator = random.choice(AVATAR_GENERATORS)
        try:
            img = generator(i * 42 + 12345)  # 시드로 재현 가능
        except Exception:
            img = create_geometric_avatar(i)  # 폴백
        
        # 원형 마스크 적용 (선택: 주석 해제하면 원형 아이콘)
        # img = add_rounded_mask(img.convert("RGBA"))
        # ext = "png"
        
        ext = "png"
        if img.mode != "RGBA":
            img = img.convert("RGB")
        
        filepath = OUTPUT_DIR / f"profile_icon_{i:03d}.{ext}"
        img.save(filepath, "PNG", optimize=True)
        
        if (i + 1) % 20 == 0:
            print(f"  {i + 1}/{ICON_COUNT} 완료")
    
    print(f"\n완료! {ICON_COUNT}개 아이콘이 생성되었습니다.")
    print(f"사용 예: <img src='profile_icons/profile_icon_000.png' alt='프로필' />")


if __name__ == "__main__":
    main()
