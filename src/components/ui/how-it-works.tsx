"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, Users, Wallet, Search, Brain, Shield } from "lucide-react";
import { SlideTabs } from "./slide-tabs";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  icon: React.ReactNode;
  stepNumber: number;
  title: string;
  description: string;
  benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({
  icon,
  stepNumber,
  title,
  description,
  benefits,
}) => (
  <div
    className={cn(
      "relative rounded-2xl border bg-card p-6 text-card-foreground transition-all duration-300 ease-in-out",
      "hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-muted"
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs font-mono text-muted-foreground">0{stepNumber}</span>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="mb-6 text-muted-foreground">{description}</p>
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          <span className="text-muted-foreground">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const stepsByTab = [
    // For Freelancers
    [
      {
        icon: <Search className="h-6 w-6" />,
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
        icon: <FileText className="h-6 w-6" />,
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
        icon: <Wallet className="h-6 w-6" />,
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
        icon: <FileText className="h-6 w-6" />,
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
        icon: <Users className="h-6 w-6" />,
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
        icon: <Shield className="h-6 w-6" />,
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
        icon: <Brain className="h-6 w-6" />,
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
        icon: <Users className="h-6 w-6" />,
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
        icon: <Wallet className="h-6 w-6" />,
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
      className={cn("w-full bg-card/30 py-16 sm:py-24", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to get started on FreelanceXchain.
          </p>
        </div>

        <div className="mb-12">
          <SlideTabs
            tabs={["For Freelancers", "For Employers", "For Both"]}
            onSelect={setActiveTab}
          />
        </div>

        <div className="relative mx-auto mb-8 w-full max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-border"
          ></div>
          <div className="relative grid grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-primary/10 font-semibold text-primary ring-4 ring-background"
              >
                {step.stepNumber}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard
              key={step.stepNumber}
              icon={step.icon}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
