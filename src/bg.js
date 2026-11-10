/**
 * Service Worker：跨子域抓取代理 + 内存缓存
 * content script 位于 www.mcmod.cn 时，直接 fetch search.mcmod.cn 会被 CORS 拦截，
 * 因此统一走这里转发。仅允许 *.mcmod.cn。
 */
const ALLOWED = /^https:\/\/([a-z0-9-]+\.)*mcmod\.cn\//i;
const CACHE = new Map(); // url -> { text, at }
const TTL = 5 * 60 * 1000;
const MAX_CACHE = 40;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'mp:fetchPage') return;

  const url = String(msg.url || '');
  if (!ALLOWED.test(url)) {
    sendResponse({ ok: false, error: 'URL_NOT_ALLOWED' });
    return;
  }

  const hit = CACHE.get(url);
  if (hit && Date.now() - hit.at < TTL) {
    sendResponse({ ok: true, text: hit.text, cached: true });
    return;
  }

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
      sendResponse({ ok: false, error: String(err && err.message || err) });
    });

  return true; // 异步响应
});
