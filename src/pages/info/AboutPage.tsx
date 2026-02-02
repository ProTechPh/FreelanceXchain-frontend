import { Info, Target, Users, Shield, Zap, Globe } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Info className="w-12 h-12 text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">About FreelanceXchain</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Revolutionizing the freelance economy with blockchain technology, smart contracts, and AI-powered matching
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 mb-8">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-primary-400 mr-3" />
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            FreelanceXchain is on a mission to create a transparent, secure, and efficient marketplace for freelancers 
            and employers worldwide. By leveraging blockchain technology and smart contracts, we eliminate intermediaries, 
            reduce fees, and ensure fair payment terms for all parties involved.
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Blockchain Security */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="p-3 bg-primary-500/10 rounded-lg w-fit mb-4">
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Blockchain Security</h3>
            <p className="text-gray-400">
              All transactions are secured on the blockchain, ensuring transparency, immutability, and trust between parties.
            </p>
          </div>

          {/* Smart Contracts */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Contracts</h3>
            <p className="text-gray-400">
              Automated escrow and milestone-based payments ensure freelancers get paid fairly and on time.
            </p>
          </div>

          {/* AI Matching */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Matching</h3>
            <p className="text-gray-400">
              Our AI algorithms match freelancers with projects based on skills, experience, and preferences.
            </p>
          </div>

          {/* KYC Verification */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="p-3 bg-green-500/10 rounded-lg w-fit mb-4">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">KYC Verification</h3>
            <p className="text-gray-400">
              Identity verification ensures a trusted community of verified freelancers and employers.
            </p>
          </div>

          {/* Dispute Resolution */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="p-3 bg-orange-500/10 rounded-lg w-fit mb-4">
              <Target className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Dispute Resolution</h3>
            <p className="text-gray-400">
              Fair and transparent dispute resolution mechanism protects both freelancers and employers.
            </p>
          </div>

          {/* Global Reach */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="p-3 bg-cyan-500/10 rounded-lg w-fit mb-4">
              <Globe className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Global Marketplace</h3>
            <p className="text-gray-400">
              Connect with talent and opportunities from around the world with borderless payments.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Why Choose FreelanceXchain?</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Lower Fees:</strong> Blockchain technology eliminates intermediaries, 
                resulting in significantly lower transaction fees compared to traditional platforms.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Guaranteed Payments:</strong> Smart contract escrow ensures funds are 
                secured and released automatically upon milestone completion.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Transparent Reputation:</strong> Blockchain-based reputation system 
                provides an immutable record of work history and reviews.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Fast Payments:</strong> Cryptocurrency payments are processed instantly, 
                without waiting for bank transfers or payment processors.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Global Access:</strong> Work with anyone, anywhere, without currency 
                conversion fees or international payment restrictions.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Our Technology</h2>
          <p className="text-gray-300 mb-4">
            FreelanceXchain is built on cutting-edge technology to provide a secure, scalable, and user-friendly platform:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Blockchain Layer</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Ethereum-compatible smart contracts</li>
                <li>Decentralized escrow system</li>
                <li>Immutable transaction records</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">AI & Machine Learning</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Intelligent project-freelancer matching</li>
                <li>Skill extraction and analysis</li>
                <li>Personalized recommendations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Security</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>KYC verification integration</li>
                <li>End-to-end encryption</li>
                <li>Multi-factor authentication</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Infrastructure</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Scalable cloud architecture</li>
                <li>Real-time notifications</li>
                <li>High-performance database</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Our Team</h2>
          <p className="text-gray-300 text-lg">
            FreelanceXchain is built by a passionate team of blockchain developers, AI engineers, and freelance industry 
            experts dedicated to transforming the future of work. We believe in creating a fair, transparent, and 
            efficient marketplace that empowers both freelancers and employers.
          </p>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join the Revolution</h2>
          <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
            Be part of the future of freelancing. Whether you're a freelancer looking for opportunities or an 
            employer seeking talent, FreelanceXchain is your gateway to a better way of working.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </a>
            <a
              href="/how-it-works"
              className="px-8 py-3 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
