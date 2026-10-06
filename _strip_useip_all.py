# -*- coding: utf-8 -*-
import json, glob, os
n = 0
for f in glob.glob("static/data/posts-fid*.json"):
    if "-index" in f or "-p" in f: continue
    with open(f, 'r', encoding='utf-8') as fp: data = json.load(fp)
    changed = False
    for p in data:
        if "useip" in p: del p["useip"]; changed = True
    if changed:
        with open(f, 'w', encoding='utf-8') as fp:
            json.dump(data, fp, ensure_ascii=False, separators=(',', ':'))
        print(f"  清除：{os.path.basename(f)}"); n += 1
print(f"DONE: 清除 {n} 檔")
