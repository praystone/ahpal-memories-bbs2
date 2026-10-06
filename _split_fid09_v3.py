# -*- coding: utf-8 -*-
import json, os, sys, shutil

DATA = "static/data"
TMP  = os.path.join(DATA, "_new")
MAX  = 5 * 1024 * 1024
WARN = MAX // 2
OLD  = [os.path.join(DATA, f"posts-fid09-{i:02d}.json") for i in range(1, 11)]

if os.path.exists(TMP): shutil.rmtree(TMP)
os.makedirs(TMP, exist_ok=True)

posts = []
for f in OLD:
    if not os.path.exists(f):
        print(f"FAIL: 缺少 {f}"); sys.exit(1)
    with open(f, 'r', encoding='utf-8') as fp:
        posts.extend(json.load(fp))
print(f"合併後：{len(posts)} 筆")
if len(posts) != 29453:
    print(f"FAIL: 預期 29453 筆，實際 {len(posts)}"); sys.exit(1)

seen, uniq = set(), []
for p in posts:
    pid = p.get("pid")
    if pid in seen: print(f"WARN: 重複 pid {pid}"); continue
    seen.add(pid); uniq.append(p)
if len(uniq) != len(posts):
    print(f"FAIL: 去重後 {len(uniq)} ≠ {len(posts)}"); sys.exit(1)
print(f"去重後：{len(uniq)} 筆")

for p in uniq: p.pop("useip", None)
uniq.sort(key=lambda x: (x.get("tid", 0), x.get("pid", 0)))

def blob(p):
    return len(json.dumps(p, ensure_ascii=False, separators=(',', ':')).encode('utf-8')) + 1

pages, cur, cur_bytes, pg = [], [], 0, 1
oversize = []
for p in uniq:
    b = blob(p)
    if b >= WARN: oversize.append((p.get("pid"), b))
    if cur and cur_bytes + b > MAX:
        pages.append((pg, cur)); pg += 1; cur, cur_bytes = [], 0
    cur.append(p); cur_bytes += b
if cur: pages.append((pg, cur))

print(f"分頁數：{len(pages)}")
if oversize:
    print(f"WARN: 超大單筆 {len(oversize)} 筆")
    for pid, b in oversize[:5]: print(f"   pid={pid}, {b/1024/1024:.2f} MiB")

index = {}
for pg_no, chunk in pages:
    out = os.path.join(TMP, f"posts-fid09-p{pg_no:02d}.json")
    with open(out, 'w', encoding='utf-8') as fp:
        json.dump(chunk, fp, ensure_ascii=False, separators=(',', ':'))
    mb = os.path.getsize(out) / 1024 / 1024
    flag = "OK" if mb <= 5 else ("BIG" if mb <= 25 else "FAIL")
    print(f"  [{flag}] {os.path.basename(out)}: {len(chunk)} 篇, {mb:.2f} MiB")
    if mb > 25:
        print(f"FAIL: {out} 超過 25 MiB"); sys.exit(2)
    for p in chunk:
        index.setdefault(str(p.get("tid", 0)), []).append(pg_no)

with open(os.path.join(TMP, "posts-fid09-index.json"), 'w', encoding='utf-8') as fp:
    json.dump(index, fp, ensure_ascii=False, separators=(',', ':'))

total = sum(len(c) for _, c in pages)
tids_p = set(p.get("tid") for _, c in pages for p in c)
tids_i = set(int(k) for k in index.keys())
if total != 29453: print(f"FAIL: 分頁總數 {total} ≠ 29453"); sys.exit(1)
if tids_p != tids_i: print("FAIL: 索引 tid 與分頁 tid 不一致"); sys.exit(1)
print(f"PASS: {total} 筆、{len(tids_i)} tid、{len(pages)} 頁")
