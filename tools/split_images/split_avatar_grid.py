#!/usr/bin/env python3
"""
아바타 격자 이미지를 개별 파일로 분할하는 스크립트.
- 이미지 크기 확인
- 지정한 행/열 수로 균등 분할 후 저장
"""

import os
import sys
from PIL import Image


def get_image_info(image_path: str) -> tuple[Image.Image, int, int] | None:
    """이미지를 열고 크기 정보를 반환합니다."""
    if not os.path.exists(image_path):
        print(f"❌ 에러: '{image_path}' 파일을 찾을 수 없습니다.")
        return None
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size
    return img, w, h


def split_and_save(
    image_path: str,
    output_folder: str = "avatars_split",
    rows: int = 8,
    cols: int = 8,
    prefix: str = "avatar",
    output_size: tuple[int, int] | None = None,
    margin: int = 0,
) -> None:
    """
    이미지를 rows x cols 격자로 균등 분할하여 개별 파일로 저장합니다.

    Args:
        image_path: 원본 이미지 경로
        output_folder: 저장할 폴더
        rows: 행 수 (기본 8)
        cols: 열 수 (기본 8)
        prefix: 저장 파일명 접두사 (기본 "avatar")
        output_size: 저장 시 리사이즈할 크기 (width, height). None이면 크롭한 그대로 저장.
        margin: 상하좌우 마진(px). 지정 시 마진 제거 후 분할 (기본 0)
    """
    result = get_image_info(image_path)
    if result is None:
        return
    img, width, height = result

    if margin > 0:
        img = img.crop((margin, margin, width - margin, height - margin))
        width, height = img.size
        print(f"📐 마진 {margin}px 적용 후: {width} x {height} px")

    print(f"📐 이미지 크기: {width} x {height} px")
    print(f"📐 분할: {rows}행 x {cols}열 = {rows * cols}개")

    cell_w = width // cols
    cell_h = height // rows
    print(f"📐 셀 크기: {cell_w} x {cell_h} px")
    if output_size:
        print(f"📐 저장 크기: {output_size[0]} x {output_size[1]} px (리사이즈)")
    print()

    os.makedirs(output_folder, exist_ok=True)
    count = 0

    for row in range(rows):
        for col in range(cols):
            x = col * cell_w
            y = row * cell_h
            box = (x, y, x + cell_w, y + cell_h)
            cell = img.crop(box)
            if output_size:
                cell = cell.resize(output_size, Image.Resampling.LANCZOS)
            count += 1
            filename = f"{prefix}_{count:03d}.png"
            save_path = os.path.join(output_folder, filename)
            cell.save(save_path)

    print(f"✅ 완료: {count}개 파일이 '{output_folder}'에 저장되었습니다.")


def main():
    # 기본값: 1024x1024 → 8x8 격자, 128x128 정사각형 셀 (64개)
    image_path = "images/img1.png"
    output_folder = "avatars_split"
    rows = 8
    cols = 8
    output_size = (512, 512)  # 저장 시 512x512 정사각형으로 리사이즈 (기본)
    margin = 0

    # --size/-s, --margin/-m 다음 값은 args에서 제외 (행/열로 오인 방지)
    exclude = set()
    for opt in ("--size", "-s", "--no-resize", "--info", "-i", "--margin", "-m"):
        if opt in sys.argv:
            i = sys.argv.index(opt)
            exclude.add(i)
            if opt in ("--size", "-s", "--margin", "-m") and i + 1 < len(sys.argv):
                exclude.add(i + 1)
    args = [a for i, a in enumerate(sys.argv[1:], 1) if i not in exclude and not a.startswith("--")]

    if "--no-resize" in sys.argv:
        output_size = None
    elif "--size" in sys.argv or "-s" in sys.argv:
        try:
            i = sys.argv.index("--size") if "--size" in sys.argv else sys.argv.index("-s")
            s = int(sys.argv[i + 1])
            output_size = (s, s)
        except (IndexError, ValueError):
            output_size = (128, 128)
    elif len(args) >= 5:
        output_size = (int(args[4]), int(args[4]))

    if "--margin" in sys.argv or "-m" in sys.argv:
        try:
            i = sys.argv.index("--margin") if "--margin" in sys.argv else sys.argv.index("-m")
            margin = int(sys.argv[i + 1])
        except (IndexError, ValueError):
            margin = 0

    if len(args) >= 1:
        image_path = args[0]
    if len(args) >= 2:
        output_folder = args[1]
    if len(args) >= 3:
        rows = int(args[2])
    if len(args) >= 4:
        cols = int(args[3])

    # 크기만 확인할 때 (--info)
    if "--info" in sys.argv or "-i" in sys.argv:
        result = get_image_info(image_path)
        if result:
            _, w, h = result
            print(f"이미지: {image_path}")
            print(f"크기: {w} x {h} px")
        return

    split_and_save(
        image_path=image_path,
        output_folder=output_folder,
        rows=rows,
        cols=cols,
        output_size=output_size,
        margin=margin,
    )


if __name__ == "__main__":
    main()
