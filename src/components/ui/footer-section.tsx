'use client';

import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkle } from '@phosphor-icons/react';
import Link from 'next/link';

interface FooterLink {
	title: string;
	href: string;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'AI Apply', href: '/#features' },
			{ title: 'Personalized Documents', href: '/#features' },
			{ title: 'Application Tracking', href: '/#features' },
			{ title: 'Smart Escrow', href: '/#features' },
			{ title: 'Browse Projects', href: '/projects' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Compare Platforms', href: '/#compare' },
			{ title: 'Verified Reviews', href: '/#reviews' },
			{ title: 'FAQs & Help', href: '/#faq' },
			{ title: 'Blog & Guides', href: '/blog' },
			{ title: 'Tutorials', href: '/tutorials' },
		],
	},
	{
		label: 'Explore',
		links: [
			{ title: 'Browse Projects', href: '/projects' },
			{ title: 'Find Talent', href: '/freelancers' },
			{ title: 'Leaderboard', href: '/leaderboard' },
			{ title: 'About Us', href: '/about' },
			{ title: 'Contact Support', href: '/contact' },
		],
	},
	{
		label: 'Legal',
		links: [
			{ title: 'Terms of Service', href: '/terms' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Security & Trust', href: '/status' },
		],
	},
];

export function FooterSection() {
	const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
		if (href.startsWith('/#') || href.startsWith('#')) {
			const hash = href.replace('/#', '').replace('#', '');
			const target = document.getElementById(hash);
			if (target) {
				e.preventDefault();
				const headerOffset = 80;
				const bodyRect = document.body.getBoundingClientRect().top;
				const elementRect = target.getBoundingClientRect().top;
				const elementPosition = elementRect - bodyRect;
				const offsetPosition = elementPosition - headerOffset;

				window.scrollTo({
					top: offsetPosition,
					behavior: 'smooth',
				});
				window.history.pushState(null, '', `#${hash}`);
			}
		}
	};

	return (
		<footer className="w-full border-t border-border/60 bg-background px-6 py-12 lg:py-16">
			<div className="max-w-6xl mx-auto">
				<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-12">
					<AnimatedContainer className="space-y-4">
						<Link href="/" className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-xs">
								<Sparkle className="w-4 h-4 text-primary-foreground fill-primary-foreground" weight="fill" />
							</div>
							<span className="font-extrabold text-lg text-foreground tracking-tight">
								FreelanceXchain
							</span>
						</Link>
						<p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-sm">
							Helping candidates and freelancers land dream roles and high-value contracts faster with AI-native tailoring and instant smart escrow.
						</p>
						<div className="pt-4 text-xs text-muted-foreground">
							© {new Date().getFullYear()} FreelanceXchain, Inc. All rights reserved.
						</div>
					</AnimatedContainer>

					<div className="grid grid-cols-2 gap-8 sm:grid-cols-4 xl:col-span-2">
						{footerLinks.map((section, index) => (
							<AnimatedContainer key={section.label} delay={0.05 + index * 0.04}>
								<div>
									<p className="text-xs font-bold text-foreground uppercase tracking-wider">
										{section.label}
									</p>
									<ul className="text-muted-foreground mt-4 space-y-2.5 text-xs font-medium">
										{section.links.map((link) => (
											<li key={link.title}>
												<Link
													href={link.href}
													onClick={(e) => handleSmoothScroll(e, link.href)}
													className="hover:text-primary transition-colors duration-150"
												>
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
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

