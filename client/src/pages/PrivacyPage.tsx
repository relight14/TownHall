import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-serif font-bold text-navy mb-2">LedeWire Privacy Policy</h1>
        <p className="text-slate mb-8 font-sans">Last Updated: September 16, 2025</p>

        <div className="prose prose-slate max-w-none font-body prose-headings:font-serif prose-headings:text-navy prose-a:text-gold hover:prose-a:text-gold-dark">
          <p className="text-gray-700 mb-6">
            We are Relight Media Inc ("LedeWire", "Company", "we", "us", "our"), a company registered in Utah, United States at 3141 American Saddler Dr., Park City, UT 84060. This Privacy Policy describes how we collect, use, and disclose your information, including information that can be used to identify you, directly or indirectly, as defined by applicable laws ("Personal Information") in connection with our website at{' '}
            <a href="http://www.ledewire.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              http://www.ledewire.com
            </a>{' '}
            and any of its subdomains, and any other websites owned and hosted by us (the "Site").
          </p>

          <p className="text-gray-700 mb-6">
            If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at{' '}
            <a href="mailto:privacy@ledewire.com" className="text-blue-600 hover:underline">privacy@ledewire.com</a>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">What Personal Information We Collect</h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information That You Provide or Authorize Us to Collect</h3>
          <p className="text-gray-700 mb-4">
            This is information that you provide directly to us or authorize us to collect from our affiliates and non-affiliated third-party partners. The Personal Information that you provide or authorize us to collect may include:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Contact and Demographic Information.</strong> Full legal name, username, email address, date of birth, physical address, telephone number, or other similar identity verification information.</li>
            <li><strong>Payment Information.</strong> Information related to your authorized payment method (both for making purchases or for receiving payouts), including your payment instrument number, security code, expiration date, etc. We use third parties to process our payments.</li>
            <li><strong>Sensitive or Financial Information.</strong> If you are a writer, you may have to share your business name, business address, social security number and/or employer identification number, other tax identification numbers, bank account information.</li>
            <li><strong>Social Media.</strong> We may provide you with the option to register with us using your existing social media account details. If you choose to register in that way, we will collect certain profile information from your social media account provider.</li>
            <li><strong>Support Information.</strong> This may include audio, electronic or similar information, such as the information collected when you email or call our customer support center.</li>
            <li><strong>Survey Information.</strong> Information filled in if you complete any surveys on our user experience.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information Automatically Collected</h3>
          <p className="text-gray-700 mb-4">
            Whenever you interact with the Site or the Services, we may automatically receive and record information from your computer, browser and/or mobile device, which may include:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Location Information.</strong> IP address and geolocation of your device.</li>
            <li><strong>Device Information.</strong> Browser or type of device, operating system, settings, browser, mobile carrier, application ID.</li>
            <li><strong>Usage Data.</strong> Log and usage data collected from our servers when you access the Site or the Services, including the types and categories of content you engage with, the features you use, the actions you take, and the time, frequency and duration of your activities on the Site.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies and Similar Technologies</h3>
          <p className="text-gray-700 mb-6">
            We or third parties may use cookies on our Site. A cookie is a small text file placed in visitors' computer browsers to store their preferences. Cookies help provide additional functionality to the Services, customize users' experiences with the Services and help us analyze Services usage more accurately for research, advertising, and marketing purposes.
          </p>
          <p className="text-gray-700 mb-6">
            We use cookies to maintain your session and authentication state, remember your preferences, and analyze how you use our services. You can control cookies through your browser settings, though disabling cookies may affect certain functionality.
          </p>
          <p className="text-gray-700 mb-6">
            <strong>Google Analytics:</strong> Please note that we use Google Analytics cookies for data analytics purposes. You can find more information on how Google uses data from these cookies at{' '}
            <a href="https://google.com/policies/privacy/partners" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              google.com/policies/privacy/partners
            </a>. You may choose to opt-out of Google Analytics by installing their{' '}
            <a href="https://tools.google.com/dlpage/gaoptout/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              opt-out browser add-on
            </a>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">How We Use Personal Information</h2>
          <p className="text-gray-700 mb-4">We may use the Personal Information we collect for the following purposes:</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">To Provide Services</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>To verify your identity to comply with industry requirements, self-regulatory guidelines, applicable laws and regulations</li>
            <li>To set up and maintain your LedeWire Account</li>
            <li>To personalize the Services when you visit our Site</li>
            <li>To monitor your use of the Services</li>
            <li>To maintain our Services and operations</li>
            <li>To process transactions made through the Services</li>
            <li>To ensure the integrity and security of our Services</li>
            <li>To detect and protect against security incidents and malicious, deceptive, fraudulent, or illegal activity</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">For Analytics, Research, and Service Improvement</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>To monitor and measure your use of our products and Services in an effort to better understand you and our other users</li>
            <li>To conduct testing, research, and surveys to understand how our Services are being used and how they can be improved</li>
            <li>To conduct analytics, such as usage trends</li>
            <li>To improve the content and functionality of the Services</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">To Communicate with You</h3>
          <p className="text-gray-700 mb-4">To contact you by email, postal mail, push notifications, in-app messages, phone, or SMS, as permitted by applicable law, to provide you with:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Information regarding your LedeWire Account or transactions made through your LedeWire Account</li>
            <li>Opportunities, alerts, and promotions available through the Services</li>
            <li>Content that we think may be of interest to you</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">How We Disclose Personal Information</h2>
          <p className="text-gray-700 mb-4">
            <strong>We do not sell your Personal Information to any party.</strong> We may disclose your Personal Information to the following categories of recipients for our business or commercial purposes:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>LedeWire Affiliates.</strong> We may disclose your Personal Information to affiliated companies for purposes consistent with this Privacy Policy.</li>
            <li><strong>Readers and Other Members.</strong> If you are a writer, we may share your Personal Information with readers and any other users of the Site and the Services.</li>
            <li><strong>Writers.</strong> If you are a reader, we may share your Personal Information, including on usage data and other analytics, with writers whose content you have purchased or otherwise engaged with.</li>
            <li><strong>Third-Party Service Providers.</strong> LedeWire, like many businesses, hires other companies and contractors to provide certain business-related services. When we employ another entity to perform a function of this nature, we only provide them with the information that they need to perform their specific function.</li>
            <li><strong>Third-Party Social Media Platforms.</strong> If you access our Site or our Services or register for a LedeWire Account by signing in using your social media credentials, you may be asked to give such third-party websites access to information about your LedeWire Account.</li>
            <li><strong>Business Partners.</strong> When we partner with other businesses to provide content, products, or services to you.</li>
            <li><strong>Potential Parties to a Corporate Transaction.</strong> We may disclose your Personal Information to actual or potential buyers in connection with any actual or proposed purchase, merger, acquisition, reorganization, financing, bankruptcy, receivership, sale of company assets, or transition of service to another provider.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Your Rights</h2>
          <p className="text-gray-700 mb-6">
            Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, delete, or port your data. To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@ledewire.com" className="text-blue-600 hover:underline">privacy@ledewire.com</a>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Data Security</h2>
          <p className="text-gray-700 mb-6">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-6">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <div className="bg-gray-100 rounded-lg p-6 mt-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h3>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@ledewire.com" className="text-blue-600 hover:underline">privacy@ledewire.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
