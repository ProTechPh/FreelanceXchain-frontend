import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatChainId,
  formatWalletAddress,
  weiHexToEther,
} from './wallet.ts';

test('formats wallet addresses without hiding short invalid input', () => {
  assert.equal(
    formatWalletAddress('0x1234567890123456789012345678901234567890'),
    '0x1234…7890',
  );
  assert.equal(formatWalletAddress('0x1234'), '0x1234');
});

test('formats known and unknown EVM chain identifiers', () => {
  assert.equal(formatChainId('0x1'), 'Ethereum Mainnet');
  assert.equal(formatChainId('0x13882'), 'Polygon Amoy');
  assert.equal(formatChainId('0x539'), 'Chain 1337');
});

test('converts hexadecimal wei balances to a readable ether value', () => {
  assert.equal(weiHexToEther('0xde0b6b3a7640000'), '1');
  assert.equal(weiHexToEther('0x6f05b59d3b20000'), '0.5');
});
