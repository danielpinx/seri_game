import os
import sys
from PIL import Image

def slice_icons(image_path='sample.png', output_folder='extracted_icons', icon_size=(50, 50), padding=5):
    if not os.path.exists(image_path):
        print(f"❌ 에러: '{image_path}' 파일을 찾을 수 없습니다.")
        return

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    try:
        img = Image.open(image_path).convert("RGBA")
        img_width, img_height = img.size
        print(f"📂 '{image_path}' 처리 중... (크기: {img_width}x{img_height})")

        # 경로에서 순수 파일 이름만 추출 (예: ./images/pic1.png -> pic1)
        base_name = os.path.splitext(os.path.basename(image_path))[0]

        count = 0
        for y in range(0, img_height - icon_size[1] + 1, icon_size[1] + padding):
            for x in range(0, img_width - icon_size[0] + 1, icon_size[0] + padding):
                
                box = (x, y, x + icon_size[0], y + icon_size[1])
                icon = img.crop(box)

                if icon.getbbox(): 
                    count += 1
                    # 수정된 부분: base_name을 사용하여 경로 충돌 방지
                    file_name = f"{base_name}_icon_{count:03d}.png"
                    save_path = os.path.join(output_folder, file_name)
                    icon.save(save_path)

        print(f"✅ 작업 완료! {count}개의 아이콘이 '{output_folder}' 폴더에 저장되었습니다.")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    target_file = sys.argv[1] if len(sys.argv) > 1 else 'sample.png'
    slice_icons(target_file)