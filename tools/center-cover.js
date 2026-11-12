const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');
const before = s;

// 原图 1500×220，容器宽 1200 时 `100% auto` 只有 176px 高，
// 剩下的 44px 就是那块「透出来的卡片底」。改成 cover，让图按高度填满。
s = s.replace(
  '  background-size: 100% auto;\n  background-position: center top;',
  '  background-size: cover;\n  background-position: center center;'
);
s = s.replace(
  '  background-size: 100% auto;\r\n  background-position: center top;',
  '  background-size: cover;\r\n  background-position: center center;'
);

fs.writeFileSync(p, s, 'utf8');
console.log('changed', before !== s, 'cover', s.includes('background-size: cover;'));
