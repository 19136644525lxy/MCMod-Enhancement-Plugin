/**
 * 全局命令面板（Cmd/Ctrl + K）
 * 能力：全站搜索 + 模组结构检索，统一入口、键盘导航。
 */
window.MP = window.MP || {};
MP.palette = (function () {
  const { h, clear, debounce } = MP.dom;

  let overlay = null;
  let input = null;
  let resultsEl = null;
  let state = { open: false, items: [], selected: 0, seq: 0, query: '' };

  const PRE_FIX = [
    { key: 'mod', label: '模组', type: '模组' },
    { key: 'pack', label: '整合包', type: '整合包' },
    { key: 'item', label: '资料', type: '资料' },
    { key: 'post', label: '教程', type: '教程' },
    { key: 'user', label: '用户', type: '用户' }
  ];

  function parseQuery(raw) {
    const q = (raw || '').trim();
    const m = /^([a-z]+):\s*(.*)$/i.exec(q);
    if (m) {
      const hit = PRE_FIX.find((p) => p.key === m[1].toLowerCase());
      if (hit) return { keyword: m[2], type: hit.type, prefix: hit.key };
    }
    return { keyword: q, type: '', prefix: '' };
  }

  function build() {
    input = h('input', {
      class: 'mp-palette-input',
      type: 'text',
      placeholder: '搜索模组、整合包、资料、教程… 支持 mod: pack: item: post: user: 前缀',
      autocomplete: 'off',
      spellcheck: 'false'
    });

    resultsEl = h('div', { class: 'mp-palette-results' });

    const panel = h('div', { class: 'mp-palette', role: 'dialog', 'aria-modal': 'true' },
      input,
      h('div', { class: 'mp-palette-hint' },
        '↑↓ 选择', h('code', null, '↵'), '打开',
        h('code', null, 'Esc'), '关闭',
        h('code', null, 'mod:'), '只搜模组'
      ),
      resultsEl,
      h('div', { class: 'mp-palette-foot' },
        h('span', null, 'MC百科增强 · 命令面板'),
        h('span', null, '搜索由 MC百科 提供，结果已本地重排')
      )
    );

    overlay = h('div', { class: 'mp-palette-overlay mp-root' }, panel);
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close();
    });
    input.addEventListener('input', debounce(onInput, 220));
    input.addEventListener('keydown', onKeydown);
  }

  function open(settings) {
    if (!settings || !settings.palette) return;
    if (!overlay) build();
    if (state.open) return;
    document.documentElement.appendChild(overlay);
    state.open = true;
    state.selected = 0;
    state.items = [];
    state.query = '';
    input.value = '';
    input.focus();
    document.body.style.overflow = 'hidden';
    renderHint();
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    document.body.style.overflow = '';
    if (overlay && overlay.parentNode) overlay.remove();
  }

  function toggle(settings) {
    if (state.open) close();
    else open(settings);
  }

  function renderHint() {
    clear(resultsEl);
    resultsEl.appendChild(
      h('div', { class: 'mp-palette-empty' },
        '输入关键词开始搜索。也可以直接回车打开 MC百科 搜索结果页。'
      )
    );
  }

  async function onInput() {
    const raw = input.value;
    const parsed = parseQuery(raw);
    state.query = parsed.keyword;
    state.selected = 0;

    if (!parsed.keyword) {
      renderHint();
      return;
    }

    // 单字搜索既没有意义，又会放大请求量，直接拦在本地
    if (parsed.keyword.length < 2) {
      clear(resultsEl);
      resultsEl.appendChild(
        MP.ui.empty('再多输入一个字', '单字搜索范围太大，且会产生多余请求')
      );
      return;
    }

    const seq = ++state.seq;
    clear(resultsEl);
    resultsEl.appendChild(MP.ui.skeleton(3));

    const [searchRes, listRes] = await Promise.all([
      MP.page.fetchDoc(MP.page.searchUrl(parsed.keyword)),
      MP.page.fetchDoc(MP.page.listUrl(parsed.keyword))
    ]);

    if (seq !== state.seq) return; // 竞态：丢弃过期结果

    const groups = [];
    const seen = new Set();

    if (searchRes.ok) {
      const data = MP.extract.search(searchRes.doc);
      let items = data.items;
      if (parsed.type) items = items.filter((it) => it.type === parsed.type);
      if (items.length) groups.push({ label: '站内搜索', items: items.slice(0, 12) });
      items.forEach((it) => seen.add(it.href));
    }

    if (listRes.ok) {
      const data = MP.extract.modlist(listRes.doc, '模组');
      let items = data.items;
      if (parsed.type && parsed.type !== '模组') items = [];
      items = items.filter((it) => !seen.has(it.href)).slice(0, 8);
      if (items.length) groups.push({ label: '结构化检索 · 模组', items });
    }

    renderGroups(groups, parsed);
  }

  function renderGroups(groups, parsed) {
    clear(resultsEl);
    state.items = [];

    if (!groups.length) {
      resultsEl.appendChild(
        MP.ui.empty('没有找到结果', '试试更短的关键词，或去掉前缀')
      );
      return;
    }

    groups.forEach((g) => {
      resultsEl.appendChild(h('div', { class: 'mp-palette-group' }, g.label));
      g.items.forEach((item) => {
        const idx = state.items.length;
        state.items.push(item);
        const row = h('div', {
          class: 'mp-palette-item' + (idx === 0 ? ' is-selected' : ''),
          dataset: { idx: String(idx) }
        },
          h('span', { class: 'mp-palette-item-type' }, item.type || '页面'),
          h('span', { class: 'mp-palette-item-title' }, item.title),
          item.ename ? h('span', { class: 'mp-palette-item-sub' }, item.ename) : null
        );
        row.addEventListener('click', () => activate(idx));
        resultsEl.appendChild(row);
      });
    });

    if (parsed.keyword) {
      const searchAll = h('div', {
        class: 'mp-palette-item',
        dataset: { idx: '-1' }
      },
        h('span', { class: 'mp-palette-item-type' }, '搜索'),
        h('span', { class: 'mp-palette-item-title' }, `在 MC百科 中搜索 “${parsed.keyword}”`),
        h('span', { class: 'mp-palette-item-sub' }, '打开结果页')
      );
      searchAll.addEventListener('click', () => {
        window.location.href = MP.page.searchUrl(parsed.keyword);
      });
      resultsEl.appendChild(searchAll);
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = parseQuery(input.value);
      if (!state.items.length && parsed.keyword) {
        window.location.href = MP.page.searchUrl(parsed.keyword);
        return;
      }
      activate(state.selected);
    }
  }

  function move(delta) {
    if (!state.items.length) return;
    const next = Math.max(0, Math.min(state.items.length - 1, state.selected + delta));
    state.selected = next;
    resultsEl.querySelectorAll('.mp-palette-item').forEach((el) => {
      const idx = Number(el.dataset.idx);
      el.classList.toggle('is-selected', idx === next);
    });
    const cur = resultsEl.querySelector('.mp-palette-item.is-selected');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  function activate(idx) {
    const item = state.items[idx];
    if (!item) return;
    window.location.href = item.href;
  }

  return { open, close, toggle, isOpen: () => state.open };
})();
