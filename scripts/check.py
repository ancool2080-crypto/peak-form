#!/usr/bin/env python3
"""index.html の静的検査。過去に本番へ流出した破損を型として登録している。"""
import re, sys, io

h = io.open('index.html', encoding='utf-8').read()
js = '\n'.join(re.findall(r'<script>(.*?)</script>', h, re.DOTALL))
fail = []


def check(ok, name, detail=''):
    print(('  OK   ' if ok else '  FAIL ') + name + (' :: ' + detail if detail and not ok else ''))
    if not ok:
        fail.append(name)


# 1. onclick から参照される関数が定義されているか
fns = set(re.findall(r'function\s+(\w+)\s*\(', js))
refs = set(re.findall(r'on(?:click|change|input|submit|keyup|blur|focus)="(\w+)\(', h))
refs |= set(re.findall(r'onclick=\?"(\w+)\(', js))
check(not (refs - fns), '未定義の onclick 参照関数', ', '.join(sorted(refs - fns)))

# 2. 同名関数の重複定義（後勝ちで意図しない挙動になる）
dup = {k for k in fns if len(re.findall(r'function\s+%s\s*\(' % re.escape(k), js)) > 1}
check(not dup, '関数の重複定義', ', '.join(sorted(dup)))

# 3. showPage の遷移先ページが存在するか
pages = set(re.findall(r"showPage\('([\w-]+)'\)", h))  # 変数渡しは対象外
ids = set(re.findall(r'id="page-([\w-]+)"', h))
check(not (pages - ids), 'showPage の遷移先', ', '.join(sorted(pages - ids)))

# 4. 目次のジャンプ先アンカーが存在するか
anchors = set(re.findall(r'id="(anc-[\w-]+)"', h))
jumps = set(re.findall(r"tocJump\('([\w-]+)'\)", h))
check(not (jumps - anchors), '目次のジャンプ先', ', '.join(sorted(jumps - anchors)))

# 5. div の開閉収支（孤児要素・ページ脱出の原因になる）
opens = len(re.findall(r'<div\b', h))
closes = len(re.findall(r'</div>', h))
check(opens == closes, 'div の開閉収支', 'open=%d close=%d' % (opens, closes))

# 6. 文書が正しく閉じているか（過去に </html が未閉鎖だった）
check(h.rstrip().endswith('</html>'), '</html> で終端', repr(h.rstrip()[-40:]))
check(h.count('</body>') == 1, '</body> がちょうど1つ', str(h.count('</body>')))

# 7. onclick 属性内のクォート破損（過去に閉じるボタンが死んだ）
check(not re.findall(r'onclick="[^"]*"[a-zA-Z]', h), 'onclick のクォート破損')

# 8. 重複 id 属性
all_ids = re.findall(r'\bid="([^"]+)"', h)
dup_ids = {i for i in all_ids if all_ids.count(i) > 1 and '${' not in i}  # 動的idは除外
check(not dup_ids, 'id の重複', ', '.join(sorted(dup_ids)))

print()
if fail:
    print('%d 件の問題を検出しました: %s' % (len(fail), ', '.join(fail)))
    sys.exit(1)
print('すべての検査に合格しました。')
