import type { MetamaskConnectEVM } from '@metamask/connect-evm';
import type { EthereumProvider } from './wallet';

type Hex = `0x${string}`;

// Chain the dapp asks MetaMask for on connect. Defaults to Ganache (1337).
export const DEFAULT_CHAIN_ID = (process.env.NEXT_PUBLIC_CHAIN_ID ?? '0x539') as Hex;

// Read-only RPC endpoints MetaMask Connect may call. Only chains listed here can be used
// through the SDK provider. On a phone, 127.0.0.1 points at the phone itself, so set
// NEXT_PUBLIC_RPC_URL to a reachable address (LAN IP or testnet RPC) for mobile testing.
// Mainnet must stay listed: the SDK always adds it to the session and falls back to it.
const SUPPORTED_NETWORKS: Record<Hex, string> = {
  '0x1': 'https://ethereum-rpc.publicnode.com',
  '0xaa36a7': 'https://ethereum-sepolia-rpc.publicnode.com',
  '0x539': process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:7545',
  '0x13882': 'https://rpc-amoy.polygon.technology',
  '0x89': 'https://polygon-rpc.com',
};

let clientPromise: Promise<MetamaskConnectEVM> | null = null;

/**
 * Lazily creates the MetaMask Connect EVM client. It routes to the browser extension on
 * desktop and to a deeplink / QR relay into the MetaMask mobile app when no extension is
 * injected (e.g. Safari or Chrome on a phone).
 */
export function getMetaMaskClient(): Promise<MetamaskConnectEVM> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MetaMask Connect is only available in the browser.'));
  }

  clientPromise ??= import('@metamask/connect-evm')
    .then(({ createEVMClient }) =>
      createEVMClient({
        dapp: {
          name: 'FreelanceXchain',
          url: window.location.origin,
          iconUrl: `${window.location.origin}/favicon.svg`,
        },
        api: { supportedNetworks: SUPPORTED_NETWORKS },
      })
    )
    .catch((error) => {
      clientPromise = null;
      throw error;
    });

  return clientPromise;
}

/** True when a wallet has injected `window.ethereum` (desktop extension or MetaMask in-app browser). */
export function hasInjectedProvider(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Returns an EIP-1193 provider: the injected one when present, otherwise the MetaMask
 * Connect provider. Returns null when neither is available.
 */
export async function getEthereumProvider(): Promise<EthereumProvider | null> {
  if (typeof window === 'undefined') return null;
  if (window.ethereum) return window.ethereum;

  try {
    const client = await getMetaMaskClient();
    return client.getProvider() as unknown as EthereumProvider;
  } catch {
    return null;
  }
}

/**
 * Asks the user to connect and returns the provider to use afterward. With no injected
 * wallet, this opens the MetaMask mobile app (or shows a QR code on desktop).
 */
export async function requestWalletProvider(): Promise<EthereumProvider> {
  if (typeof window !== 'undefined' && window.ethereum) return window.ethereum;

  const client = await getMetaMaskClient();
  await client.connect({ chainIds: [DEFAULT_CHAIN_ID] });
  return client.getProvider() as unknown as EthereumProvider;
}

/** Ends the MetaMask Connect session, if one was created. Injected wallets are left alone. */
export async function disconnectMetaMaskSession(): Promise<void> {
  if (!clientPromise) return;
  try {
    const client = await clientPromise;
    if (client.status === 'connected') await client.disconnect();
  } catch {
    // Session cleanup is best-effort
  }
}
