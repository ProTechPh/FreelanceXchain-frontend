"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Briefcase,
  CircleCheck,
  Coins,
  FileCode,
  LayoutList,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { FreelanceXchainIcon } from "@/components/ui/freelancexchain-logo";

const mockContracts = [
  { id: 1, role: "DeFi Protocol Full-Stack DApp", client: "Ethereum Ecosystem", location: "Remote • Worldwide", budget: "$4,500 USDC", stage: "Escrow Funded (Milestone 2/3)", stageColor: "bg-success-subtle text-success border-success-border", match: "99% Skill Match", notes: "Employer funded $4,500 into contract escrow. Milestone 1 deliverable verified and $1,500 auto-released to wallet." },
  { id: 2, role: "AI Agent Workflow Pipeline", client: "Modern SaaS Scaleup", location: "Remote • Global", budget: "$3,200", stage: "Proposal Accepted", stageColor: "bg-info-subtle text-info border-info-border", match: "98% Skill Match", notes: "Proposal tailored by AI assistant matched client requirements perfectly. Contract workspace created and awaiting escrow deposit." },
  { id: 3, role: "Smart Contract Audit & Formal Verification", client: "Polygon Validator Protocol", location: "Remote • US / EU", budget: "$6,000", stage: "Milestone Paid 🎉", stageColor: "bg-info-subtle text-info border-info-border", match: "99% Skill Match", notes: "Deliverable approved by employer. Funds released instantly on-chain and verified reputation score updated to 99.8%." },
  { id: 4, role: "Design System & Web3 Component Suite", client: "Supabase Partner", location: "Remote • Global", budget: "$2,800", stage: "In Progress", stageColor: "bg-warning-subtle text-warning border-warning-border", match: "96% Skill Match", notes: "Milestone 1 submitted for client review. Milestone 2 escrow active." },
];

export function ContractWorkspacePreview() {
  const reduce = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedContract, setSelectedContract] = useState(mockContracts[0]);
  const filteredContracts = useMemo(
    () => selectedFilter === "All" ? mockContracts : mockContracts.filter((contract) => selectedFilter === "Escrow Funded" ? contract.stage.includes("Escrow Funded") : selectedFilter === "Milestones" ? contract.stage.includes("Milestone") : contract.stage.includes(selectedFilter)),
    [selectedFilter],
  );

  return (
    <>
      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
        className="absolute -right-3 -top-5 z-20 hidden items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-xl backdrop-blur-md sm:flex"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-success-subtle text-success"><ShieldCheck className="size-4" aria-hidden="true" /></span>
        <span><span className="block text-xs font-bold text-foreground">Smart Escrow Funded 🔒</span><span className="block text-xs text-muted-foreground">$4,500 USDC locked upfront</span></span>
      </motion.div>
      <motion.div
        animate={reduce ? undefined : { y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-5 -left-3 z-20 hidden items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-xl backdrop-blur-md sm:flex"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Coins className="size-4" aria-hidden="true" /></span>
        <span><span className="block text-xs font-bold text-foreground">Milestone Payout Released</span><span className="block text-xs text-muted-foreground">$1,500 transferred instantly</span></span>
      </motion.div>

      <div className="grid min-h-[460px] grid-cols-12 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <aside className="col-span-3 flex flex-col justify-between border-r border-border bg-muted/25 p-4" aria-label="Workspace preview navigation">
          <div>
            <div className="mb-6 flex items-center gap-2 px-2"><FreelanceXchainIcon size={24} /><span className="text-sm font-extrabold tracking-tight">Freelance<span className="font-black text-primary">X</span>chain</span></div>
            <div aria-hidden="true" className="relative mb-4 rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-muted-foreground"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />Search projects...</div>
            <div className="space-y-1 text-xs font-semibold">
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-primary"><span className="flex items-center gap-2"><Briefcase className="size-4" aria-hidden="true" />Projects Feed</span><span className="rounded-full bg-primary/15 px-1.5 text-xs font-bold">Live</span></div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground"><span className="flex items-center gap-2"><FileCode className="size-4" aria-hidden="true" />Active Contracts</span><span className="font-bold text-foreground">4</span></div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground"><span className="flex items-center gap-2"><LayoutList className="size-4" aria-hidden="true" />Proposals</span><span className="font-bold text-foreground">12</span></div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground"><TrendingUp className="size-4" aria-hidden="true" />On-Chain Reputation</div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2.5 px-2 py-1.5"><span className="flex size-7 items-center justify-center rounded-full bg-success-subtle text-xs font-bold text-success">0x</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-xs font-bold"><span className="truncate">Alex Mercer</span><CircleCheck className="size-3 text-success" aria-hidden="true" /></span><span className="block truncate font-mono text-xs text-muted-foreground">0x71C...39A2 • KYC Verified</span></span></div>
            <p className="mt-2 px-2 text-xs font-medium text-muted-foreground">Settings · Help</p>
          </div>
        </aside>

        <div className="col-span-9 flex flex-col justify-between bg-gradient-to-b from-background to-muted/10 p-6">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div><p className="text-base font-bold">Contracts &amp; Projects Workspace</p><p className="text-xs text-muted-foreground">Milestone escrow with automatic releases</p></div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-muted/60 p-1 text-xs font-semibold" aria-label="Filter contracts">
                {["All", "Escrow Funded", "Milestones", "Proposals"].map((filter) => <button key={filter} type="button" onClick={() => setSelectedFilter(filter)} aria-pressed={selectedFilter === filter} className={`min-h-11 rounded-lg px-3 text-xs transition-colors ${selectedFilter === filter ? "bg-background font-bold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>{filter}</button>)}
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {filteredContracts.map((contract) => (
                <button key={contract.id} type="button" onClick={() => setSelectedContract(contract)} aria-pressed={selectedContract.id === contract.id} className={`flex w-full items-center justify-between gap-2.5 rounded-xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selectedContract.id === contract.id ? "border-primary/40 bg-primary/5 shadow-xs" : "border-border bg-card hover:bg-muted/30"}`}>
                  <span className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-bold">{contract.client[0]}</span><span className="min-w-0"><span className="flex items-center gap-2"><span className="text-xs font-bold">{contract.role}</span><span className="truncate text-xs text-muted-foreground">• {contract.client}</span></span><span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground"><span className="truncate">{contract.location}</span><span>•</span><span className="shrink-0 font-bold text-foreground">{contract.budget}</span></span></span></span>
                  <span className="flex shrink-0 items-center gap-2.5"><span className="text-xs font-bold text-success">{contract.match}</span><span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${contract.stageColor}`}>{contract.stage}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" /><span className="truncate"><strong className="text-foreground">{selectedContract.client}:</strong> {selectedContract.notes}</span></span><span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">Escrow Verified</span></div>
        </div>
      </div>
    </>
  );
}
