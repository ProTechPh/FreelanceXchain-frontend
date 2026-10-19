import { NextResponse } from 'next/server';

interface CacheEntry {
  gasPriceWei: string;
  gasPriceGwei: number;
  employerGasEth: number;
  freelancerGasEth: number;
  source: string;
  updatedAt: number;
}

let cachedGasFee: CacheEntry | null = null;
const CACHE_TTL_MS = 15 * 1000; // 15 seconds cache

const EMPLOYER_DEPLOY_GAS_UNITS = 850_000;
const FREELANCER_CLAIM_GAS_UNITS = 65_000;

async function fetchGasPriceFromRpc(rpcUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: [],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: string };
    if (json?.result && typeof json.result === 'string' && json.result.startsWith('0x')) {
      return json.result;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedGasFee && now - cachedGasFee.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cachedGasFee,
      cached: true,
    });
  }

  // 1. Try configured local RPC or environment RPC (Ganache)
  const configuredRpc = process.env['BLOCKCHAIN_RPC_URL'] || 'http://127.0.0.1:7545';
  let hexPrice = await fetchGasPriceFromRpc(configuredRpc);
  let source = 'ganache';

  // 2. Try Polygon RPC if local RPC unreachable
  if (!hexPrice) {
    hexPrice = await fetchGasPriceFromRpc('https://polygon-bor-rpc.publicnode.com');
    source = 'polygon';
  }

  // 3. Conservative fallback if all network calls fail
  let gasPriceWei = BigInt(20_000_000_000); // 20 Gwei baseline
  if (hexPrice) {
    try {
      gasPriceWei = BigInt(hexPrice);
    } catch {
      // keep fallback
    }
  } else {
    source = 'fallback';
  }

  const gasPriceWeiStr = gasPriceWei.toString();
  const gasPriceGwei = Number(gasPriceWei) / 1e9;

  // Legacy benchmark projection only. Executable transactions use wallet RPC
  // simulation, and mined receipts provide the final fee actually paid.
  const employerGasEth = (EMPLOYER_DEPLOY_GAS_UNITS * Number(gasPriceWei)) / 1e18;
  const freelancerGasEth = (FREELANCER_CLAIM_GAS_UNITS * Number(gasPriceWei)) / 1e18;

  cachedGasFee = {
    gasPriceWei: gasPriceWeiStr,
    gasPriceGwei,
    employerGasEth,
    freelancerGasEth,
    source,
    updatedAt: now,
  };

  return NextResponse.json(
    {
      ...cachedGasFee,
      employerDeployGasUnits: EMPLOYER_DEPLOY_GAS_UNITS,
      freelancerClaimGasUnits: FREELANCER_CLAIM_GAS_UNITS,
      cached: false,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    }
  );
}
