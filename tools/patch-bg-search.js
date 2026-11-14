const fs = require('fs');
const p = 'styles/background.css';
let s = fs.readFileSync(p, 'utf8');

const pairs = [
  ['body.mp-center-mode[data-mp-bg="aurora"],', 'body.mp-search-mode[data-mp-bg="aurora"],'],
  ['body.mp-center-mode[data-mp-bg="pixel"],', 'body.mp-search-mode[data-mp-bg="pixel"],'],
  ['body.mp-center-mode[data-mp-bg="grass"],', 'body.mp-search-mode[data-mp-bg="grass"],'],
  ['body.mp-center-mode[data-mp-bg="stars"] {', 'body.mp-search-mode[data-mp-bg="stars"] {'],
  ['body.mp-center-mode .header-container,', 'body.mp-search-mode .header-container,'],
  ['body.mp-center-mode footer {', 'body.mp-search-mode footer {'],
  ['body.mp-center-mode[data-mp-bg="stars"]::after {', 'body.mp-search-mode[data-mp-bg="stars"]::after {'],
];

let n = 0;
for (const [anchor, extra] of pairs) {
  if (s.includes(extra)) continue;
  if (!s.includes(anchor)) {
    console.log('MISS ' + anchor);
    continue;
  }
  s = s.replace(anchor, anchor + '\n' + extra);
  n++;
}
fs.writeFileSync(p, s, 'utf8');
console.log('patched ' + n);
