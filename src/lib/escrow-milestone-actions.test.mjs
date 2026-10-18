import assert from 'node:assert/strict';
import test from 'node:test';
import { confirmSubmissionOnChain, releaseFromEmployerWallet, EscrowActionError } from './escrow-milestone-actions.ts';

const EMPLOYER = '0xEmP0000000000000000000000000000000000001';
const FREELANCER = '0xFrE0000000000000000000000000000000000002';

function setup(state, account) {
  const calls = [];
  const ethereum = { request: async ({ method }) => (method === 'eth_requestAccounts' ? [account] : null) };
  const deps = {
    read: async () => state,
    switchChain: async (_e, chainId) => { calls.push(['switch', chainId]); },
    submit: async (_e, p) => { calls.push(['submit', p.milestoneIndex]); return { transactionHash: '0xsub' }; },
    approve: async (_e, p) => { calls.push(['approve', p.milestoneIndex]); return { transactionHash: '0xapp' }; },
  };
  return { calls, deps, target: { ethereum, escrowAddress: '0xesc', milestoneIndex: 2, chainId: '0x539' } };
}

test('freelancer confirms a pending submission from their wallet', async () => {
  const { calls, deps, target } = setup({ status: 'pending', employer: EMPLOYER, freelancer: FREELANCER }, FREELANCER.toLowerCase());
  assert.equal(await confirmSubmissionOnChain(deps, target), 'confirmed');
  assert.deepEqual(calls, [['switch', '0x539'], ['submit', 2]]);
});

test('submission confirm skips simulated or already-submitted escrows and rejects the wrong account', async () => {
  assert.equal(await confirmSubmissionOnChain(setup(null, FREELANCER).deps, setup(null, FREELANCER).target), 'not-onchain');
  const submitted = setup({ status: 'submitted', employer: EMPLOYER, freelancer: FREELANCER }, FREELANCER);
  assert.equal(await confirmSubmissionOnChain(submitted.deps, submitted.target), 'already');
  const wrong = setup({ status: 'pending', employer: EMPLOYER, freelancer: FREELANCER }, EMPLOYER);
  await assert.rejects(confirmSubmissionOnChain(wrong.deps, wrong.target), /freelancer wallet/);
});

test('employer signs the release when the escrow is theirs', async () => {
  const { calls, deps, target } = setup({ status: 'submitted', employer: EMPLOYER, freelancer: FREELANCER }, EMPLOYER);
  assert.deepEqual(await releaseFromEmployerWallet(deps, target), { transactionHash: '0xapp' });
  assert.deepEqual(calls.at(-1), ['approve', 2]);
});

test('release leaves platform or simulated escrows to the server and blocks pending milestones', async () => {
  const platform = setup({ status: 'submitted', employer: '0xPLATFORM', freelancer: FREELANCER }, EMPLOYER);
  assert.deepEqual(await releaseFromEmployerWallet(platform.deps, platform.target), {});
  assert.deepEqual(await releaseFromEmployerWallet(setup(null, EMPLOYER).deps, setup(null, EMPLOYER).target), {});
  const approved = setup({ status: 'approved', employer: EMPLOYER, freelancer: FREELANCER }, EMPLOYER);
  assert.deepEqual(await releaseFromEmployerWallet(approved.deps, approved.target), {});
  const pending = setup({ status: 'pending', employer: EMPLOYER, freelancer: FREELANCER }, EMPLOYER);
  await assert.rejects(releaseFromEmployerWallet(pending.deps, pending.target), EscrowActionError);
  const disputed = setup({ status: 'disputed', employer: EMPLOYER, freelancer: FREELANCER }, EMPLOYER);
  await assert.rejects(releaseFromEmployerWallet(disputed.deps, disputed.target), /disputed on the blockchain/);
  const noAccount = setup({ status: 'submitted', employer: EMPLOYER, freelancer: FREELANCER }, undefined);
  await assert.rejects(releaseFromEmployerWallet(noAccount.deps, noAccount.target), /Connect MetaMask/);
});
