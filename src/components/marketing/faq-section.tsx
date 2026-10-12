"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { ChevronDownIcon } from '@/components/ui/brand-icons';

const faqs = [
  {
    question: "How does smart contract escrow protect against unpaid work?",
    answer:
      "When a client accepts a proposal, they fund the milestone escrow into an EVM smart contract before work starts. When the freelancer delivers the milestone and the client signs off, the contract releases payment immediately to the freelancer's wallet. Funds cannot be unilaterally withdrawn by either side during active delivery.",
  },
  {
    question: "What currencies and networks are supported?",
    answer:
      "FreelanceXchain supports settlements in stablecoins (USDC, USDT) and native tokens (ETH, POL/Polygon) across Ethereum Layer 1 and major Layer 2 networks.",
  },
  {
    question: "How does milestone scoping work?",
    answer:
      "Instead of writing arbitrary contract terms, FreelanceXchain helps break project requirements into clear deliverable checkpoints with defined acceptance criteria and completion deadlines that both parties sign before escrow funding.",
  },
  {
    question: "How are identity and accounts verified?",
    answer:
      "FreelanceXchain integrates Didit KYC for identity verification across 220+ countries to ensure all parties are verified human actors, preventing anonymous bot fraud and repeat scam accounts.",
  },
  {
    question: "What happens if there is a contract dispute?",
    answer:
      "If deliverables are rejected without valid criteria, either party can trigger arbitration inside the Contract Workspace. Submitted work, commit logs, and agreement criteria are reviewed to enforce fair settlement.",
  },
  {
    question: "What makes reputation portable?",
    answer:
      "Every successfully completed milestone, client review, and on-time delivery record is tied to your wallet address on-chain. You own your track record permanently, immune to arbitrary platform deplatforming.",
  },
  {
    question: "What are the platform fees?",
    answer:
      "FreelanceXchain charges a flat, transparent 1% protocol fee upon milestone release, compared to the 10% to 20% cuts and high foreign exchange fees taken by traditional freelance marketplaces.",
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
          <ChevronDownIcon className="size-4 shrink-0" />
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Questions &amp; Answers
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-foreground break-words">
            Frequently asked questions.
          </h2>
          <p className="mt-3 text-xs sm:text-base text-muted-foreground max-w-xl mx-auto break-words leading-relaxed">
            Direct details on escrow security, payouts, verification, and dispute resolution.
          </p>
        </div>

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
