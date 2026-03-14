/**
 * Frontend escrow deployment via MetaMask
 * Deploys FreelanceEscrow smart contract using the employer's wallet
 */
import { ethers } from 'ethers';
import FreelanceEscrowArtifact from './FreelanceEscrow.json';

export type DeployEscrowParams = {
  freelancerAddress: string;
  arbiterAddress: string;
  platformAddress: string; // Server wallet that can approve milestones on employer's behalf
  contractId: string;
  milestoneAmounts: bigint[];
  milestoneDescriptions: string[];
  totalAmount: bigint;
};

export type DeployEscrowResult = {
  escrowAddress: string;
  transactionHash: string;
};

/**
 * Deploy FreelanceEscrow contract via MetaMask (employer pays)
 */
export async function deployEscrowViaMetaMask(
  params: DeployEscrowParams
): Promise<DeployEscrowResult> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();

  const factory = new ethers.ContractFactory(
    FreelanceEscrowArtifact.abi,
    FreelanceEscrowArtifact.bytecode,
    signer
  );

  const contract = await factory.deploy(
    params.freelancerAddress,
    params.arbiterAddress,
    params.platformAddress,
    params.contractId,
    params.milestoneAmounts,
    params.milestoneDescriptions,
    { value: params.totalAmount }
  );

  await contract.waitForDeployment();
  const escrowAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  return {
    escrowAddress,
    transactionHash: deployTx?.hash || '',
  };
}
