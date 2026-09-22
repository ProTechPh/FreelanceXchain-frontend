"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Globe } from 'lucide-react';

interface EcosystemItem {
  name: string;
  category: string;
  icon: React.ReactNode;
}

import {
  EthereumIcon,
  PolygonIcon,
  ArbitrumIcon,
  OptimismIcon,
  BaseIcon,
  SolanaIcon,
  UsdcIcon,
  UsdtIcon,
  DiditIcon,
  MetaMaskIcon,
  WalletConnectIcon,
  IpfsIcon,
  SupabaseIcon,
  OpenAiIcon,
  NextJsIcon,
  TypeScriptIcon,
  ChainlinkIcon,
  SolidityIcon,
  StripeIcon,
} from "./ecosystem-icons";

// 7 columns of Web3 protocols, wallets, chains and tools
const baseColumns: EcosystemItem[][] = [
  // Col 0: 2 items
  [
    { name: "Base L2", category: "Network", icon: <BaseIcon /> },
    { name: "IPFS / Filecoin", category: "Storage", icon: <IpfsIcon /> },
    { name: "Supabase", category: "Database", icon: <SupabaseIcon /> },
  ],
  // Col 1: 3 items
  [
    { name: "Arbitrum", category: "Rollup", icon: <ArbitrumIcon /> },
    { name: "USDC", category: "Escrow Asset", icon: <UsdcIcon /> },
    { name: "Didit KYC", category: "Identity", icon: <DiditIcon /> },
    { name: "Polygon", category: "EVM Chain", icon: <PolygonIcon /> },
  ],
  // Col 2: 4 items
  [
    { name: "Polygon", category: "EVM Chain", icon: <PolygonIcon /> },
    { name: "MetaMask", category: "Web3 Wallet", icon: <MetaMaskIcon /> },
    { name: "TypeScript", category: "Dev Stack", icon: <TypeScriptIcon /> },
    { name: "OpenAI", category: "AI Assistant", icon: <OpenAiIcon /> },
  ],
  // Col 3: 5 items (Peak)
  [
    { name: "Ethereum", category: "Core Escrow", icon: <EthereumIcon /> },
    { name: "Solidity", category: "Smart Contracts", icon: <SolidityIcon /> },
    { name: "WalletConnect", category: "Multi-Wallet", icon: <WalletConnectIcon /> },
    { name: "Next.js", category: "Frontend Engine", icon: <NextJsIcon /> },
    { name: "Chainlink", category: "Oracles", icon: <ChainlinkIcon /> },
  ],
  // Col 4: 4 items
  [
    { name: "Optimism", category: "OP Stack", icon: <OptimismIcon /> },
    { name: "Tether USDT", category: "Stablecoin", icon: <UsdtIcon /> },
    { name: "Stripe", category: "Fiat Onramp", icon: <StripeIcon /> },
    { name: "MetaMask", category: "Web3 Wallet", icon: <MetaMaskIcon /> },
  ],
  // Col 5: 3 items
  [
    { name: "Solana", category: "High Speed", icon: <SolanaIcon /> },
    { name: "Didit KYC", category: "Identity", icon: <DiditIcon /> },
    { name: "Arbitrum", category: "Rollup", icon: <ArbitrumIcon /> },
    { name: "USDC", category: "Escrow Asset", icon: <UsdcIcon /> },
  ],
  // Col 6: 2 items
  [
    { name: "Base L2", category: "Network", icon: <BaseIcon /> },
    { name: "IPFS / Filecoin", category: "Storage", icon: <IpfsIcon /> },
    { name: "Supabase", category: "Database", icon: <SupabaseIcon /> },
  ],
];

// Single animated column component that smoothly scrolls up or down infinitely without any scrollbar
function AnimatedColumn({
  items,
  direction = "up",
  duration = 20,
  className = "",
}: {
  items: EcosystemItem[];
  direction?: "up" | "down";
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  // Quadruple the items to ensure seamless infinite looping
  const duplicated = [...items, ...items, ...items, ...items];

  const itemHeight = 84; // icon height + gap
  const totalShift = items.length * itemHeight;

  return (
    <div
      className={`relative overflow-hidden h-[300px] sm:h-[400px] md:h-[460px] w-12 sm:w-16 md:w-20 shrink-0 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <motion.div
        aria-hidden="true"
        animate={
          reduce || paused
            ? undefined
            : direction === "up"
            ? { y: [0, -totalShift] }
            : { y: [-totalShift, 0] }
        }
        transition={{
          y: {
            repeat: Infinity,
            repeatType: "loop",
            duration: duration,
            ease: "linear",
          },
        }}
        className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5"
      >
        {duplicated.map((item, idx) => (
          <motion.div
            key={`${item.name}-${idx}`}
            whileHover={{ scale: reduce ? 1 : 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            title={item.name}
            className="group relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md shadow-black/5 hover:border-primary/60 hover:shadow-xl flex items-center justify-center p-2.5 sm:p-3.5 transition-all duration-200 shrink-0"
          >
            <div className="w-full h-full flex items-center justify-center pointer-events-none">
              {item.icon}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function EcosystemShowcase() {
  const reduce = useReducedMotion();

  // Column speed and direction configuration
  const colConfigs = [
    { direction: "up" as const, duration: 22 },
    { direction: "down" as const, duration: 26 },
    { direction: "up" as const, duration: 19 },
    { direction: "down" as const, duration: 24 }, // Center peak
    { direction: "up" as const, duration: 20 },
    { direction: "down" as const, duration: 25 },
    { direction: "up" as const, duration: 23 },
  ];

  return (
    <section
      id="ecosystem"
      className="py-20 sm:py-28 bg-background overflow-hidden border-b border-border/40 relative scroll-mt-[5.5rem]"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center mb-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
            <Globe className="size-3.5" strokeWidth={2.5} />
            <span>Supported Chains & Web3 Integrations</span>
          </div>

          {/* Two-tone headline */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground break-words">
            Top Web3 Chains & Integrations, <br className="hidden sm:inline" />
            <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
              all in one marketplace.
            </span>
          </h2>

          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed break-words">
            Connect your wallet, verify your identity with Didit KYC, and execute milestone escrow contracts seamlessly across leading Layer 1 and Layer 2 networks.
          </p>
        </motion.div>
      </div>

      {/* Infinite Scrolling Honeycomb / Diamond Icon Cloud (Zero Scrollbar with Gradient Fade Masks) */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 relative">
        {/* Top and Bottom Gradient Fade Masks for seamless cycling */}
        <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-14 sm:h-16 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-14 sm:h-16 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

        {/* Outer Left & Right Fade Masks */}
        <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div aria-hidden="true" className="absolute top-0 bottom-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

        {/* Screen-reader-only static list — a single clean pass of every unique item. */}
        <ul className="sr-only" aria-label="Ecosystem integrations">
          {Array.from(new Map(baseColumns.flat().map((item) => [item.name, item])).values()).map((item) => (
            <li key={item.name}>
              {item.name} — {item.category}
            </li>
          ))}
        </ul>

        {/* Multi-Column Animated Container - aria-hidden so AT uses the static list above */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-2 sm:gap-4 md:gap-5 overflow-hidden py-2"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
        >
          {baseColumns.map((col, idx) => {
            // Mobile (< 640px): 3 center columns (idx 2, 3, 4)
            // Tablet (640px-1024px): 5 columns (idx 1, 2, 3, 4, 5)
            // Desktop (>= 1024px): All 7 columns
            const visibilityClass =
              idx === 0 || idx === 6
                ? "hidden lg:block"
                : idx === 1 || idx === 5
                ? "hidden sm:block"
                : "block";

            return (
              <AnimatedColumn
                key={`col-${idx}`}
                items={col}
                direction={colConfigs[idx]?.direction || "up"}
                duration={colConfigs[idx]?.duration || 22}
                className={visibilityClass}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
