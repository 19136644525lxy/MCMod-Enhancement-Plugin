const fs = require('fs');

const svg = fs.readFileSync('output/stars.svg.txt', 'utf8').replace(/\s+/g, ' ').trim();
const file = 'src/content/render/components.js';
let src = fs.readFileSync(file, 'utf8');

if (src.indexOf('function dayNight(') !== -1) {
  console.log('already patched');
  process.exit(0);
}

const block = [
  '  /* 星星是 MARGIN 原组件里的那段 SVG，3142 字符，原样保留 */',
  '  const STARS = ' + JSON.stringify(svg) + ';',
  '',
  '  function paintSwitch(btn, dark) {',
  "    btn.dataset.state = dark ? 'dark' : 'light';",
  "    btn.setAttribute('aria-checked', dark ? 'true' : 'false');",
  "    var label = dark ? '切换到浅色' : '切换到深色';",
  '    btn.title = label;',
  "    btn.setAttribute('aria-label', label);",
  '  }',
  '',
  '  /** 日/夜胶囊开关：白天是云 + 太阳，夜里是星星 + 月亮 */',
  '  function dayNight(opts) {',
  '    var o = opts || {};',
  "    var btn = document.createElement('button');",
  "    btn.type = 'button';",
  "    btn.className = 'mp-ts' + (o.class ? ' ' + o.class : '');",
  "    btn.setAttribute('role', 'switch');",
  '    btn.innerHTML = \'<span class="mp-ts-c" aria-hidden="true">\'',
  '      + \'<span class="mp-ts-clouds"></span>\'',
  '      + \'<span class="mp-ts-stars">\' + STARS + \'</span>\'',
  '      + \'<span class="mp-ts-circle"><span class="mp-ts-sm"><span class="mp-ts-moon">\'',
  '      + \'<span class="mp-ts-spot"></span><span class="mp-ts-spot"></span><span class="mp-ts-spot"></span>\'',
  '      + \'</span></span></span></span>\';',
  '    paintSwitch(btn, !!o.dark);',
  '    // 首次挂载不播放过渡，避免从 light 闪到 dark',
  "    btn.classList.add('mp-ts-still');",
  '    requestAnimationFrame(function () {',
  "      requestAnimationFrame(function () { btn.classList.remove('mp-ts-still'); });",
  '    });',
  "    btn.addEventListener('click', function () {",
  "      var next = btn.dataset.state !== 'dark';",
  '      paintSwitch(btn, next);',
  '      if (o.onChange) o.onChange(next, btn);',
  '    });',
  '    return btn;',
  '  }',
  '',
  ''
].join('\n');

src = src.replace(
  '  return { chip, button, skeleton, empty, toolbar, card };',
  block + '  return { chip, button, skeleton, empty, toolbar, card, dayNight, paintSwitch };'
);

fs.writeFileSync(file, src, 'utf8');
console.log('patched', file, src.length);
