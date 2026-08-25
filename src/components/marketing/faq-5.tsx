import { Badge } from "@/components/ui/badge";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Faq5Props {
  badge?: string;
  heading?: string;
  description?: string;
  faqs?: FaqItem[];
}

const defaultFaqs: FaqItem[] = [
  {
    question: "How does the smart escrow system work?",
    answer:
      "When a project is created, funds are locked in an Ethereum smart contract. As each milestone is completed and approved by the employer, the corresponding funds are automatically released to the freelancer. This ensures both parties are protected throughout the project.",
  },
  {
    question: "What fees does FreelanceXchain charge?",
    answer:
      "FreelanceXchain charges a minimal platform fee of 5% per transaction — significantly lower than traditional freelance platforms. Because we use decentralized infrastructure, we keep our overhead low and pass the savings to you.",
  },
  {
    question: "How is my reputation calculated on-chain?",
    answer:
      "Your reputation is an immutable, transparent score stored on the Ethereum blockchain. It's calculated based on completed projects, client ratings, dispute history, and on-time delivery. Once recorded, it cannot be altered or faked, ensuring genuine trust across the platform.",
  },
  {
    question: "What is the KYC verification process?",
    answer:
      "We use Didit for identity verification across 220+ countries. The process is quick and secure — simply upload your government-issued ID and take a selfie. Once verified, your identity badge is displayed on your profile, increasing trust with potential employers or freelancers.",
  },
  {
    question: "How does AI skill matching work?",
    answer:
      "Our AI analyzes your skills, work history, and project requirements to find the best matches. It learns from successful project outcomes to continuously improve recommendations. Employers get curated freelancer suggestions, and freelancers receive personalized project recommendations.",
  },
  {
    question: "What happens if there's a dispute?",
    answer:
      "Disputes are handled through our transparent resolution system. Both parties submit evidence, and our admin team reviews the case. All dispute records are stored on-chain for full transparency. Fair outcomes are guaranteed through our structured arbitration process.",
  },
  {
    question: "Can I work from any country?",
    answer:
      "Yes! FreelanceXchain is a global platform operating in 85+ countries. Our KYC system supports international verification, and payments are handled in cryptocurrency, eliminating cross-border payment delays and currency conversion issues.",
  },
  {
    question: "How do I get started as a freelancer?",
    answer:
      "Simply create an account, select the Freelancer role, complete your KYC verification, and set up your profile with skills and portfolio. You can then browse projects, submit proposals, and start earning. The AI matching system will also suggest relevant projects based on your profile.",
  },
];

export const Faq5 = ({
  badge = "FAQ",
  heading = "Common Questions & Answers",
  description = "Find out all the essential details about our platform and how it can serve your needs.",
  faqs = defaultFaqs,
}: Faq5Props) => {
  return (
    <section className="py-32">
      <div className="container">
        <div className="text-center">
          <Badge className="text-xs font-medium">{badge}</Badge>
          <h1 className="mt-4 text-4xl font-semibold">{heading}</h1>
          <p className="mt-6 font-medium text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-screen-sm">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-8 flex gap-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-secondary font-mono text-xs text-primary">
                {index + 1}
              </span>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{faq.question}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
