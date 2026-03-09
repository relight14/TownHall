import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gold hover:text-gold-dark mb-8 font-sans"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-serif font-bold text-navy mb-2">LedeWire Terms of Service</h1>
        <p className="text-slate mb-8 font-sans">Last updated: September 12, 2025</p>

        <div className="prose prose-slate max-w-none font-body prose-headings:font-serif prose-headings:text-navy prose-a:text-gold hover:prose-a:text-gold-dark">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-amber-800 text-sm font-medium">
              PLEASE READ THESE TERMS CAREFULLY BEFORE USING OUR SITE OR OUR SERVICES. BY AGREEING TO THESE TERMS, YOU WILL BECOME SUBJECT TO AN ARBITRATION PROVISION WITH CLASS ACTION AND JURY TRIAL WAIVERS.
            </p>
          </div>

          <p className="text-gray-700 mb-6">
            We are Relight Media Inc ("LedeWire", "Company", "we", "us", "our"), a company registered in Utah, United States at 3141 American Saddler Dr., Park City, UT 84060.
          </p>

          <p className="text-gray-700 mb-6">
            These legal terms (the "Legal Terms") govern your use of our website at{' '}
            <a href="http://www.ledewire.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              http://www.ledewire.com
            </a>{' '}
            and any of its subdomains, and any other websites owned and hosted by us (the "Site"), as well as any of our other products and services offered on or through our Site (the "Services"). These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and us, concerning your access to and use of the Services.
          </p>

          <p className="text-gray-700 mb-6">
            You can contact us by phone at 415.324.9523, email at{' '}
            <a href="mailto:legal@ledewire.com" className="text-blue-600 hover:underline">legal@ledewire.com</a>, or by mail to 3141 American Saddler Dr., Park City, UT 84060, United States.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Services</h2>
          <p className="text-gray-700 mb-6">
            We are building a platform for thoughtful, unbiased content by allowing writers to monetize their work on their terms and enabling readers to connect with content that speaks to them while supporting those writers.
          </p>
          <p className="text-gray-700 mb-6">
            Our business is still growing, and so our Site and our Services may change from time to time. We may offer new features, and certain other features may become unavailable. We may, in our discretion, update and amend these Legal Terms from time to time, including by adding, deleting or modifying terms. We will alert you about any changes by updating the "Last updated" date of these Legal Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to review these Legal Terms periodically.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Your Account</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Eligibility</h3>
          <p className="text-gray-700 mb-4">You will need to create an account ("LedeWire Account") with us and log into our Site to use our Services. To be eligible to use our Services, you must:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Reside in the United States.</strong> While we hope to offer our Services globally, we are starting with the United States. As of right now, nothing on our Site is considered a solicitation to sell products or services to non-U.S. persons or subject us to non-U.S. laws or regulations.</li>
            <li><strong>Be of legal age in your state of residence.</strong> You must be at least 18 years old.</li>
            <li><strong>Provide your full legal name</strong> and have a valid and unique email address.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Account Security and Guidelines</h3>
          <p className="text-gray-700 mb-6">
            You agree to keep your password confidential and may not allow others to use your LedeWire Account. You are responsible for all activity that occurs under your LedeWire Account, including any activity by unauthorized users.
          </p>
          <p className="text-gray-700 mb-6">
            We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Account Deletion; Termination and Suspension</h3>
          <p className="text-gray-700 mb-6">
            You can permanently delete your LedeWire Account at any time by emailing{' '}
            <a href="mailto:hello@ledewire.com" className="text-blue-600 hover:underline">hello@ledewire.com</a>.
          </p>
          <p className="text-gray-700 mb-6">
            We can terminate or suspend your LedeWire Account, remove any Content and/or deny your access to all or any portion of the Site or the Services, at any time, without prior notice, and at our sole discretion.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">You as a Reader</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Credits</h3>
          <p className="text-gray-700 mb-6">
            As a reader, you can purchase credits ("Credits") through your LedeWire Account to buy a writer's content ("Contributions") offered by writers through our Site. Credits may only be redeemed through the Site on our Services, have no cash value, are non-refundable and are not transferable unless specified otherwise. Unless otherwise disclosed to you at the time of purchase or subject to promotional terms and conditions, or unless you terminate your LedeWire Account, Credits do not expire.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Payment</h3>
          <p className="text-gray-700 mb-6">
            You may purchase Credits using approved forms of payment, which include but may not be limited to credit cards issued by Visa, Mastercard, American Express, and Discover. Payments are processed through a third-party provider, and additional fees may be charged by your card issuer, network, or the third-party provider per their terms of service or other agreements.
          </p>
          <p className="text-gray-700 mb-6">
            You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. We are not responsible for failed transactions that are due to errors in the payment information submitted to us. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Purchased Contributions</h3>
          <p className="text-gray-700 mb-6">
            When you purchase Contributions, you are purchasing a limited, non-exclusive, non-transferable, non-sublicensable, perpetual, and revocable license to access and make personal and non-commercial use of the purchased Contribution. This license does not include any resale or commercial use of purchased Contribution.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Refund Policy</h3>
          <p className="text-gray-700 mb-6">
            Once purchased, Credits are not refundable. Contributions purchased are generally not refundable after they have been purchased, but if you have made an error (e.g., selected the wrong Contribution for purchase), please promptly reach out to our customer support team at{' '}
            <a href="mailto:hello@ledewire.com" className="text-blue-600 hover:underline">hello@ledewire.com</a>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">You as a Writer</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Payment and Fees</h3>
          <p className="text-gray-700 mb-4">As a writer, you may make your Contributions available through the Site or our Services. You can set your own pricing in terms of Credits.</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Platform Fee.</strong> We retain a 10% platform fee on each purchase by a reader.</li>
            <li><strong>Processing Fees.</strong> We use a third-party processor to process payments. They may charge additional fees per their terms of service.</li>
            <li><strong>Payout Schedule.</strong> Earnings are paid out monthly, net of fees and chargebacks, provided you have met all identity verification and other requirements disclosed to you.</li>
            <li><strong>Chargebacks and Refunds.</strong> We reserve the right to deduct chargebacks or reader refunds from your future payouts.</li>
            <li><strong>Currency.</strong> Payouts are in US Dollars.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Tax</h3>
          <p className="text-gray-700 mb-6">
            In order to satisfy our tax obligations, we collect tax identification information and, in certain circumstances, report this information and earnings to tax authorities as legally required. For example, if you are located in the United States or are a United States citizen who has earned $600 or more, we are required to issue you a Form 1099-K at year end.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">IP Rights in Your Contributions</h3>
          <p className="text-gray-700 mb-6">
            As a writer, you retain full ownership of all Contributions you create and publish on our Site or through our Services. This includes but is not limited to text, images, video, audio, and data. By posting your Contributions on our Site or through our Services, you represent and warrant that the Contributions are your own work and do not infringe the intellectual property rights of a third party.
          </p>
          <p className="text-gray-700 mb-6">
            You may publish, license or distribute your Contributions on other platforms, websites, services or social media channels at any time. We do not claim exclusivity over your work.
          </p>

          <div className="bg-gray-100 rounded-lg p-6 mt-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h3>
            <p className="text-gray-700">
              If you have questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@ledewire.com" className="text-blue-600 hover:underline">legal@ledewire.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
