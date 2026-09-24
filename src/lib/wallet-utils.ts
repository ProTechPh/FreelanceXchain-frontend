// Wallet utility functions - extracted from wagmi-config.ts
// These functions are used for formatting and network identification
// without requiring the full wagmi/viem stack

/**
 * Format a wallet address for display (0x1234...5678)
 */
export function formatWalletAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Chain ID to network name mapping
 */
export const chainNames: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon',
  80001: 'Mumbai Testnet',
  56: 'BNB Smart Chain',
  97: 'BSC Testnet',
  42161: 'Arbitrum One',
  10: 'Optimism',
  1337: 'Local Network',
  31337: 'Hardhat Network',
  5777: 'Ganache',
  7545: 'Ganache (7545)',
};

/**
 * Get the network symbol for a given chain ID
 */
export function getNetworkSymbol(chainId: number | null | undefined): string {
  if (!chainId) return 'ETH';
  
  const symbols: Record<number, string> = {
    1: 'ETH',
    5: 'gETH',
    11155111: 'sETH',
    137: 'MATIC',
    80001: 'mMATIC',
    56: 'BNB',
    97: 'tBNB',
    42161: 'ETH',
    10: 'ETH',
    1337: 'ETH',
    31337: 'ETH',
    5777: 'ETH',
    7545: 'ETH',
  };
  
  return symbols[chainId] ?? 'ETH';
}
