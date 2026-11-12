const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

// 旧规则写死 13px，这里整体替换成跟随 --cell 变量
const oldBlock = `body.mp-center-mode .mp-activity .mp-act-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 13px);
  grid-auto-columns: 13px;
  gap: 3px;
  justify-content: start;
}`;

const newBlock = `body.mp-center-mode .mp-activity .mp-act-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
}

body.mp-center-mode .mp-activity .mp-act-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, var(--cell, 13px));
  grid-auto-columns: var(--cell, 13px);
  gap: 3px;
  justify-content: start;
  width: max-content;
}`;

if (s.indexOf(oldBlock) >= 0) {
  s = s.replace(oldBlock, newBlock);
  console.log('grid rule replaced');
} else {
  console.log('grid rule not found, appending override');
  s += '\n' + newBlock + '\n';
}

s = s.replace(
  `body.mp-center-mode .mp-activity .mp-act-cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: rgba(128, 122, 112, 0.16);
}`,
  `body.mp-center-mode .mp-activity .mp-act-cell {
  width: var(--cell, 13px);
  height: var(--cell, 13px);
  border-radius: 3px;
  background: rgba(128, 122, 112, 0.16);
}`
);

fs.writeFileSync(p, s, 'utf8');
console.log('cell uses var:', s.includes('width: var(--cell, 13px)'));
