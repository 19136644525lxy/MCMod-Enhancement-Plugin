const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const re = /body\.mp-center-mode \.mp-center-header::after \{[\s\S]*?\n\}/;
if (!re.test(s)) {
  console.log('after-block missing');
  process.exit(1);
}
s = s.replace(re, '/* 头卡不再压渐变条：图片自己结束，直接过渡到页面背景。文字靠 text-shadow 保证可读。 */\nbody.mp-center-mode .mp-center-header::after {\n  content: none;\n}');

// 白字可读性靠描边阴影，不再靠遮挡层
s = s.replace(
  'body.mp-center-mode .mp-center-header .user-name {',
  'body.mp-center-mode .mp-center-header .user-name {'
);

fs.writeFileSync(p, s, 'utf8');
console.log('content-none', s.includes('content: none;'));
console.log('braces', (s.match(/{/g) || []).length, (s.match(/}/g) || []).length);
