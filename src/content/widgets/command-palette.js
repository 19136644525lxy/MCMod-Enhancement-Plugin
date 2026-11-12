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

  function splitWords(raw) {
    return String(raw || '').trim().split(/\s+/).filter(Boolean);
  }

  /**
   * 「猜词」词库：不额外发请求，直接从当前页面已经渲染出来的东西里收集。
   * 首页有热门标签、模组卡、九大分类，够用了。
   */
  let lexicon = null;
  function buildLexicon() {
    const words = new Set();
    const push = (sel, attr) => {
      document.querySelectorAll(sel).forEach((el) => {
        const t = (el.textContent || '').trim();
        if (t && t.length <= 24) words.add(t);
      });
    };
    push('.mp-tag-name');
    push('.mp-mod-name');
    push('.mp-cat-name');
    push('.mp-version-chip');
    return Array.from(words);
  }

  function suggestWords(prefix) {
    const p = String(prefix || '').trim().toLowerCase();
    if (p.length < 1) return [];
    if (!lexicon || !lexicon.length) lexicon = buildLexicon();
    if (!lexicon.length) return [];
    const starts = [];
    const contains = [];
    lexicon.forEach((w) => {
      const lw = w.toLowerCase();
      if (lw === p) return;
      if (lw.indexOf(p) === 0) starts.push(w);
      else if (lw.indexOf(p) > 0) contains.push(w);
    });
    return starts.concat(contains).slice(0, 6);
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
    const words = splitWords(parsed.keyword);
    const keyword = words.join(' ');
    state.query = keyword;
    state.selected = 0;

    if (!keyword) {
      renderHint();
      return;
    }

    const guesses = suggestWords(words[words.length - 1] || keyword);

    const seq = ++state.seq;
    clear(resultsEl);
    resultsEl.appendChild(MP.ui.skeleton(3));

    // 单字只查全文搜索（结果面已经够宽），多字再补一次结构化检索。
    // 前缀限定了类型时也不需要结构化那一路。
    const tasks = [MP.page.fetchDoc(MP.page.searchUrl(keyword))];
    if (keyword.length >= 2 && !parsed.type) {
      tasks.push(MP.page.fetchDoc(MP.page.listUrl(keyword)));
    }
    const res = await Promise.all(tasks);
    const searchRes = res[0];
    const listRes = res[1];

    if (seq !== state.seq) return; // 竞态：丢弃过期结果

    const groups = [];
    const seen = new Set();

    if (searchRes.ok) {
      const data = MP.extract.search(searchRes.doc);
      let items = data.items;
      if (parsed.type) items = items.filter((it) => it.type === parsed.type);
      // 多个词时，优先保留「标题/摘要同时包含所有词」的结果；
      // 一条都没有就退化成按整串搜索，不倒空。
      if (words.length > 1 && items.length) {
        const all = words.map((w) => w.toLowerCase());
        const strict = items.filter((it) => {
          const hay = (it.title + ' ' + it.snippet + ' ' + (it.ename || '')).toLowerCase();
          return all.every((w) => hay.indexOf(w) >= 0);
        });
        if (strict.length) items = strict;
      }
      if (items.length) groups.push({ label: '站内搜索', items: items.slice(0, 12) });
      items.forEach((it) => seen.add(it.href));
    }

    if (listRes && listRes.ok) {
      const data = MP.extract.modlist(listRes.doc, '模组');
      let items = data.items;
      if (parsed.type && parsed.type !== '模组') items = [];
      items = items.filter((it) => !seen.has(it.href)).slice(0, 8);
      if (items.length) groups.push({ label: '结构化检索 · 模组', items });
    }

    renderGroups(groups, parsed, guesses);
  }

  function renderGuesses(guesses) {
    if (!guesses || !guesses.length) return null;
    const row = h('div', { class: 'mp-palette-suggest' },
      h('span', { class: 'mp-palette-suggest-label' }, '猜你想搜'),
      ...guesses.map((w) => {
        const chip = h('button', { class: 'mp-palette-suggest-chip', type: 'button' }, w);
        chip.addEventListener('click', () => {
          input.value = w;
          onInput();
          input.focus();
        });
        return chip;
      })
    );
    return row;
  }


  function renderGroups(groups, parsed, guesses) {
    clear(resultsEl);
    state.items = [];

    const guessRow = renderGuesses(guesses);
    if (guessRow) resultsEl.appendChild(guessRow);

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
