const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('.mp-act-actions')) {
  console.log('exists');
  process.exit(0);
}

s += `
/* 活跃度：刷新按钮 + 进度 */
body.mp-center-mode .mp-activity .mp-act-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

body.mp-center-mode .mp-activity .mp-act-refresh {
  height: 24px;
  padding: 0 12px;
  border: 1px solid var(--c-line);
  border-radius: 999px;
  background: var(--c-card-soft);
  color: var(--c-ink-2);
  font-size: 12px;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease, border-color .2s ease;
}

body.mp-center-mode .mp-activity .mp-act-refresh:hover {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}

body.mp-center-mode .mp-activity .mp-act-refresh:active {
  transform: scale(.96);
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended');
