import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Search,
  HelpCircle,
  Shield,
  Users,
  FileText,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { Button, Input } from '../../components/ui';

const categories = [
  { id: 'general', name: 'General', icon: HelpCircle },
  { id: 'getting-started', name: 'Getting Started', icon: Zap },
  { id: 'security', name: 'Security & KYC', icon: Shield },
  { id: 'projects', name: 'Projects & Proposals', icon: FileText },
  { id: 'disputes', name: 'Disputes', icon: Users },
];

const faqs = [
  {
    category: 'general',
    question: 'What is FreelanceXchain?',
    answer:
      'FreelanceXchain is a decentralized freelance marketplace built on blockchain technology. We connect freelancers with employers using smart contracts for secure payments, AI for intelligent matching, and blockchain for transparent reputation management.',
  },
  {
    category: 'general',
    question: 'How is FreelanceXchain different from other platforms?',
    answer:
      'Unlike traditional platforms, we use blockchain smart contracts for automatic escrow and payments, provide portable on-chain reputation, and offer AI-powered matching. Your reputation and data truly belong to you, and the platform is free to join with no monthly subscriptions.',
  },
  {
    category: 'general',
    question: 'Do I need cryptocurrency to use the platform?',
    answer:
      'While we support cryptocurrency payments, you can also use traditional payment methods. However, crypto payments offer faster processing, lower fees, and access to all platform features.',
  },
  {
    category: 'general',
    question: 'Is there a cost to join FreelanceXchain?',
    answer:
      'No! FreelanceXchain is completely free to join for both freelancers and employers. There are no monthly subscriptions or membership fees. You only pay a small transaction fee when you successfully complete a project.',
  },
  {
    category: 'getting-started',
    question: 'How do I create an account?',
    answer:
      'Click "Sign Up" and choose whether you\'re a freelancer or employer. Fill in your basic information, verify your email, and complete your profile. For full access to all features, you\'ll need to complete KYC verification.',
  },
  {
    category: 'getting-started',
    question: 'Is KYC verification mandatory?',
    answer:
      'KYC verification is required to post projects, submit proposals, and handle payments. It ensures trust and security for all users. Our blockchain-based KYC system protects your privacy while verifying your identity.',
  },
  {
    category: 'getting-started',
    question: 'How long does KYC verification take?',
    answer:
      'Most KYC verifications are completed within 24-48 hours. You\'ll receive a notification once your verification is approved. In some cases, additional documentation may be requested.',
  },
  {
    category: 'security',
    question: 'How does the escrow system work?',
    answer:
      'When a project is awarded, the employer funds a smart contract escrow. Funds are held securely on the blockchain and automatically released when milestones are approved. This protects both parties and eliminates payment disputes.',
  },
  {
    category: 'security',
    question: 'When do I receive payment?',
    answer:
      'Payments are released automatically when the employer approves a milestone. For crypto payments, funds are available immediately. Traditional payment methods may take 2-5 business days to process.',
  },
  {
    category: 'security',
    question: 'Can I withdraw my earnings anytime?',
    answer:
      'Yes! Once payments are released from escrow, you can withdraw your earnings immediately. Crypto withdrawals are instant (minus gas fees), while bank transfers take 2-5 business days.',
  },
  {
    category: 'security',
    question: 'How secure is my data?',
    answer:
      'We use enterprise-grade encryption for all data. Your KYC information is stored using decentralized identity (DID) technology, giving you control over your data. Smart contracts are audited and open-source.',
  },
  {
    category: 'security',
    question: 'What if I lose access to my wallet?',
    answer:
      'We recommend backing up your wallet recovery phrase securely. If you lose access, contact support immediately. For accounts with traditional payment methods, we can help recover access through identity verification.',
  },
  {
    category: 'security',
    question: 'How do you prevent fraud?',
    answer:
      'We use multiple layers of protection: mandatory KYC verification, on-chain reputation system, smart contract escrow, AI-powered fraud detection, and a transparent dispute resolution process.',
  },
  {
    category: 'projects',
    question: 'How do I find projects as a freelancer?',
    answer:
      'Browse the project marketplace or use our AI-powered recommendation system. The AI analyzes your skills, experience, and reputation to suggest projects that match your profile. You can also set up alerts for specific project types.',
  },
  {
    category: 'projects',
    question: 'How many proposals can I submit?',
    answer:
      'Freelancers can submit unlimited proposals. However, we recommend focusing on quality over quantity. Our AI helps you identify projects where you have the best chance of success.',
  },
  {
    category: 'projects',
    question: 'Can I edit my proposal after submission?',
    answer:
      'Yes, you can edit your proposal until the employer reviews it or the project deadline passes. Once a proposal is accepted or rejected, it cannot be modified.',
  },
  {
    category: 'projects',
    question: 'How do I post a project as an employer?',
    answer:
      'Click "Post Project", describe your requirements, set your budget and timeline, and specify required skills. Our AI will help optimize your posting for better matches. Once posted, qualified freelancers can submit proposals.',
  },
  {
    category: 'disputes',
    question: 'What happens if there\'s a dispute?',
    answer:
      'Either party can open a dispute through the platform. Our blockchain-based dispute resolution system reviews evidence from both sides. A neutral arbitrator makes a decision, and the smart contract automatically executes the resolution.',
  },
  {
    category: 'disputes',
    question: 'How long does dispute resolution take?',
    answer:
      'Most disputes are resolved within 5-7 business days. Complex cases may take longer. Both parties can submit evidence and communicate through the platform during the process.',
  },
  {
    category: 'disputes',
    question: 'Are there fees for dispute resolution?',
    answer:
      'Dispute resolution is included as part of the platform service at no additional cost. However, if a dispute is found to be frivolous or in bad faith, the losing party may be charged a penalty fee.',
  },
];

export function FAQsPage() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm mb-8"
          >
            <HelpCircle className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">We're Here to Help</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold mb-6"
          >
            Frequently Asked{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Questions
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12"
          >
            Find answers to common questions about FreelanceXchain
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
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-gray-50 dark:bg-dark-surface/50 border-gray-200 dark:border-white/10"
            />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span className="font-medium">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No questions found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface/50 backdrop-blur-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg font-semibold pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5 border-t border-gray-200 dark:border-white/5"
                    >
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed pt-4">{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-900/80 to-indigo-900/80 border border-primary-500/20 p-16 text-center">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="relative z-10">
              <MessageCircle className="w-16 h-16 text-primary-300 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Still Have Questions?</h2>
              <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                Our support team is here to help you 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-100">
                    Contact Support
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                    Learn More
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
