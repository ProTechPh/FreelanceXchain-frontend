"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/ui/navbar";
import { FooterSection } from "@/components/ui/footer-section";
import {
  Sparkle,
  ArrowRight,
  MagnifyingGlass,
  BookOpen,
  Clock,
  CalendarBlank,
  CheckCircle,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: "Smart Escrow" | "AI Proposals" | "Reputation & KYC" | "Freelance Growth" | "Web3 Protocols";
  readTime: string;
  publishedDate: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  image: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "How Smart Contract Escrow Eliminates Unpaid Invoices & Payment Delays Forever",
    slug: "smart-contract-escrow-eliminates-unpaid-invoices",
    summary:
      "Traditional freelancing loses billions annually to ghosted clients and payment hold-ups. Discover how milestone funds locked in Ethereum smart contracts guarantee automatic release upon deliverable approval.",
    category: "Smart Escrow",
    readTime: "5 min read",
    publishedDate: "Aug 24, 2026",
    author: {
      name: "Alex Mercer",
      role: "Core Protocol Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80",
    featured: true,
  },
  {
    id: "post-2",
    title: "AI Proposal Engineering: How to Win High-Ticket Client Contracts in Seconds",
    slug: "ai-proposal-engineering-guide",
    summary:
      "Stop spending 4 hours writing generic cover letters. Learn how AI skill-matching analyzes employer requirements, matches your verified portfolio, and creates tailored milestone estimates.",
    category: "AI Proposals",
    readTime: "4 min read",
    publishedDate: "Aug 20, 2026",
    author: {
      name: "Elena Rostova",
      role: "AI Lead & UX Specialist",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "post-3",
    title: "Building Portable On-Chain Reputation with Global Didit KYC Verification",
    slug: "portable-on-chain-reputation-didit-kyc",
    summary:
      "Why should you lose your 5-star ratings if a legacy platform shuts down your account? Discover how portable on-chain work history gives freelancers permanent proof of expertise.",
    category: "Reputation & KYC",
    readTime: "6 min read",
    publishedDate: "Aug 18, 2026",
    author: {
      name: "Marcus Vance",
      role: "Identity & Security Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "post-4",
    title: "Comparing Web2 Take Rates (20%) vs. Decentralized Smart Contract Marketplaces",
    slug: "web2-fees-vs-decentralized-marketplace",
    summary:
      "A deep dive into fee structures: Upwork and Fiverr charge up to 20% on every payment plus withdrawal fees. See how decentralized escrow keeps maximum earnings in freelancers' pockets.",
    category: "Freelance Growth",
    readTime: "7 min read",
    publishedDate: "Aug 14, 2026",
    author: {
      name: "Sophia Chen",
      role: "Economics & Growth",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "post-5",
    title: "Milestone Contract Workspaces: Delivering Code with Zero Dispute Friction",
    slug: "milestone-contract-workspaces-guide",
    summary:
      "How structured milestone scopes, real-time workspace messaging, and transparent revision workflows protect both clients and engineers from scope creep and misunderstanding.",
    category: "Web3 Protocols",
    readTime: "5 min read",
    publishedDate: "Aug 10, 2026",
    author: {
      name: "Devon Thorne",
      role: "Smart Contract Engineer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "post-6",
    title: "Multi-Currency Escrow: Getting Paid in USDC, Ethereum, or Local Fiat Seamlessly",
    slug: "multi-currency-escrow-usdc-eth-fiat",
    summary:
      "Whether you prefer stable digital currencies like USDC, native Ethereum, or instant bank on-ramps via Stripe, explore how FreelanceXchain supports frictionless global settlement.",
    category: "Smart Escrow",
    readTime: "4 min read",
    publishedDate: "Aug 05, 2026",
    author: {
      name: "Alex Mercer",
      role: "Core Protocol Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = [
  "All Articles",
  "Smart Escrow",
  "AI Proposals",
  "Reputation & KYC",
  "Freelance Growth",
  "Web3 Protocols",
];

export default function BlogPage() {
  const reduce = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState("All Articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === "All Articles" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero Section */}
        <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-16 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <Sparkle className="size-3.5 fill-primary" weight="fill" />
              <span>Insights, Guides & Web3 Updates</span>
            </div>

            {/* Two-tone Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              Stories & Insights for the <br className="hidden sm:inline" />
              <span className="text-[#717680] dark:text-muted-foreground font-semibold">
                future of on-chain work.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore deep dives on smart contract escrow, AI proposal generation, Didit identity verification, and strategies for thriving in the decentralized freelance economy.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-md mx-auto relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search guides, tutorials & articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Featured Big Story Card */}
        {selectedCategory === "All Articles" && !searchQuery && (
          <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-16">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl bg-card border border-border/80 shadow-lg shadow-black/5 overflow-hidden group hover:border-primary/50 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              {/* Image Banner */}
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                    Featured Guide
                  </span>
                </div>
              </div>

              {/* Content Panel */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                      {featuredPost.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {featuredPost.summary}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      className="w-9 h-9 rounded-full object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {featuredPost.author.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {featuredPost.publishedDate}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 group-hover:translate-x-1 transition-transform"
                  >
                    Read Article
                    <ArrowRight className="size-3.5 ml-1.5" weight="bold" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Articles Grid */}
        <section className="mx-auto max-w-6xl px-6 lg:px-8 mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {selectedCategory === "All Articles" ? "All Articles" : selectedCategory} ({filteredPosts.length})
            </h3>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 rounded-3xl bg-card border border-border/80 p-8">
              <BookOpen className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-bold text-foreground">No articles found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching for another keyword or selecting a different category.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full text-xs font-bold"
                onClick={() => {
                  setSelectedCategory("All Articles");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredPosts.map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="rounded-3xl bg-card border border-border/80 shadow-md shadow-black/5 overflow-hidden flex flex-col justify-between group hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    {/* Card Thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-card/90 backdrop-blur-md text-foreground text-[11px] font-bold border border-border/60 shadow-xs">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2.5">
                        <span className="flex items-center gap-1">
                          <CalendarBlank className="size-3" />
                          {post.publishedDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {post.readTime}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>

                      <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 pt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-7 h-7 rounded-full object-cover border border-border"
                    />
                      <span className="text-xs font-semibold text-foreground">
                        {post.author.name}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-3">
                      Read <ArrowRight className="size-3" weight="bold" />
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter Subscription Banner */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center relative overflow-hidden shadow-xl"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-4 backdrop-blur-xs">
                <Sparkle className="size-3.5 fill-white" weight="fill" />
                <span>FreelanceXchain Dispatch</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Stay ahead in the decentralized freelance revolution.
              </h3>

              <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                Receive weekly breakdowns of top-funded escrow projects, AI proposal templates, and Web3 industry trends directly in your inbox.
              </p>

              {subscribed ? (
                <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-primary font-bold text-sm shadow-md">
                  <CheckCircle className="size-5 text-emerald-600" weight="fill" />
                  <span>You are subscribed! Welcome to the decentralized network.</span>
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
                    className="w-full px-5 py-3 rounded-full bg-white text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50 shadow-md"
                  />
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#181d27] text-white hover:bg-black text-xs font-bold shrink-0 shadow-md cursor-pointer"
                  >
                    Subscribe Free
                    <PaperPlaneTilt className="size-3.5 ml-1.5" weight="bold" />
                  </Button>
                </form>
              )}

              <p className="mt-3 text-[11px] text-white/60">
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
