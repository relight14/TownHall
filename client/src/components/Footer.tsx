import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-cream py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-xl font-bold text-navy font-serif">The Commons</span>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/terms" className="text-gray-500 hover:text-gray-700 transition-colors" data-testid="link-terms">
                Terms of Service
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors" data-testid="link-privacy">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span>&copy; {new Date().getFullYear()} The Commons. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
