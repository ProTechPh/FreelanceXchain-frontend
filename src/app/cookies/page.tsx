import { InfoPage } from "@/components/public/info-page";
import { CookiePolicyContent } from "@/components/public/cookie-policy-content";

export const metadata = {
  title: "Cookie Policy | FreelanceXchain",
  description: "A simple, transparent guide to how FreelanceXchain uses cookies to keep your account safe and customize your experience.",
};

export default function CookiePolicyPage() {
  return (
    <InfoPage
      title="Cookie Policy"
      badge="Simple & Transparent"
      intro="A plain-English guide to how we use cookies, what we save on your device, and how you can manage your preferences anytime."
    >
      <CookiePolicyContent />
    </InfoPage>
  );
}
