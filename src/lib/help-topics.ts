/**
 * Short explanations for the concepts this product cannot avoid.
 *
 * Escrow, milestones and KYC are the three things a new user meets before they
 * have any reason to trust them, and the tour only says each one once. These are
 * the same explanations, kept where the control actually is.
 *
 * Each topic names the tour step that covers it in more depth, so the hint can
 * hand off rather than repeat.
 */
export interface HelpTopic {
  /** Button label. Phrased as the question the reader is actually asking. */
  question: string;
  answer: string;
  /** Step id in `onboarding-tour.ts`, if the tour goes further on this. */
  step?: string;
}

export const HELP_TOPICS = {
  escrow: {
    question: 'What is escrow?',
    answer:
      'The money for a milestone is locked into a smart contract before the work starts. The employer cannot spend it elsewhere and the freelancer cannot take it early — it releases only when the deliverable is approved.',
    step: 'wallet',
  },
  milestones: {
    question: 'Why split work into milestones?',
    answer:
      'Each milestone is funded, delivered and paid on its own. That keeps the amount at risk small for both sides, and it gives you a natural place to check the work before more money moves.',
    step: 'contracts',
  },
  kyc: {
    question: 'Why verify my identity?',
    answer:
      'Verification earns the badge that employers and freelancers filter on, and it is what lets the platform arbitrate a dispute over real money. Only an approved status counts — "completed" means it is still under review.',
    step: 'profile',
  },
  wallet: {
    question: 'Why do I need a wallet?',
    answer:
      'Escrow settles on Ethereum, so payouts arrive in a wallet rather than a bank account. Linking one is free and costs no gas; you only pay network fees when funds actually move.',
    step: 'wallet',
  },
  disputes: {
    question: 'What happens if we disagree?',
    answer:
      'Either side can open a dispute and submit evidence. Arbiters review it against the on-chain record of what was funded, submitted and approved, so the timeline is not a matter of opinion.',
    step: 'messages',
  },
} satisfies Record<string, HelpTopic>;

export type HelpTopicId = keyof typeof HELP_TOPICS;
