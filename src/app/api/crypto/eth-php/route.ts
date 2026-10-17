import { NextResponse } from 'next/server';

interface CacheEntry {
  rate: number;
  updatedAt: number;
  source: string;
}

let cachedRate: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const FALLBACK_ETH_PHP_RATE = 155000; // Safe baseline fallback if external APIs are unreachable

async function fetchFromCoinbase(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.coinbase.com/v2/prices/ETH-PHP/spot', {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { amount?: string } };
    const amount = Number(json?.data?.amount);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  } catch {
    return null;
  }
}

async function fetchFromCoinGecko(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=php', {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as { ethereum?: { php?: number } };
    const php = Number(json?.ethereum?.php);
    return Number.isFinite(php) && php > 0 ? php : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return fresh cache if within TTL
  if (cachedRate && now - cachedRate.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      rate: cachedRate.rate,
      currency: 'PHP',
      updatedAt: new Date(cachedRate.updatedAt).toISOString(),
      source: cachedRate.source,
      cached: true,
    });
  }

  // 1. Try CoinGecko (matches Brave Search / Google crypto widgets)
  let rate = await fetchFromCoinGecko();
  let source = 'coingecko';

  // 2. Try Coinbase if CoinGecko fails
  if (!rate) {
    rate = await fetchFromCoinbase();
    source = 'coinbase';
  }

  // 3. Fallback to previous cache or baseline if all fail
  if (!rate) {
    if (cachedRate) {
      rate = cachedRate.rate;
      source = `${cachedRate.source}-stale`;
    } else {
      rate = FALLBACK_ETH_PHP_RATE;
      source = 'fallback';
    }
  }

  cachedRate = {
    rate,
    updatedAt: now,
    source,
  };

  return NextResponse.json(
    {
      rate,
      currency: 'PHP',
      updatedAt: new Date(now).toISOString(),
      source,
      cached: false,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
