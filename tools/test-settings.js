/**
 * 首页快速设置面板的 jsdom 测试。
 * 只验证面板能被撑起来、行数够、开关都在、关闭逻辑生效。
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const dom = new JSDOM('<!doctype html><html><body><header id="mp-home-topbar"></header></body></html>', {
  url: 'https://www.mcmod.cn/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const w = dom.window;

const DEFAULTS = {
  enabled: true, theme: 'auto', compact: false, palette: true,
  homeRotate: true, footprint: true, redrawSearch: true, redrawPages: false,
  bgPreset: 'mist', debug: false
};

let unmounted = 0;
let rotated = null;

w.MP = {};
w.MP.DEFAULTS = DEFAULTS;
w.MP.theme = { inject() {}, apply() {} };
w.MP.store = {
  DEFAULTS,
  getSync: () => Promise.resolve(Object.assign({}, DEFAULTS)),
  setSync: () => Promise.resolve(true)
};
w.MP.pages = { home: { unmount() { unmounted++; }, mount() {}, setRotate(v) { rotated = v; } } };
w.chrome = {
  runtime: { getURL: (p) => 'chrome-extension://test/' + p },
  storage: { sync: { get(d, cb) { cb(Object.assign({}, DEFAULTS)); }, set(o, cb) { cb && cb(); } } }
};

let pass = 0; let fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

for (const f of [
  'src/content/core/dom.js',
  'src/content/render/components.js',
  'src/content/widgets/settings-panel.js',
]) {
  w.eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}

w.MP.settingsPanel.open();

setTimeout(() => {
  const d = w.document;
  const panel = d.getElementById('mp-settings');
  ok('面板已挂载', !!panel);
  ok('面板在 body 下', !!panel && panel.parentNode === d.body);
  ok('有标题', !!panel && panel.textContent.indexOf('插件设置') >= 0);
  ok('有 7 个设置行', d.querySelectorAll('.mp-sp-row').length === 7, 'got ' + d.querySelectorAll('.mp-sp-row').length);
  ok('日夜开关不在面板里', d.querySelectorAll('.mp-sp-night').length === 0);
  ok('开关 6 个', d.querySelectorAll('.mp-sp .mp-toggle').length === 6, 'got ' + d.querySelectorAll('.mp-sp .mp-toggle').length);
  ok('背景预设 6 个', d.querySelectorAll('.mp-sp-chips .mp-sp-chip').length === 6, 'got ' + d.querySelectorAll('.mp-sp-chips .mp-sp-chip').length);
  ok('自定义背景面板默认收起', !!d.querySelector('.mp-sp-bg-extra.is-hide'));
  ok('背景默认选中晨雾', (() => {
    const on = d.querySelector('.mp-sp-chip.is-on');
    return !!on && on.getAttribute('data-key') === 'mist';
  })());
  ok('分组标题 3 个', d.querySelectorAll('.mp-sp-group-title').length === 3, 'got ' + d.querySelectorAll('.mp-sp-group-title').length);
  ok('轮换开关默认勾选', (() => {
    const rows = Array.from(d.querySelectorAll('.mp-sp-row'));
    const r = rows.find((x) => x.textContent.indexOf('随便看看轮换') >= 0);
    return !!r && r.querySelector('input').checked === true;
  })());
  ok('完整设置链接指向 options', /options\/options\.html/.test(
    (d.querySelector('.mp-sp-link') || {}).href || ''));

  // 关闭
  w.MP.settingsPanel.close();
  ok('关闭后面板移除', !d.getElementById('mp-settings'));

  // 再开一次，验证可以重复打开
  w.MP.settingsPanel.open();
  setTimeout(() => {
    ok('可重复打开', !!d.getElementById('mp-settings'));

    // 切换「随便看看轮换」应调用 home.setRotate(false)
    const rows = Array.from(d.querySelectorAll('.mp-sp-row'));
    const rot = rows.find((x) => x.textContent.indexOf('随便看看轮换') >= 0);
    const input = rot.querySelector('input');
    input.checked = false;
    input.dispatchEvent(new w.Event('change'));
    setTimeout(() => {
      ok('关轮换调用 setRotate(false)', rotated === false, 'rotated=' + rotated);

      console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
      w.close();
      process.exit(fail ? 1 : 0);
    }, 30);
  }, 30);
}, 30);
