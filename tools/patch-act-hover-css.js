const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('.mp-act-tip')) {
  console.log('exists');
  process.exit(0);
}

s += `
/* 活跃度：格子悬停小动画 + 跟随鼠标的提示气泡 */
body.mp-center-mode .mp-activity .mp-act-cell {
  cursor: pointer;
  transform-origin: center;
  transition: transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .16s ease;
}

body.mp-center-mode .mp-activity .mp-act-cell:hover {
  transform: scale(1.45);
  box-shadow: 0 0 0 2px var(--c-accent), 0 4px 10px rgba(0,0,0,.18);
  position: relative;
  z-index: 3;
}

.mp-act-tip {
  position: fixed;
  z-index: 2147483001;
  padding: 5px 9px;
  border-radius: 8px;
  background: rgba(20, 18, 15, .9);
  color: #f3f1ec;
  font: 12px/1.3 -apple-system, "Segoe UI", system-ui, sans-serif;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity .14s ease, transform .14s ease;
}

.mp-act-tip.is-on {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  body.mp-center-mode .mp-activity .mp-act-cell { transition: none; }
  body.mp-center-mode .mp-activity .mp-act-cell:hover { transform: none; }
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended');
