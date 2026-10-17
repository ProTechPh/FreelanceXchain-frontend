import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertEthToPhp,
  formatEthToPhp,
  formatEthWithPhp,
  convertPhpToEth,
  formatPhpToEth,
  DEFAULT_FALLBACK_ETH_PHP,
} from './eth-php-converter.ts';

test('convertEthToPhp calculates accurate PHP amounts', () => {
  assert.equal(convertEthToPhp(1, 150000), 150000);
  assert.equal(convertEthToPhp('0.5', 150000), 75000);
  assert.equal(convertEthToPhp(0, 150000), 0);
  assert.equal(convertEthToPhp(null, 150000), null);
  assert.equal(convertEthToPhp(undefined, 150000), null);
  assert.equal(convertEthToPhp('invalid', 150000), null);
});

test('convertEthToPhp uses fallback rate if rate is not explicitly passed', () => {
  assert.equal(convertEthToPhp(2), 2 * DEFAULT_FALLBACK_ETH_PHP);
});

test('formatEthToPhp formats to Philippine Peso currency string', () => {
  const result = formatEthToPhp(0.5, 150000);
  assert.equal(result, '₱75,000');

  const withDecimals = formatEthToPhp(0.005, 150000);
  assert.equal(withDecimals, '₱750');

  const invalid = formatEthToPhp('invalid', 150000);
  assert.equal(invalid, '—');
});

test('formatEthWithPhp formats dual ETH and PHP strings', () => {
  assert.equal(formatEthWithPhp(0.5, 150000), '0.5 ETH (≈ ₱75,000)');
  assert.equal(formatEthWithPhp(0, 150000), '0 ETH (≈ ₱0)');
  assert.equal(formatEthWithPhp(null, 150000), '—');
});

test('convertPhpToEth calculates accurate ETH amounts', () => {
  assert.equal(convertPhpToEth(150000, 150000), 1);
  assert.equal(convertPhpToEth(75000, 150000), 0.5);
  assert.equal(convertPhpToEth(0, 150000), 0);
  assert.equal(convertPhpToEth(null, 150000), null);
  assert.equal(convertPhpToEth(undefined, 150000), null);
  assert.equal(convertPhpToEth('invalid', 150000), null);
});

test('formatPhpToEth formats to readable ETH string', () => {
  assert.equal(formatPhpToEth(150000, 150000), '1 ETH');
  assert.equal(formatPhpToEth(75000, 150000), '0.5 ETH');
  assert.equal(formatPhpToEth(null, 150000), '—');
});
