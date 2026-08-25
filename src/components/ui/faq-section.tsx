"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { CaretDown, Sparkle } from "@phosphor-icons/react";

const faqs = [
  {
    question: "1. What is FreelanceXchain?",
    answer:
      "FreelanceXchain is a decentralized freelance marketplace combining AI skill discovery and automated proposal generation with Ethereum smart contract escrow. Employers post scoped projects, freelancers submit milestone proposals, and funds are locked securely upfront until deliverables are approved.",
  },
  {
    question: "2. How does Smart Contract Escrow protect both parties?",
    answer:
      "When an employer accepts a proposal, they fund the milestone escrow. Funds remain safely locked in an EVM smart contract. When the freelancer submits deliverables and the employer approves them, funds are released automatically to the freelancer's wallet. Zero unpaid invoices and zero escrow risk.",
  },
  {
    question: "3. How does AI Skill Matching & Proposal Generation work?",
    answer:
      "Our AI analyzes client project specifications, required technical stacks, and milestone deliverables. It evaluates your portfolio and verified skills to draft custom, high-converting proposals with recommended milestones and timelines that you can edit before submitting.",
  },
  {
    question: "4. What payment methods and currencies are supported?",
    answer:
      "FreelanceXchain supports on-chain payments in stablecoins (USDC, USDT), native tokens (ETH, MATIC/POL), and standard payment rails with automated escrow triggers.",
  },
  {
    question: "5. How does Identity Verification (Didit KYC) work?",
    answer:
      "FreelanceXchain integrates Didit KYC for seamless, biometric and government ID verification across 220+ countries. This keeps the marketplace free of scams, fake profiles, and spam bots.",
  },
  {
    question: "6. What happens if there is a contract dispute?",
    answer:
      "Either participant can open a dispute inside the dedicated Contract Workspace. Both sides upload verified deliverable proofs and chat logs. Platform arbitrators review the on-chain evidence to execute a fair, binding resolution.",
  },
  {
    question: "7. What is On-Chain Portable Reputation?",
    answer:
      "Every successfully completed milestone, employer rating, and verified review is recorded permanently on the blockchain. Your reputation belongs to you — it cannot be deleted, suspended, or locked by any central platform.",
  },
  {
    question: "8. What are the platform fees on FreelanceXchain?",
    answer:
      "Unlike traditional freelance platforms that charge up to 20% of your earnings, FreelanceXchain operates on a low, transparent fee structure with zero hidden conversion cuts.",
  },
];

function FaqItem({ faq, isOpen, onToggle }: { faq: (typeof faqs)[number]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border/60 last:border-b-0 py-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors focus-visible:outline-none gap-3"
        aria-expanded={isOpen}
      >
        <span className="min-w-0 flex-1 break-words">{faq.question}</span>
        <span className={`p-1 rounded-lg bg-muted/60 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 bg-primary/10 text-primary" : "text-muted-foreground"}`}>
          <CaretDown className="size-4 shrink-0" weight="bold" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-muted/10 border-b border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Sparkle className="size-3.5 fill-primary" weight="fill" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight break-words">
            <span className="text-foreground">Still have questions? </span> <br className="hidden sm:inline" />
            <span className="text-[#717680] dark:text-muted-foreground">
              We’ve got you covered.
            </span>
          </h2>
          <p className="mt-3 text-xs sm:text-base text-muted-foreground max-w-xl mx-auto break-words leading-relaxed">
            If it’s not covered here, reach out to our team — or just try FreelanceXchain and see for yourself.
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border/80 bg-card px-6 sm:px-8 py-2 shadow-xs"
        >
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
