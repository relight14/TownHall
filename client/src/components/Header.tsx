import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, LogOut, MapPin, ChevronDown, X } from 'lucide-react';
import { useVideoStore } from '../context/VideoStoreContext';
import { STATE_NAMES, STATE_CODES, getHomeState, setHomeState, getStateName } from '../lib/states';

interface HeaderProps {
  onLoginClick?: () => void;
  selectedState?: string | null;
}

function StateSelector({ selectedState }: { selectedState?: string | null }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const homeState = selectedState || getHomeState();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStates = STATE_CODES.filter(code => {
    if (!search) return true;
    const q = search.toLowerCase();
    return code.toLowerCase().includes(q) || STATE_NAMES[code].toLowerCase().includes(q);
  });

  function handleSelect(code: string) {
    setHomeState(code);
    setOpen(false);
    setSearch('');
    navigate(`/state/${code.toLowerCase()}`);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-parchment/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        data-testid="state-selector-trigger"
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline">
          {homeState ? getStateName(homeState) : 'Select Your State'}
        </span>
        <span className="sm:hidden">
          {homeState || 'State'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                autoFocus
                data-testid="state-search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* All States link */}
          <div className="border-b border-gray-100">
            <Link
              to="/"
              onClick={() => { setOpen(false); setSearch(''); }}
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              All States
            </Link>
          </div>

          {/* State list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredStates.map(code => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors flex items-center justify-between ${
                  homeState?.toUpperCase() === code ? 'bg-cream font-medium text-navy' : 'text-gray-700'
                }`}
                data-testid={`state-option-${code}`}
              >
                <span>{STATE_NAMES[code]}</span>
                <span className="text-gray-400 text-xs">{code}</span>
              </button>
            ))}
            {filteredStates.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No states match "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ onLoginClick, selectedState }: HeaderProps) {
  const { user, walletBalance, logout } = useVideoStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(prev => {
        // Hysteresis: collapse at 60px, only re-expand below 10px
        if (!prev && window.scrollY > 60) return true;
        if (prev && window.scrollY < 10) return false;
        return prev;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="bg-navy sticky top-0 z-50">
      {/* Expanded masthead — visible only at top */}
      <div className={`transition-all duration-300 ease-in-out ${isCompact ? 'max-h-0 overflow-hidden opacity-0 pointer-events-none' : 'max-h-24 opacity-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <StateSelector selectedState={selectedState} />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-parchment/60 hover:text-gold transition-colors"
                data-testid="button-search"
              >
                <Search className="w-4 h-4" />
              </button>
              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link to="/wallet">
                    <button className="bg-white/5 text-white px-2 sm:px-3 py-1 rounded-lg font-sans font-medium hover:bg-white/10 transition-colors flex items-center gap-1 sm:gap-2 text-xs border border-white/10" data-testid="button-wallet">
                      <span className="text-gold font-semibold">${walletBalance.toFixed(2)}</span>
                      <span className="text-white/20 hidden sm:inline">|</span>
                      <span className="hidden sm:inline text-parchment/70">{user.email?.split('@')[0] || 'Account'}</span>
                    </button>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 text-parchment/40 hover:text-parchment transition-colors"
                    title="Log out"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLoginClick}
                  className="text-parchment/70 hover:text-white px-3 py-1 font-sans font-medium transition-colors text-sm" 
                  data-testid="button-login"
                >
                  Log in
                </button>
              )}
            </div>
          </div>
          {/* Large centered logo */}
          <div className="flex items-center justify-center pb-4 pt-1">
            <Link to="/">
              <span className="font-serif font-bold text-white text-4xl sm:text-5xl tracking-wide" data-testid="logo">
                The Commons
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Compact nav bar — always rendered, becomes the visible header on scroll */}
      <div className={`transition-all duration-300 ease-in-out ${isCompact ? 'border-t-0' : 'border-t border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Left: State selector (compact only) / nav links */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isCompact && <StateSelector selectedState={selectedState} />}
            </div>

            {/* Center: Logo (compact only) */}
            {isCompact && (
              <Link to="/" className="absolute left-1/2 -translate-x-1/2">
                <span className="font-serif font-bold text-white text-lg sm:text-xl tracking-tight" data-testid="logo-compact">
                  The Commons
                </span>
              </Link>
            )}

            {/* Right: Search + Auth (compact) */}
            {isCompact && (
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 text-parchment/60 hover:text-gold transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
                {user ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link to="/wallet">
                      <button className="bg-white/5 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-sans font-medium hover:bg-white/10 transition-colors flex items-center gap-1 sm:gap-2 text-sm border border-white/10">
                        <span className="text-gold font-semibold">${walletBalance.toFixed(2)}</span>
                      </button>
                    </Link>
                    <button
                      onClick={logout}
                      className="p-1.5 sm:p-2 text-parchment/40 hover:text-parchment transition-colors"
                      title="Log out"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={onLoginClick}
                    className="bg-gold text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded font-sans font-semibold hover:bg-gold-light transition-colors text-sm tracking-wide"
                  >
                    Log in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Subtle gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </header>
  );
}
