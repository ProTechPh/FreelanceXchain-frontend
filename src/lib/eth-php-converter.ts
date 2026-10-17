import { formatAmount } from './format.ts';

export const DEFAULT_FALLBACK_ETH_PHP = 155000;

/**
 * Calculate the PHP equivalent for a given ETH amount.
 * Returns null if the ETH amount or rate is invalid.
 */
export function convertEthToPhp(
  ethAmount: number | string | null | undefined,
  rate: number | null | undefined = DEFAULT_FALLBACK_ETH_PHP
): number | null {
  if (ethAmount == null || rate == null) return null;
  const eth = typeof ethAmount === 'string' ? parseFloat(ethAmount) : ethAmount;
  if (!Number.isFinite(eth) || !Number.isFinite(rate)) return null;
  return eth * rate;
}

/**
 * Formats an ETH amount into a clean PHP currency string (e.g. "₱154,204.40").
 */
export function formatEthToPhp(
  ethAmount: number | string | null | undefined,
  rate: number | null | undefined,
  options?: { fractionDigits?: number }
): string {
  const php = convertEthToPhp(ethAmount, rate);
  if (php == null) return '—';
  return formatAmount(php, {
    currency: 'PHP',
    fractionDigits: options?.fractionDigits,
  });
}

/**
 * Formats an ETH amount with both ETH and converted PHP equivalent:
 * e.g. "0.5 ETH (≈ ₱77,102.20)" or "0 ETH"
 */
export function formatEthWithPhp(
  ethAmount: number | string | null | undefined,
  rate: number | null | undefined,
  options?: { fractionDigitsEth?: number; fractionDigitsPhp?: number }
): string {
  if (ethAmount == null) return '—';
  const eth = typeof ethAmount === 'string' ? parseFloat(ethAmount) : ethAmount;
  if (!Number.isFinite(eth)) return '—';

  const ethFormatted = `${eth.toLocaleString('en-US', {
    maximumFractionDigits: options?.fractionDigitsEth ?? 4,
  })} ETH`;

  if (rate == null || !Number.isFinite(rate) || eth === 0) {
    if (eth === 0 && rate != null) {
      return `${ethFormatted} (≈ ₱0)`;
    }
    return ethFormatted;
  }

  const phpFormatted = formatEthToPhp(eth, rate, {
    fractionDigits: options?.fractionDigitsPhp,
  });

  return `${ethFormatted} (≈ ${phpFormatted})`;
}

/**
 * Calculate the ETH equivalent for a given PHP amount.
 * Returns null if the PHP amount or rate is invalid.
 */
export function convertPhpToEth(
  phpAmount: number | string | null | undefined,
  rate: number | null | undefined = DEFAULT_FALLBACK_ETH_PHP
): number | null {
  if (phpAmount == null || rate == null) return null;
  const php = typeof phpAmount === 'string' ? parseFloat(phpAmount) : phpAmount;
  if (!Number.isFinite(php) || !Number.isFinite(rate) || rate <= 0) return null;
  return php / rate;
}

/**
 * Formats a PHP amount into an ETH string (e.g. "0.0123 ETH").
 */
export function formatPhpToEth(
  phpAmount: number | string | null | undefined,
  rate: number | null | undefined,
  options?: { fractionDigits?: number }
): string {
  const eth = convertPhpToEth(phpAmount, rate);
  if (eth == null) return '—';
  const maxDigits = options?.fractionDigits ?? (eth < 0.01 ? 6 : 4);
  return `${eth.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  })} ETH`;
}
