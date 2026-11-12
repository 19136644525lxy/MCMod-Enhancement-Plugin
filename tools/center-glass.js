const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

// 卡片底色更透，让背景图/背景层透上来
s = s.replace('--c-card: rgba(255, 255, 255, 0.88);', '--c-card: rgba(255, 255, 255, 0.55);');
s = s.replace('--c-card-soft: rgba(255, 255, 255, 0.66);', '--c-card-soft: rgba(255, 255, 255, 0.4);');
s = s.replace(/--c-card: rgba\(26, 25, 22, 0\.86\);/g, '--c-card: rgba(26, 25, 22, 0.52);');
s = s.replace(/--c-card-soft: rgba\(26, 25, 22, 0\.6\);/g, '--c-card-soft: rgba(26, 25, 22, 0.38);');

if (!s.includes('毛玻璃：卡片')) {
  s += `

/* 毛玻璃：卡片不再是不透明的实色块，背景图/背景层能透上来 */
body.mp-center-mode .mp-center-block,
body.mp-center-mode .mp-center-total,
body.mp-center-mode .mp-center-tabs,
body.mp-center-mode .mp-center-tab,
body.mp-center-mode .mp-center-header {
  -webkit-backdrop-filter: blur(20px) saturate(1.45);
  backdrop-filter: blur(20px) saturate(1.45);
}

/* 内容多的长卡片少一点模糊，滚动时省合成层 */
body.mp-center-mode .mp-center-block {
  -webkit-backdrop-filter: blur(14px) saturate(1.3);
  backdrop-filter: blur(14px) saturate(1.3);
}
`;
}

fs.writeFileSync(p, s, 'utf8');
console.log('c-card now:', (s.match(/--c-card: [^;]+;/g) || []).join(' | '));
console.log('backdrop added:', s.includes('毛玻璃：卡片'));
