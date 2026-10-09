export const HERO_HOLD_MS = 1500;
export const HERO_SWAP_SMOOTH_TIME = 0.12;
export const HERO_SLOT_COUNT = 4;
export const HERO_SLOT_ANGLE = (Math.PI * 2) / HERO_SLOT_COUNT;
const wrap = (index, length) => ((index % length) + length) % length;

export function initialCarousel(roster, step = 0) {
  if (roster.length < HERO_SLOT_COUNT) throw new Error('Hero showcase needs at least four entries');
  const slots = {};
  // Previous shadow, foreground, next shadow, and a hidden rear buffer.
  for (let offset = -1; offset <= 2; offset++) {
    slots[wrap(step + offset, HERO_SLOT_COUNT)] = roster[wrap(step + offset, roster.length)];
  }
  return { step, slots };
}

export function nextCarousel(frame, roster) {
  const step = frame.step + 1;
  // After the rotation settles, only the opposite (hidden) slot is recycled.
  // All three visible heroes retain their textures and identities.
  const retiredSlot = (step + 2) % HERO_SLOT_COUNT;
  return { step, slots: { ...frame.slots, [retiredSlot]: roster[(step + 2) % roster.length] } };
}
