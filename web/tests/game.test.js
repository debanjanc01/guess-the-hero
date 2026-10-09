import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAnswerBook, startGame, transition, poolFor, normalize, artwork, readSaved, writeSaved } from '../src/game.js';
const heroes = JSON.parse(readFileSync(new URL('../src/data/heroes.json', import.meta.url)));
const book = createAnswerBook(heroes);
const begin = () => startGame(heroes, 'original', () => 0.5);
const correct = (game) => transition(game, { type: 'guess', answer: heroes[game.order[game.index]].name }, book);

test('verified pools contain original 32, classic 116, current 127, newcomers 11', () => {
  assert.equal(poolFor(heroes, 'original').length, 32);
  assert.equal(poolFor(heroes, 'classic').length, 116);
  assert.equal(poolFor(heroes, 'current').length, 127);
  assert.equal(poolFor(heroes, 'newcomers').length, 11);
  assert.throws(() => poolFor(heroes, 'bad-mode'));
});
test('all classic voice line IDs are historically verified', () => {
  for (const id of poolFor(heroes, 'classic')) assert.equal(heroes[id].historicalLineVerified, true, id);
});
test('normalizes punctuation, spacing, case and diacritics', () => {
  assert.equal(normalize('  CRYSTAL-maiden! '), 'crystalmaiden');
  assert.equal(normalize('Kéz'), 'kez');
});
test('every hero has a direct canonical answer lookup', () => {
  for (const id in heroes) assert.equal(book[id][normalize(heroes[id].name)], true, id);
});
test('common aliases and Ring Master / Ringmaster are accepted', () => {
  assert.equal(book.antimage.am, true);
  assert.equal(book.juggernaut.jugg, true);
  assert.equal(book.ringmaster.ringmaster, true);
});
test('shuffle never duplicates heroes or excludes the final hero', () => {
  for (const random of [() => 0, () => 0.999999, () => 0.5]) {
    const game = startGame(heroes, 'current', random);
    assert.equal(new Set(game.order).size, 127);
    assert.ok(game.order.includes('largo'));
  }
});
test('correct answer awards ten points and reveals', () => {
  const game = correct(begin());
  assert.equal(game.score, 10); assert.equal(game.correct, 1); assert.equal(game.status, 'revealed'); assert.equal(game.outcome, 'correct');
});
test('double submission cannot award duplicate points', () => {
  const game = correct(begin()); assert.equal(correct(game), game);
});
test('wrong guesses are unlimited and preserve score / skips', () => {
  const start = begin(); const game = transition(start, { type: 'guess', answer: 'not a hero' }, book);
  assert.equal(game.score, 0); assert.equal(game.skips, 3); assert.equal(game.status, 'playing'); assert.equal(game.attempts, 1); assert.ok(game.feedback);
  assert.equal(start.attempts, 0);
});
test('empty input has feedback without counting an attempt', () => {
  const game = transition(begin(), { type: 'guess', answer: '  ' }, book);
  assert.equal(game.attempts, 0); assert.ok(game.feedback);
});
test('skip reveals, spends exactly one skip, awards no points', () => {
  const game = transition(begin(), { type: 'skip' }, book);
  assert.equal(game.skips, 2); assert.equal(game.skipped, 1); assert.equal(game.score, 0); assert.equal(game.status, 'revealed');
  assert.equal(transition(game, { type: 'skip' }, book), game);
});
test('next after a correct answer does not spend a skip', () => {
  const game = transition(correct(begin()), { type: 'next' }, book);
  assert.equal(game.index, 1); assert.equal(game.skips, 3); assert.equal(game.status, 'playing');
});
test('cannot skip with zero remaining, but can still guess', () => {
  let game = begin();
  for (let i = 0; i < 3; i++) {
    game = transition(game, { type: 'skip' }, book); game = transition(game, { type: 'next' }, book);
  }
  assert.equal(game.skips, 0); assert.equal(transition(game, { type: 'skip' }, book), game); assert.equal(correct(game).score, 10);
});
test('a full match finishes cleanly with 320 points and unique history', () => {
  let game = begin();
  for (let i = 0; i < 32; i++) game = transition(correct(game), { type: 'next' }, book);
  assert.equal(game.status, 'finished'); assert.equal(game.reason, 'completed'); assert.equal(game.score, 320); assert.equal(Object.keys(game.history).length, 32);
  assert.equal(transition(game, { type: 'next' }, book), game);
});
test('all pick can complete with three skipped heroes', () => {
  let game = startGame(heroes, 'current', () => 0.5);
  for (let i = 0; i < 127; i++) {
    game = i < 3 ? transition(game, { type: 'skip' }, book) : correct(game);
    game = transition(game, { type: 'next' }, book);
  }
  assert.equal(game.status, 'finished'); assert.equal(game.score, 1240); assert.equal(game.skipped, 3);
});
test('GG preserves earned score; restarting resets everything', () => {
  const game = transition(correct(begin()), { type: 'quit' }, book);
  assert.equal(game.status, 'finished'); assert.equal(game.score, 10); assert.equal(game.reason, 'gg');
  assert.equal(begin().score, 0); assert.equal(begin().skips, 3);
});
test('next does not bypass an unrevealed hero', () => {
  const game = begin(); assert.equal(transition(game, { type: 'next' }, book), game);
});
test('original artwork is used only in classic / original modes', () => {
  assert.equal(artwork(heroes.axe, 'classic').original, true);
  assert.equal(artwork(heroes.axe, 'current').original, false);
  assert.equal(artwork(heroes.largo, 'current').original, false);
});
test('local storage failures and corrupted data do not crash gameplay', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.deepEqual(readSaved(blocked, 'scores', {}), {});
  assert.equal(writeSaved(blocked, 'scores', {}), false);
  assert.deepEqual(readSaved({ getItem: () => 'not-json' }, 'scores', {}), {});
});
