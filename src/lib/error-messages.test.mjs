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

test('a 403 PLAN_UPGRADE_REQUIRED reads as an upgrade prompt, not a permission error', () => {
  const error = httpError(403, { error: { code: 'PLAN_UPGRADE_REQUIRED' } });

  assert.equal(classifyFailure(error), 'plan-upgrade');

  const described = describeFailure(error, 'load recommendations');
  assert.equal(described.tone, 'info', 'a paywall is not a red error');
  assert.equal(described.retryable, false, 'retrying will never clear a paywall');
  assert.match(described.title, /Pro feature/i);
  // The reassurance matters on a platform holding escrow.
  assert.match(described.detail, /escrow/i);
});

test('an ordinary 403 still reads as forbidden', () => {
  // Guards the branch order in classifyFailure: the upgrade check runs first,
  // and must not swallow genuine permission errors.
  const error = httpError(403, { error: { code: 'AUTH_FORBIDDEN' } });

  assert.equal(classifyFailure(error), 'forbidden');
  assert.match(describeFailure(error, 'do that').title, /permission/i);
});

test('a 403 shows the rule the backend named, not a generic denial', () => {
  const error = httpError(403, { error: { code: 'UNAUTHORIZED', message: 'Only the contract employer can approve milestones' } });

  const message = describeFailure(error, 'approve this milestone');
  assert.equal(message.title, 'Only the contract employer can approve milestones');
  assert.equal(message.detail, undefined);
  assert.equal(message.retryable, false);
});

test('a 403 with nothing specific does not send the user to an administrator', () => {
  const message = describeFailure(httpError(403), 'approve this milestone');

  assert.match(message.title, /permission/i);
  assert.doesNotMatch(message.detail, /administrator/i);
});

test('a 404 is not reported as a validation error', () => {
  assert.equal(classifyFailure(httpError(404)), 'not-found');

  const message = describeFailure(httpError(404), 'open this contract');
  assert.doesNotMatch(message.detail ?? '', /details you entered/i);
  assert.equal(message.retryable, false);
});

test('a 404 leads with the backend message when there is one', () => {
  const message = describeFailure(httpError(404, { error: 'Contract not found' }), 'open this contract');
  assert.equal(message.title, 'Contract not found');
});

test('a 409 duplicate is not described as a concurrent edit', () => {
  const error = httpError(409, { error: { code: 'DUPLICATE_RATING', message: 'You have already rated this contract' } });

  const message = describeFailure(error, 'submit your review');
  assert.equal(message.title, 'You have already rated this contract');
  assert.doesNotMatch(message.detail ?? '', /someone updated it/i);
});

test('a 409 with no backend message still explains a race', () => {
  const message = describeFailure(httpError(409), 'submit your review');
  assert.equal(message.title, 'This has already changed');
  assert.match(message.detail, /Someone updated it/);
});

test('a 429 leads with the real limit, not "too many attempts"', () => {
  const error = httpError(429, { error: { code: 'RATE_LIMITED', message: 'You have already rated the app recently.' } });
  assert.equal(describeFailure(error, 'send your rating').title, 'You have already rated the app recently.');

  const generic = describeFailure(httpError(429), 'send your rating');
  assert.equal(generic.title, 'Too many attempts');
  assert.equal(generic.detail, 'Wait a moment, then try again.');
});

test('backend strings that explain nothing fall back to plain copy', () => {
  for (const message of ['Insufficient permissions', 'Unauthorized', 'An unexpected error occurred.']) {
    const shown = describeFailure(httpError(403, { error: { code: 'AUTH_FORBIDDEN', message } }), 'open this page');
    assert.match(shown.title, /permission/i, message);
    assert.match(shown.detail, /right account/i, message);
  }
});

test('getApiErrorMessage still returns raw backend text for its own callers', () => {
  // Unlike describeFailure, this one is used where the caller supplies its own
  // fallback, so it must not start filtering strings out from under them.
  assert.equal(
    getApiErrorMessage(httpError(403, { error: { message: 'Insufficient permissions' } }), 'fb'),
    'Insufficient permissions',
  );
});

test('not-found gets a tone like the other recoverable states', () => {
  assert.equal(describeFailure(httpError(404), 'do the thing').tone, 'warning');
});

test('a write failure sent as 400 reads as our fault, not the user\'s input', () => {
  const error = httpError(400, { error: { code: 'UPDATE_FAILED', message: 'Failed to retrieve updated dispute' } });

  assert.equal(classifyFailure(error), 'server');
  const message = describeFailure(error, 'update this dispute');
  assert.equal(message.title, "We couldn't update this dispute");
  assert.match(message.detail, /problem on our side/i);
  // The backend wording is written for developers; it must not reach the user.
  assert.doesNotMatch(`${message.title} ${message.detail}`, /Failed to retrieve/i);
});

test('database and upstream faults are treated the same way', () => {
  for (const code of ['DATABASE_ERROR', 'INTERNAL_ERROR', 'UPSTREAM_ERROR', 'FETCH_FAILED', 'CREATE_FAILED', 'DELETE_FAILED']) {
    assert.equal(classifyFailure(httpError(400, { error: { code } })), 'server', code);
  }
});

test('a typed not-found sent as 400 is still a not-found', () => {
  for (const code of ['PROFILE_NOT_FOUND', 'USER_NOT_FOUND', 'DISPUTE_NOT_FOUND', 'ESCROW_NOT_FOUND']) {
    assert.equal(classifyFailure(httpError(400, { error: { code } })), 'not-found', code);
  }
});

test('a genuine validation error is still a validation error', () => {
  const error = httpError(400, { error: { code: 'VALIDATION_ERROR', message: 'Proposed rate must be a number.' } });

  assert.equal(classifyFailure(error), 'validation');
  assert.equal(describeFailure(error, 'submit your proposal').title, 'Proposed rate must be a number.');
});

test('permission and session errors outrank the code-based rules', () => {
  assert.equal(classifyFailure(httpError(403, { error: { code: 'UPDATE_FAILED' } })), 'forbidden');
  assert.equal(classifyFailure(httpError(401, { error: { code: 'DATABASE_ERROR' } })), 'auth');
});

test('a duplicate offers no Retry, but a genuine race does', () => {
  const duplicate = httpError(409, { error: { code: 'DUPLICATE_PROPOSAL', message: 'You have already submitted a proposal' } });
  assert.equal(describeFailure(duplicate, 'submit your proposal').retryable, false);

  assert.equal(describeFailure(httpError(409), 'submit your proposal').retryable, true);
});

test('destructive is reserved for faults, not for user wallet states', () => {
  const walletStates = [
    { code: -32002 },
    { code: 'INSUFFICIENT_FUNDS' },
    { code: 4902 },
    new Error('No wallet account was selected.'),
  ];

  for (const error of walletStates) {
    assert.equal(describeFailure(error, 'fund the escrow').tone, 'warning');
  }
});
