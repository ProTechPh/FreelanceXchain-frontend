'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Globe, Mail, X } from 'lucide-react';
import Link from 'next/link';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Platform',
		links: [
			{ title: 'Browse Projects', href: '/projects' },
			{ title: 'Find Talent', href: '/freelancers' },
			{ title: 'Leaderboard', href: '/leaderboard' },
			{ title: 'Status', href: '/status' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About Us', href: '/about' },
			{ title: 'Blog', href: '/blog' },
			{ title: 'Careers', href: '/careers' },
			{ title: 'Contact', href: '/contact' },
		],
	},
	{
		label: 'Legal',
		links: [
			{ title: 'Terms of Service', href: '/terms' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Cookie Policy', href: '/cookies' },
		],
	},
	{
		label: 'Connect',
		links: [
			{ title: 'Website', href: '#', icon: Globe },
			{ title: 'Email', href: '#', icon: Mail },
			{ title: 'X (Twitter)', href: '#', icon: X },
		],
	},
];

export function FooterSection() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
			<div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-4">
					<Link href="/" className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
							<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						</div>
						<span className="font-bold text-lg gradient-text">FreelanceX</span>
					</Link>
					<p className="text-muted-foreground text-sm">
						The decentralized freelance marketplace powered by blockchain and AI.
					</p>
					<p className="text-muted-foreground mt-8 text-sm md:mt-0">
						© {new Date().getFullYear()} FreelanceXchain. All rights reserved.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs font-semibold">{section.label}</h3>
								<ul className="text-muted-foreground mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<Link
												href={link.href}
												className="hover:text-foreground inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-1 size-4" />}
												{link.title}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
