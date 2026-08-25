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

