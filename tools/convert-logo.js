const { execFileSync } = require('child_process');
const fs = require('fs');

// 用 ffmpeg 把 GIF 转成带 alpha 的 WebP 动画，边缘比 GIF 的 1-bit 透明干净。
const out = 'assets/logo_dynamic.webp';

execFileSync('F:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe', [
  '-y', '-v', 'error',
  '-i', 'output/logo_dynamic.gif',
  '-filter_complex', '[0:v]split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=128',
  '-loop', '0',
  '-c:v', 'libwebp_anim',
  '-lossless', '0',
  '-q:v', '80',
  out
], { stdio: 'inherit' });

console.log('webp bytes', fs.statSync(out).size);
console.log('gif bytes', fs.statSync('output/logo_dynamic.gif').size);
