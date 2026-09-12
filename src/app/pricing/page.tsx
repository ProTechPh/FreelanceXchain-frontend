import { InfoPage } from '@/components/public/info-page';
import { PricingContent } from '@/components/billing/pricing-content';

export const metadata = {
  title: 'Pricing | FreelanceXchain',
  description:
    'One plan, same price whether you hire or get hired. Free covers the full marketplace; Pro adds AI matching, AI proposals, your analytics and priority matching.',
};

export default function PricingPage() {
  return (
    <InfoPage
      title="One plan. Same price whether you hire or get hired."
      intro="Free covers the whole marketplace — projects, proposals, escrow and messaging. Pro adds the AI matching and analytics layer on top."
      badge="Pricing"
    >
      <PricingContent />
    </InfoPage>
  );
}
