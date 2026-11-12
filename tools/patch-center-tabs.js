const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 设置 / 成就 / 名片 / 收藏 四个 tab ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* ---- 设置中心 ---- */
body.mp-center-mode #center-setting-frame .center-sub-menu a {
  display: block;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  color: var(--c-ink-2);
  transition: background-color .18s ease, color .18s ease;
}
body.mp-center-mode #center-setting-frame .center-sub-menu a:hover {
  background: var(--c-card);
  color: var(--c-ink);
}
body.mp-center-mode #center-setting-frame .center-sub-menu a.active {
  background: var(--c-accent);
  color: #fff;
}

body.mp-center-mode #center-setting-frame .center-block {
  background: var(--c-card-soft) !important;
  border: 0;
  border-radius: var(--c-radius);
  padding: 20px 22px;
  box-sizing: border-box;
}

body.mp-center-mode #center-setting-frame .center-block-head .title {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-ink);
}

body.mp-center-mode .center-setting-block .setting-item {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
body.mp-center-mode .center-setting-block .setting-item > .title {
  min-width: 84px;
  font-size: 13.5px;
  color: var(--c-ink-2);
}

body.mp-center-mode .form-control {
  max-width: 420px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--c-hair);
  background: var(--c-card);
  color: var(--c-ink);
  font-size: 13.5px;
  padding: 0 12px;
  box-shadow: none;
  transition: border-color .18s ease, background-color .18s ease;
}
body.mp-center-mode .form-control:focus {
  outline: none;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(47, 111, 79, .16);
}
body.mp-center-mode textarea.form-control {
  height: auto;
  min-height: 84px;
  padding: 10px 12px;
  line-height: 1.6;
}

body.mp-center-mode .text-muted {
  color: var(--c-ink-3) !important;
  font-size: 12.5px;
}

body.mp-center-mode #center-setting-frame hr {
  border: 0;
  border-top: 1px dashed var(--c-hair);
  margin: 18px 0;
}

body.mp-center-mode .checkbox label,
body.mp-center-mode .checkbox {
  font-size: 13.5px;
  color: var(--c-ink-2);
}
body.mp-center-mode .checkbox input[type="checkbox"] {
  accent-color: var(--c-accent);
  margin-right: 8px;
}

body.mp-center-mode .selectpicker,
body.mp-center-mode select.form-control {
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--c-hair);
  background: var(--c-card);
  color: var(--c-ink);
  font-size: 13.5px;
  padding: 0 12px;
}
body.mp-center-mode .bootstrap-select .dropdown-toggle {
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--c-hair);
  background: var(--c-card);
  color: var(--c-ink);
}
body.mp-center-mode .bootstrap-select .dropdown-menu {
  border-radius: 12px;
  border: 1px solid var(--c-hair);
  background: var(--c-card);
  box-shadow: var(--c-shadow);
}
body.mp-center-mode .bootstrap-select .dropdown-menu li a {
  color: var(--c-ink) !important;
}
body.mp-center-mode .bootstrap-select .dropdown-menu li a:hover {
  background: var(--c-accent);
  color: #fff !important;
}

body.mp-center-mode .btn.btn-dark {
  background: var(--c-accent);
  border-color: transparent;
  color: #fff;
  border-radius: 999px;
  padding: 6px 18px;
  font-size: 13px;
}
body.mp-center-mode .btn.btn-light {
  background: var(--c-card);
  border: 1px solid var(--c-hair);
  color: var(--c-ink);
  border-radius: 999px;
  padding: 6px 18px;
  font-size: 13px;
}

/* ---- 成就 / 名片 / 收藏：先保证深色下不出黑字，白底卡片交给通用层 ---- */
html[data-mp-theme="dark"] body.mp-center-mode #center-page-task,
html[data-mp-theme="dark"] body.mp-center-mode #center-page-card,
html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite {
  color: #e6e1d8;
}

html[data-mp-theme="dark"] body.mp-center-mode #center-page-task *,
html[data-mp-theme="dark"] body.mp-center-mode #center-page-card *,
html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite * {
  border-color: rgba(255, 255, 255, .13) !important;
}

html[data-mp-theme="dark"] body.mp-center-mode #center-page-task .center-content > div,
html[data-mp-theme="dark"] body.mp-center-mode #center-page-card .center-content > div,
html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite .center-content > div {
  background-color: var(--c-card-soft) !important;
  border-radius: var(--c-radius);
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, length', s.length);
