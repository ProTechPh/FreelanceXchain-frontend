'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Brain, Globe, TrendingUp, Users } from 'lucide-react';

const stats = [
  { label: 'Total Earned', value: '$2.4M+' },
  { label: 'Active Projects', value: '1,200+' },
  { label: 'Freelancers', value: '12,000+' },
  { label: 'Countries', value: '85+' },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-cyan/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Blockchain & AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text">Decentralize</span>
            <br />
            Your Freelance Career
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The future of work is here. Get matched with projects using AI, 
            secure payments with smart contracts, and build an immutable reputation on-chain.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register">
              <Button size="lg" className="gradient-primary text-white px-8 h-12 text-base">
                Find Work <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base border-border/50 hover:bg-card">
                Hire Talent
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Shield,
    title: 'Smart Escrow',
    description: 'Milestone-based payments secured by Ethereum smart contracts. Funds released only when work is approved.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Brain,
    title: 'AI Skill Matching',
    description: 'Advanced AI analyzes skills and project requirements to find the perfect match for both freelancers and employers.',
    color: 'text-cyan',
    bg: 'bg-cyan/10',
  },
  {
    icon: TrendingUp,
    title: 'On-Chain Reputation',
    description: 'Build an immutable, transparent reputation that follows you across the platform. No more fake reviews.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Globe,
    title: 'Global KYC',
    description: 'Verified identity across 220+ countries with Didit integration. Trust without borders.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Zap,
    title: 'Low Fees',
    description: 'Decentralized architecture means lower platform fees. Keep more of what you earn.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Users,
    title: 'Fair Disputes',
    description: 'Transparent dispute resolution with evidence submission and admin arbitration. Your work, your protection.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            Why <span className="gradient-text">FreelanceXchain</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built on blockchain technology with AI-powered features for the modern gig economy.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    step: '01',
    title: 'Post a Project',
    description: 'Describe your project, set milestones, and define your budget. AI helps optimize your listing.',
  },
  {
    step: '02',
    title: 'AI Matches Talent',
    description: 'Our AI analyzes skills and matches you with the best freelancers. Review proposals and choose.',
  },
  {
    step: '03',
    title: 'Secure Escrow Payment',
    description: 'Fund milestones with smart contract escrow. Pay only when work is approved.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to start working or hiring on FreelanceXchain.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="text-6xl font-bold gradient-text/20 mb-4">{step.step}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+60px)] w-[calc(100%-120px)] h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative p-12 rounded-3xl bg-card border border-border overflow-hidden"
        >
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">
              Start Earning <span className="gradient-text">Securely</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Join thousands of freelancers and employers building the future of work on FreelanceXchain.
            </p>
            <Link href="/register">
              <Button size="lg" className="gradient-primary text-white px-8 h-12 text-base">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="font-bold text-lg">FreelanceX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The decentralized freelance marketplace powered by blockchain and AI.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/projects" className="hover:text-foreground">Browse Projects</Link></li>
              <li><Link href="/freelancers" className="hover:text-foreground">Find Talent</Link></li>
              <li><Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
              <li><Link href="/status" className="hover:text-foreground">Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FreelanceXchain. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
