import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Users,
  Shield,
  Coins,
  FileText,
  MessageCircle,
  ArrowRight,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Input, Button } from '../../components/ui';

const categories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Zap,
    color: 'text-primary-400',
    bgColor: 'bg-primary-600/10',
    articles: [
      { title: 'Creating Your Account', views: '12.5K', readTime: '3 min' },
      { title: 'Completing Your Profile', views: '10.2K', readTime: '5 min' },
      { title: 'Understanding the Dashboard', views: '8.7K', readTime: '4 min' },
      { title: 'First Steps as a Freelancer', views: '15.3K', readTime: '6 min' },
      { title: 'First Steps as an Employer', views: '9.8K', readTime: '5 min' },
    ],
  },
  {
    id: 'account',
    name: 'Account & Profile',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    articles: [
      { title: 'Managing Your Profile Information', views: '7.2K', readTime: '4 min' },
      { title: 'Changing Your Password', views: '5.1K', readTime: '2 min' },
      { title: 'Two-Factor Authentication Setup', views: '6.3K', readTime: '3 min' },
      { title: 'Connecting Your Wallet', views: '11.4K', readTime: '5 min' },
      { title: 'Deleting Your Account', views: '2.8K', readTime: '3 min' },
    ],
  },
  {
    id: 'kyc',
    name: 'KYC & Verification',
    icon: Shield,
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    articles: [
      { title: 'Why KYC is Required', views: '14.6K', readTime: '4 min' },
      { title: 'How to Complete KYC Verification', views: '18.9K', readTime: '6 min' },
      { title: 'KYC Verification Status', views: '9.5K', readTime: '3 min' },
      { title: 'Troubleshooting KYC Issues', views: '7.8K', readTime: '5 min' },
      { title: 'Privacy & Data Security', views: '6.2K', readTime: '4 min' },
    ],
  },
  {
    id: 'projects',
    name: 'Projects & Proposals',
    icon: FileText,
    color: 'text-amber-400',
    bgColor: 'bg-amber-600/10',
    articles: [
      { title: 'How to Post a Project', views: '13.7K', readTime: '5 min' },
      { title: 'Writing Winning Proposals', views: '16.4K', readTime: '7 min' },
      { title: 'Understanding Project Status', views: '8.9K', readTime: '4 min' },
      { title: 'Managing Multiple Projects', views: '7.3K', readTime: '5 min' },
      { title: 'Project Milestones Explained', views: '10.1K', readTime: '6 min' },
    ],
  },
  {
    id: 'payments',
    name: 'Payments & Escrow',
    icon: Coins,
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/10',
    articles: [
      { title: 'How Smart Contract Escrow Works', views: '19.2K', readTime: '6 min' },
      { title: 'Funding a Project', views: '11.8K', readTime: '4 min' },
      { title: 'Releasing Milestone Payments', views: '14.5K', readTime: '5 min' },
      { title: 'Withdrawing Your Earnings', views: '17.6K', readTime: '4 min' },
      { title: 'Understanding Transaction Fees', views: '12.3K', readTime: '3 min' },
    ],
  },
  {
    id: 'disputes',
    name: 'Disputes & Support',
    icon: MessageCircle,
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/10',
    articles: [
      { title: 'Opening a Dispute', views: '8.4K', readTime: '5 min' },
      { title: 'Dispute Resolution Process', views: '9.7K', readTime: '6 min' },
      { title: 'Providing Evidence', views: '6.5K', readTime: '4 min' },
      { title: 'Contacting Support', views: '11.2K', readTime: '3 min' },
      { title: 'Reporting Issues', views: '5.9K', readTime: '3 min' },
    ],
  },
];

const popularArticles = [
  {
    title: 'Complete Guide to Getting Started on FreelanceXchain',
    category: 'Getting Started',
    views: '25.3K',
    readTime: '10 min',
  },
  {
    title: 'Understanding Smart Contract Escrow',
    category: 'Payments',
    views: '19.2K',
    readTime: '6 min',
  },
  {
    title: 'How to Complete KYC Verification',
    category: 'KYC',
    views: '18.9K',
    readTime: '6 min',
  },
  {
    title: 'Withdrawing Your Earnings',
    category: 'Payments',
    views: '17.6K',
    readTime: '4 min',
  },
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-white">
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
            <BookOpen className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">24/7 Support</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold mb-6"
          >
            How Can We{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Help You?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12"
          >
            Search our knowledge base or browse categories to find answers
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-2xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-dark-surface/50 border-white/10"
            />
          </motion.div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Popular Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {popularArticles.map((article, index) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-primary-400 px-3 py-1 rounded-full bg-primary-600/10">
                    {article.category}
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-primary-400 transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{article.views} views</span>
                  <span>•</span>
                  <span>{article.readTime} read</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-2xl border border-white/10 ${category.bgColor} backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-bg/80 flex items-center justify-center">
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <h3 className="text-xl font-bold">{category.name}</h3>
                </div>
                <ul className="space-y-3">
                  {category.articles.map((article) => (
                    <li key={article.title}>
                      <a
                        href="#"
                        className="text-gray-600 dark:text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center justify-between group"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">
                          {article.title}
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <a
                    href="#"
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-2"
                  >
                    View all articles
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-900/80 to-indigo-900/80 border border-primary-500/20 p-16 text-center">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="relative z-10">
              <HelpCircle className="w-16 h-16 text-primary-300 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Can't Find What You're Looking For?</h2>
              <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                Our support team is available 24/7 to help you with any questions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-100">
                  <MessageCircle className="w-5 h-5" />
                  Contact Support
                </Button>
                <Link to="/faqs">
                  <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                    View FAQs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
