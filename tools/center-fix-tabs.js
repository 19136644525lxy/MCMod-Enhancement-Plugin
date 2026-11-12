const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const anchor = 'body.mp-center-mode .mp-center-tabs .page-ul {';
const i = s.indexOf(anchor);
if (i < 0) {
  console.log('anchor missing');
  process.exit(1);
}
if (s.slice(i, i + 200).includes('width: 100%')) {
  console.log('already patched');
  process.exit(0);
}
const insertAt = i + anchor.length;
s = s.slice(0, insertAt) + '\n  width: 100%;\n  box-sizing: border-box;' + s.slice(insertAt);
fs.writeFileSync(p, s, 'utf8');
console.log('patched at', insertAt);
