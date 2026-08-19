(() => {
  const ROOT_ID = 'studyplease-root';
  const TIMER_ID = 'studyplease-timer';
  const DEFAULT_STATE = {
    blockedSites: [],
    unlockMinutes: 10,
    vocabularyLevel: 'C1',
    sessionExpiresAt: 0,
    words: [],
    stats: { quizzes: 0, correct: 0, wrong: 0, unlocked: 0 }
  };

  let state = { ...DEFAULT_STATE };
  let quizWords = [];
  let currentWord = null;
  let currentOptions = [];
  let locked = false;
  let feedbackTimer = null;
  let clockTimer = null;
  let observedHost = location.hostname;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function normalizeHost(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split(':')[0];
  }

  function siteMatches(host, rule) {
    const target = normalizeHost(rule);
    const current = normalizeHost(host);
    if (!target || !current) return false;
    return current === target || current.endsWith(`.${target}`);
  }

  async function loadState() {
    const stored = await chrome.storage.local.get(DEFAULT_STATE);
    state = { ...DEFAULT_STATE, ...stored };
    return state;
  }

  function isBlockedSite() {
    return state.blockedSites.some((site) => siteMatches(location.hostname, site));
  }

  function sessionActive() {
    return Number(state.sessionExpiresAt) > Date.now();
  }

  function removeUI() {
    document.getElementById(ROOT_ID)?.remove();
    document.getElementById(TIMER_ID)?.remove();
    document.documentElement.classList.remove('studyplease-locked');
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
  }

  function setBodyLock(lockedValue) {
    document.documentElement.classList.toggle('studyplease-locked', lockedValue);
    document.body?.classList.toggle('studyplease-locked', lockedValue);
  }

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('aria-live', 'polite');
    (document.documentElement || document.body).appendChild(root);
    return root;
  }

  function chooseWords() {
    const words = Array.isArray(state.words) ? state.words.slice() : [];
    if (!words.length) return [];
    const preferred = words.filter((w) => !state.vocabularyLevel || w.level === state.vocabularyLevel);
    return (preferred.length ? preferred : words).sort(() => Math.random() - 0.5);
  }

  function getNextWord() {
    if (!quizWords.length) quizWords = chooseWords();
    currentWord = quizWords.shift();
    if (!currentWord) return null;
    const pool = (state.words || []).filter((w) => w.id !== currentWord.id && w.meaning);
    const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    currentOptions = [currentWord, ...distractors].sort(() => Math.random() - 0.5);
    return currentWord;
  }

  function answerButton(label, index) {
    return `<button class="sp-option" data-index="${index}" type="button">${escapeHtml(label)}</button>`;
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function updateStats(delta) {
    const stats = state.stats || DEFAULT_STATE.stats;
    const next = {
      quizzes: Math.max(0, (stats.quizzes || 0) + (delta.quizzes || 0)),
      correct: Math.max(0, (stats.correct || 0) + (delta.correct || 0)),
      wrong: Math.max(0, (stats.wrong || 0) + (delta.wrong || 0)),
      unlocked: Math.max(0, (stats.unlocked || 0) + (delta.unlocked || 0))
    };
    state.stats = next;
    await chrome.storage.local.set({ stats: next });
  }

  function renderQuiz() {
    const root = ensureRoot();
    const word = getNextWord();

    if (!word) {
      root.innerHTML = `
        <div class="sp-backdrop">
          <div class="sp-card">
            <div class="sp-brand">StudyPlease</div>
            <h1>Add some vocabulary first.</h1>
            <p class="sp-muted">Open the StudyPlease extension popup and add at least one word with its meaning.</p>
          </div>
        </div>`;
      setBodyLock(true);
      return;
    }

    root.innerHTML = `
      <div class="sp-backdrop">
        <div class="sp-card" role="dialog" aria-modal="true" aria-label="StudyPlease vocabulary checkpoint">
          <div class="sp-brand">StudyPlease</div>
          <div class="sp-chip">English checkpoint · ${escapeHtml(word.level || state.vocabularyLevel || 'C1')}</div>
          <h1>Learn before you browse.</h1>
          <p class="sp-question">What does <strong>“${escapeHtml(word.word)}”</strong> mean?</p>
          <div class="sp-options">
            ${currentOptions.map((option, i) => answerButton(option.meaning, i)).join('')}
          </div>
          <div class="sp-feedback" id="sp-feedback"></div>
          <div class="sp-footer">One correct answer unlocks your browsing time.</div>
        </div>
      </div>`;

    root.querySelectorAll('.sp-option').forEach((button) => {
      button.addEventListener('click', () => handleAnswer(Number(button.dataset.index)));
    });
    setBodyLock(true);
  }

  async function handleAnswer(index) {
    if (locked || !currentWord) return;
    locked = true;
    await updateStats({ quizzes: 1 });
    const selected = currentOptions[index];
    const root = document.getElementById(ROOT_ID);
    const feedback = document.getElementById('sp-feedback');
    const buttons = [...(root?.querySelectorAll('.sp-option') || [])];
    buttons.forEach((button) => { button.disabled = true; });

    const isCorrect = selected?.id === currentWord.id;

    if (isCorrect) {
      buttons[index]?.classList.add('sp-correct');
      if (feedback) feedback.innerHTML = '<span class="sp-good">✓ Correct</span>';
      await updateStats({ correct: 1, unlocked: 1 });
      const minutes = Math.min(60, Math.max(1, Number(state.unlockMinutes) || 10));
      const expires = Date.now() + minutes * 60 * 1000;
      state.sessionExpiresAt = expires;
      await chrome.storage.local.set({ sessionExpiresAt: expires });
      await sleep(700);
      showTimer();
      removeLockOverlayOnly();
      locked = false;
      return;
    }

    buttons[index]?.classList.add('sp-wrong');
    const correctIndex = currentOptions.findIndex((option) => option.id === currentWord.id);
    buttons[correctIndex]?.classList.add('sp-correct');
    if (feedback) feedback.innerHTML = `<span class="sp-bad">✕ Not quite.</span><span class="sp-answer">${escapeHtml(currentWord.word)} = ${escapeHtml(currentWord.meaning)}</span>`;
    await updateStats({ wrong: 1 });
    await sleep(1100);
    locked = false;
    quizWords = quizWords.length ? quizWords : chooseWords();
    renderQuiz();
  }

  function removeLockOverlayOnly() {
    document.getElementById(ROOT_ID)?.remove();
    setBodyLock(false);
  }

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  async function showTimer() {
    const existing = document.getElementById(TIMER_ID);
    if (!existing) {
      const timer = document.createElement('div');
      timer.id = TIMER_ID;
      timer.innerHTML = `<span class="sp-timer-label">StudyPlease</span><span class="sp-timer-value">00:00</span>`;
      (document.body || document.documentElement).appendChild(timer);
    }
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(async () => {
      const data = await chrome.storage.local.get({ sessionExpiresAt: 0 });
      state.sessionExpiresAt = data.sessionExpiresAt || 0;
      const remaining = state.sessionExpiresAt - Date.now();
      const value = document.querySelector('#studyplease-timer .sp-timer-value');
      if (value) value.textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(clockTimer);
        clockTimer = null;
        document.getElementById(TIMER_ID)?.remove();
        await chrome.storage.local.set({ sessionExpiresAt: 0 });
        if (isBlockedSite()) {
          quizWords = [];
          renderQuiz();
        }
      }
    }, 500);
  }

  async function sync() {
    await loadState();
    const hostChanged = observedHost !== location.hostname;
    observedHost = location.hostname;
    if (!isBlockedSite()) {
      removeUI();
      return;
    }
    if (sessionActive()) {
      removeLockOverlayOnly();
      await showTimer();
      return;
    }
    if (!document.getElementById(ROOT_ID) || hostChanged) {
      quizWords = [];
      renderQuiz();
    }
  }

  chrome.storage.onChanged.addListener(async () => {
    await sync();
  });

  const boot = async () => {
    for (let i = 0; i < 20 && !document.documentElement; i++) await sleep(50);
    await sync();
  };

  boot();
})();
