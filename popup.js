const $ = (id) => document.getElementById(id);

const DEFAULT_WORDS = [
  { word: 'meticulous', meaning: 'very careful and precise about details', level: 'C1' },
  { word: 'ambiguous', meaning: 'open to more than one possible meaning or interpretation', level: 'C1' },
  { word: 'compelling', meaning: 'very convincing or able to hold your attention strongly', level: 'C1' },
  { word: 'detrimental', meaning: 'causing harm or damage', level: 'C1' },
  { word: 'inevitable', meaning: 'certain to happen and impossible to avoid', level: 'C1' },
  { word: 'coherent', meaning: 'logical, clear, and well connected', level: 'C1' },
  { word: 'predominant', meaning: 'more common or important than anything else', level: 'C1' },
  { word: 'substantial', meaning: 'large in amount, size, or importance', level: 'C1' },
  { word: 'skeptical', meaning: 'not easily convinced and likely to question claims', level: 'C1' },
  { word: 'sophisticated', meaning: 'advanced, refined, or highly developed', level: 'C1' }
];

let state = { blockedSites: [], unlockMinutes: 10, vocabularyLevel: 'C1', words: [], stats: {} };

function normalizeHost(value) {
  return String(value || '')
    .trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split(':')[0];
}

function makeId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }

async function load() {
  state = await chrome.storage.local.get({
    blockedSites: [],
    unlockMinutes: 10,
    vocabularyLevel: 'C1',
    words: DEFAULT_WORDS.map((w) => ({ ...w, id: makeId() })),
    stats: { quizzes: 0, correct: 0, wrong: 0, unlocked: 0 }
  });
  render();
}

async function save(patch) {
  Object.assign(state, patch);
  await chrome.storage.local.set(patch);
  render();
}

function renderSites() {
  const list = $('siteList');
  if (!state.blockedSites?.length) {
    list.innerHTML = '<div class="empty">No restricted sites yet.</div>';
    return;
  }
  list.innerHTML = state.blockedSites.map((site, i) => `
    <div class="row">
      <div class="value"><div class="site">${escapeHtml(site)}</div></div>
      <button class="remove" data-site-index="${i}" type="button">Remove</button>
    </div>`).join('');
  list.querySelectorAll('[data-site-index]').forEach((button) => {
    button.addEventListener('click', async () => {
      const next = state.blockedSites.slice();
      next.splice(Number(button.dataset.siteIndex), 1);
      await save({ blockedSites: next });
    });
  });
}

function renderWords() {
  const list = $('wordList');
  const words = state.words || [];
  list.innerHTML = words.map((item, i) => `
    <div class="row">
      <div class="value">
        <div class="site">${escapeHtml(item.word)} <span style="font-size:10px;color:#7b80ff">${escapeHtml(item.level || 'C1')}</span></div>
        <div class="meaning">${escapeHtml(item.meaning)}</div>
      </div>
      <button class="remove" data-word-index="${i}" type="button">Remove</button>
    </div>`).join('') || '<div class="empty">No vocabulary yet.</div>';
  list.querySelectorAll('[data-word-index]').forEach((button) => {
    button.addEventListener('click', async () => {
      const next = state.words.slice();
      next.splice(Number(button.dataset.wordIndex), 1);
      await save({ words: next });
    });
  });
}

function renderStats() {
  const s = state.stats || {};
  $('stats').innerHTML = `<span>Quizzes <strong>${s.quizzes || 0}</strong></span><span>Correct <strong>${s.correct || 0}</strong></span><span>Wrong <strong>${s.wrong || 0}</strong></span>`;
}

function render() {
  $('minutesRange').value = state.unlockMinutes ?? 10;
  $('minutesValue').textContent = state.unlockMinutes ?? 10;
  $('levelBadge').textContent = state.vocabularyLevel || 'C1';
  renderSites();
  renderWords();
  renderStats();
}

function escapeHtml(text) {
  return String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

$('minutesRange').addEventListener('input', async (event) => {
  await save({ unlockMinutes: Number(event.target.value) });
});

$('addSite').addEventListener('click', async () => {
  const normalized = normalizeHost($('siteInput').value);
  if (!normalized || !normalized.includes('.')) return;
  const next = [...new Set([...(state.blockedSites || []), normalized])];
  $('siteInput').value = '';
  await save({ blockedSites: next });
});

$('siteInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('addSite').click();
});

$('addWord').addEventListener('click', async () => {
  const word = $('wordInput').value.trim();
  const meaning = $('meaningInput').value.trim();
  if (!word || !meaning) return;
  const exists = (state.words || []).some((item) => item.word.toLowerCase() === word.toLowerCase());
  if (exists) return;
  const next = [...(state.words || []), { id: makeId(), word, meaning, level: state.vocabularyLevel || 'C1' }];
  $('wordInput').value = '';
  $('meaningInput').value = '';
  await save({ words: next });
});

$('wordInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('meaningInput').focus();
});

$('meaningInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('addWord').click();
});

chrome.storage.onChanged.addListener(async () => { await load(); });
load();
