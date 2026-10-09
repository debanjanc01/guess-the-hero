export const MODES = {
  original: { name: 'The original', label: '2017 · ORIGINAL 32', description: 'Where it all began. The silhouettes and artwork from the Android game.', number: '01' },
  classic: { name: 'The old guard', label: '2018 · CLASSIC ROSTER', description: 'A trip back to the old days. Every hero on the December 2018 roster.', number: '02' },
  current: { name: 'All pick', label: 'CURRENT · FULL ROSTER', description: 'The entire battlefield. From the legends to Kez, Ring Master, and Largo.', number: '03' },
  newcomers: { name: 'New blood', label: 'POST-2018 · NEW ARRIVALS', description: 'Meet the heroes who joined after the classic era.', number: '04' },
};

export const normalize = (value) => value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');

export function createAnswerBook(heroes) {
  const book = Object.create(null);
  for (const id in heroes) {
    const hero = heroes[id];
    const accepted = Object.create(null);
    accepted[normalize(hero.name)] = true;
    accepted[normalize(id)] = true;
    for (const alias of hero.aliases) if (alias) accepted[normalize(alias)] = true;
    book[id] = accepted;
  }
  return book;
}

export function poolFor(heroes, mode) {
  if (!Object.hasOwn(MODES, mode)) throw new Error('Unknown game mode');
  const ids = [];
  for (const id in heroes) {
    const hero = heroes[id];
    if (mode === 'current' || (mode === 'original' && hero.originalImage) || (mode === 'classic' && hero.classic) || (mode === 'newcomers' && !hero.classic)) ids.push(id);
  }
  return ids;
}

export function startGame(heroes, mode, random = Math.random) {
  const order = poolFor(heroes, mode);
  // Fisher–Yates: every hero gets exactly one turn. No random-retry/contains loop.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { mode, order, index: 0, score: 0, skips: 3, correct: 0, skipped: 0, attempts: 0, status: order.length ? 'playing' : 'finished', feedback: '', outcome: '', history: {}, reason: '' };
}

export function transition(game, action, answerBook) {
  const id = game.order[game.index];
  switch (action.type) {
    case 'guess': {
      if (game.status !== 'playing') return game;
      const answer = normalize(action.answer);
      if (!answer) return { ...game, feedback: 'Enter a hero name first.' };
      if (!answerBook[id]?.[answer]) return { ...game, attempts: game.attempts + 1, feedback: 'Not this hero. Trust your instincts—try again.' };
      return { ...game, status: 'revealed', score: game.score + 10, correct: game.correct + 1, attempts: game.attempts + 1, feedback: '', outcome: 'correct', history: { ...game.history, [id]: 'correct' } };
    }
    case 'skip':
      if (game.status !== 'playing' || game.skips === 0) return game;
      return { ...game, status: 'revealed', skips: game.skips - 1, skipped: game.skipped + 1, feedback: '', outcome: 'skipped', history: { ...game.history, [id]: 'skipped' } };
    case 'next':
      if (game.status !== 'revealed') return game;
      if (game.index + 1 >= game.order.length) return { ...game, status: 'finished', reason: 'completed' };
      return { ...game, index: game.index + 1, status: 'playing', feedback: '', outcome: '' };
    case 'quit':
      if (game.status === 'finished') return game;
      return { ...game, status: 'finished', reason: 'gg' };
    default: return game;
  }
}

export function artwork(hero, mode) {
  if ((mode === 'original' || mode === 'classic') && hero.originalImage) return { image: hero.originalImage, silhouette: hero.originalSilhouette, original: true };
  return { image: hero.image, silhouette: hero.image, original: false };
}

export function readSaved(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function writeSaved(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
