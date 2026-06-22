"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  Wallet,
  MagnifyingGlass,
  Brain,
  ShieldCheck,
} from "@phosphor-icons/react";
import { SlideTabs } from "./slide-tabs";
import { motion, AnimatePresence } from "motion/react";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const stepsByTab = [
    // For Freelancers
    [
      {
        icon: <MagnifyingGlass className="h-5 w-5" weight="light" />,
        stepNumber: 1,
        title: "Create Your Profile",
        description:
          "Build your professional profile with skills, portfolio, and verified identity. Your on-chain reputation starts here.",
        benefits: [
          "AI-assisted profile optimization",
          "Skill verification system",
          "Portfolio showcase",
        ],
      },
      {
        icon: <FileText className="h-5 w-5" weight="light" />,
        stepNumber: 2,
        title: "Find & Apply",
        description:
          "Browse projects matched to your skills by AI, or receive personalized recommendations based on your expertise.",
        benefits: [
          "AI-powered project matching",
          "Smart proposal suggestions",
          "Competitive analysis",
        ],
      },
      {
        icon: <Wallet className="h-5 w-5" weight="light" />,
        stepNumber: 3,
        title: "Get Paid Securely",
        description:
          "Complete milestones and receive payment through smart contract escrow. Your reputation grows on-chain with every success.",
        benefits: [
          "Instant crypto payments",
          "Milestone-based releases",
          "Immutable earnings record",
        ],
      },
    ],
    // For Employers
    [
      {
        icon: <FileText className="h-5 w-5" weight="light" />,
        stepNumber: 1,
        title: "Post a Project",
        description:
          "Describe your project, set milestones, and define your budget. Our AI helps optimize your listing for better matches.",
        benefits: [
          "AI-assisted project description",
          "Smart milestone suggestions",
          "Budget optimization tips",
        ],
      },
      {
        icon: <Users className="h-5 w-5" weight="light" />,
        stepNumber: 2,
        title: "AI Matches Talent",
        description:
          "Our AI analyzes skills and matches you with the best freelancers. Review proposals and choose the perfect fit.",
        benefits: [
          "Skill-based matching algorithm",
          "On-chain reputation scoring",
          "Transparent proposal comparison",
        ],
      },
      {
        icon: <ShieldCheck className="h-5 w-5" weight="light" />,
        stepNumber: 3,
        title: "Secure Escrow Payment",
        description:
          "Fund milestones with smart contract escrow. Pay only when work is approved — your funds are always protected.",
        benefits: [
          "Ethereum smart contract security",
          "Milestone-based fund release",
          "Immutable payment records",
        ],
      },
    ],
    // For Both
    [
      {
        icon: <Brain className="h-5 w-5" weight="light" />,
        stepNumber: 1,
        title: "Get Matched by AI",
        description:
          "Our advanced AI analyzes your needs and matches you with the perfect counterpart — freelancer or employer.",
        benefits: [
          "Intelligent skill matching",
          "Project requirement analysis",
          "Compatibility scoring",
        ],
      },
      {
        icon: <Users className="h-5 w-5" weight="light" />,
        stepNumber: 2,
        title: "Collaborate On-Chain",
        description:
          "Work together with transparent milestones, secure communication, and immutable progress records on the blockchain.",
        benefits: [
          "Transparent milestone tracking",
          "Secure communication channels",
          "Immutable progress records",
        ],
      },
      {
        icon: <Wallet className="h-5 w-5" weight="light" />,
        stepNumber: 3,
        title: "Complete & Earn Trust",
        description:
          "Finish projects successfully and both parties build on-chain reputation that follows them across the platform.",
        benefits: [
          "Mutual reputation building",
          "Verified completion records",
          "Trust score enhancement",
        ],
      },
    ],
  ];

  const steps = stepsByTab[activeTab];

  return (
    <section
      id="how-it-works"
      className={cn("w-full py-20 sm:py-32 relative bg-background", className)}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,oklch(0.62_0.26_280/0.05),transparent)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 lg:px-8 relative">
        <div className="mb-14">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            Three steps between you and your next milestone.
          </p>
        </div>

        <div className="mb-14">
          <SlideTabs
            tabs={["For Freelancers", "For Employers", "For Both"]}
            onSelect={setActiveTab}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute left-[1.25rem] top-8 bottom-8 w-px bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-transparent hidden sm:block" aria-hidden="true" />

            <div className="flex flex-col">
              {steps.map((step, index) => (
                <motion.div
                  key={step.stepNumber}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex gap-6 sm:gap-10 py-8 sm:py-10 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-4 px-4 rounded-xl transition-colors duration-300"
                >
                  <div className="relative flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] text-foreground/60">
                    {step.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-xs font-mono text-foreground/25 tabular-nums">0{step.stepNumber}</span>
                      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-5 max-w-lg text-sm">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {step.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/[0.08] border border-primary/15 text-primary/80"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
