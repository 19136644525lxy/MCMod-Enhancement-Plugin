const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');
const before = s;
s = s.replace('padding-bottom: 36px;', 'padding-bottom: 0;');
fs.writeFileSync(p, s, 'utf8');
console.log('changed', before !== s, 'left36', s.includes('padding-bottom: 36px'));
