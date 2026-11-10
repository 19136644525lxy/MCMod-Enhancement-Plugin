const $ = (id) => document.getElementById(id);

function readForm() {
  return {
    enabled: $('enabled').checked,
    theme: document.querySelector('#theme button.active')?.dataset.value || 'auto',
    palette: $('palette').checked,
    redrawSearch: $('redrawSearch').checked,
    compact: $('compact').checked
  };
}

function paint(settings) {
  $('enabled').checked = !!settings.enabled;
  $('palette').checked = !!settings.palette;
  $('redrawSearch').checked = !!settings.redrawSearch;
  $('compact').checked = !!settings.compact;
  document.querySelectorAll('#theme button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === (settings.theme || 'auto'));
  });
}

function save() {
  const data = readForm();
  chrome.storage.sync.set(data, () => {
    $('status').textContent = '已保存';
    setTimeout(() => ($('status').textContent = '就绪'), 1200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  $('version').textContent = 'v' + chrome.runtime.getManifest().version;

  chrome.storage.sync.get(
    { enabled: true, theme: 'auto', palette: true, redrawSearch: true, compact: false },
    (s) => paint(s)
  );

  $('enabled').addEventListener('change', save);

  ['palette', 'redrawSearch', 'compact'].forEach((id) => {
    $(id).addEventListener('change', save);
  });

  document.querySelectorAll('#theme button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#theme button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      save();
    });
  });

  $('options').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});
