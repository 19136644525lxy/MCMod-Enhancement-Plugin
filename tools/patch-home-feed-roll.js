const fs = require('fs');
const p = 'styles/pages/home.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 编辑动态时间轴：主题自适应 + 滚筒 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 正文里除了链接和时间，其余文本（「编辑了模组」「物品/方块。」）
   统一压到 --ink-2。原站的 span / 裸文本节点会继承各自颜色，
   深色主题下会出现看不清的暗字。 */
.mp-home .mp-tl-item,
.mp-home .mp-tl-item * {
  color: var(--ink-2);
}
.mp-home .mp-tl-item a,
.mp-home .mp-tl-item a * {
  color: var(--ink);
}
.mp-home .mp-tl-item .time,
.mp-home .mp-tl-item .time * {
  color: var(--ink-3);
}

/* 滚筒：两份列表首尾相接，整体匀速上移一份的高度 */
.mp-home .mp-tl-track {
  animation: mp-tl-roll 52s linear infinite;
  will-change: transform;
}
.mp-home .mp-feed-scroll:hover .mp-tl-track {
  animation-play-state: paused;
}
@keyframes mp-tl-roll {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

/* 滚动时容器不再需要滚动条，也避免出现两条竖向的线 */
.mp-home .mp-feed-scroll {
  overflow: hidden;
  mask-image: linear-gradient(to bottom, transparent 0, #000 10px, #000 calc(100% - 14px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 10px, #000 calc(100% - 14px), transparent 100%);
}

/* 每条都画到底，这样两份拼起来时竖线是连续的 */
.mp-home .mp-tl-item::before { bottom: -12px; }
.mp-home .mp-tl-item:last-child::before { display: block; }
.mp-home .mp-tl:last-child .mp-tl-item:last-child::before { display: none; }

@media (prefers-reduced-motion: reduce) {
  .mp-home .mp-tl-track { animation: none !important; }
  .mp-home .mp-feed-scroll { overflow-y: auto; }
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);
