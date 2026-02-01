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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl text-white font-bold">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="button-close-auth"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-400 mb-6">
            {isLogin 
              ? 'Sign in to purchase and access premium content'
              : 'Create an account to get started'
            }
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" data-testid="text-error">
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
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-slate-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              {!isLogin && (
                <div>
                  <label className="block text-slate-300 mb-2 text-sm font-medium">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Your name"
                      required
                      data-testid="input-name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-2 text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                  />
                </div>
                {isLogin && onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                    agreedToTerms 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  data-testid="checkbox-terms"
                >
                  {agreedToTerms && <Check className="w-5 h-5 text-white" />}
                </button>
                <span className="text-slate-400 text-sm leading-tight">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-400 hover:underline" target="_blank" onClick={(e) => e.stopPropagation()} data-testid="link-signup-terms">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-400 hover:underline" target="_blank" onClick={(e) => e.stopPropagation()} data-testid="link-signup-privacy">
                    Privacy Policy
                  </Link>
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium border border-slate-700"
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!isLogin && !agreedToTerms)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full text-blue-400 hover:text-blue-300 text-sm transition-colors py-2"
            data-testid="button-toggle-auth"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="px-6 pb-4 pt-2 border-t border-slate-800">
          <p className="text-slate-500 text-xs text-center">
            powered by{' '}
            <a 
              href="https://www.ledewire.com/explore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
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
