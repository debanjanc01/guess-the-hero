import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialCarousel, nextCarousel, HERO_HOLD_MS, HERO_SWAP_SMOOTH_TIME } from '../src/carousel.js';
const heroes = JSON.parse(readFileSync(new URL('../src/data/heroes.json', import.meta.url)));
const roster = Object.keys(heroes).map((id) => ({ id }));

test('showcase has a real still-picture dwell and a short transition setting', () => {
  assert.equal(HERO_HOLD_MS, 3000);
  assert.ok(HERO_SWAP_SMOOTH_TIME >= 0.1 && HERO_SWAP_SMOOTH_TIME <= 0.2);
});
test('only three hero cards are needed at any time', () => {
  assert.equal(Object.keys(initialCarousel(roster).slots).length, 3);
});
test('every one of the 127 heroes reaches the foreground', () => {
  let frame = initialCarousel(roster);
  const seen = new Set();
  for (let i = 0; i < roster.length; i++) {
    assert.equal(frame.slots[frame.step % 3].id, roster[i].id);
    seen.add(frame.slots[frame.step % 3].id);
    frame = nextCarousel(frame, roster);
  }
  assert.equal(seen.size, 127);
});
test('wraparound stays ordered even though 127 is not divisible by three', () => {
  let frame = initialCarousel(roster);
  for (let i = 0; i < 270; i++) {
    assert.equal(frame.slots[frame.step % 3].id, roster[i % 127].id);
    frame = nextCarousel(frame, roster);
  }
});
test('the next foreground card is already in the preceding frame', () => {
  const frame = initialCarousel(roster);
  const next = nextCarousel(frame, roster);
  assert.equal(next.slots[1], frame.slots[1]);
  assert.equal(next.slots[2], frame.slots[2]);
  assert.notEqual(next.slots[0], frame.slots[0]);
});
test('returning from reduced-motion mode keeps the selected hero', () => {
  const frame = initialCarousel(roster, 126);
  assert.equal(frame.slots[0].id, roster[126].id);
  assert.equal(frame.slots[1].id, roster[0].id);
  assert.equal(nextCarousel(frame, roster).slots[1].id, roster[0].id);
});
test('advancing does not mutate prior carousel state', () => {
  const frame = initialCarousel(roster);
  nextCarousel(frame, roster);
  assert.equal(frame.step, 0);
  assert.equal(frame.slots[0].id, roster[0].id);
});
