const fs = require('fs');

function stripFab(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    // 找到下一个选择器起点：跳过空白与注释
    const start = i;
    // 扫描到 '{' 之前的 '}' 或 '/*'
    let j = i;
    while (j < css.length && css[j] !== '{' && css[j] !== '}') {
      if (css[j] === '/' && css[j + 1] === '*') {
        const end = css.indexOf('*/', j + 2);
        j = end === -1 ? css.length : end + 2;
        continue;
      }
      j++;
    }
    if (j >= css.length) { out.push(css.slice(start)); break; }
    if (css[j] === '}') { out.push(css.slice(start, j + 1)); i = j + 1; continue; }
    // 找到选择器文本（从 start 到 j），去掉注释后再判断
    const selRaw = css.slice(start, j);
    const sel = selRaw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    // 找到匹配的 }
    let depth = 0, k = j;
    while (k < css.length) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') { depth--; if (depth === 0) { k++; break; } }
      k++;
    }
    const block = css.slice(start, k);
    // 若是 @media 之类包含 fab 的，保留（人工确认后再处理）
    if (/\.mp-fab/.test(sel) && !/^@/.test(sel)) {
      i = k; continue; // 丢弃
    }
    out.push(block);
    i = k;
  }
  return out.join('');
}

for (const f of ['styles/pages/home.css', 'styles/pages/center.css']) {
  const css = fs.readFileSync(f, 'utf8');
  const cleaned = stripFab(css).replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(f, cleaned, 'utf8');
  const left = (cleaned.match(/\.mp-fab/g) || []).length;
  console.log(f, 'remaining .mp-fab mentions:', left, 'len', cleaned.length);
}
