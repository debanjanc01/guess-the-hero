import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtimeHeroes } from '../src/runtime-heroes.js';
import { artwork, createAnswerBook, MODES, poolFor } from '../src/game.js';
const full = JSON.parse(readFileSync(new URL('../src/data/heroes.json', import.meta.url)));
const compact = runtimeHeroes(full);
test('compact browser data preserves every hero, alias, roster, image and voice', () => {
  assert.deepEqual(Object.keys(compact), Object.keys(full));
  assert.deepEqual(createAnswerBook(compact), createAnswerBook(full));
  for (const mode of Object.keys(MODES)) {
    assert.deepEqual(poolFor(compact, mode), poolFor(full, mode));
    for (const id in full) assert.deepEqual(artwork(compact[id], mode), artwork(full[id], mode));
  }
  for (const id in full) {
    for (const field of ['name', 'audio', 'quote', 'archiveImage', 'historicalLineVerified']) assert.equal(compact[id][field], full[id][field]);
  }
});
test('provenance stays in the source ledger rather than the gameplay payload', () => {
  assert.ok(JSON.stringify(compact).length < JSON.stringify(full).length * 0.6);
  assert.notDeepEqual(compact, full);
});
