import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Play,
  BookOpen,
  Users,
  Briefcase,
  Zap,
  Shield,
  Coins,
  Star,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui';

const categories = ['All Tutorials', 'For Freelancers', 'For Employers', 'Advanced'];

const tutorials = [
  {
    id: 1,
    title: 'Getting Started as a Freelancer',
    description: 'Complete walkthrough from creating your account to landing your first project',
    category: 'For Freelancers',
    type: 'video',
    duration: '15 min',
    difficulty: 'Beginner',
    icon: Users,
    color: 'text-primary-400',
    bgColor: 'bg-primary-600/10',
    lessons: [
      'Creating and setting up your account',
      'Building an attractive profile',
      'Completing KYC verification',
      'Finding and applying to projects',
      'Writing your first proposal',
    ],
  },
  {
    id: 2,
    title: 'How to Post Your First Project',
    description: 'Step-by-step guide for employers to post projects and hire talent',
    category: 'For Employers',
    type: 'video',
    duration: '12 min',
    difficulty: 'Beginner',
    icon: Briefcase,
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    lessons: [
      'Setting up your employer account',
      'Defining project requirements',
      'Setting budget and timeline',
      'Reviewing and selecting proposals',
      'Awarding and starting a project',
    ],
  },
  {
    id: 3,
    title: 'Understanding Smart Contract Escrow',
    description: 'Learn how blockchain-based escrow protects both parties in transactions',
    category: 'Advanced',
    type: 'article',
    duration: '10 min',
    difficulty: 'Intermediate',
    icon: Shield,
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    lessons: [
      'What is smart contract escrow?',
      'How funds are secured on-chain',
      'Milestone-based payment release',
      'Handling disputes through escrow',
      'Withdrawing your earnings',
    ],
  },
  {
    id: 4,
    title: 'Mastering Proposal Writing',
    description: 'Advanced techniques to write proposals that win high-value projects',
    category: 'For Freelancers',
    type: 'video',
    duration: '20 min',
    difficulty: 'Intermediate',
    icon: Star,
    color: 'text-amber-400',
    bgColor: 'bg-amber-600/10',
    lessons: [
      'Understanding what clients want',
      'Structuring your proposal',
      'Showcasing relevant experience',
      'Pricing strategies that work',
      'Following up effectively',
    ],
  },
  {
    id: 5,
    title: 'Managing Multiple Projects Efficiently',
    description: 'Time management and organization tips for handling multiple clients',
    category: 'For Freelancers',
    type: 'article',
    duration: '8 min',
    difficulty: 'Intermediate',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/10',
    lessons: [
      'Setting up your workflow',
      'Using the dashboard effectively',
      'Communication best practices',
      'Meeting deadlines consistently',
      'Maintaining quality across projects',
    ],
  },
  {
    id: 6,
    title: 'Building Your On-Chain Reputation',
    description: 'Strategies to build and maintain a strong blockchain-based reputation',
    category: 'For Freelancers',
    type: 'video',
    duration: '14 min',
    difficulty: 'Beginner',
    icon: Star,
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/10',
    lessons: [
      'Why on-chain reputation matters',
      'Delivering quality work consistently',
      'Getting positive reviews',
      'Handling negative feedback',
      'Leveraging your reputation',
    ],
  },
  {
    id: 7,
    title: 'Advanced Hiring Strategies',
    description: 'How to find, evaluate, and hire the best freelancers for your projects',
    category: 'For Employers',
    type: 'video',
    duration: '18 min',
    difficulty: 'Advanced',
    icon: Users,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-600/10',
    lessons: [
      'Using AI-powered matching',
      'Evaluating freelancer profiles',
      'Conducting effective interviews',
      'Setting clear expectations',
      'Building long-term relationships',
    ],
  },
  {
    id: 8,
    title: 'Cryptocurrency Payments Guide',
    description: 'Everything you need to know about crypto payments on the platform',
    category: 'Advanced',
    type: 'article',
    duration: '12 min',
    difficulty: 'Intermediate',
    icon: Coins,
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    lessons: [
      'Connecting your crypto wallet',
      'Understanding gas fees',
      'Converting crypto to fiat',
      'Tax implications',
      'Security best practices',
    ],
  },
  {
    id: 9,
    title: 'Dispute Resolution Process',
    description: 'How to handle disputes professionally and get fair outcomes',
    category: 'Advanced',
    type: 'video',
    duration: '16 min',
    difficulty: 'Intermediate',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-600/10',
    lessons: [
      'When to open a dispute',
      'Gathering evidence',
      'Communicating during disputes',
      'Understanding arbitration',
      'Preventing future disputes',
    ],
  },
];

const difficultyColors = {
  Beginner: 'text-green-400 bg-green-600/10',
  Intermediate: 'text-amber-400 bg-amber-600/10',
  Advanced: 'text-red-400 bg-red-600/10',
};

export function TutorialsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Tutorials');

  const filteredTutorials =
    selectedCategory === 'All Tutorials'
      ? tutorials
      : tutorials.filter((tutorial) => tutorial.category === selectedCategory);

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
            <BookOpen className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-300">Learn at Your Own Pace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold mb-6"
          >
            Video Tutorials &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Guides
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            Master FreelanceXchain with our comprehensive tutorials and step-by-step guides
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

      {/* Tutorials Grid */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-2xl border border-white/10 ${tutorial.bgColor} backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer group`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl bg-dark-bg/80 flex items-center justify-center">
                    <tutorial.icon className={`w-7 h-7 ${tutorial.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {tutorial.type === 'video' ? (
                      <div className="p-2 rounded-full bg-primary-600/20">
                        <Play className="w-4 h-4 text-primary-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-blue-600/20">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary-400 transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">{tutorial.description}</p>

                {/* Meta Info */}
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      difficultyColors[tutorial.difficulty as keyof typeof difficultyColors]
                    }`}
                  >
                    {tutorial.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{tutorial.duration}</span>
                  </div>
                </div>

                {/* Lessons */}
                <div className="space-y-2 mb-6">
                  {tutorial.lessons.slice(0, 3).map((lesson, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{lesson}</span>
                    </div>
                  ))}
                  {tutorial.lessons.length > 3 && (
                    <div className="text-sm text-gray-500 pl-6">
                      +{tutorial.lessons.length - 3} more lessons
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-medium flex items-center justify-center gap-2 transition-colors group-hover:border-primary-500/50">
                  {tutorial.type === 'video' ? 'Watch Tutorial' : 'Read Guide'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
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
              <Zap className="w-16 h-16 text-primary-300 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                Put your knowledge into practice and start your freelancing journey today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-100">
                  Create Free Account
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                  Browse Projects
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
