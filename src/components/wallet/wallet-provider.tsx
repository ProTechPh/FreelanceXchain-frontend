'use client';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Wallet connection is now handled directly via MetaMask browser extension
  // Mobile users should use MetaMask mobile app's built-in browser
  return <>{children}</>;
}
