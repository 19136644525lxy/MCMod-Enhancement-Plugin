/**
 * 通用 UI 组件（原型阶段用 h() 手写，结构与 Preact 组件对应）
 */
window.MP = window.MP || {};

MP.ui = (function () {
  const { h } = MP.dom;

  function chip(label, opts) {
    const o = opts || {};
    return h(o.href ? 'a' : 'span', {
      class: 'mp-chip' + (o.active ? ' is-active' : '') + (o.muted ? ' is-muted' : ''),
      href: o.href || undefined,
      onclick: o.onclick
    }, label, o.count != null ? h('span', { class: 'mp-chip-count' }, o.count) : null);
  }

  function button(label, opts) {
    const o = opts || {};
    return h('button', {
      class: 'mp-btn' + (o.variant ? ' mp-btn--' + o.variant : ''),
      onclick: o.onclick,
      type: o.type || 'button',
      title: o.title || undefined
    }, label);
  }

  function skeleton(lines) {
    const n = lines || 3;
    return h('div', { class: 'mp-skeleton' },
      Array.from({ length: n }, () => h('div', { class: 'mp-skeleton-line' }))
    );
  }

  function empty(text, hint) {
    return h('div', { class: 'mp-empty' },
      h('div', { class: 'mp-empty-title' }, text),
      hint ? h('div', { class: 'mp-empty-hint' }, hint) : null
    );
  }

  function toolbar(left, right) {
    return h('div', { class: 'mp-toolbar' },
      h('div', { class: 'mp-toolbar-left' }, left),
      h('div', { class: 'mp-toolbar-right' }, right)
    );
  }

  function card(children, opts) {
    const o = opts || {};
    return h(o.href ? 'a' : 'div', {
      class: 'mp-card' + (o.class ? ' ' + o.class : ''),
      href: o.href || undefined,
      target: o.href ? '_blank' : undefined,
      rel: o.href ? 'noopener' : undefined
    }, children);
  }

  return { chip, button, skeleton, empty, toolbar, card };
})();
