import test from 'node:test';
import assert from 'node:assert/strict';
import { viewportMetrics } from '../src/useGameViewport.js';

test('closed keyboard leaves the normal mobile layout intact', () => {
  assert.deepEqual(viewportMetrics(844, 844, false), { height: 844, top: 0, keyboardOpen: false });
});
test('focused answer with a shrunken visual viewport activates compact keyboard layout', () => {
  assert.equal(viewportMetrics(480, 844, true).keyboardOpen, true);
});
test('browser toolbar changes are not treated as a keyboard', () => {
  assert.equal(viewportMetrics(790, 844, true).keyboardOpen, false);
});
test('non-input viewport resizing does not activate keyboard mode', () => {
  assert.equal(viewportMetrics(480, 844, false).keyboardOpen, false);
});
test('Safari viewport pan is preserved as the fixed game top offset', () => {
  assert.equal(viewportMetrics(410, 844, true, 87).top, 87);
});
test('tapping Guess does not expand the layout before the native keyboard closes', () => {
  assert.equal(viewportMetrics(480, 844, false, 0, true).keyboardOpen, true);
});
test('closing the keyboard clears a previously open keyboard state', () => {
  assert.equal(viewportMetrics(844, 844, false, 0, true).keyboardOpen, false);
});
test('closing the keyboard restores full visual height', () => {
  assert.deepEqual(viewportMetrics(844, 844, true), { height: 844, top: 0, keyboardOpen: false });
});
