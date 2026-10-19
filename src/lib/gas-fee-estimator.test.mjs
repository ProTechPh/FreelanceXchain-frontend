import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateGasEth,
  getEmployerEscrowGasFee,
  getFreelancerClaimGasFee,
  computeEmployerTotalCost,
  computeFreelancerNetPayout,
  getMilestoneActionGasFee,
} from './gas-fee-estimator.ts';

test('calculateGasEth computes correct gas fee in ETH', () => {
  // 850,000 gas * 1 Gwei = 0.00085 ETH
  assert.equal(calculateGasEth(850000, 1), 0.00085);
  // 65,000 gas * 2 Gwei = 0.00013 ETH
  assert.equal(calculateGasEth(65000, 2), 0.00013);
  // Invalid inputs return 0
  assert.equal(calculateGasEth(0, 1), 0);
  assert.equal(calculateGasEth(-100, 1), 0);
});

test('getEmployerEscrowGasFee returns gas in ETH and converted PHP', () => {
  const result = getEmployerEscrowGasFee(150000, 1);
  assert.equal(result.gasEth, 0.00085);
  assert.equal(result.gasPhp, 0.00085 * 150000); // 127.50
  assert.match(result.gasFormattedEth, /0\.00085 ETH/);
  assert.match(result.gasFormattedPhp, /₱/);
});

test('getFreelancerClaimGasFee returns gas in ETH and converted PHP', () => {
  const result = getFreelancerClaimGasFee(150000, 1);
  assert.equal(result.gasEth, 0.000065);
  assert.equal(result.gasPhp, 0.000065 * 150000); // 9.75
  assert.match(result.gasFormattedEth, /0\.000065 ETH/);
  assert.match(result.gasFormattedPhp, /₱/);
});

test('computeEmployerTotalCost adds proposed rate and escrow gas fee', () => {
  const cost = computeEmployerTotalCost(0.5, 150000, 1);
  assert.ok(cost);
  assert.equal(cost.rateEth, 0.5);
  assert.equal(cost.gasEth, 0.00085);
  assert.equal(cost.totalEth, 0.50085);
  assert.match(cost.totalFormattedEth, /0\.50085 ETH/);
  assert.match(cost.totalFormattedPhp, /₱/);
});

test('computeFreelancerNetPayout calculates net earnings minus claim gas', () => {
  const payout = computeFreelancerNetPayout(0.5, 150000, 1);
  assert.ok(payout);
  assert.equal(payout.rateEth, 0.5);
  assert.equal(payout.netEth, 0.5 - 0.000065);
  assert.match(payout.netFormattedEth, /ETH/);
  assert.match(payout.netFormattedPhp, /₱/);
});

test('milestone gas estimates scale with the number of on-chain actions', () => {
  const gas = getMilestoneActionGasFee('freelancer-submit', 3, 150000, 1);
  assert.equal(gas.gasUnits, 195000);
  assert.equal(gas.gasEth, 0.000195);

  const payout = computeFreelancerNetPayout(0.5, 150000, 1, 3);
  assert.ok(payout);
  assert.equal(payout.gasEth, 0.000195);
  assert.equal(payout.netEth, 0.5 - 0.000195);
});
