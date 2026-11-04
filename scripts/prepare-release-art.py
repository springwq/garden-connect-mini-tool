"""Build a local preview for deterministic publication assets, outside the game ZIP."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
out=root/'artifacts/release-art-preview'
(out/'assets').mkdir(parents=True,exist_ok=True)
for name in ('toys-v6.webp','toys-v7-extra.webp','world-v6.jpg'):
    shutil.copyfile(root/'src/assets'/name,out/'assets'/name)
shutil.copyfile(root/'src/art.js',out/'art.js')
shutil.copyfile(root/'scripts/release-art.js',out/'release-art.js')
(out/'index.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>开心连连看发布素材</title><body style="background:#eee;font-family:system-ui"><h1>发布素材</h1><p id="status">素材准备中</p><h2>图标</h2><canvas id="release-icon" width="512" height="512" style="width:256px"></canvas><h2>封面</h2><canvas id="release-cover" width="1080" height="1440" style="width:405px"></canvas><script src="./art.js"></script><script src="./release-art.js"></script></body></html>''')
print(out)
