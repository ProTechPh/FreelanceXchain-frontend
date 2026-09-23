import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { TutorialsInteractive } from "@/components/tutorials/tutorials-interactive";
import { Sparkles as Sparkle, User, Briefcase, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Tutorials | FreelanceXchain",
  description:
    "Step-by-step guides for freelancers, employers, and Web3 developers to work, hire, and transact with total security.",
};

const TUTORIAL_TRACKS = [
  {
    id: "freelancers",
    label: "For Freelancers",
    icon: null, // Will be rendered in client component
    badge: "Getting Hired & Paid",
    description:
      "Master the complete freelancer lifecycle: profile setup, AI proposal bidding, milestone deliverables, and instant escrow payouts.",
    steps: [
      {
        step: "01",
        title: "Complete Your Profile & Didit KYC",
        description:
          "Add your verified skills, portfolio attachments, hourly rate, and complete quick identity verification to receive verified talent badges.",
        action: "Edit Profile",
        href: "/dashboard/freelancer/profile",
      },
      {
        step: "02",
        title: "Discover Projects with AI Skill Matching",
        description:
          "Browse curated project listings matching your exact verified stack. Use skill gap analysis to optimize your relevance scores.",
        action: "Browse Projects",
        href: "/projects",
      },
      {
        step: "03",
        title: "Submit 1-Click AI Proposals",
        description:
          "Generate tailored milestone proposals that break down deliverables, timeline scopes, and escrow amounts in seconds.",
        action: "View Proposals",
        href: "/dashboard/freelancer/proposals",
      },
      {
        step: "04",
        title: "Deliver Work in Contract Workspaces",
        description:
          "Collaborate in real-time with employers, upload deliverables for each milestone, and receive instant payouts released directly to your wallet.",
        action: "Active Contracts",
        href: "/dashboard/freelancer/contracts",
      },
    ],
  },
  {
    id: "employers",
    label: "For Employers",
    icon: null,
    badge: "Hiring & Escrow Management",
    description:
      "Post projects, review AI-ranked proposals, lock upfront funds in smart contract escrow, and approve milestone deliverables safely.",
    steps: [
      {
        step: "01",
        title: "Post a Scoped Milestone Project",
        description:
          "Specify your project requirements, required tech stack, estimated budget, and structured milestone deadlines.",
        action: "Post Project",
        href: "/dashboard/employer/projects/new",
      },
      {
        step: "02",
        title: "Review Bids & Chat with Candidates",
        description:
          "Inspect applicant ratings, on-chain portfolios, and open direct messaging channels to align on scope before awarding.",
        action: "Review Proposals",
        href: "/dashboard/employer/projects",
      },
      {
        step: "03",
        title: "Fund Milestone Escrow Upfront",
        description:
          "Connect your Web3 wallet or use fiat on-ramp. Lock milestone funds into the Ethereum smart contract escrow.",
        action: "Manage Contracts",
        href: "/dashboard/employer/contracts",
      },
      {
        step: "04",
        title: "Approve Deliverables & Release Payouts",
        description:
          "Inspect submitted code or assets. Approve to trigger automatic smart contract payout release, or request structured revisions.",
        action: "Workspace Overview",
        href: "/dashboard/employer/contracts",
      },
    ],
  },
  {
    id: "security",
    label: "Security & Wallet Basics",
    icon: null,
    badge: "Account Protection",
    description:
      "Essential best practices for Web3 security, multi-factor authentication, and safe smart contract interactions.",
    steps: [
      {
        step: "01",
        title: "Enable Multi-Factor Authentication (MFA)",
        description:
          "Add TOTP 2-factor authentication via Google Authenticator or 1Password to protect account mutation actions.",
        action: "Setup MFA",
        href: "/mfa/setup",
      },
      {
        step: "02",
        title: "Never Share Seed Phrases or OTPs",
        description:
          "FreelanceXchain will never ask for your wallet recovery seed phrase or one-time verification tokens under any circumstances.",
        action: "Learn More",
        href: "/status",
      },
      {
        step: "03",
        title: "Use In-Platform Escrow Controls",
        description:
          "Always conduct milestone deposits and payments through official contract workspaces to ensure 100% dispute protection.",
        action: "View Terms",
        href: "/terms",
      },
      {
        step: "04",
        title: "Transparent Dispute Arbitration",
        description:
          "In the rare event of a disagreement, submit evidence through the Dispute Center where impartial arbiters review on-chain records.",
        action: "Dispute Center",
        href: "/dashboard/freelancer/disputes",
      },
    ],
  },
];

// Icons are rendered client-side since they use React components
function getTrackIcon(id: string) {
  const iconClass = "size-4";
  switch (id) {
    case "freelancers":
      return <User className={iconClass} strokeWidth={2.5} />;
    case "employers":
      return <Briefcase className={iconClass} strokeWidth={2.5} />;
    case "security":
      return <ShieldCheck className={iconClass} strokeWidth={2.5} />;
    default:
      return null;
  }
}

export default function TutorialsPage() {
  // Add icons to tracks for the client component
  const tracksWithIcons = TUTORIAL_TRACKS.map((track) => ({
    ...track,
    icon: getTrackIcon(track.id),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <Sparkle className="size-3.5 fill-primary" fill="currentColor" />
              <span>Step-by-Step Guides & Tutorials</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              Master the FreelanceXchain <br className="hidden sm:inline" />
              <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
                smart escrow ecosystem.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive walkthroughs for freelancers, employers, and Web3 developers to work,
              hire, and transact with total security.
            </p>
          </div>
        </section>

        {/* Interactive content (client component) */}
        <TutorialsInteractive tracks={tracksWithIcons} />
      </main>

      <FooterSection />
    </div>
  );
}
