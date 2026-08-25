import type { CryptoNewsArticle, CryptoPricesResponse, CryptoCoinPrice } from '../types/index';

export function normalizeCryptoPriceMap(
  data: CryptoPricesResponse | Record<string, unknown> | null | undefined
): Record<string, { usd: number; change24h?: number }> {
  if (!data || typeof data !== 'object') return {};

  const parsed: Record<string, { usd: number; change24h?: number }> = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'number') {
      parsed[key] = { usd: val };
    } else if (val && typeof (val as CryptoCoinPrice).usd === 'number') {
      parsed[key] = {
        usd: (val as CryptoCoinPrice).usd,
        change24h: (val as CryptoCoinPrice).usd_24h_change,
      };
    }
  }
  return parsed;
}

export function filterCryptoArticles(
  articles: CryptoNewsArticle[],
  filter?: string
): CryptoNewsArticle[] {
  if (!filter || filter === 'All') return articles;
  const f = filter.toLowerCase();
  return articles.filter(
    (a) =>
      a.category?.toLowerCase().includes(f) ||
      a.title?.toLowerCase().includes(f) ||
      a.source?.toLowerCase().includes(f)
  );
}

export function getCryptoNewsSentimentLabel(sentiment?: string): 'positive' | 'negative' | 'neutral' {
  if (!sentiment) return 'neutral';
  const s = sentiment.toLowerCase();
  if (s === 'positive' || s === 'bullish') return 'positive';
  if (s === 'negative' || s === 'bearish') return 'negative';
  return 'neutral';
}

export function extractCryptoArticleImage(
  article?: CryptoNewsArticle | Partial<CryptoNewsArticle> | Record<string, unknown> | null,
  categoryHint?: string
): string {
  if (!article || typeof article !== 'object') {
    return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80';
  }

  const art = article as Record<string, unknown>;
  const possibleUrls = [
    art.image,
    art.imageurl,
    art.imageUrl,
    art.image_url,
    art.urlToImage,
    art.thumbnail,
    art.thumb,
    typeof art.source_info === 'object' && art.source_info !== null
      ? (art.source_info as { img?: string }).img
      : undefined,
  ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0 && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')));

  if (possibleUrls.length > 0) {
    return possibleUrls[0];
  }

  const cat = (categoryHint || (typeof art.category === 'string' ? art.category : '') || (typeof art.title === 'string' ? art.title : '')).toLowerCase();
  if (cat.includes('btc') || cat.includes('bitcoin')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('eth') || cat.includes('ethereum') || cat.includes('defi')) {
    return 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('sol') || cat.includes('solana')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80';
}

/**
 * Extract date string from various possible API field names
 */
export function extractArticleDate(article?: CryptoNewsArticle | Record<string, unknown> | null): string | undefined {
  if (!article || typeof article !== 'object') return undefined;
  const art = article as Record<string, unknown>;
  const possible = [
    art.pubDate,
    art.published_at,
    art.publishedAt,
    art.date,
    art.time,
    art.createdAt,
    art.created_at,
    art.pub_date,
  ].find((d) => typeof d === 'string' && d.trim().length > 0);
  return typeof possible === 'string' ? possible : undefined;
}

/**
 * Convert ISO / UTC date string to the user's device local formatted date:
 * e.g. "Aug 25, 2026"
 */
export function formatNewsDate(dateInput?: string | Record<string, unknown> | null): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : extractArticleDate(dateInput as Record<string, unknown>);
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    // Uses the client browser/device's local timezone
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Convert ISO / UTC date string to the user's device local date & time:
 * e.g. "Aug 25, 2026, 6:45 PM"
 */
export function formatNewsDateTime(dateInput?: string | Record<string, unknown> | null): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : extractArticleDate(dateInput as Record<string, unknown>);
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    // Uses the client browser/device's local timezone and clock
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Convert ISO date string to human-friendly relative time based on user's device clock:
 * e.g. "Just now", "15m ago", "2h ago", or "Aug 25, 2026"
 */
export function formatNewsTimeAgo(dateInput?: string | Record<string, unknown> | null): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : extractArticleDate(dateInput as Record<string, unknown>);
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    // Uses client device's current time in milliseconds
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatNewsDate(dateStr);
  } catch {
    return dateStr;
  }
}
