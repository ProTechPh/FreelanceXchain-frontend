import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decideWalletLinkAction,
  getLinkedWalletMismatchMessage,
} from './wallet-linking.ts';

test('restores the local wallet session when MetaMask returns the already linked wallet', () => {
  const decision = decideWalletLinkAction(
    '0x5726B39300000000000000000000000000000000',
    '0x5726b39300000000000000000000000000000000',
  );

  assert.deepEqual(decision, {
    type: 'restore',
    walletAddress: '0x5726B39300000000000000000000000000000000',
  });
});

test('asks the user to switch MetaMask accounts before trying to replace a linked wallet', () => {
  const linkedAddress = '0x5726b39300000000000000000000000000000000';
  const selectedAddress = '0x800e083dd1000000000000000000000000000000';

  const decision = decideWalletLinkAction(linkedAddress, selectedAddress);

  assert.deepEqual(decision, {
    type: 'switch-account',
    linkedAddress,
    selectedAddress,
  });
  assert.equal(
    getLinkedWalletMismatchMessage(linkedAddress, selectedAddress),
    'MetaMask is using 0x800e...0000, but your FreelanceXchain account is linked to 0x5726...0000. Switch MetaMask back to 0x5726...0000, or disconnect it in Settings before connecting another wallet.',
  );
});

test('links the selected wallet when the profile has no wallet yet', () => {
  assert.deepEqual(
    decideWalletLinkAction('', '0x800e083dd1000000000000000000000000000000'),
    {
      type: 'link',
      selectedAddress: '0x800e083dd1000000000000000000000000000000',
    },
  );
});
