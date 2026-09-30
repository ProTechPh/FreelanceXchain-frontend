import { formatWalletAddress } from './wallet-utils.ts';

export type WalletLinkAction =
  | { type: 'link'; selectedAddress: string }
  | { type: 'restore'; walletAddress: string }
  | { type: 'switch-account'; linkedAddress: string; selectedAddress: string };

function normalizeWalletAddress(address: string | null | undefined): string {
  return address?.trim().toLowerCase() ?? '';
}

export function decideWalletLinkAction(
  linkedAddress: string | null | undefined,
  selectedAddress: string,
): WalletLinkAction {
  const normalizedLinked = normalizeWalletAddress(linkedAddress);
  const normalizedSelected = normalizeWalletAddress(selectedAddress);

  if (!normalizedLinked) {
    return { type: 'link', selectedAddress };
  }

  if (normalizedLinked === normalizedSelected) {
    return { type: 'restore', walletAddress: linkedAddress?.trim() || selectedAddress };
  }

  return {
    type: 'switch-account',
    linkedAddress: linkedAddress?.trim() || linkedAddress || '',
    selectedAddress,
  };
}

export function getLinkedWalletMismatchMessage(linkedAddress: string, selectedAddress: string): string {
  const selected = formatWalletAddress(selectedAddress) ?? selectedAddress;
  const linked = formatWalletAddress(linkedAddress) ?? linkedAddress;
  return `MetaMask is using ${selected}, but your FreelanceXchain account is linked to ${linked}. Switch MetaMask back to ${linked}, or disconnect it in Settings before connecting another wallet.`;
}
