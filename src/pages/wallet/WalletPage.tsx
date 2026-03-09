import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useWalletStore, useAuthStore } from '../../store';
import { Card, CardHeader, Button, Badge } from '../../components/ui';
import { FiCheck, FiCopy, FiExternalLink, FiAlertCircle, FiRefreshCw, FiLink } from 'react-icons/fi';

export function WalletPage() {
  const { user } = useAuthStore();
  const {
    isConnected,
    address,
    balance,
    chainId,
    connect,
    disconnect,
    error: walletError
  } = useWalletStore();

  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Redirect admin to dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (id: number | null) => {
    if (!id) return 'Unknown';
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      56: 'BNB Smart Chain',
      97: 'BSC Testnet',
      43114: 'Avalanche C-Chain',
      42161: 'Arbitrum One',
      10: 'Optimism',
    };
    return networks[id] || `Chain ID: ${id}`;
  };

  return (
    <div className="space-y-6" data-tour-id="wallet-main">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect your Web3 wallet to enable blockchain transactions
        </p>
      </div>

      {walletError && (
        <Card className="bg-red-500/10 border-red-500/30">
          <div className="p-4 text-red-400 flex items-center gap-2">
            <FiAlertCircle />
            {walletError}
          </div>
        </Card>
      )}

      {/* Wallet Connection Card */}
      <Card>
        <div className="p-6">
          {isConnected && address ? (
            <div className="space-y-6">
              {/* Connected Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <FiCheck className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-600 dark:text-green-400 font-medium">Wallet Connected</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">MetaMask</p>
                  </div>
                </div>
                <Button variant="outline" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>

              {/* Wallet Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 dark:text-white font-mono">{formatAddress(address)}</p>
                    <button
                      onClick={handleCopyAddress}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {copied ? <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" /> : <FiCopy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Balance</p>
                  <p className="text-gray-900 dark:text-white text-xl font-semibold">{balance || '0.0000'} ETH</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg md:col-span-2">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Network</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={chainId === 1 ? 'success' : 'warning'}>
                      {getNetworkName(chainId)}
                    </Badge>
                    {chainId !== 1 && (
                      <span className="text-amber-600 dark:text-amber-400 text-sm">Switch to Mainnet for production</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-bg mx-auto mb-6 flex items-center justify-center">
                <FiLink className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Connect your MetaMask wallet to enable secure blockchain transactions,
                escrow payments, and on-chain reputation tracking.
              </p>
              <Button onClick={handleConnect} disabled={connecting} size="lg">
                {connecting ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                      alt="MetaMask"
                      className="w-5 h-5 mr-2"
                    />
                    Connect MetaMask
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Features Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Secure Escrow</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Payments are held in smart contract escrow until milestones are completed and approved.
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-600/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">On-Chain Reputation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your work history and ratings are stored on the blockchain, creating a permanent and verifiable reputation.
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Instant Payments</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Receive payments instantly upon milestone approval, with no intermediaries or delays.
            </p>
          </div>
        </Card>
      </div>

      {/* Transaction History Placeholder */}
      {isConnected && (
        <Card>
          <CardHeader title="Recent Transactions" description="Your latest blockchain transactions" />
          <div className="p-6 pt-0">
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Your escrow payments and contract interactions will appear here</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
