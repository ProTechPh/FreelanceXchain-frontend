import { Shield } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-dark-card border border-dark-border rounded-lg p-8">
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 text-primary-400 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          </div>

          <div className="text-gray-600 dark:text-gray-300 space-y-6">
            <p className="text-sm text-gray-400">Last Updated: January 2026</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
              <p>
                FreelanceXchain ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">2.1 Personal Information</h3>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Name, email address, and contact information</li>
                <li>Profile information (bio, skills, experience)</li>
                <li>Payment information and wallet addresses</li>
                <li>KYC verification documents (ID, proof of address)</li>
                <li>Communication data (messages, support tickets)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <p>When you use our platform, we automatically collect:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Blockchain transaction data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
              <p>We use the collected information for various purposes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>To provide, maintain, and improve our services</li>
                <li>To process transactions and send related information</li>
                <li>To verify your identity through KYC procedures</li>
                <li>To send administrative information and updates</li>
                <li>To respond to your comments and questions</li>
                <li>To detect, prevent, and address fraud and security issues</li>
                <li>To comply with legal obligations</li>
                <li>To personalize your experience and provide recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. KYC Data Processing</h2>
              <p>
                We partner with third-party KYC verification providers to verify your identity. Your KYC documents are:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Encrypted during transmission and storage</li>
                <li>Processed by certified KYC verification services</li>
                <li>Stored securely with restricted access</li>
                <li>Retained only as long as legally required</li>
                <li>Never shared with unauthorized parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Blockchain and Smart Contracts</h2>
              <p>
                Please note that blockchain transactions are public and permanent. Information recorded on the blockchain, 
                including wallet addresses and transaction amounts, cannot be deleted or modified. We do not control the 
                blockchain and cannot remove or alter blockchain data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Information Sharing and Disclosure</h2>
              <p>We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>With Service Providers:</strong> Third-party vendors who perform services on our behalf</li>
                <li><strong>For Legal Reasons:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
              </ul>
              <p className="mt-2">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data centers and infrastructure</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform. You can instruct your 
                browser to refuse all cookies or to indicate when a cookie is being sent. However, some features may not 
                function properly without cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
                Privacy Policy, unless a longer retention period is required by law. KYC documents are retained according 
                to regulatory requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Children's Privacy</h2>
              <p>
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If you become aware that a child has provided us with personal information, 
                please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy 
                Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">14. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="mt-2">
                Email: privacy@freelancexchain.com<br />
                Data Protection Officer: dpo@freelancexchain.com<br />
                Address: [Company Address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
