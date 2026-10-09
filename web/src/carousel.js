export const HERO_HOLD_MS = 3000;
export const HERO_SWAP_SMOOTH_TIME = 0.12;
export const HERO_SLOT_ANGLE = (Math.PI * 2) / 3;

export function initialCarousel(roster, step = 0) {
  if (roster.length < 3) throw new Error('Hero showcase needs at least three entries');
  const slots = {};
  for (let offset = 0; offset < 3; offset++) slots[(step + offset) % 3] = roster[(step + offset) % roster.length];
  return { step, slots };
}

export function nextCarousel(frame, roster) {
  const step = frame.step + 1;
  // Recycle only the card that has just moved behind the camera. The next
  // foreground card is already loaded and has been visible as a shadow.
  const retiredSlot = (step + 2) % 3;
  return { step, slots: { ...frame.slots, [retiredSlot]: roster[(step + 2) % roster.length] } };
}
