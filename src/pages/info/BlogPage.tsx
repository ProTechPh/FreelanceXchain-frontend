import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui';

const categories = ['All', 'Platform Updates', 'Success Stories', 'Tips & Tricks', 'Blockchain', 'AI & Technology'];

const blogPosts = [
  {
    id: 1,
    title: 'Introducing AI-Powered Project Matching: Find Your Perfect Gig Faster',
    excerpt:
      'We\'re excited to announce our new AI matching system that analyzes your skills, experience, and preferences to recommend the best projects for you.',
    category: 'Platform Updates',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    featured: true,
    tags: ['AI', 'Matching', 'Features'],
  },
  {
    id: 2,
    title: 'How Maria Built a $100K Freelance Business on FreelanceXchain',
    excerpt:
      'From her first project to becoming a top-rated freelancer, Maria shares her journey and the strategies that helped her succeed on our platform.',
    category: 'Success Stories',
    author: 'John Martinez',
    date: '2024-01-12',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Success', 'Freelancer', 'Case Study'],
  },
  {
    id: 3,
    title: 'Smart Contract Security: How We Keep Your Funds Safe',
    excerpt:
      'Learn about the multiple layers of security we\'ve implemented to protect your payments, from audited smart contracts to multi-signature wallets.',
    category: 'Blockchain',
    author: 'Alex Thompson',
    date: '2024-01-10',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Security', 'Blockchain', 'Smart Contracts'],
  },
  {
    id: 4,
    title: '10 Tips for Writing Proposals That Win Projects',
    excerpt:
      'Master the art of proposal writing with these proven strategies from our top freelancers. Learn what employers really want to see.',
    category: 'Tips & Tricks',
    author: 'Emily Rodriguez',
    date: '2024-01-08',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Proposals', 'Freelancing', 'Tips'],
  },
  {
    id: 5,
    title: 'Platform Update: New Dashboard and Analytics Features',
    excerpt:
      'Check out our redesigned dashboard with real-time analytics, earnings tracking, and project insights to help you make better decisions.',
    category: 'Platform Updates',
    author: 'David Kim',
    date: '2024-01-05',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Updates', 'Dashboard', 'Analytics'],
  },
  {
    id: 6,
    title: 'Understanding On-Chain Reputation: Your Digital Professional Identity',
    excerpt:
      'Discover how blockchain-based reputation works and why it\'s more valuable than traditional platform ratings.',
    category: 'Blockchain',
    author: 'Lisa Wang',
    date: '2024-01-03',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Reputation', 'Blockchain', 'Identity'],
  },
  {
    id: 7,
    title: 'From Zero to Hero: Tech Startup Finds Perfect Development Team',
    excerpt:
      'How a small startup used FreelanceXchain to build their entire tech team and launch their product in just 3 months.',
    category: 'Success Stories',
    author: 'Michael Brown',
    date: '2024-01-01',
    readTime: '9 min',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Success', 'Employer', 'Startup'],
  },
  {
    id: 8,
    title: 'Maximizing Your Earnings: Pricing Strategies for Freelancers',
    excerpt:
      'Learn how to price your services competitively while maximizing your income. Includes real examples and market data.',
    category: 'Tips & Tricks',
    author: 'Rachel Green',
    date: '2023-12-28',
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop',
    featured: false,
    tags: ['Pricing', 'Strategy', 'Earnings'],
  },
];

export function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

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
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-300">Latest Updates & Stories</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold mb-6"
          >
            FreelanceXchain{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Blog
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            Platform updates, success stories, and insights from the world of decentralized freelancing
          </motion.p>
        </div>
      </section>

      {/* Categories */}
      <section className="relative pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'All' && (
        <section className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-white/10 bg-dark-surface/50 backdrop-blur-sm hover:scale-[1.02] transition-transform cursor-pointer group"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="relative h-64 lg:h-auto overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 px-4 py-2 bg-primary-600 rounded-full text-sm font-bold">
                    Featured
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-primary-400 px-3 py-1 rounded-full bg-primary-600/10">
                      {featuredPost.category}
                    </span>
                    {featuredPost.tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-3xl font-bold mb-4 group-hover:text-primary-400 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-400 mb-6 leading-relaxed">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">By {featuredPost.author}</span>
                    <ArrowRight className="w-5 h-5 text-primary-400 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-dark-surface/50 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-primary-400 px-3 py-1 rounded-full bg-primary-600/10">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-400">{post.author}</span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-900/80 to-indigo-900/80 border border-primary-500/20 p-16 text-center">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="relative z-10">
              <TrendingUp className="w-16 h-16 text-primary-300 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Stay Updated</h2>
              <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                Subscribe to our newsletter for the latest platform updates, tips, and success stories
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-white/40"
                />
                <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-100 rounded-full">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
