import { toast } from 'sonner';
import { contractsApi } from '@/lib/api';
import { getEthereumProvider } from '@/lib/metamask';
import { sendRushFeeFromWallet } from '@/lib/wallet';

export interface PayRushFeeInput {
  contractId: string;
  baseAmount: number;
  percentage: number;
  progressId: string;
}

export type RushFeePaymentErrorType = 'NO_WALLET' | 'NO_FREELANCER_WALLET';

export class RushFeePaymentError extends Error {
  constructor(public readonly type: RushFeePaymentErrorType, message: string) {
    super(message);
    this.name = 'RushFeePaymentError';
  }
}

/**
 * Execute rush fee blockchain transaction from the user's connected wallet.
 * Validates wallet presence, resolves freelancer wallet address, prompts MetaMask/EVM signer,
 * and returns the resulting transaction hash.
 */
export async function executeRushFeePayment(
  input: PayRushFeeInput
): Promise<{ transactionHash: string }> {
  const provider = await getEthereumProvider();
  if (!provider) {
    throw new RushFeePaymentError(
      'NO_WALLET',
      'Connect MetaMask or another EVM-compatible wallet to pay the rush fee.'
    );
  }

  const { contractId, baseAmount, percentage, progressId } = input;
  const amount = Math.round(baseAmount * (percentage / 100) * 10000) / 10000;

  toast.loading('Checking the freelancer wallet…', { id: progressId });
  const { data: info } = await contractsApi.getFundInfo(contractId);
  if (!info.freelancerWallet) {
    throw new RushFeePaymentError(
      'NO_FREELANCER_WALLET',
      'The freelancer has no wallet connected yet. They need to connect one before you can pay the rush fee.'
    );
  }

  toast.loading(`Confirm the ${amount} ETH rush fee in your wallet…`, { id: progressId });
  return sendRushFeeFromWallet(provider, {
    freelancerWallet: info.freelancerWallet,
    amountEth: amount,
    chainId: info.chainId,
  });
}
