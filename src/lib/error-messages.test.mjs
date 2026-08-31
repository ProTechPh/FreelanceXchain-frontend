import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyFailure,
  describeFailure,
  failureLine,
  getApiErrorMessage,
} from './error-messages.ts';

const httpError = (status, data) => ({ response: { status, data } });

test('treats an ethers ACTION_REJECTED as a cancellation, not an error', () => {
  // The shape ethers v6 actually throws when the user clicks Reject.
  const error = Object.assign(
    new Error(
      'user rejected action (action="sendTransaction", reason="rejected", '
      + 'code=ACTION_REJECTED, version=6.17.0)',
    ),
    {
      code: 'ACTION_REJECTED',
      info: { error: { code: 4001, message: 'MetaMask Tx Signature: User denied transaction signature.' } },
    },
  );

  assert.equal(classifyFailure(error), 'cancelled');

  const described = describeFailure(error, 'pay the rush fee');
  assert.equal(described.tone, 'info', 'a deliberate cancel must never render as destructive');
  assert.equal(described.title, 'Cancelled in your wallet');
  assert.match(described.detail, /no funds moved/i);
  // The raw ethers blob must not survive into user copy.
  assert.doesNotMatch(described.title + described.detail, /ACTION_REJECTED|version=|action="/);
});

test('detects a bare EIP-1193 rejection by code alone', () => {
  assert.equal(classifyFailure({ code: 4001, message: 'User denied' }), 'cancelled');
  assert.equal(classifyFailure({ info: { error: { code: 4001 } } }), 'cancelled');
});

test('classifies wallet problems distinctly from each other', () => {
  assert.equal(classifyFailure({ code: -32002 }), 'wallet');
  assert.equal(classifyFailure({ code: 'INSUFFICIENT_FUNDS' }), 'wallet');
  assert.equal(classifyFailure({ code: 4902 }), 'wallet');
  assert.equal(classifyFailure(new Error('No wallet account was selected.')), 'wallet');

  // Each gets its own remedy rather than one catch-all string.
  const pending = describeFailure({ code: -32002 }, 'connect your wallet');
  const funds = describeFailure({ code: 'INSUFFICIENT_FUNDS' }, 'fund the escrow');
  assert.match(pending.title, /already asking you to confirm/);
  assert.match(funds.title, /Not enough funds/);
  assert.notEqual(pending.title, funds.title);
});

test('separates offline, timeout and unknown when there is no HTTP response', () => {
  assert.equal(classifyFailure({ code: 'ERR_NETWORK' }), 'offline');
  assert.equal(classifyFailure({ code: 'ECONNABORTED' }), 'timeout');
  assert.equal(classifyFailure({ code: 'ETIMEDOUT' }), 'timeout');
  assert.equal(classifyFailure(new Error('Network Error')), 'offline');
  assert.equal(classifyFailure(new Error('socket timed out')), 'timeout');
  assert.equal(classifyFailure(new Error('something else entirely')), 'unknown');
});

test('maps HTTP statuses to distinct kinds', () => {
  assert.equal(classifyFailure(httpError(401)), 'auth');
  assert.equal(classifyFailure(httpError(403)), 'forbidden');
  assert.equal(classifyFailure(httpError(408)), 'timeout');
  assert.equal(classifyFailure(httpError(409)), 'conflict');
  assert.equal(classifyFailure(httpError(422)), 'validation');
  assert.equal(classifyFailure(httpError(429)), 'rate-limit');
  assert.equal(classifyFailure(httpError(400)), 'validation');
  assert.equal(classifyFailure(httpError(500)), 'server');
  assert.equal(classifyFailure(httpError(503)), 'server');
});

test('shows the backend message for validation errors', () => {
  const error = httpError(422, { error: 'Proposed rate must be greater than 0.' });
  const described = describeFailure(error, 'submit your proposal');

  assert.equal(described.title, 'Proposed rate must be greater than 0.');
  assert.equal(described.retryable, false, 'retrying an invalid form changes nothing');
});

test('suppresses the backend message for server faults', () => {
  // A 5xx body is a stack trace. Showing it is the leak this module exists to stop.
  const error = httpError(500, {
    error: 'TypeError: Cannot read properties of undefined (reading \'escrowAddress\')\n    at deploy (/srv/api/dist/escrow.js:212:31)',
  });
  const described = describeFailure(error, 'fund the escrow');

  assert.doesNotMatch(described.title, /TypeError|escrow\.js/);
  assert.doesNotMatch(described.detail, /TypeError|escrow\.js/);
  assert.match(described.detail, /on our side/);
  assert.equal(described.retryable, true);
});

test('never claims funds are safe unless the caller vouches for it', () => {
  const serverFault = describeFailure(httpError(500, {}), 'release the milestone');
  // A 5xx may have committed the write, so no reassurance is allowed here.
  assert.doesNotMatch(serverFault.detail, /no funds moved/i);

  const optedIn = describeFailure(new Error('boom'), 'release the milestone', {
    fundsUnchanged: true,
  });
  assert.match(optedIn.detail, /No funds moved/);
});

test('composes the action phrase into the copy', () => {
  const described = describeFailure(httpError(500, {}), 'load your contracts');
  assert.equal(described.title, "We couldn't load your contracts");
});

test('assigns a tone to every kind, and reserves destructive for real faults', () => {
  const cases = [
    [{ code: 4001 }, 'info'],
    [{ code: 'ERR_NETWORK' }, 'warning'],
    [httpError(401), 'warning'],
    [httpError(403), 'warning'],
    [httpError(409), 'warning'],
    [httpError(422, { error: 'Bad' }), 'warning'],
    [httpError(429), 'warning'],
    [httpError(500), 'destructive'],
  ];

  for (const [error, tone] of cases) {
    assert.equal(describeFailure(error, 'do the thing').tone, tone);
  }
});

test('failureLine joins title and detail for single-line contexts', () => {
  assert.equal(
    failureLine({ code: 4001 }, 'pay the rush fee'),
    'Cancelled in your wallet. Nothing was submitted and no funds moved.',
  );
  // Validation carries the backend copy as the whole message, with no detail.
  assert.equal(
    failureLine(httpError(422, { error: 'Pick a milestone.' }), 'open a dispute'),
    'Pick a milestone.',
  );
});

test('getApiErrorMessage keeps the behaviour its 38 existing callers rely on', () => {
  assert.equal(getApiErrorMessage(httpError(400, { error: 'Direct' }), 'fb'), 'Direct');
  assert.equal(getApiErrorMessage(httpError(400, { message: 'Nested' }), 'fb'), 'Nested');
  assert.equal(
    getApiErrorMessage(httpError(400, { error: { message: 'Deep' } }), 'fb'),
    'Deep',
  );
  assert.equal(getApiErrorMessage(new Error('no response'), 'fb'), 'fb');
  assert.equal(getApiErrorMessage(httpError(400, { error: '   ' }), 'fb'), 'fb');
  assert.equal(getApiErrorMessage(null, 'fb'), 'fb');
});

test('survives values that are not errors at all', () => {
  for (const value of [null, undefined, 'boom', 42, {}, []]) {
    const described = describeFailure(value, 'save your profile');
    assert.equal(typeof described.title, 'string');
    assert.ok(described.title.length > 0);
    assert.ok(['destructive', 'warning', 'info'].includes(described.tone));
  }
});
