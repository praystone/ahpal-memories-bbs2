# -*- coding: utf-8 -*-
import json, os

SRC = "static/data/posts-fid09.json"
OUT_DIR = "static/data"
CHUNKS = 10

print(f"讀取：{SRC}")
with open(SRC, 'r', encoding='utf-8') as f:
    posts = json.load(f)

print(f"總帖子數：{len(posts)}")

# 移除 useip（隱私 + 縮小）
for p in posts:
    if "useip" in p:
        del p["useip"]

# 按 tid 排序
posts.sort(key=lambda x: x.get("tid", 0))

# 平均分 10 檔
chunk_size = len(posts) // CHUNKS + 1
print(f"每檔約：{chunk_size} 篇")

for i in range(CHUNKS):
    start = i * chunk_size
    end = start + chunk_size
    chunk = posts[start:end]
    if not chunk:
        continue
    out = os.path.join(OUT_DIR, f"posts-fid09-{i+1:02d}.json")
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(chunk, f, ensure_ascii=False, separators=(',', ':'))
    size_mb = os.path.getsize(out) / 1024 / 1024
    print(f"  {out}: {len(chunk)} 篇, {size_mb:.2f} MB")

# 刪除原檔
os.remove(SRC)
print(f"已刪除：{SRC}")
