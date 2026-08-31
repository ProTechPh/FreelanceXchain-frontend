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

export function getNetworkSymbol(chainId?: string): string {
  if (!chainId) return 'ETH';
  const numericChainId = Number.parseInt(chainId, 16);
  if (numericChainId === 137 || numericChainId === 80002) return 'POL';
  return 'ETH';
}

export function weiHexToEther(balance: string): string {
  try {
    const wei = BigInt(balance);
    const weiPerEther = BigInt('1000000000000000000');
    const whole = wei / weiPerEther;
    const fraction = wei % weiPerEther;
    const fractionalDigits = fraction.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
    return fractionalDigits ? `${whole}.${fractionalDigits}` : whole.toString();
  } catch {
    return '0';
  }
}

export async function getWalletBalance(provider: EthereumProvider, address: string): Promise<WalletConnection> {
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

export async function switchToGanache(provider: EthereumProvider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x539' }], // 1337 in hex
    });
  } catch (switchError: unknown) {
    if ((switchError as { code?: number })?.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x539',
            chainName: 'Ganache Localhost 7545',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['http://127.0.0.1:7545'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function connectWallet(provider: EthereumProvider): Promise<WalletConnection> {
  const accounts = await provider.request<string[]>({ method: 'eth_requestAccounts' });
  const address = accounts[0];
  if (!address) throw new Error('No wallet account was selected.');

  return getWalletBalance(provider, address);
}

export interface DeployEscrowParams {
  freelancerWallet: string;
  arbiterAddress: string;
  platformWallet: string;
  contractId: string;
  milestoneAmounts: string[];
  milestoneDescriptions: string[];
  totalAmount: string;
  chainId?: string;
}

export interface DeployedEscrowResult {
  escrowAddress: string;
  transactionHash: string;
}

export async function deployEscrowFromWallet(
  ethereum: EthereumProvider,
  params: DeployEscrowParams
): Promise<DeployedEscrowResult> {
  const { BrowserProvider, ContractFactory } = await import('ethers');
  const { FreelanceEscrowABI, FreelanceEscrowBytecode } = await import('./escrow-abi');

  if (params.chainId) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code?: number })?.code === 4902 && params.chainId === '0x539') {
        await switchToGanache(ethereum);
      }
    }
  }

  const browserProvider = new BrowserProvider(ethereum as never);
  const signer = await browserProvider.getSigner();

  const factory = new ContractFactory(FreelanceEscrowABI, FreelanceEscrowBytecode, signer);

  const contract = await factory.deploy(
    params.freelancerWallet,
    params.arbiterAddress,
    params.platformWallet,
    params.contractId,
    params.milestoneAmounts.map((a) => BigInt(a)),
    params.milestoneDescriptions,
    { value: BigInt(params.totalAmount) }
  );

  await contract.waitForDeployment();
  const escrowAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  if (!deployTx) {
    throw new Error('Deployment transaction not found');
  }

  const receipt = await deployTx.wait();

  return {
    escrowAddress,
    transactionHash: receipt?.hash ?? deployTx.hash,
  };
}

export interface SendRushFeeParams {
  freelancerWallet: string;
  amountEth: number | string;
  chainId?: string;
}

export async function sendRushFeeFromWallet(
  ethereum: EthereumProvider,
  params: SendRushFeeParams
): Promise<{ transactionHash: string }> {
  const { BrowserProvider, parseEther } = await import('ethers');

  if (params.chainId) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code?: number })?.code === 4902 && params.chainId === '0x539') {
        await switchToGanache(ethereum);
      }
    }
  }

  const browserProvider = new BrowserProvider(ethereum as never);
  const signer = await browserProvider.getSigner();

  const tx = await signer.sendTransaction({
    to: params.freelancerWallet,
    value: parseEther(String(params.amountEth)),
  });

  const receipt = await tx.wait(1);

  return {
    transactionHash: receipt?.hash ?? tx.hash,
  };
}
