import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeCryptoPriceMap,
  filterCryptoArticles,
  getCryptoNewsSentimentLabel,
  extractCryptoArticleImage,
} from './crypto-news-contract.ts';

test('normalizeCryptoPriceMap normalizes object and numeric formats', () => {
  const samplePrices = {
    bitcoin: { usd: 95000, usd_24h_change: 2.5 },
    ethereum: { usd: 3400, usd_24h_change: -1.2 },
    solana: 195,
  };

  const parsed = normalizeCryptoPriceMap(samplePrices);
  assert.equal(parsed.bitcoin.usd, 95000);
  assert.equal(parsed.bitcoin.change24h, 2.5);
  assert.equal(parsed.ethereum.usd, 3400);
  assert.equal(parsed.ethereum.change24h, -1.2);
  assert.equal(parsed.solana.usd, 195);
  assert.equal(parsed.solana.change24h, undefined);
});

test('normalizeCryptoPriceMap handles null/undefined/empty gracefully', () => {
  assert.deepEqual(normalizeCryptoPriceMap(null), {});
  assert.deepEqual(normalizeCryptoPriceMap(undefined), {});
  assert.deepEqual(normalizeCryptoPriceMap({}), {});
});

test('filterCryptoArticles filters by coin/category/source correctly', () => {
  const articles = [
    { title: 'Bitcoin ETF Inflows Surge', category: 'Bitcoin', pubDate: '2026-08-25', source: 'CoinDesk' },
    { title: 'Ethereum Staking Rewards', category: 'Ethereum', pubDate: '2026-08-25', source: 'Decrypt' },
    { title: 'Smart Escrow on Polygon', category: 'DeFi', pubDate: '2026-08-24', source: 'The Block' },
  ];

  const btcArticles = filterCryptoArticles(articles, 'Bitcoin');
  assert.equal(btcArticles.length, 1);
  assert.equal(btcArticles[0].title, 'Bitcoin ETF Inflows Surge');

  const ethArticles = filterCryptoArticles(articles, 'Ethereum');
  assert.equal(ethArticles.length, 1);
  assert.equal(ethArticles[0].title, 'Ethereum Staking Rewards');

  const allArticles = filterCryptoArticles(articles, 'All');
  assert.equal(allArticles.length, 3);
});

test('getCryptoNewsSentimentLabel standardizes sentiment keywords', () => {
  assert.equal(getCryptoNewsSentimentLabel('positive'), 'positive');
  assert.equal(getCryptoNewsSentimentLabel('bullish'), 'positive');
  assert.equal(getCryptoNewsSentimentLabel('negative'), 'negative');
  assert.equal(getCryptoNewsSentimentLabel('bearish'), 'negative');
  assert.equal(getCryptoNewsSentimentLabel('neutral'), 'neutral');
  assert.equal(getCryptoNewsSentimentLabel(undefined), 'neutral');
});

test('extractCryptoArticleImage extracts image from multiple API field variants', () => {
  assert.equal(
    extractCryptoArticleImage({ image: 'https://images.example.com/btc.jpg' }),
    'https://images.example.com/btc.jpg'
  );
  assert.equal(
    extractCryptoArticleImage({ imageurl: 'https://images.example.com/eth.jpg' }),
    'https://images.example.com/eth.jpg'
  );
  assert.equal(
    extractCryptoArticleImage({ imageUrl: 'https://images.example.com/sol.jpg' }),
    'https://images.example.com/sol.jpg'
  );
  assert.equal(
    extractCryptoArticleImage({ image_url: 'https://images.example.com/arb.jpg' }),
    'https://images.example.com/arb.jpg'
  );
  assert.equal(
    extractCryptoArticleImage({ urlToImage: 'https://images.example.com/news.jpg' }),
    'https://images.example.com/news.jpg'
  );
  assert.equal(
    extractCryptoArticleImage({ thumbnail: 'https://images.example.com/thumb.jpg' }),
    'https://images.example.com/thumb.jpg'
  );
});

test('extractCryptoArticleImage returns relevant context wallpaper when image is absent', () => {
  const btcWallpaper = extractCryptoArticleImage({ title: 'Bitcoin Market Update' }, 'Bitcoin');
  assert.match(btcWallpaper, /^https:\/\/images\.unsplash\.com\//);

  const ethWallpaper = extractCryptoArticleImage({ title: 'Ethereum Layer 2 scaling' }, 'Ethereum');
  assert.match(ethWallpaper, /^https:\/\/images\.unsplash\.com\//);
});

