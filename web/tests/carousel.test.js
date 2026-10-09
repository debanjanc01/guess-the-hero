import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialCarousel, nextCarousel, HERO_HOLD_MS, HERO_SWAP_SMOOTH_TIME, HERO_SLOT_COUNT, HERO_SLOT_ANGLE } from '../src/carousel.js';
const heroes = JSON.parse(readFileSync(new URL('../src/data/heroes.json', import.meta.url)));
const roster = Object.keys(heroes).map((id) => ({ id }));

test('showcase has a real still-picture dwell and a short transition setting', () => {
  assert.equal(HERO_HOLD_MS, 1500);
  assert.ok(HERO_SWAP_SMOOTH_TIME >= 0.1 && HERO_SWAP_SMOOTH_TIME <= 0.2);
});
test('four cards are spaced a quarter turn apart', () => {
  assert.equal(HERO_SLOT_COUNT, 4);
  assert.equal(HERO_SLOT_ANGLE, Math.PI / 2);
  assert.equal(Object.keys(initialCarousel(roster).slots).length, 4);
});
test('every one of the 127 heroes reaches the foreground', () => {
  let frame = initialCarousel(roster);
  const seen = new Set();
  for (let i = 0; i < roster.length; i++) {
    assert.equal(frame.slots[frame.step % HERO_SLOT_COUNT].id, roster[i].id);
    seen.add(frame.slots[frame.step % HERO_SLOT_COUNT].id);
    frame = nextCarousel(frame, roster);
  }
  assert.equal(seen.size, 127);
});
test('wraparound stays ordered even though 127 is not divisible by four', () => {
  let frame = initialCarousel(roster);
  for (let i = 0; i < 270; i++) {
    assert.equal(frame.slots[frame.step % HERO_SLOT_COUNT].id, roster[i % 127].id);
    frame = nextCarousel(frame, roster);
  }
});
test('only the hidden rear slot changes; all three visible cards are preserved', () => {
  let frame = initialCarousel(roster);
  for (let i = 0; i < 270; i++) {
    const next = nextCarousel(frame, roster);
    const hidden = (next.step + 2) % HERO_SLOT_COUNT;
    for (let slot = 0; slot < HERO_SLOT_COUNT; slot++) {
      if (slot === hidden) assert.notEqual(next.slots[slot], frame.slots[slot]);
      else assert.equal(next.slots[slot], frame.slots[slot]);
    }
    assert.equal(next.slots[hidden].id, roster[(next.step + 2) % roster.length].id);
    frame = next;
  }
});
test('initial layout has previous and next shadows around the foreground', () => {
  const frame = initialCarousel(roster);
  assert.equal(frame.slots[3].id, roster[126].id);
  assert.equal(frame.slots[0].id, roster[0].id);
  assert.equal(frame.slots[1].id, roster[1].id);
  assert.equal(frame.slots[2].id, roster[2].id);
});
test('returning from reduced-motion mode keeps the selected hero', () => {
  const frame = initialCarousel(roster, 126);
  assert.equal(frame.slots[2].id, roster[126].id);
  assert.equal(frame.slots[3].id, roster[0].id);
  assert.equal(nextCarousel(frame, roster).slots[3].id, roster[0].id);
});
test('advancing does not mutate prior carousel state', () => {
  const frame = initialCarousel(roster);
  nextCarousel(frame, roster);
  assert.equal(frame.step, 0);
  assert.equal(frame.slots[0].id, roster[0].id);
});
