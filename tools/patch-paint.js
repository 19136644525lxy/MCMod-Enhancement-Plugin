const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

s = s.replace('function paintActivity(host, days) {', 'function paintActivity(host, days, note) {');

const oldFoot = "'<span>近 26 周 · ' + total + ' 次编辑 · ' + active + ' 天有记录</span>' +";
const newFoot = "'<span>近 26 周 · ' + total + ' 次编辑 · ' + active + ' 天有记录' + (note ? ' · ' + note : '') + '</span>' +";
if (s.indexOf(oldFoot) >= 0) {
  s = s.replace(oldFoot, newFoot);
  console.log('footer patched');
} else {
  console.log('footer anchor missing');
}

fs.writeFileSync(p, s, 'utf8');
console.log('has note param:', s.includes('function paintActivity(host, days, note)'));
