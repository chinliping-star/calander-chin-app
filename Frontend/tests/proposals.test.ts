import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ApiMeetup } from '../src/features/calendar/api/calendar.api.ts';
import { isOpenProposal, isConfirmedProposal, isMyPendingInvite } from '../src/features/meetup/proposals.ts';

const TODAY = '2026-11-27';
const poll = (over: Partial<ApiMeetup>) =>
  ({
    is_proposal: true,
    locked_slot_id: null,
    status: 'pending',
    date: '2026-12-01',
    proposed_slots: [{ _id: 's1', date: '2026-12-01', time: '18:00', location: '' }],
    ...over,
  }) as ApiMeetup;

test('open poll with a future slot counts', () => {
  assert.equal(isOpenProposal(poll({}), TODAY), true);
});

test('cancelled or expired polls do not count as open', () => {
  assert.equal(isOpenProposal(poll({ status: 'cancelled' }), TODAY), false);
  assert.equal(
    isOpenProposal(poll({ proposed_slots: [{ _id: 's1', date: '2026-11-20', time: '', location: '' }] }), TODAY),
    false,
  );
});

test('locked poll is confirmed, not open (backend sets is_proposal false on lock)', () => {
  const locked = poll({ is_proposal: false, locked_slot_id: 's1', status: 'accepted' });
  assert.equal(isOpenProposal(locked, TODAY), false);
  assert.equal(isConfirmedProposal(locked, TODAY), true);
  assert.equal(isConfirmedProposal({ ...locked, date: '2026-11-01' }, TODAY), false);
});

test('invite badge counts only invites waiting for my answer', () => {
  const me = { _id: 'me' } as ApiMeetup['proposer_id'];
  const other = { _id: 'x' } as ApiMeetup['proposer_id'];
  const invite = (over: Partial<ApiMeetup>) =>
    ({ is_proposal: false, proposer_id: other, responses: [{ user_id: me, status: 'pending' }], ...over }) as ApiMeetup;
  assert.equal(isMyPendingInvite(invite({}), 'me'), true);
  assert.equal(isMyPendingInvite(invite({ proposer_id: me }), 'me'), false); // I sent it
  assert.equal(isMyPendingInvite(invite({ responses: [{ user_id: me, status: 'accepted' }] }), 'me'), false);
  assert.equal(isMyPendingInvite(invite({ is_proposal: true }), 'me'), false);
});
