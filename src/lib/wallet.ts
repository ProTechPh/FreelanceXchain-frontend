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
  abi?: unknown[];
  bytecode?: string;
  chainId?: string;
  existingDeployment?: {
    escrowAddress: string;
    transactionHash: string;
  };
}

export interface DeployedEscrowResult {
  escrowAddress: string;
  transactionHash: string;
}

export async function deployEscrowFromWallet(
  ethereum: EthereumProvider,
  params: DeployEscrowParams
): Promise<DeployedEscrowResult> {
  if (params.existingDeployment?.escrowAddress && params.existingDeployment?.transactionHash) {
    return params.existingDeployment;
  }

  const { BrowserProvider, ContractFactory } = await import('ethers');
  const { FreelanceEscrowABI, FreelanceEscrowBytecode } = await import('./escrow-abi');
  const resolvedAbi = Array.isArray(params.abi) && params.abi.length > 0 ? params.abi : FreelanceEscrowABI;
  const resolvedBytecode =
    typeof params.bytecode === 'string' && params.bytecode.startsWith('0x') && params.bytecode.length > 2
      ? params.bytecode
      : FreelanceEscrowBytecode;

  if (params.chainId) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code?: number })?.code === 4902 && params.chainId === '0x539') {
        await switchToGanache(ethereum);
      } else {
        throw switchError;
      }
    }
  }

  const browserProvider = new BrowserProvider(ethereum as never);
  const storageKey = `fx_pending_escrow_${params.contractId}`;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const cached = JSON.parse(raw) as { escrowAddress?: string; transactionHash?: string };
        if (cached?.escrowAddress && cached?.transactionHash) {
          const code = await browserProvider.getCode(cached.escrowAddress);
          if (code && code !== '0x') {
            return {
              escrowAddress: cached.escrowAddress,
              transactionHash: cached.transactionHash,
            };
          }
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore storage or RPC check errors and proceed with deployment
    }
  }

  const signer = await browserProvider.getSigner();

  const factory = new ContractFactory(resolvedAbi as import('ethers').InterfaceAbi, resolvedBytecode, signer);

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
  const result: DeployedEscrowResult = {
    escrowAddress,
    transactionHash: receipt?.hash ?? deployTx.hash,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(result));
    } catch {
      // Ignore storage write errors
    }
  }

  return result;
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
      } else {
        throw switchError;
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

export interface WithdrawFromEscrowParams {
  escrowAddress: string;
  chainId?: string;
}

export async function withdrawFromEscrowFromWallet(
  ethereum: EthereumProvider,
  params: WithdrawFromEscrowParams
): Promise<{ transactionHash: string }> {
  const { BrowserProvider, Contract } = await import('ethers');
  const { FreelanceEscrowABI } = await import('./escrow-abi');

  if (params.chainId) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code?: number })?.code === 4902 && params.chainId === '0x539') {
        await switchToGanache(ethereum);
      } else {
        throw switchError;
      }
    }
  }

  const browserProvider = new BrowserProvider(ethereum as never);
  const signer = await browserProvider.getSigner();
  const contract = new Contract(params.escrowAddress, FreelanceEscrowABI, signer);

  const tx = await contract.withdraw();
  const receipt = await tx.wait(1);

  return {
    transactionHash: receipt?.hash ?? tx.hash,
  };
}

export async function getEscrowPendingWithdrawal(
  ethereum: EthereumProvider,
  escrowAddress: string,
  walletAddress: string
): Promise<bigint> {
  const { BrowserProvider, Contract } = await import('ethers');
  const { FreelanceEscrowABI } = await import('./escrow-abi');

  const browserProvider = new BrowserProvider(ethereum as never);
  const contract = new Contract(escrowAddress, FreelanceEscrowABI, browserProvider);

  return await contract.pendingWithdrawals(walletAddress);
}


export type EscrowMilestoneStatus = 'pending' | 'submitted' | 'approved' | 'disputed' | 'refunded';

const ESCROW_MILESTONE_STATUSES: EscrowMilestoneStatus[] = ['pending', 'submitted', 'approved', 'disputed', 'refunded'];

async function ensureChain(ethereum: EthereumProvider, chainId?: string): Promise<void> {
  if (!chainId) return;
  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (switchError: unknown) {
    if ((switchError as { code?: number })?.code === 4902 && chainId === '0x539') {
      await switchToGanache(ethereum);
    } else {
      throw switchError;
    }
  }
}

export interface EscrowMilestoneState {
  status: EscrowMilestoneStatus;
  /** The escrow's on-chain employer: only this wallet can release payments. */
  employer: string;
  freelancer: string;
}

/**
 * On-chain state of an escrow milestone, or null when the address has no
 * contract on the wallet's current network (simulated escrows).
 */
export async function readEscrowMilestone(
  ethereum: EthereumProvider,
  escrowAddress: string,
  milestoneIndex: number,
): Promise<EscrowMilestoneState | null> {
  const { BrowserProvider, Contract } = await import('ethers');
  const { FreelanceEscrowABI } = await import('./escrow-abi');
  const browserProvider = new BrowserProvider(ethereum as never);
  const code = await browserProvider.getCode(escrowAddress);
  if (!code || code === '0x') return null;
  const contract = new Contract(escrowAddress, FreelanceEscrowABI, browserProvider);
  const [milestone, employer, freelancer] = await Promise.all([
    contract.getMilestone(milestoneIndex),
    contract.employer(),
    contract.freelancer(),
  ]);
  const status = ESCROW_MILESTONE_STATUSES[Number(milestone[1])];
  return status ? { status, employer: String(employer), freelancer: String(freelancer) } : null;
}

/** Switch the wallet to the escrow's network (prompts only when it differs). */
export async function switchToEscrowChain(ethereum: EthereumProvider, chainId?: string): Promise<void> {
  await ensureChain(ethereum, chainId);
}

/** Freelancer marks the escrow milestone Submitted from their own wallet. */
export async function submitEscrowMilestoneFromWallet(
  ethereum: EthereumProvider,
  params: { escrowAddress: string; milestoneIndex: number; chainId?: string },
): Promise<{ transactionHash: string }> {
  await ensureChain(ethereum, params.chainId);
  const { BrowserProvider, Contract } = await import('ethers');
  const { FreelanceEscrowABI } = await import('./escrow-abi');
  const signer = await new BrowserProvider(ethereum as never).getSigner();
  const tx = await new Contract(params.escrowAddress, FreelanceEscrowABI, signer).submitMilestone(params.milestoneIndex);
  const receipt = await tx.wait(1);
  return { transactionHash: receipt?.hash ?? tx.hash };
}

/** Employer releases the escrow milestone payment from their own wallet. */
export async function approveEscrowMilestoneFromWallet(
  ethereum: EthereumProvider,
  params: { escrowAddress: string; milestoneIndex: number; chainId?: string },
): Promise<{ transactionHash: string }> {
  await ensureChain(ethereum, params.chainId);
  const { BrowserProvider, Contract } = await import('ethers');
  const { FreelanceEscrowABI } = await import('./escrow-abi');
  const signer = await new BrowserProvider(ethereum as never).getSigner();
  const tx = await new Contract(params.escrowAddress, FreelanceEscrowABI, signer).approveMilestone(params.milestoneIndex);
  const receipt = await tx.wait(1);
  return { transactionHash: receipt?.hash ?? tx.hash };
}
