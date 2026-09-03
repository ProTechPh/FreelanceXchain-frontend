"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Star, Sparkles as Sparkle, CircleCheck as CheckCircle } from 'lucide-react';

const testimonialsRow1 = [
  {
    text: "Smart contract escrow completely eliminated my anxiety about client non-payment. I completed 4 DApp milestones and received $18,000 USDC directly into my wallet with zero delays.",
    name: "Marcus Vance",
    role: "Senior Solidity & Web3 Engineer",
    badge: "Verified Escrow Win",
  },
  {
    text: "As an employer hiring remote engineers across 5 countries, Didit KYC and milestone escrow protect our company budget. We fund escrow upfront and release payouts when code is verified.",
    name: "Elena Rostova",
    role: "Tech Lead @ ChainScale",
    badge: "Verified Employer",
  },
  {
    text: "The AI proposal assistant saved me hours. It analyzed the client scope and created a precise 3-milestone breakdown that won me a $7,500 contract on my very first bid.",
    name: "David Chen",
    role: "Full-Stack React & Next.js Dev",
    badge: "Top Rated",
  },
  {
    text: "No more 20% platform cuts taking thousands from my earnings. FreelanceXchain's transparent fees and portable on-chain reputation let me carry my trust anywhere.",
    name: "Amina Al-Mansoor",
    role: "UI/UX & Brand Designer",
    badge: "Top Earner",
  },
];

const testimonialsRow2 = [
  {
    text: "Having my past deliverables and client reviews recorded on-chain gave new employers instant trust. My proposal acceptance rate skyrocketed.",
    name: "Saman Malik",
    role: "Lead Backend Engineer",
    badge: "On-Chain Record",
  },
  {
    text: "We needed an urgent security audit for our token launch. Found a top-tier auditor through AI Skill Matching, funded the milestone escrow, and had our report in 4 days flat.",
    name: "Kasper Lindqvist",
    role: "Protocol Founder",
    badge: "Verified Employer",
  },
  {
    text: "The dedicated contract workspace with built-in milestone reviews, chat, and automated crypto payouts is miles ahead of legacy freelance platforms.",
    name: "Sofia Benitez",
    role: "AI Workflow Architect",
    badge: "Active Freelancer",
  },
  {
    text: "The dispute process is backed by cryptographic evidence, not an anonymous support bot. I know my work and my funds are 100% protected on every single milestone.",
    name: "Kevin Zhao",
    role: "Smart Contract Auditor",
    badge: "Security Specialist",
  },
];

function TestimonialCard({ t }: { t: (typeof testimonialsRow1)[number] }) {
  return (
    <div className="shrink-0 w-[270px] sm:w-[340px] rounded-2xl border border-border/80 bg-card p-4 sm:p-5 mx-2 shadow-xs hover:border-primary/40 hover:bg-muted/20 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-0.5 shrink-0">
            {[...Array(5)].map((_, j) => (
              <Star
                key={j}
                className="size-3.5 text-warning fill-warning"
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-2xs font-bold text-success bg-success-subtle px-2 py-0.5 rounded-full truncate">
            <CheckCircle className="size-3 shrink-0 text-success fill-success" />
            {t.badge}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-4 break-words">
          &ldquo;{t.text}&rdquo;
        </p>
      </div>

      <div className="pt-2 border-t border-border/40">
        <p className="text-xs sm:text-sm font-bold text-foreground truncate">{t.name}</p>
        <p className="text-2xs text-muted-foreground truncate">{t.role}</p>
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  const reduce = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);
  // Card outer width (including its mx-2) at the current breakpoint; the initial
  // value is the sm+ card so the first frame is not visibly wrong.
  const [step, setStep] = useState(356);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) return;
    const measure = () => {
      const first = node.firstElementChild;
      if (first) setStep(first.getBoundingClientRect().width + 16);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="reviews" className="py-20 sm:py-28 bg-muted/10 overflow-hidden border-b border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Sparkle className="size-3.5 fill-primary" fill="currentColor" />
            <span>Real Results</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight break-words">
            <span className="text-foreground">Real feedback, real contracts: </span> <br className="hidden sm:inline" />
            <span className="text-muted-foreground dark:text-muted-foreground">
              How talent & employers thrive with FreelanceXchain.
            </span>
          </h2>
          <p className="mt-3 text-xs sm:text-base text-muted-foreground max-w-xl mx-auto break-words leading-relaxed">
            See what verified freelancers and hiring companies are saying about smart contract escrow, AI proposal matching, and instant payouts.
          </p>
        </motion.div>
      </div>

      {/* Scrolling marquee row 1 */}
      <div className="relative mb-3">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <motion.div
          animate={
            reduce
              ? undefined
              : { x: [0, -step * testimonialsRow1.length] }
          }
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 32,
              ease: "linear",
            },
          }}
          className="flex"
          ref={rowRef}
        >
          {[...testimonialsRow1, ...testimonialsRow1, ...testimonialsRow1].map((t, i) => (
            <TestimonialCard key={`row1-${i}`} t={t} />
          ))}
        </motion.div>
      </div>

      {/* Scrolling marquee row 2 - reverse */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <motion.div
          animate={
            reduce
              ? undefined
              : { x: [-step * testimonialsRow2.length, 0] }
          }
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 36,
              ease: "linear",
            },
          }}
          className="flex"
        >
          {[...testimonialsRow2, ...testimonialsRow2, ...testimonialsRow2].map((t, i) => (
            <TestimonialCard key={`row2-${i}`} t={t} />
          ))}
        </motion.div>
      </div>

      {/* Platform Trust & Metric Strip */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-12 mx-auto max-w-4xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
      >
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">99.8%</p>
          <p className="text-xs text-muted-foreground mt-1">
            Milestone Escrow Completion Rate
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <p className="text-2xl sm:text-3xl font-extrabold text-primary">0% Risk</p>
          <p className="text-xs text-muted-foreground mt-1">
            Zero Unpaid Milestones on Approved Work
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">220+ Countries</p>
          <p className="text-xs text-muted-foreground mt-1">
            Verified Global Identity with Didit KYC
          </p>
        </div>
      </motion.div>
    </section>
  );
}
