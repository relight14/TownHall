import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'ledewire_cookie_consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-white border border-navy/10 rounded-xl shadow-xl shadow-navy/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-navy font-sans font-medium mb-1">We use cookies</h3>
              <p className="text-slate text-sm font-body">
                We use cookies to keep you signed in and improve your experience. By continuing to use this site, you agree to our{' '}
                <Link to="/privacy" className="text-gold hover:underline" data-testid="link-cookie-privacy">Privacy Policy</Link>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-initial px-4 py-2 text-slate hover:text-navy text-sm font-sans font-medium transition-colors"
              data-testid="button-decline-cookies"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-6 py-2 bg-gold hover:bg-gold-light text-white text-sm font-sans font-medium rounded-lg transition-colors"
              data-testid="button-accept-cookies"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
