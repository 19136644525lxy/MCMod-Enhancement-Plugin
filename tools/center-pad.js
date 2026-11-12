const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const before = s;
s = s.replace(
  '  height: auto;\n  min-height: 220px;\n  padding-bottom: 36px;',
  '  height: auto;\n  min-height: 220px;\n  padding-bottom: 0;'
);

// 内容整体上提一点，避免去掉 padding 后签名贴到下边缘
if (!s.includes('.mp-center-header .user-sign {\n  text-shadow')) {
  // no-op: 保持原样
}

fs.writeFileSync(p, s, 'utf8');
console.log('changed', before !== s);
console.log('padding0', s.includes('padding-bottom: 0;'));
