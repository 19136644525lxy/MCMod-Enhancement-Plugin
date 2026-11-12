const fs = require('fs');

const gearCss = `

/* 个人主页顶栏的设置齿轮（首页那颗在 home.css 里，变量体系不同，这里用 --c-*） */
.mp-center-mode .mp-gear-btn {
  flex: none;
  width: 32px;
  height: 32px;
  margin-left: 6px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--c-hair);
  border-radius: 50%;
  background: var(--c-card);
  color: var(--c-ink-2);
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease,
              border-color 0.18s ease, transform 0.32s ease;
}

.mp-center-mode .mp-gear-btn:hover {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #ffffff;
  transform: rotate(90deg);
}

.mp-center-mode .mp-gear-btn:active {
  transform: rotate(90deg) scale(0.94);
}

.mp-center-mode .mp-gear-btn svg {
  width: 16px;
  height: 16px;
}

/* 把手点完会拿到焦点，Chrome 默认画一圈 focus ring，看起来像「描边弹出来」 */
.mp-fab-handle:focus {
  outline: none;
}

.mp-fab-handle:focus-visible {
  outline: 2px solid #2f6f4f;
  outline-offset: 2px;
}

html[data-mp-theme="dark"] .mp-fab-handle:focus-visible {
  outline-color: #57b98a;
}
`;

const fabFocus = `

/* 把手焦点：点完不再弹默认描边 */
.mp-fab-handle:focus {
  outline: none;
}

.mp-fab-handle:focus-visible {
  outline: 2px solid #2f6f4f;
  outline-offset: 2px;
}

html[data-mp-theme="dark"] .mp-fab-handle:focus-visible {
  outline-color: #57b98a;
}
`;

// center.css：齿轮 + 焦点
let c = fs.readFileSync('styles/pages/center.css', 'utf8');
if (!c.includes('.mp-center-mode .mp-gear-btn')) c += gearCss;
fs.writeFileSync('styles/pages/center.css', c, 'utf8');

// home.css：只补焦点
let h = fs.readFileSync('styles/pages/home.css', 'utf8');
if (!h.includes('.mp-fab-handle:focus-visible')) h += fabFocus;
fs.writeFileSync('styles/pages/home.css', h, 'utf8');

console.log('center gear css:', fs.readFileSync('styles/pages/center.css', 'utf8').includes('.mp-center-mode .mp-gear-btn'));
console.log('home focus css:', fs.readFileSync('styles/pages/home.css', 'utf8').includes('.mp-fab-handle:focus-visible'));
