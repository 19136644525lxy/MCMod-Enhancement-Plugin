/**
 * 启动过渡层冒烟测试：显示 → 收起 → DOM 清理。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/test-splash.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'src/content/boot-splash.js'), 'utf8');

function makeWindow(url) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><p>page</p></body></html>', {
    url, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  dom.window.chrome = {
    storage: { sync: { get: (defaults, cb) => cb(Object.assign({ enabled: true }, defaults)) } },
  };
  return dom.window;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async function main() {
  let pass = 0;
  let fail = 0;
  const ok = (name, cond, extra) => {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
  };

  console.log('\n[1] www 首页');
  const w = makeWindow('https://www.mcmod.cn/');
  w.eval(SRC);
  ok('注入遮罩', !!w.document.getElementById('mp-splash'));
  ok('注入样式', !!w.document.getElementById('mp-splash-style'));
  ok('含标记文字', w.document.body.textContent.includes('MC'));
  ok('暴露 MP.splash', typeof w.MP.splash.done === 'function');
  w.MP.splash.done();
  await sleep(600);
  ok('done 后移除遮罩', !w.document.getElementById('mp-splash'));
  ok('done 后移除样式', !w.document.getElementById('mp-splash-style'));

  console.log('\n[2] bbs 子域不显示');
  const w2 = makeWindow('https://bbs.mcmod.cn/');
  w2.eval(SRC);
  ok('无遮罩', !w2.document.getElementById('mp-splash'));
  ok('空接口可调用', typeof w2.MP.splash.done === 'function');
  w2.MP.splash.done(); // 不应抛错
  ok('调用不抛错', true);

  console.log('\n[3] 插件关闭时立刻收起');
  const w3 = makeWindow('https://www.mcmod.cn/');
  w3.chrome.storage.sync.get = (defaults, cb) => cb({ enabled: false });
  w3.eval(SRC);
  await sleep(600);
  ok('遮罩已移除', !w3.document.getElementById('mp-splash'));

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
})();
