#!/usr/bin/env python3
"""
스프라이트 시트 형태의 프로필 이미지를 개별 이미지로 분할하는 프로그램
"""

from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow 라이브러리가 필요합니다. 설치: pip install Pillow")
    exit(1)


def split_profile_grid(
    input_path: str,
    output_dir: str | None = None,
    rows: int = 8,
    cols: int = 10,
    output_prefix: str = "profile",
    output_format: str = "png",
) -> list[Path]:
    """
    그리드 형태의 이미지를 개별 이미지로 분할합니다.

    Args:
        input_path: 입력 이미지 경로
        output_dir: 출력 디렉토리 (None이면 입력 파일과 같은 위치의 'split_output' 폴더)
        rows: 그리드 행 수
        cols: 그리드 열 수
        output_prefix: 출력 파일명 접두사
        output_format: 출력 이미지 형식 (png, jpg 등)

    Returns:
        생성된 파일 경로 목록
    """
    input_path = Path(input_path)
    if not input_path.exists():
        raise FileNotFoundError(f"입력 파일을 찾을 수 없습니다: {input_path}")

    output_dir = Path(output_dir) if output_dir else input_path.parent / "split_output"
    output_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    cell_width = width // cols
    cell_height = height // rows

    saved_paths = []
    for row in range(rows):
        for col in range(cols):
            left = col * cell_width
            top = row * cell_height
            right = left + cell_width
            bottom = top + cell_height

            cell = img.crop((left, top, right, bottom))

            filename = f"{output_prefix}_{row * cols + col + 1:02d}.{output_format}"
            output_path = output_dir / filename
            cell.save(output_path, format=output_format.upper())
            saved_paths.append(output_path)

    return saved_paths


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="그리드 형태의 프로필 이미지를 개별 이미지로 분할"
    )
    parser.add_argument(
        "input",
        nargs="?",
        default="images/profile_img1.png",
        help="입력 이미지 경로 (기본: images/profile_img1.png)",
    )
    parser.add_argument(
        "-o", "--output-dir",
        help="출력 디렉토리 (기본: 입력 파일 위치의 split_output 폴더)",
    )
    parser.add_argument(
        "-r", "--rows",
        type=int,
        default=8,
        help="그리드 행 수 (기본: 8)",
    )
    parser.add_argument(
        "-c", "--cols",
        type=int,
        default=10,
        help="그리드 열 수 (기본: 10)",
    )
    parser.add_argument(
        "-p", "--prefix",
        default="profile",
        help="출력 파일명 접두사 (기본: profile)",
    )
    parser.add_argument(
        "-f", "--format",
        default="png",
        choices=["png", "jpg", "webp"],
        help="출력 이미지 형식 (기본: png)",
    )

    args = parser.parse_args()

    try:
        paths = split_profile_grid(
            input_path=args.input,
            output_dir=args.output_dir,
            rows=args.rows,
            cols=args.cols,
            output_prefix=args.prefix,
            output_format=args.format,
        )
        print(f"✓ {len(paths)}개의 이미지를 저장했습니다.")
        print(f"  저장 위치: {paths[0].parent}")
    except FileNotFoundError as e:
        print(f"오류: {e}")
        exit(1)


if __name__ == "__main__":
    main()
