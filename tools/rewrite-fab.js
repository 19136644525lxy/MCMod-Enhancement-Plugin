const fs = require('fs');

function removeTrailingDarkFab(css) {
  const at = css.lastIndexOf('@media (prefers-color-scheme: dark)');
  if (at === -1) return css;
  let d = 0, k = at;
  while (k < css.length) {
    if (css[k] === '{') d++;
    else if (css[k] === '}') { d--; if (!d) { k++; break; } }
    k++;
  }
  const block = css.slice(at, k);
  if (/\.mp-fab/.test(block) && !/^@media \(prefers-color-scheme: dark\)\s*\{\s*\}/.test(block)) {
    // 只有当这个块里全是 fab 规则时才整块删除
    const lines = block.split(/\r?\n/).filter(l => l.trim() && !/^\s*[@}]/.test(l) && !/^@media/.test(l));
    const allFab = lines.every(l => /\.mp-fab/.test(l) || /^\s*[a-z-]+:/.test(l) || /^\s*\}/.test(l));
    if (allFab) return css.slice(0, at) + css.slice(k);
  }
  return css;
}

function removeFabAtLines(css, startLine, endLine) {
  const lines = css.split(/\r?\n/);
  lines.splice(startLine - 1, endLine - startLine + 1);
  return lines.join('\n');
}

const FAB_CSS = `
/* ============================================================
   右侧抽屉（唯一一份，前面的历史版本已全部删除）
   ============================================================ */
.mp-fab-bar {
  position: fixed;
  right: 0;
  bottom: 344px;
  z-index: 2147483100;
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  box-shadow: none;
  opacity: 1;
  transform: none;
}

/* 50% / 50% 的椭圆半径 = 左边缘永远是标准半圆，不受宽高影响 */
.mp-fab-handle {
  width: 30px;
  height: 60px;
  padding: 0;
  margin: 0;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(24, 22, 20, 0.1);
  border-right: 0;
  border-radius: 50% 0 0 50% / 50% 0 0 50%;
  background: #ffffff;
  color: #4a453d;
  font-size: 0;
  box-shadow: -3px 0 14px rgba(30, 24, 18, 0.1);
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.mp-fab-handle:hover {
  background: #2f6f4f;
  border-color: #2f6f4f;
  color: #ffffff;
}

.mp-fab-handle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mp-fab-bar.is-open .mp-fab-handle-icon {
  transform: rotate(180deg);
}

.mp-fab-sheet {
  position: absolute;
  right: 100%;
  top: 50%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  padding: 4px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(24, 22, 20, 0.09);
  box-shadow: 0 10px 30px rgba(30, 24, 18, 0.16);
  opacity: 0;
  pointer-events: none;
  transform: translate(calc(100% + 10px), -50%) scale(0.86);
  transform-origin: right center;
  transition: transform 0.44s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.mp-fab-bar.is-open .mp-fab-sheet {
  opacity: 1;
  pointer-events: auto;
  transform: translate(0, -50%) scale(1);
}

.mp-fab-sheet .mp-fab {
  width: auto;
  min-width: 52px;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #4a453d;
  font-size: 12px;
  letter-spacing: 0.4px;
  cursor: pointer;
}

.mp-fab-sheet .mp-fab:hover {
  background: rgba(47, 111, 79, 0.1);
  color: #2f6f4f;
}

.mp-fab-sheet .mp-fab.is-on {
  background: #2f6f4f;
  color: #ffffff;
}

.mp-fab-sheet .mp-fab-icon {
  width: 34px;
  min-width: 0;
  height: 32px;
  padding: 0;
}

html[data-mp-theme="dark"] .mp-fab-handle {
  background: #2b2924;
  border-color: rgba(255, 255, 255, 0.14);
  color: #ded8cc;
  box-shadow: -3px 0 14px rgba(0, 0, 0, 0.5);
}

html[data-mp-theme="dark"] .mp-fab-handle:hover {
  background: #57b98a;
  border-color: #57b98a;
  color: #14130f;
}

html[data-mp-theme="dark"] .mp-fab-sheet {
  background: #232120;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
}

html[data-mp-theme="dark"] .mp-fab-sheet .mp-fab {
  color: #ded8cc;
}

html[data-mp-theme="dark"] .mp-fab-sheet .mp-fab:hover {
  background: rgba(87, 185, 138, 0.16);
  color: #57b98a;
}

html[data-mp-theme="dark"] .mp-fab-sheet .mp-fab.is-on {
  background: #57b98a;
  color: #14130f;
}

@media (prefers-color-scheme: dark) {
  html:not([data-mp-theme="light"]) .mp-fab-handle {
    background: #2b2924;
    border-color: rgba(255, 255, 255, 0.14);
    color: #ded8cc;
    box-shadow: -3px 0 14px rgba(0, 0, 0, 0.5);
  }
  html:not([data-mp-theme="light"]) .mp-fab-handle:hover {
    background: #57b98a;
    border-color: #57b98a;
    color: #14130f;
  }
  html:not([data-mp-theme="light"]) .mp-fab-sheet {
    background: #232120;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
  }
  html:not([data-mp-theme="light"]) .mp-fab-sheet .mp-fab {
    color: #ded8cc;
  }
  html:not([data-mp-theme="light"]) .mp-fab-sheet .mp-fab:hover {
    background: rgba(87, 185, 138, 0.16);
    color: #57b98a;
  }
  html:not([data-mp-theme="light"]) .mp-fab-sheet .mp-fab.is-on {
    background: #57b98a;
    color: #14130f;
  }
}
`;

for (const f of ['styles/pages/home.css', 'styles/pages/center.css']) {
  let css = fs.readFileSync(f, 'utf8');
  css = removeTrailingDarkFab(css);
  // 移除残余的 html:not(...) .mp-fab-bar / .mp-fab 单行规则块
  css = css.replace(/html:not\(\[data-mp-theme="light"\]\) \.mp-fab-bar \{[^}]*\}\s*/g, '');
  css = css.replace(/html:not\(\[data-mp-theme="light"\]\) \.mp-fab \{[^}]*\}\s*/g, '');
  css = css.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(f, css.trimEnd() + '\n' + FAB_CSS, 'utf8');
  console.log(f, 'left mentions:', (fs.readFileSync(f, 'utf8').match(/\.mp-fab/g) || []).length);
}
