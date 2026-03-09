import { FileText } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-dark-card border border-dark-border rounded-lg p-8">
          <div className="flex items-center mb-6">
            <FileText className="w-8 h-8 text-primary-400 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          </div>

          <div className="text-gray-600 dark:text-gray-300 space-y-6">
            <p className="text-sm text-gray-400">Last Updated: January 2026</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using FreelanceXchain, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily access the materials (information or software) on FreelanceXchain's platform 
                for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>You may not modify or copy the materials</li>
                <li>You may not use the materials for any commercial purpose</li>
                <li>You may not attempt to decompile or reverse engineer any software</li>
                <li>You may not remove any copyright or other proprietary notations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide accurate, complete, and current information. 
                Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <p className="mt-2">
                You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. KYC Verification</h2>
              <p>
                Users must complete Know Your Customer (KYC) verification to access certain features of the platform. 
                By submitting KYC information, you consent to the collection, processing, and storage of your personal data 
                in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Smart Contracts and Blockchain</h2>
              <p>
                FreelanceXchain utilizes blockchain technology and smart contracts for escrow and payment processing. 
                You acknowledge that:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Blockchain transactions are irreversible</li>
                <li>You are responsible for maintaining the security of your wallet</li>
                <li>Network fees (gas fees) may apply to transactions</li>
                <li>Smart contract execution is automated and cannot be reversed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Dispute Resolution</h2>
              <p>
                In the event of a dispute between parties, FreelanceXchain provides a dispute resolution mechanism. 
                The platform's decision in disputes is final and binding. Users agree to abide by the dispute resolution process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Fees and Payments</h2>
              <p>
                FreelanceXchain charges service fees for facilitating transactions. All fees are clearly disclosed before 
                transaction confirmation. Payment processing is handled through blockchain smart contracts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Prohibited Activities</h2>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Violating laws and regulations</li>
                <li>Infringing on intellectual property rights</li>
                <li>Transmitting malicious code or viruses</li>
                <li>Attempting to gain unauthorized access to the platform</li>
                <li>Engaging in fraudulent activities</li>
                <li>Harassing or threatening other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
              <p>
                FreelanceXchain shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes 
                by posting the new Terms on this page. Your continued use of the platform after any changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="mt-2">
                Email: legal@freelancexchain.com<br />
                Address: [Company Address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
