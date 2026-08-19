const DEFAULT_WORDS = [
  { id: crypto.randomUUID(), word: 'meticulous', meaning: 'very careful and precise about details', level: 'C1' },
  { id: crypto.randomUUID(), word: 'ambiguous', meaning: 'open to more than one possible meaning or interpretation', level: 'C1' },
  { id: crypto.randomUUID(), word: 'compelling', meaning: 'very convincing or able to hold your attention strongly', level: 'C1' },
  { id: crypto.randomUUID(), word: 'detrimental', meaning: 'causing harm or damage', level: 'C1' },
  { id: crypto.randomUUID(), word: 'inevitable', meaning: 'certain to happen and impossible to avoid', level: 'C1' },
  { id: crypto.randomUUID(), word: 'coherent', meaning: 'logical, clear, and well connected', level: 'C1' },
  { id: crypto.randomUUID(), word: 'predominant', meaning: 'more common or important than anything else', level: 'C1' },
  { id: crypto.randomUUID(), word: 'substantial', meaning: 'large in amount, size, or importance', level: 'C1' },
  { id: crypto.randomUUID(), word: 'skeptical', meaning: 'not easily convinced and likely to question claims', level: 'C1' },
  { id: crypto.randomUUID(), word: 'sophisticated', meaning: 'advanced, refined, or highly developed', level: 'C1' }
];

const DEFAULT_SETTINGS = {
  blockedSites: [],
  unlockMinutes: 10,
  vocabularyLevel: 'C1',
  sessionExpiresAt: 0,
  stats: { quizzes: 0, correct: 0, wrong: 0, unlocked: 0 }
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const existing = await chrome.storage.local.get(null);
  const patch = {};
  if (!Array.isArray(existing.words) || existing.words.length === 0) patch.words = DEFAULT_WORDS;
  if (!Array.isArray(existing.blockedSites)) patch.blockedSites = DEFAULT_SETTINGS.blockedSites;
  if (typeof existing.unlockMinutes !== 'number') patch.unlockMinutes = DEFAULT_SETTINGS.unlockMinutes;
  if (typeof existing.vocabularyLevel !== 'string') patch.vocabularyLevel = DEFAULT_SETTINGS.vocabularyLevel;
  if (typeof existing.sessionExpiresAt !== 'number') patch.sessionExpiresAt = 0;
  if (!existing.stats) patch.stats = DEFAULT_SETTINGS.stats;
  await chrome.storage.local.set(patch);

  if (reason === 'install') {
    await chrome.storage.local.set({ lastInstalledAt: Date.now() });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'getState') {
    chrome.storage.local.get(null).then((data) => sendResponse(data));
    return true;
  }
});
