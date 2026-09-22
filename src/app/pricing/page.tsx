import { InfoPage } from '@/components/public/info-page';
import { PricingContent } from '@/components/billing/pricing-content';

export const metadata = {
  title: 'Pricing | FreelanceXchain',
  description:
    'One plan, same price whether you hire or get hired. Free covers the full marketplace; Pro adds AI matching, AI proposals, and priority matching.',
};

export default function PricingPage() {
  return (
    <InfoPage
      title="One plan. Same price whether you hire or get hired."
      intro="Free covers the whole marketplace — projects, proposals, escrow, messaging and the entire analytics layer, including skill demand trends. Pro adds the AI matching and intelligence layer on top."
      badge="Pricing"
    >
      <PricingContent />
    </InfoPage>
  );
}
