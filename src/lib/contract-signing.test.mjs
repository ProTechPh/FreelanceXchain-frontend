import assert from 'node:assert/strict';
import test from 'node:test';
import { signContractTerms, sameAddress, isUsablePngDataUrl, WalletSigningError, withDomainType } from './contract-signing.ts';

const payload = { chainIdHex: '0x539', typedData: { domain: { name: 'x', version: '1', chainId: 1337 }, types: {}, primaryType: 'SignContract', message: {} } };
const mismatch = (linked, selected) => `linked ${linked} selected ${selected}`;

function provider(handlers) {
  const calls = [];
  return {
    calls,
    request: async ({ method, params }) => {
      calls.push({ method, params });
      const h = handlers[method];
      if (typeof h === 'function') return h(params);
      return h;
    },
  };
}

test('signs typed data with the linked account after switching chain', async () => {
  const p = provider({ wallet_switchEthereumChain: null, eth_requestAccounts: ['0xAbC'], eth_signTypedData_v4: '0xsig' });
  const result = await signContractTerms(p, payload, '0xabc', mismatch);
  assert.deepEqual(result, { walletAddress: '0xAbC', walletSignature: '0xsig' });
  const signCall = p.calls.find(c => c.method === 'eth_signTypedData_v4');
  assert.equal(signCall.params[0], '0xAbC');
  const sent = JSON.parse(signCall.params[1]);
  // MetaMask needs the domain type spelled out, in the domain's field order.
  assert.deepEqual(sent.types.EIP712Domain, [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
  ]);
  assert.deepEqual(sent.message, payload.typedData.message);
  assert.deepEqual(sent.domain, payload.typedData.domain);
});

test('refuses a different MetaMask account, missing accounts and bad signatures', async () => {
  await assert.rejects(signContractTerms(provider({ wallet_switchEthereumChain: null, eth_requestAccounts: ['0xdef'] }), payload, '0xabc', mismatch), /linked 0xabc selected 0xdef/);
  await assert.rejects(signContractTerms(provider({ wallet_switchEthereumChain: null, eth_requestAccounts: [] }), payload, '0xabc', mismatch), WalletSigningError);
  await assert.rejects(signContractTerms(provider({ wallet_switchEthereumChain: null, eth_requestAccounts: ['0xabc'], eth_signTypedData_v4: null }), payload, '0xabc', mismatch), /did not return/);
  await assert.rejects(signContractTerms(provider({}), { ...payload, typedData: null }, '0xabc', mismatch), /Only contract parties/);
  const failing = provider({ wallet_switchEthereumChain: () => { throw Object.assign(new Error('rejected'), { code: 4001 }); } });
  await assert.rejects(signContractTerms(failing, payload, '0xabc', mismatch), /rejected/);
});

test('address and image helpers', () => {
  assert.equal(sameAddress('0xAB', '0xab'), true);
  assert.equal(sameAddress(null, '0xab'), false);
  assert.equal(isUsablePngDataUrl(`data:image/png;base64,${'A'.repeat(40)}`), true);
  assert.equal(isUsablePngDataUrl('data:image/png;base64,AA'), false);
  assert.equal(isUsablePngDataUrl(null), false);
});

test('withDomainType keeps an existing EIP712Domain entry', () => {
  const typed = { domain: { name: 'x' }, types: { EIP712Domain: [{ name: 'name', type: 'string' }], A: [] } };
  assert.equal(withDomainType(typed), typed);
});
