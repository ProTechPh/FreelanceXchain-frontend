export interface EthereumProvider {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
  on?(event: 'accountsChanged' | 'chainChanged', listener: (value: string[] | string) => void): void;
  removeListener?(event: 'accountsChanged' | 'chainChanged', listener: (value: string[] | string) => void): void;
}

export interface WalletConnection {
  address: string;
  chainId: string;
  networkName: string;
  balance: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  80002: 'Polygon Amoy',
};

export function formatWalletAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function formatChainId(chainId: string): string {
  const numericChainId = Number.parseInt(chainId, 16);
  return CHAIN_NAMES[numericChainId] ?? `Chain ${numericChainId}`;
}

export function weiHexToEther(balance: string): string {
  const wei = BigInt(balance);
  const weiPerEther = BigInt('1000000000000000000');
  const whole = wei / weiPerEther;
  const fraction = wei % weiPerEther;
  const fractionalDigits = fraction.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
  return fractionalDigits ? `${whole}.${fractionalDigits}` : whole.toString();
}

export async function connectWallet(provider: EthereumProvider): Promise<WalletConnection> {
  const accounts = await provider.request<string[]>({ method: 'eth_requestAccounts' });
  const address = accounts[0];
  if (!address) throw new Error('No wallet account was selected.');

  const [chainId, balance] = await Promise.all([
    provider.request<string>({ method: 'eth_chainId' }),
    provider.request<string>({ method: 'eth_getBalance', params: [address, 'latest'] }),
  ]);

  return {
    address,
    chainId,
    networkName: formatChainId(chainId),
    balance: weiHexToEther(balance),
  };
}
