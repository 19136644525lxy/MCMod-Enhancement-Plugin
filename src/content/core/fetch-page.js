/**
 * 跨子域页面抓取：content script 不直接 fetch，统一走 background 代理。
 * 返回解析好的 Document，供 extract 层使用。
 */
window.MP = window.MP || {};

MP.page = (function () {
  const CACHE = new Map(); // url -> {doc, at}
  const TTL = 5 * 60 * 1000;

  function rawFetch(url) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'mp:fetchPage', url }, (res) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(res || { ok: false, error: 'NO_RESPONSE' });
        });
      } catch (e) {
        resolve({ ok: false, error: String(e) });
      }
    });
  }

  function parse(text) {
    return new DOMParser().parseFromString(text, 'text/html');
  }

  async function fetchDoc(url, opts) {
    const force = !!(opts && opts.force);
    const hit = CACHE.get(url);
    if (!force && hit && Date.now() - hit.at < TTL) {
      return { ok: true, doc: hit.doc, cached: true };
    }
    const res = await rawFetch(url);
    if (!res.ok) return { ok: false, error: res.error || 'FETCH_FAILED' };
    const doc = parse(res.text);
    if (CACHE.size >= 30) CACHE.delete(CACHE.keys().next().value);
    CACHE.set(url, { doc, at: Date.now() });
    return { ok: true, doc, cached: false };
  }

  function searchUrl(keyword) {
    return 'https://search.mcmod.cn/s?key=' + encodeURIComponent(keyword);
  }

  function listUrl(keyword) {
    return 'https://www.mcmod.cn/modlist.html?key=' + encodeURIComponent(keyword);
  }

  return { fetchDoc, parse, rawFetch, searchUrl, listUrl };
})();
