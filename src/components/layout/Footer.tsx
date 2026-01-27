import { Link } from 'react-router-dom';
import {
    Twitter,
    Github,
    Linkedin,
    Send,
    Zap
} from 'lucide-react';
import { Button, Input } from '../ui';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-dark-bg border-t border-white/5 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                                <Zap className="w-5 h-5 text-white fill-current" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">
                                Freelance<span className="text-primary-400">Xchain</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            The world's first decentralized freelance marketplace powered by AI and Blockchain technology.
                            Fair, transparent, and secure.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Platform</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/projects" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Browse Projects
                                </Link>
                            </li>
                            <li>
                                <Link to="/freelancers" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Find Talent
                                </Link>
                            </li>
                            <li>
                                <Link to="/how-it-works" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    How it Works
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Success Stories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/help-center" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link to="/tutorials" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Tutorials
                                </Link>
                            </li>
                            <li>
                                <Link to="/faqs" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Contact Support
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Subscribe to our newsletter for the latest updates and features.
                        </p>
                        <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                            <Input
                                placeholder="Enter your email"
                                type="email"
                                className="bg-white/5 border-white/10 focus:border-primary-500"
                            />
                            <Button variant="primary" size="md" className="w-full">
                                Subscribe <Send className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} FreelanceXchain. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                        <Link to="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</Link>
                        <Link to="#" className="text-gray-500 hover:text-white text-sm transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
