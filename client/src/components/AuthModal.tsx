import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useVideoStore } from '../context/VideoStoreContext';
import { useGoogleOAuthStatus } from '../App';
import { X, Mail, Lock, User, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: (ledewireToken: string) => void;
  onForgotPassword?: () => void;
}

interface GoogleLoginButtonProps {
  onLoginSuccess: (credential: string) => void;
  onLoginError: (error: string) => void;
}

function GoogleLoginButtonWrapper({ onLoginSuccess, onLoginError }: GoogleLoginButtonProps) {
  return (
    <div className="w-full mb-6">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onLoginSuccess(credentialResponse.credential);
          } else {
            onLoginError('No credential received from Google');
          }
        }}
        onError={() => {
          onLoginError('Google sign-in failed. Please try again.');
        }}
        useOneTap
        theme="filled_blue"
        size="large"
        width="100%"
        text="continue_with"
      />
    </div>
  );
}

export default function AuthModal({ onClose, onSuccess, onForgotPassword }: AuthModalProps) {
  const { login, signup, loginWithGoogle } = useVideoStore();
  const { isAvailable: googleOAuthAvailable } = useGoogleOAuthStatus();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let token: string;
      if (isLogin) {
        token = await login(email, password);
      } else {
        token = await signup(email, password, name);
      }
      if (onSuccess) {
        onSuccess(token);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const token = await loginWithGoogle(credential);
      if (onSuccess) {
        onSuccess(token);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-navy/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-md w-full border border-navy/10 shadow-2xl shadow-navy/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-navy/5">
          <h2 className="text-xl font-serif font-bold text-navy">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate/40 hover:text-navy transition-colors"
            data-testid="button-close-auth"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate text-sm mb-6 font-sans">
            {isLogin 
              ? 'Sign in to unlock and access premium content'
              : 'Create an account to get started'
            }
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-sans" data-testid="text-error">
              {error}
            </div>
          )}

          {googleOAuthAvailable && (
            <>
              <GoogleLoginButtonWrapper
                onLoginSuccess={handleGoogleLoginSuccess}
                onLoginError={handleGoogleLoginError}
              />

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-navy/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate/50 font-sans">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              {!isLogin && (
                <div>
                  <label className="block text-navy text-sm font-sans font-medium mb-1.5">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-parchment border border-navy/10 rounded px-10 py-2.5 text-navy font-sans focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                      placeholder="Your name"
                      required
                      data-testid="input-name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-navy text-sm font-sans font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-parchment border border-navy/10 rounded px-10 py-2.5 text-navy font-sans focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                    placeholder="your@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-navy text-sm font-sans font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-parchment border border-navy/10 rounded px-10 py-2.5 text-navy font-sans focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                  />
                </div>
                {isLogin && onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-gold hover:text-gold-dark text-sm mt-2 transition-colors font-sans"
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                    agreedToTerms 
                      ? 'bg-gold border-gold' 
                      : 'border-navy/20 hover:border-navy/40'
                  }`}
                  data-testid="checkbox-terms"
                >
                  {agreedToTerms && <Check className="w-5 h-5 text-white" />}
                </button>
                <span className="text-slate text-sm leading-tight font-sans">
                  I agree to the{' '}
                  <Link to="/terms" className="text-gold hover:underline" target="_blank" onClick={(e) => e.stopPropagation()} data-testid="link-signup-terms">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-gold hover:underline" target="_blank" onClick={(e) => e.stopPropagation()} data-testid="link-signup-privacy">
                    Privacy Policy
                  </Link>
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-parchment hover:bg-cool-grey text-navy py-2.5 rounded transition-colors font-sans font-medium border border-navy/10"
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!isLogin && !agreedToTerms)}
                className="flex-1 bg-gold hover:bg-gold-light text-white py-2.5 rounded transition-colors font-sans font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-submit"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>

        <div className="px-6 pb-2">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-gold hover:text-gold-dark text-sm transition-colors py-2 font-sans"
            data-testid="button-toggle-auth"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="px-6 pb-4 pt-2 border-t border-navy/5">
          <p className="text-slate/40 text-xs text-center font-sans">
            powered by{' '}
            <a 
              href="https://www.ledewire.com/explore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold/60 hover:text-gold transition-colors"
              data-testid="link-ledewire-auth"
            >
              ledewire
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
