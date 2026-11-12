const DEFAULTS = {
  enabled: true,
  theme: 'auto',
  palette: true,
  homeRotate: true,
  footprint: true,
  redrawSearch: true,
  redrawPages: false,
  bgPreset: 'mist',
  bgIntensity: 45,
  compact: false,
  debug: false
};

const $ = (id) => document.getElementById(id);
let state = Object.assign({}, DEFAULTS);

function paint() {
  $('enabled').checked = !!state.enabled;
  $('palette').checked = !!state.palette;
  $('redrawSearch').checked = !!state.redrawSearch;
  $('redrawPages').checked = !!state.redrawPages;
  $('compact').checked = !!state.compact;
  document.querySelectorAll('#theme button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === (state.theme || 'auto'));
  });
}

function save() {
  chrome.storage.sync.set(state, () => {
    const s = $('status');
    s.textContent = '已保存 · ' + new Date().toLocaleTimeString();
  });
}

function bind() {
  ['enabled', 'palette', 'redrawSearch', 'redrawPages', 'compact'].forEach((id) => {
    $(id).addEventListener('change', () => {
      state[id] = $(id).checked;
      save();
    });
  });

  document.querySelectorAll('#theme button').forEach((b) => {
    b.addEventListener('click', () => {
      state.theme = b.dataset.value;
      paint();
      save();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  $('version').textContent = chrome.runtime.getManifest().version;
  chrome.storage.sync.get(DEFAULTS, (s) => {
    state = Object.assign({}, DEFAULTS, s);
    paint();
    bind();
  });
});

