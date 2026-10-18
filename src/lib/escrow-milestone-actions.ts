/**
 * Wallet-side escrow milestone actions for escrows funded from the employer's
 * wallet. The escrow only accepts approveMilestone from its on-chain employer,
 * and (in escrows deployed before the platform could submit) submitMilestone
 * only from the freelancer, so those steps are signed in MetaMask.
 */
import type { EscrowMilestoneState, EthereumProvider } from './wallet.ts';

export class EscrowActionError extends Error {}

export interface EscrowWalletDeps {
  read: (ethereum: EthereumProvider, escrowAddress: string, index: number) => Promise<EscrowMilestoneState | null>;
  switchChain: (ethereum: EthereumProvider, chainId?: string) => Promise<void>;
  submit: (ethereum: EthereumProvider, params: { escrowAddress: string; milestoneIndex: number; chainId?: string }) => Promise<{ transactionHash: string }>;
  approve: (ethereum: EthereumProvider, params: { escrowAddress: string; milestoneIndex: number; chainId?: string }) => Promise<{ transactionHash: string }>;
}

export interface EscrowTarget {
  ethereum: EthereumProvider;
  escrowAddress: string;
  milestoneIndex: number;
  chainId?: string;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

async function activeAccount(ethereum: EthereumProvider): Promise<string> {
  const accounts = await ethereum.request<string[]>({ method: 'eth_requestAccounts' });
  const account = accounts?.[0];
  if (!account) throw new EscrowActionError('Connect MetaMask to continue.');
  return account;
}

/**
 * Freelancer: mark the escrow milestone Submitted from their wallet.
 * 'not-onchain' for simulated escrows, 'already' when nothing needs signing.
 */
export async function confirmSubmissionOnChain(deps: EscrowWalletDeps, target: EscrowTarget): Promise<'confirmed' | 'already' | 'not-onchain'> {
  await deps.switchChain(target.ethereum, target.chainId);
  const state = await deps.read(target.ethereum, target.escrowAddress, target.milestoneIndex);
  if (!state) return 'not-onchain';
  if (state.status !== 'pending') return 'already';
  const account = await activeAccount(target.ethereum);
  if (!same(account, state.freelancer)) {
    throw new EscrowActionError(`Switch MetaMask to the freelancer wallet on this contract (${state.freelancer}) to confirm the submission.`);
  }
  await deps.submit(target.ethereum, target);
  return 'confirmed';
}

/**
 * Employer: release the milestone from their wallet when the escrow requires it.
 * Returns the transaction hash for the server to verify, or no hash when the
 * server can release (simulated or platform-deployed escrows) or it already happened.
 */
export async function releaseFromEmployerWallet(deps: EscrowWalletDeps, target: EscrowTarget): Promise<{ transactionHash?: string }> {
  await deps.switchChain(target.ethereum, target.chainId);
  const state = await deps.read(target.ethereum, target.escrowAddress, target.milestoneIndex);
  if (!state || state.status === 'approved') return {};
  if (state.status === 'pending') {
    throw new EscrowActionError('The freelancer still needs to confirm this submission on the blockchain. They will see a "Confirm on blockchain" button on the contract.');
  }
  if (state.status !== 'submitted') {
    throw new EscrowActionError(`This milestone is ${state.status} on the blockchain and can't be released.`);
  }
  const account = await activeAccount(target.ethereum);
  if (!same(account, state.employer)) {
    // The escrow belongs to the platform wallet; the server releases it.
    return {};
  }
  const { transactionHash } = await deps.approve(target.ethereum, target);
  return { transactionHash };
}
