import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  FileText,
  Shield,
  Coins,
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
  Users,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui';

const freelancerSteps = [
  {
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Sign up and complete your professional profile with skills, experience, and portfolio.',
    color: 'text-primary-400',
    bgColor: 'bg-primary-600/10',
  },
  {
    icon: Shield,
    title: 'Complete KYC Verification',
    description: 'Verify your identity using our secure blockchain-based KYC system for trust and credibility.',
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
  },
  {
    icon: Search,
    title: 'Browse & Apply to Projects',
    description: 'Use AI-powered recommendations to find projects that match your skills and interests.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-600/10',
  },
  {
    icon: FileText,
    title: 'Submit Proposals',
    description: 'Write compelling proposals outlining your approach, timeline, and pricing.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
  },
  {
    icon: Coins,
    title: 'Work & Get Paid',
    description: 'Complete milestones and receive payments automatically through smart contract escrow.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/10',
  },
  {
    icon: Star,
    title: 'Build Your Reputation',
    description: 'Earn reviews and build an immutable on-chain reputation that follows you everywhere.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/10',
  },
];

const employerSteps = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up as an employer and set up your company profile.',
    color: 'text-primary-400',
    bgColor: 'bg-primary-600/10',
  },
  {
    icon: FileText,
    title: 'Post a Project',
    description: 'Describe your project requirements, budget, timeline, and required skills.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-600/10',
  },
  {
    icon: Users,
    title: 'Review Proposals',
    description: 'Receive proposals from qualified freelancers and review their profiles and ratings.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
  },
  {
    icon: CheckCircle,
    title: 'Hire & Fund Escrow',
    description: 'Select the best freelancer and fund the smart contract escrow to secure the project.',
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
  },
  {
    icon: Zap,
    title: 'Track Progress',
    description: 'Monitor milestone completion and communicate directly with your freelancer.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/10',
  },
  {
    icon: Star,
    title: 'Release Payment & Review',
    description: 'Approve completed work, release payments automatically, and leave a review.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/10',
  },
];

const features = [
  {
    icon: Lock,
    title: 'Smart Contract Escrow',
    description: 'Funds are held securely on-chain and released automatically when milestones are approved.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Our intelligent system matches freelancers with projects based on skills, experience, and reputation.',
  },
  {
    icon: Shield,
    title: 'Blockchain KYC',
    description: 'Decentralized identity verification ensures trust without compromising privacy.',
  },
  {
    icon: Star,
    title: 'On-Chain Reputation',
    description: 'Build a verifiable, immutable reputation that you truly own and can take anywhere.',
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <Zap className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-300">Simple, Transparent, Secure</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold mb-6"
          >
            How FreelanceXchain{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Works
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            A decentralized platform that connects talent with opportunity, powered by blockchain
            technology and artificial intelligence.
          </motion.p>
        </div>
      </section>

      {/* For Freelancers */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">For Freelancers</h2>
            <p className="text-gray-400 text-lg">
              Start earning with confidence on a platform built for your success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {freelancerSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border border-white/10 ${step.bgColor} backdrop-blur-sm`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-bg/80 flex items-center justify-center">
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/register">
              <Button size="lg">
                Start as a Freelancer
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Employers */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">For Employers</h2>
            <p className="text-gray-400 text-lg">
              Find and hire top talent with complete transparency and security
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employerSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border border-white/10 ${step.bgColor} backdrop-blur-sm`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-bg/80 flex items-center justify-center">
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Start Hiring
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Makes Us Different</h2>
            <p className="text-gray-400 text-lg">
              Blockchain technology and AI working together for a better freelance experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-primary-400 mb-4" />
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-900/80 to-indigo-900/80 border border-primary-500/20 p-16 text-center">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                Join thousands of freelancers and employers already using FreelanceXchain
              </p>
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-100">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
