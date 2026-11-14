const fs = require('fs');
const p = 'styles/pages/home.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 编辑动态：时间轴 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

.mp-home .mp-feed-scroll {
  height: 262px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}
.mp-home .mp-feed-scroll::-webkit-scrollbar { width: 6px; }
.mp-home .mp-feed-scroll::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 999px;
}

.mp-home .mp-tl {
  list-style: none;
  margin: 0;
  padding: 2px 0 0;
}

.mp-home .mp-tl-item {
  position: relative;
  padding: 0 0 12px 18px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--ink-2);
}
.mp-home .mp-tl-item::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 13px;
  bottom: -3px;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(to bottom, var(--glass-border), rgba(255, 255, 255, 0));
}
.mp-home .mp-tl-item:last-child { padding-bottom: 2px; }
.mp-home .mp-tl-item:last-child::before { display: none; }

.mp-home .mp-tl-dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--glass-bg-strong);
  border: 2px solid var(--ink-3);
  box-sizing: border-box;
  transition: transform .2s cubic-bezier(.22, 1, .36, 1), border-color .2s ease;
}
.mp-home .mp-tl-item[data-kind="add"] .mp-tl-dot { border-color: #3aa06a; }
.mp-home .mp-tl-item[data-kind="update"] .mp-tl-dot { border-color: #4a86c8; }
.mp-home .mp-tl-item[data-kind="remove"] .mp-tl-dot { border-color: #c0625c; }
.mp-home .mp-tl-item:hover .mp-tl-dot { transform: scale(1.35); }

.mp-home .mp-tl-body { position: relative; }

/* 正文里的用户名和条目名 */
.mp-home .mp-tl-body a {
  color: var(--ink);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color .16s ease, border-color .16s ease;
}
.mp-home .mp-tl-body a:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* 时间戳：从行内文本改成右下角的小字 */
.mp-home .mp-tl-body .time {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  letter-spacing: .01em;
}

.mp-home .mp-tl-item:hover { color: var(--ink); }
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);
