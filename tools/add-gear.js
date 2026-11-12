const fs = require('fs');
const path = 'src/content/render/pages/center.js';
let s = fs.readFileSync(path, 'utf8');

if (!/function ensureGear\(/.test(s)) {
  const anchor = '  function gearSvg() {';
  if (!s.includes(anchor)) {
    console.error('anchor missing');
    process.exit(1);
  }
  const helper = [
    '  function ensureGear() {',
    "    var right = document.querySelector('.header-right');",
    '    if (!right) return;',
    "    var btn = document.getElementById('mp-center-gear');",
    '    if (btn && right.contains(btn)) return;',
    "    btn = h('button', {",
    "      id: 'mp-center-gear',",
    "      class: 'mp-gear-btn',",
    "      type: 'button',",
    "      title: '插件设置',",
    "      'aria-label': '插件设置',",
    '      onclick: function (e) {',
    '        e.preventDefault();',
    '        e.stopPropagation();',
    '        if (MP.settingsPanel) MP.settingsPanel.toggle();',
    '      }',
    '    }, gearSvg());',
    '    right.appendChild(btn);',
    '  }',
    '',
    ''
  ].join('\n');
  s = s.replace(anchor, helper + anchor);
}

if (!s.includes('ensureGear();')) {
  s = s.replace('    ensureDayNight();', '    ensureGear();\n    ensureDayNight();');
}

fs.writeFileSync(path, s, 'utf8');
console.log('ensureGear:', /function ensureGear\(/.test(s), 'call:', s.includes('ensureGear();'));
