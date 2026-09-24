import { createConfig, http } from 'wagmi';
import { mainnet, polygon, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Get WalletConnect Project ID from environment or use a fallback for development
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Supported chains
export const supportedChains = [mainnet, polygon, polygonAmoy] as const;

// Create wagmi config
export const config = createConfig({
  chains: supportedChains,
  connectors: [
    // Injected wallet (MetaMask extension, etc.)
    injected({ target: 'metaMask' }),
    // WalletConnect for mobile wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'FreelanceXchain',
        description: 'Decentralized Freelance Marketplace with Smart Escrow',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://www.freelancexchain.works',
        icons: ['https://www.freelancexchain.works/favicon.svg'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

// Chain ID to name mapping for display
export const chainNames: Record<number, string> = {
  [mainnet.id]: 'Ethereum Mainnet',
  [polygon.id]: 'Polygon',
  [polygonAmoy.id]: 'Polygon Amoy',
};

// Get network symbol
export function getNetworkSymbol(chainId?: number): string {
  if (!chainId) return 'ETH';
  if (chainId === polygon.id || chainId === polygonAmoy.id) return 'POL';
  return 'ETH';
}

// Format wallet address for display
export function formatWalletAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}
