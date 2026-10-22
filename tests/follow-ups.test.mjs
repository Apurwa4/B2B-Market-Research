import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateKey, followUpState, formatFollowUp } from '../lib/follow-ups.mjs';

test('follow-ups distinguish no date, overdue, today, and upcoming across month boundaries', () => {
  assert.equal(followUpState('', '2026-11-01'), 'none');
  assert.equal(followUpState('2026-10-31', '2026-11-01'), 'overdue');
  assert.equal(followUpState('2026-11-01', '2026-11-01'), 'today');
  assert.equal(followUpState('2027-01-01', '2026-11-01'), 'upcoming');
});
test('date-only formatting preserves calendar dates and handles unscheduled follow-ups', () => {
  assert.equal(localDateKey(new Date(2026, 0, 2, 0, 15)), '2026-01-02');
  assert.equal(formatFollowUp('2026-10-22'), '22 Oct 2026');
  assert.equal(formatFollowUp(''), 'Not scheduled');
});
