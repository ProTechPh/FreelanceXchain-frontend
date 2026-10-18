/**
 * Wallet half of the contract e-signature: EIP-712 typed data signed in
 * MetaMask with the account linked to the user's FreelanceXchain profile.
 */
import type { SigningPayload } from '@/types';
import type { EthereumProvider } from './wallet.ts';

export class WalletSigningError extends Error {}

export function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** The signature pad's PNG, or null when nothing was drawn. */
export function isUsablePngDataUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith('data:image/png;base64,') && value.length > 'data:image/png;base64,'.length + 32;
}

const DOMAIN_FIELD_TYPES: Record<string, string> = {
  name: 'string',
  version: 'string',
  chainId: 'uint256',
  verifyingContract: 'address',
  salt: 'bytes32',
};

/**
 * MetaMask (eth_signTypedData_v4) hashes the domain using `types.EIP712Domain`
 * and treats a missing entry as an empty domain, while the server (ethers)
 * derives the domain type from the domain's fields. Without this entry the
 * wallet signs a different digest and the signature recovers to the wrong address.
 */
export function withDomainType<T extends { domain: Record<string, unknown>; types: Record<string, Array<{ name: string; type: string }>> }>(typedData: T): T {
  if (typedData.types.EIP712Domain) return typedData;
  const EIP712Domain = Object.keys(DOMAIN_FIELD_TYPES)
    .filter((field) => typedData.domain[field] !== undefined)
    .map((field) => ({ name: field, type: DOMAIN_FIELD_TYPES[field]! }));
  return { ...typedData, types: { EIP712Domain, ...typedData.types } };
}

export async function signContractTerms(
  ethereum: EthereumProvider,
  payload: Pick<SigningPayload, 'typedData' | 'chainIdHex'>,
  linkedWallet: string,
  mismatchMessage: (linked: string, selected: string) => string,
): Promise<{ walletAddress: string; walletSignature: string }> {
  if (!payload.typedData) throw new WalletSigningError('Only contract parties can sign these terms.');

  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: payload.chainIdHex }] });
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 4902 && payload.chainIdHex === '0x539') {
      const { switchToGanache } = await import('./wallet.ts');
      await switchToGanache(ethereum);
    } else {
      throw error;
    }
  }

  const accounts = await ethereum.request<string[]>({ method: 'eth_requestAccounts' });
  const account = accounts?.[0];
  if (!account) throw new WalletSigningError('Connect MetaMask to sign the contract.');
  if (!sameAddress(account, linkedWallet)) throw new WalletSigningError(mismatchMessage(linkedWallet, account));

  const walletSignature = await ethereum.request<string>({
    method: 'eth_signTypedData_v4',
    params: [account, JSON.stringify(withDomainType(payload.typedData))],
  });
  if (typeof walletSignature !== 'string' || !walletSignature.startsWith('0x')) {
    throw new WalletSigningError('MetaMask did not return a signature.');
  }
  return { walletAddress: account, walletSignature };
}
