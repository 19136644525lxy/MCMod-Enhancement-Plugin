const fs = require('fs');
const t = fs.readFileSync('F:/下载/margin/pages/chunk-CroYLTSv.js', 'utf8');
const key = 'viewBox="0 0 144 55"';
const i = t.indexOf(key);
if (i < 0) {
  console.log('not found');
  process.exit(1);
}
const s = t.lastIndexOf('<svg', i);
const e = t.indexOf('</svg>', i) + 6;
let svg = t.slice(s, e);
// MARGIN 的模板串里反引号会被转义，这里还原成普通字符串
svg = svg.replace(/\\`/g, '"');
fs.writeFileSync('output/stars.svg.txt', svg, 'utf8');
console.log('len', svg.length);
console.log(svg.slice(0, 100));
console.log(svg.slice(-70));
