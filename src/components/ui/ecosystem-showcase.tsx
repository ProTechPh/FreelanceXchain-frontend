"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Globe } from "@phosphor-icons/react";

interface EcosystemItem {
  name: string;
  category: string;
  icon: React.ReactNode;
}

// Crisp Web3, Chain & Dev Icons
const EthereumIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 784.37 1277.39">
    <path fill="#627EEA" d="M392.07 0L383.5 29.11V874.74L392.07 883.35L784.13 651.54L392.07 0Z" />
    <path fill="#8A92B2" d="M392.07 0L0 651.54L392.07 883.35V472.33V0Z" />
    <path fill="#627EEA" d="M392.07 956.52L387.24 962.41V1263.28L392.07 1277.38L784.37 724.89L392.07 956.52Z" />
    <path fill="#8A92B2" d="M392.07 1277.38V956.52L0 724.89L392.07 1277.38Z" />
    <path fill="#454A75" d="M392.07 883.35L784.13 651.54L392.07 472.33V883.35Z" />
    <path fill="#8A92B2" d="M0 651.54L392.07 883.35V472.33L0 651.54Z" />
  </svg>
);

const PolygonIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 38.4 33.5" fill="none">
    <path
      d="M28.7 13.1c-1.6 0-3 0.9-3.8 2.2l-4.7-2.7c0.1-0.5 0.1-0.9 0.1-1.4 0-3.2-2.6-5.8-5.8-5.8s-5.8 2.6-5.8 5.8c0 0.5 0.1 0.9 0.1 1.4L4.1 15.3C3.3 14 1.9 13.1 0.3 13.1c-0.2 0-0.3 0-0.3 0v7.3c0.3 0 0.5 0 0.8 0 1.6 0 3-0.9 3.8-2.2l4.7 2.7c-0.1 0.5-0.1 0.9-0.1 1.4 0 3.2 2.6 5.8 5.8 5.8s5.8-2.6 5.8-5.8c0-0.5-0.1-0.9-0.1-1.4l4.7-2.7c0.8 1.3 2.2 2.2 3.8 2.2 0.3 0 0.5 0 0.8 0v-7.3c-0.3 0-0.6 0-0.8 0z"
      fill="#8247E5"
    />
  </svg>
);

const ArbitrumIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 19.5H22L12 2Z" fill="#28A0F0" opacity="0.15" />
    <path d="M12 4.5L4.5 17.5H19.5L12 4.5Z" fill="#28A0F0" />
    <path d="M12 9.5L8.5 15.5H15.5L12 9.5Z" fill="#FFFFFF" />
  </svg>
);

const OptimismIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#FF0420" />
    <path
      d="M10.8 21.5c-2.8 0-4.6-2.1-4.6-5.5s1.8-5.5 4.6-5.5c2.8 0 4.6 2.1 4.6 5.5s-1.8 5.5-4.6 5.5zm0-2.6c1.3 0 2-1.2 2-2.9s-.7-2.9-2-2.9-2 1.2-2 2.9.7 2.9 2 2.9zm10.4 2.6h-2.5v-11h4.4c2.5 0 4.1 1.4 4.1 3.7 0 2.3-1.6 3.7-4.1 3.7h-1.9v3.6zm0-6.1h1.7c1.1 0 1.8-.6 1.8-1.6s-.7-1.6-1.8-1.6h-1.7v3.2z"
      fill="#FFFFFF"
    />
  </svg>
);

const BaseIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#0052FF" />
    <circle cx="16" cy="16" r="8" fill="#FFFFFF" />
    <path d="M16 11V21" stroke="#0052FF" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const SolanaIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 397.7 311.7">
    <linearGradient id="solGrad" x1="363.9" y1="300.7" x2="62.4" y2="-1.7" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#00FFA3" />
      <stop offset="1" stopColor="#DC1FFF" />
    </linearGradient>
    <path
      d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67 1.4 70.3 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zm268.5 115.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
      fill="url(#solGrad)"
    />
  </svg>
);

const UsdcIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#2775CA" />
    <path
      d="M17.5 7.5c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm.1 13.9c-2.4 0-3.9-.9-4.7-2.1l1.4-1.1c.6.9 1.8 1.6 3.2 1.6 1.6 0 2.6-.7 2.6-1.8 0-1.1-.9-1.5-2.7-1.9-2.3-.5-3.9-1.2-3.9-3.3 0-1.7 1.4-3.1 3.7-3.3V8h1.6v1.4c2 .2 3.3.9 4.1 1.9l-1.3 1.1c-.6-.7-1.6-1.3-2.8-1.3-1.4 0-2.3.7-2.3 1.6 0 1 .8 1.4 2.5 1.8 2.5.6 4.1 1.3 4.1 3.5-.1 1.9-1.5 3.3-3.9 3.5v1.4h-1.6v-1.5z"
      fill="#FFFFFF"
    />
  </svg>
);

const UsdtIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      d="M17.9 16.3c-.1 0-1.2.1-1.9.1s-1.8 0-1.9-.1c-3.1-.1-5.4-.7-5.4-1.4s2.3-1.3 5.4-1.4v2.3c.2 0 1.2.1 1.9.1.7 0 1.7 0 1.9-.1v-2.3c3.1.1 5.4.7 5.4 1.4s-2.3 1.3-5.4 1.4zm0-3.3V11h4.8V8H9.3v3h4.8v2c-3.6.1-6.4.9-6.4 1.9s2.8 1.8 6.4 1.9v6.5h3.8v-6.5c3.6-.1 6.4-.9 6.4-1.9s-2.8-1.8-6.4-1.9z"
      fill="#FFFFFF"
    />
  </svg>
);

const DiditIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#0F4C3D" />
    <path
      d="M16 6L9 9.5V15.5C9 20.3 12 24.7 16 26C20 24.7 23 20.3 23 15.5V9.5L16 6Z"
      fill="#10B981"
      opacity="0.25"
    />
    <path
      d="M16 7L10 10.2V15.5C10 19.8 12.6 23.8 16 25C19.4 23.8 22 19.8 22 15.5V10.2L16 7Z"
      stroke="#10B981"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M13.5 15.5L15.5 17.5L19 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MetaMaskIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F6851B" />
    <path d="M24 10L16 6L8 10L10 16L8 22L16 26L24 22L22 16L24 10Z" fill="#E2761B" />
    <path d="M16 6L16 18L10 16L8 10L16 6Z" fill="#E4761B" />
    <path d="M16 6L16 18L22 16L24 10L16 6Z" fill="#D7C1B3" />
    <path d="M12 18L16 26L20 18L16 19L12 18Z" fill="#233447" />
  </svg>
);

const WalletConnectIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#3B99FC" />
    <path
      d="M9.5 13.5C13.1 9.9 18.9 9.9 22.5 13.5L23 14L21 16L20.5 15.5C18 13 14 13 11.5 15.5L9.5 13.5ZM24.5 15.5L26.5 17.5L20.5 23.5L17.5 20.5L16 22L14.5 20.5L11.5 23.5L5.5 17.5L7.5 15.5L11.5 19.5L14.5 16.5L16 18L17.5 16.5L20.5 19.5L24.5 15.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

const IpfsIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#6ACAD1" />
    <path d="M16 6L24 10.5V21.5L16 26L8 21.5V10.5L16 6Z" fill="#043A4E" />
    <path d="M16 6V16M16 16L24 21.5M16 16L8 21.5" stroke="#6ACAD1" strokeWidth="1.5" />
  </svg>
);

const SupabaseIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#1C1C1C" />
    <path
      d="M17.5 7L7 20H15.5L14.5 25L25 12H16.5L17.5 7Z"
      fill="#3ECF8E"
    />
  </svg>
);

const OpenAiIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#10A37F" />
    <path
      d="M23.5 14.8C23.3 12.8 21.8 11.2 19.9 10.8C19.5 9.4 18.2 8.3 16.7 8.1C15 7.9 13.4 8.7 12.6 10.2C11 10.6 9.8 11.9 9.6 13.6C8.8 14.8 8.8 16.4 9.4 17.7C9.2 19.7 10.7 21.3 12.6 21.7C13 23.1 14.3 24.2 15.8 24.4C17.5 24.6 19.1 23.8 19.9 22.3C21.5 21.9 22.7 20.6 22.9 18.9C23.7 17.7 23.7 16.1 23.5 14.8Z"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const NextJsIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#000000" />
    <path d="M10 10V22M10 10L21 22M21 10V18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TypeScriptIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#3178C6" />
    <path
      d="M10 14H16M13 14V22M18 19.5C18.5 20.5 19.5 21 20.8 21C22 21 23 20.3 23 19.2C23 18 22 17.5 20.5 17C18.8 16.4 18 15.7 18 14.5C18 13.3 19.2 12.5 20.7 12.5C22 12.5 22.8 13 23.3 14M23.3 14L22 15"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ChainlinkIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#375BD2" />
    <path
      d="M16 7L23 11V19L16 23L9 19V11L16 7Z"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M16 12L19.5 14V18L16 20L12.5 18V14L16 12Z" fill="#FFFFFF" />
  </svg>
);

const SolidityIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#24292E" />
    <path d="M16 8L22 14L19 17L13 11L16 8Z" fill="#656565" />
    <path d="M10 14L16 20L13 23L7 17L10 14Z" fill="#808080" />
    <path d="M16 14L22 20L19 23L13 17L16 14Z" fill="#B0B0B0" />
  </svg>
);

const StripeIcon = () => (
  <svg className="w-7 h-7 sm:w-9 sm:h-9" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#635BFF" />
    <path
      d="M15.5 13.5C14.8 13.2 13.8 12.9 13.8 12.2C13.8 11.6 14.4 11.2 15.3 11.2C16.4 11.2 17.5 11.7 18.2 12.1L19 9.8C18.1 9.4 16.8 9 15.3 9C12.7 9 11 10.4 11 12.6C11 15.8 15.5 15.3 15.5 16.8C15.5 17.5 14.8 17.9 13.8 17.9C12.4 17.9 11.1 17.3 10.2 16.7L9.4 19.1C10.5 19.7 12.1 20.2 13.8 20.2C16.6 20.2 18.4 18.7 18.4 16.4C18.4 13.1 13.9 13.7 15.5 13.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

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
}: {
  items: EcosystemItem[];
  direction?: "up" | "down";
  duration?: number;
}) {
  const reduce = useReducedMotion();
  // Triple the items to ensure seamless infinite looping
  const duplicated = [...items, ...items, ...items, ...items];

  const itemHeight = 84; // icon height + gap
  const totalShift = items.length * itemHeight;

  return (
    <div className="relative overflow-hidden h-[340px] sm:h-[400px] md:h-[460px] w-14 sm:w-18 md:w-20 shrink-0">
      <motion.div
        animate={
          reduce
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
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            aria-label={item.name}
            title={item.name}
            role="img"
            className="group relative w-13 h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md shadow-black/5 hover:border-primary/60 hover:shadow-xl flex items-center justify-center p-2.5 sm:p-3.5 transition-all duration-200 cursor-pointer shrink-0"
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
      className="py-20 sm:py-28 bg-background overflow-hidden border-b border-border/40 relative scroll-mt-20"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-6 lg:px-8 text-center mb-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
            <Globe className="size-3.5" weight="bold" />
            <span>Supported Chains & Web3 Integrations</span>
          </div>

          {/* Two-tone headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            Top Web3 Chains & Integrations, <br />
            <span className="text-[#717680] dark:text-muted-foreground font-semibold">
              all in one marketplace.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect your wallet, verify your identity with Didit KYC, and execute milestone escrow contracts seamlessly across leading Layer 1 and Layer 2 networks.
          </p>
        </motion.div>
      </div>

      {/* Infinite Scrolling Honeycomb / Diamond Icon Cloud (Zero Scrollbar with Gradient Fade Masks) */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative">
        {/* Top and Bottom Gradient Fade Masks for seamless cycling */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

        {/* Outer Left & Right Fade Masks */}
        <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

        {/* Multi-Column Animated Container - Completely hidden scrollbar */}
        <div
          className="flex items-center justify-center gap-2.5 sm:gap-4 md:gap-5 overflow-hidden py-2"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
        >
          {baseColumns.map((col, idx) => (
            <AnimatedColumn
              key={`col-${idx}`}
              items={col}
              direction={colConfigs[idx]?.direction || "up"}
              duration={colConfigs[idx]?.duration || 22}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
