import { formatAmount } from './format.ts';
import { convertEthToPhp, formatEthToPhp, DEFAULT_FALLBACK_ETH_PHP } from './eth-php-converter.ts';

/**
 * Standard EVM gas unit benchmarks for FreelanceXchain smart contract operations:
 * - ESCROW_DEPLOY_GAS: Deploying FreelanceEscrow contract + initializing milestones with deposit (~850,000 gas units)
 * - CLAIM_PAYOUT_GAS: Claiming / releasing a milestone deliverable payout (~65,000 gas units)
 */
export const GAS_UNITS = {
  EMPLOYER_DEPLOY_AND_DEPOSIT: 850_000,
  EMPLOYER_RELEASE_MILESTONE: 65_000,
  FREELANCER_SUBMIT_MILESTONE: 65_000,
  /** @deprecated Kept for compatibility with older callers. */
  FREELANCER_CLAIM_PAYOUT: 65_000,
} as const;

/**
 * Standard fallback gas price in Gwei when wallet provider is not connected:
 * 1 Gwei baseline (typical for L2 / Polygon / local testnets) = 0.000000001 ETH
 */
export const DEFAULT_GAS_PRICE_GWEI = 1;

/**
 * Calculates gas fee in ETH given gas units and gas price in Gwei.
 */
export function calculateGasEth(gasUnits: number, gasPriceGwei: number = DEFAULT_GAS_PRICE_GWEI): number {
  if (!Number.isFinite(gasUnits) || gasUnits <= 0) return 0;
  if (!Number.isFinite(gasPriceGwei) || gasPriceGwei <= 0) return 0;
  // gasUnits * (gasPriceGwei * 1e9 wei) / 1e18 wei per ETH
  return (gasUnits * gasPriceGwei) / 1_000_000_000;
}

export interface GasFeeBreakdown {
  gasUnits: number;
  gasPriceGwei: number;
  gasEth: number;
  gasPhp: number;
  gasFormattedEth: string;
  gasFormattedPhp: string;
}

/**
 * Get estimated gas fee for employer escrow deployment and deposit.
 */
export function getEmployerEscrowGasFee(
  ethRatePhp: number = DEFAULT_FALLBACK_ETH_PHP,
  gasPriceGwei: number = DEFAULT_GAS_PRICE_GWEI
): GasFeeBreakdown {
  const gasUnits = GAS_UNITS.EMPLOYER_DEPLOY_AND_DEPOSIT;
  const gasEth = calculateGasEth(gasUnits, gasPriceGwei);
  const gasPhp = convertEthToPhp(gasEth, ethRatePhp) ?? 0;

  return {
    gasUnits,
    gasPriceGwei,
    gasEth,
    gasPhp,
    gasFormattedEth: `${gasEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    gasFormattedPhp: formatEthToPhp(gasEth, ethRatePhp),
  };
}

/**
 * Get estimated gas fee for freelancer milestone payout claim.
 */
export function getFreelancerClaimGasFee(
  ethRatePhp: number = DEFAULT_FALLBACK_ETH_PHP,
  gasPriceGwei: number = DEFAULT_GAS_PRICE_GWEI
): GasFeeBreakdown {
  const gasUnits = GAS_UNITS.FREELANCER_CLAIM_PAYOUT;
  const gasEth = calculateGasEth(gasUnits, gasPriceGwei);
  const gasPhp = convertEthToPhp(gasEth, ethRatePhp) ?? 0;

  return {
    gasUnits,
    gasPriceGwei,
    gasEth,
    gasPhp,
    gasFormattedEth: `${gasEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    gasFormattedPhp: formatEthToPhp(gasEth, ethRatePhp),
  };
}

/**
 * Estimated gas for repeated milestone actions. The estimate is deliberately
 * kept separate from the agreed contract amount: gas is paid to validators,
 * not deducted by FreelanceXchain from escrow.
 */
export function getMilestoneActionGasFee(
  action: 'employer-release' | 'freelancer-submit',
  milestoneCount: number,
  ethRatePhp: number = DEFAULT_FALLBACK_ETH_PHP,
  gasPriceGwei: number = DEFAULT_GAS_PRICE_GWEI
): GasFeeBreakdown {
  const count = Number.isFinite(milestoneCount) ? Math.max(0, Math.floor(milestoneCount)) : 0;
  const unitsPerAction = action === 'employer-release'
    ? GAS_UNITS.EMPLOYER_RELEASE_MILESTONE
    : GAS_UNITS.FREELANCER_SUBMIT_MILESTONE;
  const gasUnits = unitsPerAction * count;
  const gasEth = calculateGasEth(gasUnits, gasPriceGwei);
  const gasPhp = convertEthToPhp(gasEth, ethRatePhp) ?? 0;

  return {
    gasUnits,
    gasPriceGwei,
    gasEth,
    gasPhp,
    gasFormattedEth: `${gasEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    gasFormattedPhp: formatEthToPhp(gasEth, ethRatePhp),
  };
}

export interface EmployerTotalCost {
  rateEth: number;
  ratePhp: number;
  gasEth: number;
  gasPhp: number;
  totalEth: number;
  totalPhp: number;
  rateFormattedEth: string;
  rateFormattedPhp: string;
  gasFormattedEth: string;
  gasFormattedPhp: string;
  totalFormattedEth: string;
  totalFormattedPhp: string;
}

/**
 * Computes employer total deposit (Proposed Rate + Escrow Deployment Gas)
 */
export function computeEmployerTotalCost(
  proposedRateEth: number | string | null | undefined,
  ethRatePhp: number = DEFAULT_FALLBACK_ETH_PHP,
  gasPriceGwei: number = DEFAULT_GAS_PRICE_GWEI
): EmployerTotalCost | null {
  if (proposedRateEth == null) return null;
  const rateEth = typeof proposedRateEth === 'string' ? parseFloat(proposedRateEth) : proposedRateEth;
  if (!Number.isFinite(rateEth) || rateEth <= 0) return null;

  const gas = getEmployerEscrowGasFee(ethRatePhp, gasPriceGwei);
  const ratePhp = convertEthToPhp(rateEth, ethRatePhp) ?? 0;
  const totalEth = rateEth + gas.gasEth;
  const totalPhp = ratePhp + gas.gasPhp;

  return {
    rateEth,
    ratePhp,
    gasEth: gas.gasEth,
    gasPhp: gas.gasPhp,
    totalEth,
    totalPhp,
    rateFormattedEth: `${rateEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    rateFormattedPhp: formatEthToPhp(rateEth, ethRatePhp),
    gasFormattedEth: gas.gasFormattedEth,
    gasFormattedPhp: gas.gasFormattedPhp,
    totalFormattedEth: `${totalEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    totalFormattedPhp: formatAmount(totalPhp, { currency: 'PHP' }),
  };
}

export interface FreelancerNetPayout {
  rateEth: number;
  ratePhp: number;
  gasEth: number;
  gasPhp: number;
  netEth: number;
  netPhp: number;
  rateFormattedEth: string;
  rateFormattedPhp: string;
  gasFormattedEth: string;
  gasFormattedPhp: string;
  netFormattedEth: string;
  netFormattedPhp: string;
}

/**
 * Computes freelancer net payout after estimated claim gas fee
 */
export function computeFreelancerNetPayout(
  proposedRateEth: number | string | null | undefined,
  ethRatePhp: number = DEFAULT_FALLBACK_ETH_PHP,
  gasPriceGwei: number = DEFAULT_GAS_PRICE_GWEI,
  milestoneCount: number = 1
): FreelancerNetPayout | null {
  if (proposedRateEth == null) return null;
  const rateEth = typeof proposedRateEth === 'string' ? parseFloat(proposedRateEth) : proposedRateEth;
  if (!Number.isFinite(rateEth) || rateEth <= 0) return null;

  const gas = getMilestoneActionGasFee('freelancer-submit', milestoneCount, ethRatePhp, gasPriceGwei);
  const ratePhp = convertEthToPhp(rateEth, ethRatePhp) ?? 0;
  const netEth = Math.max(0, rateEth - gas.gasEth);
  const netPhp = Math.max(0, ratePhp - gas.gasPhp);

  return {
    rateEth,
    ratePhp,
    gasEth: gas.gasEth,
    gasPhp: gas.gasPhp,
    netEth,
    netPhp,
    rateFormattedEth: `${rateEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    rateFormattedPhp: formatEthToPhp(rateEth, ethRatePhp),
    gasFormattedEth: gas.gasFormattedEth,
    gasFormattedPhp: gas.gasFormattedPhp,
    netFormattedEth: `${netEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    netFormattedPhp: formatAmount(netPhp, { currency: 'PHP' }),
  };
}
