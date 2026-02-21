cd ./tools/split_images

# HTML
image_grid_crop.html 실행

# 개별 실행
pyenv versions
pyenv local 3.12.12
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

## 기본: 8×8, 512×512
python3 split_avatar_grid.py images/img1.png avatars_split

## 경계가 어긋날 때 마진 적용
python3 split_avatar_grid.py images/img1.png avatars_split 8 8 --margin 8
