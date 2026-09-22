/**
 * The in-app FAQ, shown on the support page before anyone opens a ticket.
 *
 * One list serves freelancers and employers alike, so each section answers both
 * sides of the same mechanic — escrow is "when do I get paid?" to one reader and
 * "when is my money committed?" to the other, and both deserve an answer without
 * having to work out which half applies to them.
 *
 * Longer-form than `HELP_TOPICS` in ./help-topics.ts, which is the same material
 * cut down to a sentence for an inline hint beside a control. Where the two
 * overlap they agree on purpose.
 */

export interface FaqItem {
  /** Stable id, used as the accordion key. Unique across every section. */
  id: string;
  /** Phrased as the question the reader is actually asking. */
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export const SUPPORT_FAQ: FaqSection[] = [
  {
    title: 'Getting started',
    items: [
      {
        id: 'roles',
        question: 'What is the difference between a freelancer and an employer account?',
        answer:
          'A freelancer browses projects, sends proposals and gets paid from escrow. An employer posts projects, reviews proposals and funds the escrow those payments come from. Your dashboard, sidebar and search are built around whichever role you signed up as.',
      },
      {
        id: 'post-project',
        question: 'How do I post a project?',
        answer:
          'Employers post from Hiring → Post a project. You describe the work, add the skills it needs and break it into milestones. Freelancers can then find it in the marketplace and send you a proposal.',
      },
      {
        id: 'find-work',
        question: 'How do I find work that fits me?',
        answer:
          'Freelancers browse everything under Find work → Browse projects, and can search by keyword from the bar at the top of the dashboard. Save a search you run often and it will keep matching new projects for you in the background.',
      },
      {
        id: 'proposals',
        question: 'What happens after I send a proposal?',
        answer:
          'It appears in the employer\'s project for review, and in your own list under Find work → My proposals. The employer can accept it, decline it, or come back with a counter-offer, and you are notified either way.',
      },
      {
        id: 'portfolio',
        question: 'Where do I show off previous work?',
        answer:
          'Freelancers have a portfolio under Profile → Portfolio. Adding pieces there gives employers something concrete to judge alongside your proposal, which matters most before you have reviews on the platform.',
      },
    ],
  },
  {
    title: 'Identity verification',
    items: [
      {
        id: 'why-verify',
        question: 'Why do I need to verify my identity?',
        answer:
          'Verification earns the badge that employers and freelancers filter on, and it is what lets the platform arbitrate a dispute over real money. Both sides of the marketplace benefit from knowing the person opposite them is who they say they are.',
      },
      {
        id: 'how-verify',
        question: 'How do I get verified?',
        answer:
          'Open Verification from your account menu and start the check. It runs through Didit, our identity provider, and asks for a government ID and a live selfie.',
      },
      {
        id: 'verification-status',
        question: 'What do the verification statuses mean?',
        answer:
          'Only an approved status counts as verified. "Completed" means you finished your side and the submission is with our reviewers — it is not the final answer yet. You will be notified when a decision is made.',
      },
    ],
  },
  {
    title: 'Escrow and payments',
    items: [
      {
        id: 'what-is-escrow',
        question: 'What is escrow?',
        answer:
          'The money for a milestone is locked into a smart contract before the work starts. The employer cannot spend it elsewhere and the freelancer cannot take it early — it releases only when the deliverable is approved.',
      },
      {
        id: 'when-paid',
        question: 'When do I get paid?',
        answer:
          'As a freelancer, the moment the employer approves your milestone. The funds were already committed to escrow before you started, so approval releases them to your wallet rather than starting a payment.',
      },
      {
        id: 'funding',
        question: 'When does my money leave my wallet?',
        answer:
          'As an employer, when you fund a milestone — not when you post the project and not when you accept a proposal. Funding is what tells the freelancer it is safe to begin.',
      },
      {
        id: 'wallet',
        question: 'Why do I need a crypto wallet?',
        answer:
          'Escrow settles on Ethereum, so payouts arrive in a wallet rather than a bank account. Linking one is free and costs no gas; you only pay network fees when funds actually move.',
      },
      {
        id: 'refunds',
        question: 'Can an employer get funded money back?',
        answer:
          'Yes. An employer can request a refund on a funded milestone that has not been released. The request is reviewed rather than granted automatically, because the money is committed to the freelancer at that point.',
      },
      {
        id: 'transactions',
        question: 'Where can I see everything that has moved?',
        answer:
          'Freelancers have Work → Earnings and employers have Work → Transactions. Both show the on-chain record behind each payment, so the two sides are reading the same ledger.',
      },
    ],
  },
  {
    title: 'Contracts and milestones',
    items: [
      {
        id: 'milestones',
        question: 'Why split work into milestones?',
        answer:
          'Each milestone is funded, delivered and paid on its own. That keeps the amount at risk small for both sides, and it gives you a natural place to check the work before more money moves.',
      },
      {
        id: 'submit-work',
        question: 'How do I submit a deliverable?',
        answer:
          'Open the contract under Work → Contracts, find the milestone and submit it there with whatever files or links the employer needs. Submitting notifies them that it is ready to review.',
      },
      {
        id: 'approve-work',
        question: 'How do I review and approve a milestone?',
        answer:
          'Employers approve from the same contract page. Approving releases the escrowed funds immediately, so it is worth checking the deliverable against what the milestone described first.',
      },
      {
        id: 'rush',
        question: 'Can a deadline be brought forward mid-contract?',
        answer:
          'Either side can raise a rush upgrade on a contract. It is a proposal, not a change: the other party can accept it, decline it, or counter with different terms.',
      },
      {
        id: 'messages',
        question: 'How do I talk to the other party?',
        answer:
          'Every contract has Messages in the sidebar. Keeping the conversation there rather than off-platform means the record is available if a dispute is ever opened.',
      },
    ],
  },
  {
    title: 'Disputes',
    items: [
      {
        id: 'disagree',
        question: 'What happens if we disagree?',
        answer:
          'Either side can open a dispute and submit evidence. Arbiters review it against the on-chain record of what was funded, submitted and approved, so the timeline is not a matter of opinion.',
      },
      {
        id: 'open-dispute',
        question: 'How do I open one?',
        answer:
          'From Work → Disputes, or from the contract itself. You will be asked what went wrong and given somewhere to attach evidence supporting it.',
      },
      {
        id: 'dispute-outcome',
        question: 'What happens to the escrowed money during a dispute?',
        answer:
          'It stays locked while the dispute is reviewed — neither side can move it. The resolution decides where it goes, and both parties are notified of the outcome.',
      },
    ],
  },
  {
    title: 'Plan and billing',
    items: [
      {
        id: 'pro-plan',
        question: 'What does the Pro plan add?',
        answer:
          'Pro unlocks the AI-assisted features: recommended projects matched to your profile, and skill analysis. Everything to do with posting work, proposals, contracts and escrow is on the free plan.',
      },
      {
        id: 'manage-billing',
        question: 'Where do I manage my subscription?',
        answer:
          'Under Profile → Plan & billing. From there you can change or cancel your plan; payments are handled by Stripe, so card details never touch FreelanceXchain.',
      },
    ],
  },
  {
    title: 'Account and notifications',
    items: [
      {
        id: 'password-reset',
        question: 'I cannot sign in — what now?',
        answer:
          'Use the password reset link on the sign-in page, or sign in passwordlessly with a magic link sent to your email address. If neither reaches you, open a ticket below and we will look into the account.',
      },
      {
        id: 'mfa',
        question: 'Can I add a second factor to my account?',
        answer:
          'Yes — multi-factor authentication is available in Settings. It is worth turning on: this account can move money.',
      },
      {
        id: 'notifications',
        question: 'Can I change which emails I get?',
        answer:
          'Settings holds your email preferences. In-app notifications stay on for the things that need an answer — a proposal, an approval, a dispute — and live behind the bell in the top bar.',
      },
      {
        id: 'ticket-reply',
        question: 'How will I hear back about a support ticket?',
        answer:
          'You will get an in-app notification the moment we resolve it, and the reply appears on the ticket under "Your tickets" on this page.',
      },
    ],
  },
];

/**
 * Filter the FAQ by a free-text query, matching questions and answers alike.
 *
 * Sections that end up empty are dropped rather than rendered as bare headings.
 * An empty query returns everything, so the page can use this unconditionally.
 */
export function searchFaq(query: string, sections: FaqSection[] = SUPPORT_FAQ): FaqSection[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(needle) ||
          item.answer.toLowerCase().includes(needle)
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** Total number of questions, for the "N articles" line above the accordion. */
export function countFaqItems(sections: FaqSection[] = SUPPORT_FAQ): number {
  return sections.reduce((total, section) => total + section.items.length, 0);
}
