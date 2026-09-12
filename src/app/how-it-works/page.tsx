import Link from 'next/link';
import { InfoPage } from '@/components/public/info-page';
import { Button } from '@/components/ui/button';
import { UserCheck, Sparkles, ShieldCheck, CheckCircle2, Award, ArrowRight, Briefcase } from 'lucide-react';

export const metadata = {
  title: 'How It Works | FreelanceXchain',
  description: 'Learn how FreelanceXchain connects employers with freelancers through smart contract escrow and milestone-based payments.',
};

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Create and verify your account',
    icon: UserCheck,
    description: 'Choose your role as an employer or freelancer, verify your identity with Didit KYC in minutes, and connect your Web3 wallet for seamless on-chain transactions.',
    tip: 'Verified badges boost proposal acceptance rates by up to 3x.',
  },
  {
    step: '02',
    title: 'Match and scope with AI assistance',
    icon: Sparkles,
    description: 'Employers post scoped projects with milestones. Freelancers leverage AI-generated proposal drafts matching their verified skill stack with real-time relevance scores.',
    tip: 'Saved searches and automated skill matching notify you immediately of relevant opportunities.',
  },
  {
    step: '03',
    title: 'Fund smart contract escrow securely',
    icon: ShieldCheck,
    description: 'Once a proposal is accepted, the employer funds the contract. Funds are locked securely in Ethereum smart contract escrow—neither party can unilaterally withdraw without mutual agreement.',
    tip: '100% smart contract escrow eliminates payment default risk.',
  },
  {
    step: '04',
    title: 'Deliver and approve milestones',
    icon: CheckCircle2,
    description: 'Freelancers submit deliverables for each milestone directly in the contract workspace. Employers review the work and release payments with a single approval click.',
    tip: 'Need revisions? Structured negotiation and revision loops keep expectations aligned.',
  },
  {
    step: '05',
    title: 'Build portable on-chain reputation',
    icon: Award,
    description: 'Completed milestones release funds directly to the freelancer’s wallet. Both participants rate each other, establishing verifiable, non-custodial feedback on-chain.',
    tip: 'Your reputation score stays with your wallet across the Web3 ecosystem.',
  },
];

export default function HowItWorksPage() {
  return (
    <InfoPage
      title="How it works"
      intro="A transparent, automated pathway from project scoping to smart contract escrow release."
      badge="Workflow & Escrow Guide"
    >
      <div className="not-prose space-y-6">
        <div className="grid gap-5 sm:gap-6">
          {WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex flex-col sm:flex-row items-start gap-4 p-5 sm:p-6 rounded-2xl bg-secondary/30 border border-border/70 hover:border-primary/40 transition-all duration-200 shadow-xs"
            >
              <div className="flex items-center gap-3 shrink-0">
                <div className="size-11 sm:size-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-xs border border-primary/20">
                  <item.icon className="size-5" />
                </div>
                <span className="sm:hidden font-mono text-xs font-bold text-muted-foreground">
                  Step {item.step}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Step {item.step}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    {item.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                <p className="text-xs text-primary/90 font-medium pt-1 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  {item.tip}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Call to Action Section */}
        <div className="pt-8 mt-10 border-t border-border/80 text-center space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Ready to experience decentralized freelancing?
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Join thousands of verified freelancers and clients collaborating with trustless smart contract escrow.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" variant="gradient" className="rounded-full shadow-md min-h-[44px] px-6">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full min-h-[44px] px-6">
              <Link href="/projects">
                <Briefcase className="size-4 mr-1.5" />
                Browse Projects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </InfoPage>
  );
}
