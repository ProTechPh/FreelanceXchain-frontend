'use client';

import { useState } from 'react';
import { useConnect } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { Wallet, QrCode, Smartphone, ArrowLeft, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

type View = 'main' | 'mobile';

// Detect if user is on mobile
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detect if MetaMask is installed
function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethereum = (window as any).ethereum;
  return typeof ethereum !== 'undefined' && ethereum.isMetaMask === true;
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const [view, setView] = useState<View>('main');
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectAsync } = useConnect();

  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      await connectAsync({ connector: injected({ target: 'metaMask' }) });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectWalletConnect = async () => {
    setIsConnecting(true);
    try {
      await connectAsync({ 
        connector: walletConnect({ 
          showQrModal: true,
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        }) 
      });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenInMetamaskApp = () => {
    // Open current URL in MetaMask app's browser
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const metamaskDeepLink = `https://metamask.app.link/dapp/${currentUrl.replace(/^https?:\/\//, '')}`;
    window.location.href = metamaskDeepLink;
  };

  const isMobileDevice = isMobile();
  const hasMetaMask = isMetaMaskInstalled();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === 'mobile' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={() => setView('main')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Wallet className="h-5 w-5 text-primary" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            {view === 'main' 
              ? 'Choose your preferred wallet to connect to FreelanceXchain'
              : 'Connect using your mobile wallet app'
            }
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-3 py-4">
            {/* MetaMask Option */}
            <Button
              variant="outline"
              className="w-full h-14 justify-between px-4 text-left hover:bg-muted"
              onClick={handleConnectMetaMask}
              disabled={isConnecting}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                    <path d="M22.56 12.25c0-.78-.05-1.56-.14-2.32H12v4.39h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.15z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">MetaMask</p>
                  <p className="text-xs text-muted-foreground">
                    {hasMetaMask ? 'Extension detected' : 'Desktop extension'}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* WalletConnect Option - for mobile */}
            <Button
              variant="outline"
              className="w-full h-14 justify-between px-4 text-left hover:bg-muted"
              onClick={handleConnectWalletConnect}
              disabled={isConnecting}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">WalletConnect</p>
                  <p className="text-xs text-muted-foreground">
                    Scan with mobile wallet
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Mobile Wallet Option */}
            {isMobileDevice && (
              <Button
                variant="outline"
                className="w-full h-14 justify-between px-4 text-left hover:bg-muted"
                onClick={() => setView('mobile')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Mobile Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      MetaMask, Trust Wallet, etc.
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}

        {view === 'mobile' && (
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full h-14 justify-between px-4 text-left hover:bg-muted"
              onClick={handleOpenInMetamaskApp}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-xs">MM</span>
                </div>
                <div>
                  <p className="font-medium">Open in MetaMask App</p>
                  <p className="text-xs text-muted-foreground">
                    Launches MetaMask mobile browser
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>

            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Or scan the QR code with your wallet app
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full h-14 justify-between px-4 text-left hover:bg-muted"
              onClick={handleConnectWalletConnect}
              disabled={isConnecting}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Show QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    For any WalletConnect wallet
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have a wallet?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get MetaMask
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
