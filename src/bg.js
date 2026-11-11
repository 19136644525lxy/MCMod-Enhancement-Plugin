/**
 * Service Worker：跨子域抓取代理 + 内存缓存 + 限流
 *
 * content script 位于 www.mcmod.cn 时，直接 fetch search.mcmod.cn 会被 CORS 拦截，
 * 因此统一走这里转发。
 *
 * 2026-11-10 该扩展的调试流量触发过 MC百科 WAF（站长反馈：单张图片被连续请求
 * 上千次）。本扩展从未请求过图片，但为避免任何意外的循环请求再次触发风控，
 * 这里做了三道闸：
 *   1. 白名单精确到「真正需要的三种页面 URL」，其余一律拒绝；
 *   2. 滑动窗口限流：60 秒内最多 30 次，超出直接返回 RATE_LIMITED；
 *   3. 暴露计数（mp:stats），调试面板可查看，便于事后定位。
 */
const ALLOWED = [
  /^https:\/\/search\.mcmod\.cn\/s\?/i,
  /^https:\/\/www\.mcmod\.cn\/modlist\.html\?/i,
  /^https:\/\/www\.mcmod\.cn\/(item|class|post)\/\d+\.html$/i
];

const CACHE = new Map(); // url -> { text, at }
const TTL = 5 * 60 * 1000;
const MAX_CACHE = 40;

const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 30;
const hits = [];       // 最近 60 秒内的请求时间戳
let fetched = 0;       // 实际发出的请求数
let blocked = 0;       // 被白名单或限流拦下的次数

function isAllowed(url) {
  return ALLOWED.some((re) => re.test(url));
}

function allowByRate() {
  const now = Date.now();
  while (hits.length && now - hits[0] > RATE_WINDOW) hits.shift();
  if (hits.length >= RATE_MAX) return false;
  hits.push(now);
  return true;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === 'mp:stats') {
    sendResponse({ ok: true, fetched, blocked, cache: CACHE.size });
    return;
  }

  if (msg.type !== 'mp:fetchPage') return;

  const url = String(msg.url || '');

  if (!isAllowed(url)) {
    blocked++;
    sendResponse({ ok: false, error: 'URL_NOT_ALLOWED' });
    return;
  }

  const hit = CACHE.get(url);
  if (hit && Date.now() - hit.at < TTL) {
    sendResponse({ ok: true, text: hit.text, cached: true });
    return;
  }

  if (!allowByRate()) {
    blocked++;
    sendResponse({ ok: false, error: 'RATE_LIMITED' });
    return;
  }

  fetched++;
  fetch(url, {
    credentials: 'omit',
    headers: { 'Accept': 'text/html,application/xhtml+xml' }
  })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then((text) => {
      if (CACHE.size >= MAX_CACHE) {
        CACHE.delete(CACHE.keys().next().value);
      }
      CACHE.set(url, { text, at: Date.now() });
      sendResponse({ ok: true, text, cached: false });
    })
    .catch((err) => {
      sendResponse({ ok: false, error: String((err && err.message) || err) });
    });

  return true; // 异步响应
});
