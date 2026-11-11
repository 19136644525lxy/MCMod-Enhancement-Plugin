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
  homeRotate: true, footprint: true, redrawSearch: true, redrawPages: false, debug: false
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
  ok('有 8 个设置行', d.querySelectorAll('.mp-sp-row').length === 8, 'got ' + d.querySelectorAll('.mp-sp-row').length);
  ok('日夜开关存在', d.querySelectorAll('.mp-sp-night').length === 1);
  ok('普通开关 7 个', d.querySelectorAll('.mp-sp .mp-toggle').length === 7, 'got ' + d.querySelectorAll('.mp-sp .mp-toggle').length);
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

    // 关掉「增强视图」应调用 home.unmount()
    const rows = Array.from(d.querySelectorAll('.mp-sp-row'));
    const en = rows.find((x) => x.textContent.indexOf('增强视图') >= 0);
    const input = en.querySelector('input');
    input.checked = false;
    input.dispatchEvent(new w.Event('change'));
    setTimeout(() => {
      ok('关增强视图调用 unmount', unmounted === 1, 'unmounted=' + unmounted);
      ok('关增强视图后自动收起面板', !d.getElementById('mp-settings'));

      console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
      w.close();
      process.exit(fail ? 1 : 0);
    }, 30);
  }, 30);
}, 30);
