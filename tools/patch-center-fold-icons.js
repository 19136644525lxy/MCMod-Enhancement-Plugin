const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 收藏文件夹项的图标与文本排版 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .title {
  display: flex !important;
  align-items: center;
  gap: 7px;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: var(--c-ink) !important;
  padding: 0 !important;
  height: auto !important;
  line-height: 1.4 !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .title i {
  font-size: 13px !important;
  width: 16px;
  text-align: center;
  opacity: .8;
  margin: 0 !important;
}

body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .count {
  display: flex !important;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 5px !important;
  font-size: 11.5px !important;
  line-height: 1.4 !important;
  height: auto !important;
  color: var(--c-ink-3) !important;
  padding: 0 !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .count i {
  font-size: 11px !important;
  opacity: .75;
  margin: 0 !important;
}

/* 选中态里图标跟文字一起变白 */
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .title,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .title i,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .count,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .count i {
  color: #fff !important;
  opacity: 1;
}

/* 右侧的编辑 / 删除图标：原来靠 absolute 定位在 old padding 上，现在要重新摆 */
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .edit,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .remove {
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%);
  margin: 0 !important;
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 6px;
  text-align: center;
  font-size: 12px !important;
  color: var(--c-ink-3) !important;
  background: transparent;
  transition: background-color .16s ease, color .16s ease;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .edit {
  right: 34px !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .remove {
  right: 8px !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover .edit,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover .remove {
  color: var(--c-ink-2) !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover .edit:hover,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover .remove:hover {
  background: var(--c-card) !important;
  color: var(--c-accent) !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .edit,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .remove {
  color: rgba(255, 255, 255, .72) !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .edit:hover,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .remove:hover {
  background: rgba(255, 255, 255, .18) !important;
  color: #fff !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover .title {
  padding-right: 44px !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);
