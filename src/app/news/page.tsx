/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { Sparkles as Sparkle, ExternalLink as ArrowSquareOut, Search as MagnifyingGlass, BookOpen, Clock, Calendar as CalendarBlank, CircleCheck as CheckCircle, Send as PaperPlaneTilt, RefreshCw as ArrowsClockwise, TrendingUp as TrendUp, TrendingDown as TrendDown, Newspaper, Flame as Fire, Bitcoin as CurrencyBtc, Coins as CurrencyEth, Coins, Globe, Radio as Broadcast, Tag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cryptoNewsApi } from "@/lib/api";
import {
  normalizeCryptoPriceMap,
  extractCryptoArticleImage,
  formatNewsDate,
  formatNewsTimeAgo,
} from "@/lib/crypto-news-contract";
import type {
  CryptoNewsArticle,
  FearGreedIndexData,
} from "@/types";

type NewsCategory = { label: string; coin?: string; filter?: string };

export default function NewsPage() {
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();

  const [categories, setCategories] = useState<NewsCategory[]>([{ label: 'All News' }]);
  const [selectedCategory, setSelectedCategory] = useState('All News');
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Live Crypto News & Market State
  const [articles, setArticles] = useState<CryptoNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fearGreed, setFearGreed] = useState<FearGreedIndexData | null>(null);
  const [prices, setPrices] = useState<Record<string, { usd: number; change24h?: number }>>({});
  const [, setLastRefreshed] = useState<Date>(new Date());

  // Fetch Live Crypto News & Market Data from backend API proxy
  const loadCryptoNews = useCallback(async (coinSymbol?: string, categoryFilter?: string, searchQ?: string) => {
    setLoading(true);
    try {
      if (searchQ && searchQ.trim().length > 1) {
        // Full text search via crypto news API
        const searchRes = await cryptoNewsApi.search(searchQ.trim(), 20);
        const searchData = searchRes.data;
        const found = searchData?.results || searchData?.articles || [];
        setArticles(found);
      } else {
        // Fetch news feed with optional coin or category filter
        const params: { limit: number; coin?: string; category?: string } = { limit: 24 };
        if (coinSymbol) {
          params.coin = coinSymbol;
        }
        if (categoryFilter) {
          params.category = categoryFilter;
        }
        const newsRes = await cryptoNewsApi.getNews(params);
        if (newsRes.data && Array.isArray(newsRes.data.articles)) {
          setArticles(newsRes.data.articles);
        } else {
          setArticles([]);
        }
      }
    } catch {
      // If error occurs, clear or retain previous
      setArticles((prev) => prev);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, []);

  // Fetch Market Sentiment & Ticker Prices
  const loadMarketIndicators = useCallback(async () => {
    try {
      const fgRes = await cryptoNewsApi.getFearGreed();
      if (fgRes.data && typeof fgRes.data.value === "number") {
        setFearGreed(fgRes.data);
      }
    } catch {}

    try {
      const pricesRes = await cryptoNewsApi.getPrices("bitcoin,ethereum,solana,polygon,tether");
      if (pricesRes.data && typeof pricesRes.data === "object") {
        const parsed = normalizeCryptoPriceMap(pricesRes.data);
        if (Object.keys(parsed).length > 0) {
          setPrices(parsed);
        }
      }
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    let ignore = false;

    async function initFeed() {
      try {
        const [newsRes, fgRes, pricesRes, catRes] = await Promise.allSettled([
          cryptoNewsApi.getNews({ limit: 24 }),
          cryptoNewsApi.getFearGreed(),
          cryptoNewsApi.getPrices("bitcoin,ethereum,solana,polygon,tether"),
          cryptoNewsApi.getCategories(),
        ]);

        if (ignore) return;

        if (newsRes.status === "fulfilled" && newsRes.value.data?.articles && Array.isArray(newsRes.value.data.articles)) {
          setArticles(newsRes.value.data.articles);
        } else {
          setArticles([]);
        }

        if (fgRes.status === "fulfilled" && fgRes.value.data && typeof fgRes.value.data.value === "number") {
          setFearGreed(fgRes.value.data);
        }

        if (pricesRes.status === "fulfilled" && pricesRes.value.data && typeof pricesRes.value.data === "object") {
          const parsed = normalizeCryptoPriceMap(pricesRes.value.data);
          if (Object.keys(parsed).length > 0) {
            setPrices(parsed);
          }
        }

        if (catRes.status === "fulfilled" && Array.isArray(catRes.value.data?.categories) && catRes.value.data.categories.length > 0) {
          setCategories(catRes.value.data.categories);
        }
      } catch {
        if (!ignore) {
          setArticles([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setLastRefreshed(new Date());
        }
      }
    }

    initFeed();

    return () => {
      ignore = true;
    };
  }, []);

  // Handle Category selection
  const handleSelectCategory = (catObj: NewsCategory) => {
    setSelectedCategory(catObj.label);
    setSearchQuery("");
    startTransition(() => {
      loadCryptoNews(catObj.coin, catObj.filter);
    });
  };

  // Handle Search submit / debounce
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadCryptoNews(undefined, searchQuery.trim());
    } else {
      loadCryptoNews();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadCryptoNews();
  };

  // Filtered articles list based on client-side search fallback if already loaded
  const displayArticles: CryptoNewsArticle[] = articles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      art.title?.toLowerCase().includes(q) ||
      art.summary?.toLowerCase().includes(q) ||
      art.description?.toLowerCase().includes(q) ||
      art.source?.toLowerCase().includes(q) ||
      art.category?.toLowerCase().includes(q)
    );
  });

  const featuredArticle = displayArticles[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput("");
    }
  };

  const getFearGreedColor = (val: number) => {
    if (val >= 75) return "bg-success text-success-foreground border-success";
    if (val >= 55) return "bg-success-subtle text-success border-success-border";
    if (val >= 45) return "bg-warning-subtle text-warning border-warning-border";
    return "bg-destructive text-destructive-foreground border-destructive";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero Section */}
        <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-10 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Broadcast className="size-3.5" fill="currentColor" />
              <span>Live Cryptocurrency News Feed</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground break-words">
              Real-Time Crypto News & <br className="hidden sm:inline" />
              <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
                Market Intelligence.
              </span>
            </h1>

            <p className="mt-3 sm:mt-4 text-xs sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed break-words">
              Breaking headlines, market trends, token movements, and blockchain ecosystem updates aggregated live from 300+ trusted global crypto sources.
            </p>

            {/* Live Crypto Market Sentiment & Price Bar */}
            <div className="mt-8 mx-auto max-w-4xl p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-md shadow-black/5 flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Fear & Greed Indicator */}
              {fearGreed && typeof fearGreed.value === "number" && (
                <div className="flex items-center gap-2.5">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Fire className="size-4 text-warning" fill="currentColor" />
                    Market Sentiment:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold border text-2xs ${getFearGreedColor(
                      fearGreed.value
                    )}`}
                  >
                    {fearGreed.value} / 100 • {fearGreed.classification || fearGreed.value_classification || "Active"}
                  </span>
                </div>
              )}

              {/* Real-time Crypto Price Badges */}
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground font-medium">
                {prices.bitcoin && (
                  <div className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border/60">
                    <CurrencyBtc className="size-3.5 text-warning" strokeWidth={2.5} />
                    <span className="text-foreground font-bold">
                      ${prices.bitcoin.usd.toLocaleString()}
                    </span>
                    {prices.bitcoin.change24h !== undefined && (
                      <span
                        className={`text-2xs font-semibold flex items-center ${
                          prices.bitcoin.change24h >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {prices.bitcoin.change24h >= 0 ? (
                          <TrendUp className="size-3" />
                        ) : (
                          <TrendDown className="size-3" />
                        )}
                        {Math.abs(prices.bitcoin.change24h).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}

                {prices.ethereum && (
                  <div className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border/60">
                    <CurrencyEth className="size-3.5 text-info" strokeWidth={2.5} />
                    <span className="text-foreground font-bold">
                      ${prices.ethereum.usd.toLocaleString()}
                    </span>
                    {prices.ethereum.change24h !== undefined && (
                      <span
                        className={`text-2xs font-semibold flex items-center ${
                          prices.ethereum.change24h >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {prices.ethereum.change24h >= 0 ? (
                          <TrendUp className="size-3" />
                        ) : (
                          <TrendDown className="size-3" />
                        )}
                        {Math.abs(prices.ethereum.change24h).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}

                {prices.solana && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border border-border/60">
                    <Coins className="size-3.5 text-info" strokeWidth={2.5} />
                    <span className="text-foreground font-bold">
                      ${prices.solana.usd.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Refresh / Live Sync Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const active = categories.find((c) => c.label === selectedCategory);
                    loadCryptoNews(active?.coin, active?.filter, searchQuery);
                    loadMarketIndicators();
                  }}
                  disabled={loading}
                  title="Refresh Live Crypto News Feed"
                  className="inline-flex items-center gap-1 text-2xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20"
                >
                  <ArrowsClockwise
                    className={`size-3.5 ${loading ? "animate-spin" : ""}`}
                    strokeWidth={2.5}
                  />
                  <span>{loading ? "Syncing..." : "Live Feed"}</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mt-8 max-w-md mx-auto relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Bitcoin, Ethereum, DeFi, ETF..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-11 pr-16 py-3 rounded-full bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs text-foreground placeholder:text-muted-foreground transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Category & News Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.label
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {cat.label.includes("BTC") && <CurrencyBtc className="size-3.5 text-warning" strokeWidth={2.5} />}
                  {cat.label.includes("ETH") && <CurrencyEth className="size-3.5 text-info" strokeWidth={2.5} />}
                  {cat.label.includes("SOL") && <Coins className="size-3.5 text-info" strokeWidth={2.5} />}
                  {cat.label === "All News" && <Broadcast className="size-3.5 text-destructive" strokeWidth={2.5} />}
                  {cat.coin && !cat.label.includes("BTC") && !cat.label.includes("ETH") && !cat.label.includes("SOL") && (
                    <Coins className="size-3.5 text-success" strokeWidth={2.5} />
                  )}
                  {cat.filter && !cat.coin && <Sparkle className="size-3.5 text-info" strokeWidth={2.5} />}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Loading Skeleton */}
        {loading && articles.length === 0 && (
          <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-card border border-border/60 p-4 space-y-4">
                  <div className="aspect-[16/10] bg-muted rounded-2xl" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Big Story Card */}
        {!loading && featuredArticle && !searchQuery && (
          <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-16">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl bg-card border border-border/80 shadow-lg shadow-black/5 overflow-hidden group hover:border-primary/50 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              {/* Image Banner */}
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-muted">
                <img
                  src={extractCryptoArticleImage(featuredArticle, featuredArticle.category)}
                  alt={featuredArticle.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80";
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md flex items-center gap-1">
                    <Broadcast className="size-3.5 animate-pulse" fill="currentColor" />
                    Breaking News
                  </span>
                </div>
              </div>

              {/* Content Panel */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold flex items-center gap-1">
                      <Tag className="size-3" strokeWidth={2.5} />
                      {featuredArticle.category || "Crypto"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatNewsTimeAgo(featuredArticle)}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                    {featuredArticle.title}
                  </h2>

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {featuredArticle.summary || featuredArticle.description || "Read full coverage and market analysis from the original news publisher."}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      <Newspaper className="size-4" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {featuredArticle.source || "Crypto Feed"}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        {formatNewsDate(featuredArticle)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={featuredArticle.link || featuredArticle.url || "https://cryptocurrency.cv"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 py-2 hover:bg-primary/90 transition-all shadow-xs"
                  >
                    Read Full Story
                    <ArrowSquareOut className="size-3.5" strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Live News Grid */}
        <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span>{selectedCategory}</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  ({displayArticles.length})
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time updates powered by the FreelanceXchain Crypto News Proxy.
              </p>
            </div>

            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowsClockwise className="size-3.5 animate-spin text-primary" strokeWidth={2.5} />
                <span>Updating live feed...</span>
              </div>
            )}
          </div>

          {!loading && displayArticles.length === 0 ? (
            <div className="text-center py-20 rounded-3xl bg-card border border-border/80 p-8">
              <BookOpen className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-bold text-foreground">No news articles found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching for another token or resetting the filters.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full text-xs font-bold cursor-pointer"
                onClick={() => {
                  setSelectedCategory("All News");
                  setSearchQuery("");
                  loadCryptoNews();
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {displayArticles.map((article, idx) => {
                const imageUrl = extractCryptoArticleImage(article, article.category);

                return (
                  <motion.article
                    key={article.id || article.link || `art-${idx}`}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4) }}
                    className="rounded-3xl bg-card border border-border/80 shadow-md shadow-black/5 overflow-hidden flex flex-col justify-between group hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                  >
                    <div>
                      {/* Card Thumbnail */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={imageUrl}
                          alt={article.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80";
                          }}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-card/95 backdrop-blur-md text-foreground text-2xs font-bold border border-border/60 shadow-xs flex items-center gap-1">
                            <Globe className="size-3 text-primary" strokeWidth={2.5} />
                            {article.category || "Crypto"}
                          </span>
                        </div>

                        {article.sentiment && (
                          <div className="absolute top-3 right-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-2xs font-bold backdrop-blur-md shadow-xs ${
                                article.sentiment.toLowerCase() === "positive"
                                  ? "bg-success text-success-foreground"
                                  : article.sentiment.toLowerCase() === "negative"
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-card/90 text-foreground border border-border/60"
                              }`}
                            >
                              {article.sentiment.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-2xs text-muted-foreground mb-2.5">
                          <span className="flex items-center gap-1">
                            <CalendarBlank className="size-3" />
                            {formatNewsDate(article)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatNewsTimeAgo(article)}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>

                        <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {article.summary || article.description || "Read the latest cryptocurrency market update and source coverage."}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 pt-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xs">
                          <Newspaper className="size-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                          {article.source || "Crypto Feed"}
                        </span>
                      </div>

                      <a
                        href={article.link || article.url || "https://cryptocurrency.cv"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-3"
                      >
                        Read Story <ArrowSquareOut className="size-3" strokeWidth={2.5} />
                      </a>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* Newsletter & Dispatch Subscription Banner */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-bold mb-4 backdrop-blur-xs">
                <Sparkle className="size-3.5 fill-primary-foreground" fill="currentColor" />
                <span>FreelanceXchain Crypto Wire</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-primary-foreground">
                Get real-time market alpha & breaking news.
              </h3>

              <p className="mt-3 text-sm sm:text-base text-primary-foreground/80 leading-relaxed">
                Receive weekly breakdowns of market shifts, token movements, and decentralized economy trends directly in your inbox.
              </p>

              {subscribed ? (
                <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary-foreground text-primary font-bold text-sm shadow-md">
                  <CheckCircle className="size-5 text-success" fill="currentColor" />
                  <span>You are subscribed to the Crypto Wire!</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-5 py-3 rounded-full bg-primary-foreground text-primary text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 dark:focus:ring-primary/60 shadow-md"
                  />
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs font-bold shrink-0 shadow-md cursor-pointer"
                  >
                    Subscribe Free
                    <PaperPlaneTilt className="size-3.5 ml-1.5" strokeWidth={2.5} />
                  </Button>
                </form>
              )}

              <p className="mt-3 text-2xs text-primary-foreground/60">
                Zero spam. One-click unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
