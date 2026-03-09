import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy text-parchment mt-auto">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1">
            <span className="text-2xl font-bold font-serif text-white tracking-wide">The Commons</span>
            <p className="mt-4 text-parchment/60 text-sm leading-relaxed font-body">
              Reader-funded local journalism from on-the-ground reporters across all 50 states. 
              Every story you unlock directly supports the writer who reported it.
            </p>
            {/* 75% trust signal */}
            <div className="mt-6 inline-flex items-center gap-3 px-4 py-2.5 rounded bg-white/5 border border-gold/20">
              <span className="text-gold font-serif font-bold text-xl">75%</span>
              <span className="text-parchment/50 text-xs leading-tight font-sans">of every purchase<br />goes to the writer</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-1">
            <h4 className="section-label mb-5">Navigate</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-sm text-parchment/60 hover:text-gold transition-colors font-sans">Home</Link>
              <Link to="/videos" className="text-sm text-parchment/60 hover:text-gold transition-colors font-sans">Videos</Link>
              <Link to="/wallet" className="text-sm text-parchment/60 hover:text-gold transition-colors font-sans">Wallet</Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="md:col-span-1">
            <h4 className="section-label mb-5">Legal</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/terms" className="text-sm text-parchment/60 hover:text-gold transition-colors font-sans" data-testid="link-terms">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-sm text-parchment/60 hover:text-gold transition-colors font-sans" data-testid="link-privacy">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-parchment/40 font-sans">
              &copy; {new Date().getFullYear()} The Commons. All rights reserved.
            </span>
            <span className="text-xs text-parchment/30 font-sans">
              Payments powered by{' '}
              <a href="https://www.ledewire.com" target="_blank" rel="noopener noreferrer" className="text-gold/50 hover:text-gold transition-colors">
                Ledewire
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
