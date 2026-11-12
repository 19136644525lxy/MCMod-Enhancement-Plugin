const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('.mp-activity {')) {
  console.log('already patched');
  process.exit(0);
}

s += `

/* ---------- 活跃度热力图 ----------
   原站是 ECharts，深色主题下整块白底。这里换成自绘网格，
   数据来自 history.html 的真实编辑记录，与首页「我的足迹」同源。 */

body.mp-center-mode .mp-activity {
  padding: 4px 2px 2px;
}

body.mp-center-mode .mp-activity .mp-act-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

body.mp-center-mode .mp-activity .mp-act-head b {
  font-size: 14px;
  color: var(--c-ink);
}

body.mp-center-mode .mp-activity .mp-act-head span {
  font-size: 12px;
  color: var(--c-ink-3);
}

body.mp-center-mode .mp-activity .mp-act-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 13px);
  grid-auto-columns: 13px;
  gap: 3px;
  justify-content: start;
}

body.mp-center-mode .mp-activity .mp-act-cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: rgba(128, 122, 112, 0.16);
}

html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-cell {
  background: rgba(255, 255, 255, 0.07);
}

body.mp-center-mode .mp-activity .mp-act-cell[data-lv="1"] { background: rgba(47, 111, 79, 0.35); }
body.mp-center-mode .mp-activity .mp-act-cell[data-lv="2"] { background: rgba(47, 111, 79, 0.62); }
body.mp-center-mode .mp-activity .mp-act-cell[data-lv="3"] { background: #2f6f4f; }

html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-cell[data-lv="1"] { background: rgba(87, 185, 138, 0.35); }
html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-cell[data-lv="2"] { background: rgba(87, 185, 138, 0.65); }
html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-cell[data-lv="3"] { background: #57b98a; }

body.mp-center-mode .mp-activity .mp-act-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--c-ink-3);
}

body.mp-center-mode .mp-activity .mp-act-legend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

body.mp-center-mode .mp-activity .mp-act-legend i {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  background: rgba(128, 122, 112, 0.16);
}

body.mp-center-mode .mp-activity .mp-act-legend i[data-lv="1"] { background: rgba(47, 111, 79, 0.35); }
body.mp-center-mode .mp-activity .mp-act-legend i[data-lv="2"] { background: rgba(47, 111, 79, 0.62); }
body.mp-center-mode .mp-activity .mp-act-legend i[data-lv="3"] { background: #2f6f4f; }

html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-legend i { background: rgba(255, 255, 255, 0.07); }
html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-legend i[data-lv="1"] { background: rgba(87, 185, 138, 0.35); }
html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-legend i[data-lv="2"] { background: rgba(87, 185, 138, 0.65); }
html[data-mp-theme="dark"] body.mp-center-mode .mp-activity .mp-act-legend i[data-lv="3"] { background: #57b98a; }

/* 原站图表容器整块藏掉，避免白底透出来 */
body.mp-center-mode .mp-chart-frame #center-editchart-obj,
body.mp-center-mode .mp-chart-frame #center-editchart-select {
  display: none !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, braces', (s.match(/{/g) || []).length, (s.match(/}/g) || []).length);
