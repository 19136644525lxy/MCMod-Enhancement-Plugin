const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');
const before = s;

// 之前的阴影是「四周外扩」，在深色背景上等于给每张卡片描了一圈暗边。
// 改成负 spread 的贴合投影：只在正下方一点点，不外扩。
s = s.split('--c-shadow: 0 10px 34px rgba(40, 32, 24, 0.12);').join(
  '--c-shadow: 0 6px 18px -8px rgba(40, 32, 24, 0.3);'
);
s = s.split('--c-shadow: 0 12px 34px rgba(0, 0, 0, 0.38);').join(
  '--c-shadow: 0 8px 22px -10px rgba(0, 0, 0, 0.55);'
);

fs.writeFileSync(p, s, 'utf8');
console.log('changed', before !== s);
console.log('count', (s.match(/--c-shadow:/g) || []).length);
