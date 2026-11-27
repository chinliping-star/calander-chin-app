import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chipColors } from '../src/modules/meetups/chip-colors.ts';

const colors = [
  { user_id: 'creator', color: '#22c55e' },
  { user_id: 'friend', color: '#3b82f6' },
];

test('friend with no pick sees the creator colour', () => {
  assert.deepEqual(chipColors(colors, 'other', 'creator'), { my_color: '#22c55e', own_color: null });
});

test('own pick wins over the creator colour', () => {
  assert.deepEqual(chipColors(colors, 'friend', 'creator'), { my_color: '#3b82f6', own_color: '#3b82f6' });
});

test('no picks at all, or no viewer, falls back cleanly', () => {
  assert.deepEqual(chipColors([], 'friend', 'creator'), { my_color: null, own_color: null });
  assert.deepEqual(chipColors(undefined, null, 'creator'), { my_color: null, own_color: null });
  assert.deepEqual(chipColors(colors, null, 'creator'), { my_color: '#22c55e', own_color: null });
});
