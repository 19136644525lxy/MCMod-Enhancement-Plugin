/**
 * 基础 DOM 工具：h() 渲染函数、文本清理、高亮、时间格式化。
 * 原型阶段不依赖任何框架；M2 迁移 Preact 时保持组件签名一致即可。
 */
window.MP = window.MP || {};

MP.dom = (function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class' || k === 'className') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'html') {
          // 仅用于内部受控内容，禁止传入用户数据
          el.innerHTML = v;
        } else el.setAttribute(k, String(v));
      }
    }
    append(el, children);
    return el;
  }

  function append(parent, children) {
    for (const c of children) {
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) append(parent, c);
      else if (c instanceof Node) parent.appendChild(c);
      else parent.appendChild(document.createTextNode(String(c)));
    }
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function text(s) {
    return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  }

  /** 去掉 MC百科 编辑语法残留：[ban:title_menu]、[h1=简介]、[img]、[b] 等 */
  function stripWiki(s) {
    return text(s)
      .replace(/\[[a-z]+(?::[^\]]*)?\]/gi, '')
      .replace(/\[\/?(b|i|u|s|code|quote|list|\*)\]/gi, '')
      .replace(/\[h[1-6]=[^\]]*\]/gi, '')
      .replace(/\s{2,}/g, ' ');
  }

  function absUrl(href) {
    if (!href) return '';
    try {
      return new URL(href, location.href).href;
    } catch (e) {
      return href;
    }
  }

  /** 关键词高亮，返回 DocumentFragment（不使用 innerHTML，避免 XSS） */
  function highlight(str, keyword) {
    const frag = document.createDocumentFragment();
    const s = String(str || '');
    const kw = text(keyword);
    if (!kw) {
      frag.appendChild(document.createTextNode(s));
      return frag;
    }
    const lower = s.toLowerCase();
    const k = kw.toLowerCase();
    let i = 0;
    let idx;
    while ((idx = lower.indexOf(k, i)) !== -1) {
      if (idx > i) frag.appendChild(document.createTextNode(s.slice(i, idx)));
      const mark = document.createElement('mark');
      mark.className = 'mp-mark';
      mark.textContent = s.slice(idx, idx + kw.length);
      frag.appendChild(mark);
      i = idx + kw.length;
    }
    if (i < s.length) frag.appendChild(document.createTextNode(s.slice(i)));
    return frag;
  }

  function debounce(fn, ms) {
    let t = 0;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else fn();
  }

  function relTime(input) {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return text(input);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 30) return Math.floor(diff / 86400) + ' 天前';
    if (diff < 86400 * 365) return Math.floor(diff / 86400 / 30) + ' 个月前';
    return Math.floor(diff / 86400 / 365) + ' 年前';
  }

  /** 在页面中查找第一个匹配元素，返回 {el, selector} */
  function pick(root, list) {
    for (const sel of list) {
      try {
        const el = root.querySelector(sel);
        if (el) return { el, selector: sel };
      } catch (e) { /* 非法选择器忽略 */ }
    }
    return { el: null, selector: null };
  }

  return { h, append, clear, text, stripWiki, absUrl, highlight, debounce, ready, relTime, pick, SVG_NS };
})();
