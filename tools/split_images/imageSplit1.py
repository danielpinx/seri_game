import os
from PIL import Image

def slice_icons(image_path, output_folder, icon_size=(50, 50), padding=2):
    """
    시트 이미지를 개별 아이콘으로 잘라서 저장합니다.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # 이미지 열기
    img = Image.open(image_path).convert("RGBA")
    img_width, img_height = img.size

    count = 0
    # 행과 열을 순회하며 자르기
    # 이미지의 상단 제목이나 여백을 고려하여 시작 위치(y, x)를 조정할 수 있습니다.
    for y in range(0, img_height - icon_size[1], icon_size[1] + padding):
        for x in range(0, img_width - icon_size[0], icon_size[0] + padding):
            
            # 아이콘 영역 설정
            box = (x, y, x + icon_size[0], y + icon_size[1])
            icon = img.crop(box)

            # 완전히 투명하거나 내용이 없는 파일은 저장하지 않음 (선택 사항)
            if icon.getextrema()[3][1] > 0: 
                count += 1
                icon.save(os.path.join(output_folder, f"icon_{count:03d}.png"))

    print(f"✅ 작업 완료! {count}개의 아이콘이 '{output_folder}' 폴더에 저장되었습니다.")

# --- 설정값 ---
# 1. 파일 경로: 이미지 파일 이름을 입력하세요 (예: 'Gemini_Generated_Image.jpg')
# 2. 저장 폴더: 결과물이 저장될 폴더명
# 3. 아이콘 사이즈: 요청하신 50x50
# 4. 패딩: 아이콘 사이의 간격 (이미지에 따라 0~5 사이 조정 필요)

slice_icons('./images/your_image_file.jpg', './images/extracted_icons', icon_size=(50, 50), padding=5)