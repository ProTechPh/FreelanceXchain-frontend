import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Shield,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui';
import api from '../lib/api';

const features = [
  {
    icon: Shield,
    title: 'Secure Escrow Payments',
    description: 'Smart contract-based escrow ensures your payments are safe and released only when milestones are met.',
    color: 'text-primary-400',
    bgColor: 'bg-primary-600/10',
    borderColor: 'border-primary-500/20'
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Our intelligent matching system connects you with the perfect projects or freelancers based on skills and reputation.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-600/10',
    borderColor: 'border-amber-500/20'
  },
  {
    icon: Star,
    title: 'On-Chain Reputation',
    description: 'Build an immutable, verifiable professional reputation stored on the blockchain. Trust that cannot be faked.',
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    borderColor: 'border-green-500/20'
  },
  {
    icon: Globe,
    title: 'Borderless Work',
    description: 'Access a truly global talent pool without currency barriers or complex international banking fees.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-500/20'
  },
];

export function LandingPage() {
  const [stats, setStats] = useState({
    totalFreelancers: 0,
    totalEmployers: 0,
    totalProjects: 0,
    totalPaidOut: '0.00',
    satisfactionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const platformStats = await api.getPlatformStats();
        setStats(platformStats);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const displayStats = [
    { 
      value: loading ? '...' : `${stats.totalFreelancers + stats.totalEmployers}+`, 
      label: 'Active Users' 
    },
    { 
      value: loading ? '...' : `${stats.totalProjects}+`, 
      label: 'Completed Projects' 
    },
    { 
      value: loading ? '...' : `${stats.totalPaidOut} ETH`, 
      label: 'Crypto Paid Out' 
    },
    { 
      value: loading ? '...' : `${stats.satisfactionRate}%`, 
      label: 'Satisfaction Rate' 
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-white selection:bg-primary-500/30">
      {/* Background Gradients - Reduced intensity */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* Hero Section - More spacious */}
      <section className="relative container-padding section-spacing max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm mb-10"
        >
          <Zap className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">The Next Gen Freelance Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-10 leading-[1.1] text-balance"
        >
          Build Your Future on <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 animate-gradient bg-300%">
            The Blockchain
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Connect with elite global talent, secure payments with smart contracts,
          and build a reputation that truly belongs to you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/register">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-shadow">
                Start Hiring Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <Link to="/projects">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5">
                Find Work
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Hero Stats - Better spacing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 pt-16 border-t border-gray-200 dark:border-white/5"
        >
          {displayStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-gray-900 dark:from-white to-gray-500">
                {stat.value}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid - Cleaner spacing */}
      <section className="section-spacing bg-gray-50 dark:bg-dark-surface/30 relative">
        <div className="max-w-7xl mx-auto container-padding">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-balance text-gray-900 dark:text-white">Redefining Platform Reliability</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              We've eliminated the middlemen and inefficiencies. Experience a platform built for
              trust, speed, and transparency.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`p-8 rounded-2xl border ${feature.borderColor} ${feature.bgColor} backdrop-blur-sm transition-all duration-300 cursor-pointer`}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  className="w-14 h-14 rounded-xl bg-white dark:bg-dark-bg/80 flex items-center justify-center mb-6"
                >
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </motion.div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - Better spacing and clarity */}
      <section className="section-spacing relative overflow-hidden">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              {/* Abstract decorative elements */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-full blur-3xl opacity-50" />

              <div className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/5 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-start gap-4 mb-8">
                  <div className="p-3 rounded-full bg-green-500/10 border border-green-500/20">
                    <Lock className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Smart Contract Escrow</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Funds are held safely on-chain until work is approved.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-gray-200 dark:bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-green-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Milestone 2/3 Complete</span>
                    <span className="text-green-400">75%</span>
                  </div>
                </div>
              </div>

              <div className="relative mt-6 bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/5 rounded-2xl p-8 shadow-2xl lg:ml-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-lg font-bold text-white">
                    JD
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">John Doe</h4>
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-gray-500 dark:text-gray-400 ml-2">(48 Reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-balance text-gray-900 dark:text-white">
                Trust is Built-in, <br />
                <span className="text-primary-400">Not Added On</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                Traditional platforms rely on obscure algorithms and support teams.
                FreelanceXchain uses open source smart contracts and verifying systems
                to ensure fair play for everyone.
              </p>
              <ul className="space-y-5 mb-12">
                {[
                  'Instant Payment Settlements',
                  'Lower Fees (Active only 1-2%)',
                  'Identity Verification (DID)',
                  'Unbiased Dispute Resolution'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/register">
                <Button variant="secondary" size="lg" className="h-12">
                  Learn How it Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Cleaner design */}
      <section className="section-spacing">
        <div className="max-w-5xl mx-auto container-padding">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-900/80 to-indigo-900/80 border border-primary-500/20 p-16 text-center">
            {/* Background texture/glow */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px]" />

            <div className="relative z-10 content-spacing">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
                Ready to Join the Revolution?
              </h2>
              <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop paying high fees. Start earning what you deserve.
                Join the decentralized workforce today.
              </p>
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-100 h-14 px-10 font-bold text-base">
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
