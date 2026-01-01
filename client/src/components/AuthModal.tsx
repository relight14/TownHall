import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useVideoStore } from '../context/VideoStoreContext';
import { useGoogleOAuthStatus } from '../App';
import { X, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: (ledewireToken: string) => void;
  onForgotPassword?: () => void;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

interface GoogleLoginButtonProps {
  onLoginStart: () => void;
  onLoginSuccess: (accessToken: string) => void;
  onLoginError: (error: string) => void;
  loading: boolean;
}

function GoogleLoginButton({ onLoginStart, onLoginSuccess, onLoginError, loading }: GoogleLoginButtonProps) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onLoginSuccess(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Google login error:', error);
      onLoginError('Google sign-in failed. Please try again.');
    },
  });

  return (
    <button
      onClick={() => {
        onLoginStart();
        googleLogin();
      }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 py-3 rounded-lg transition-colors font-medium mb-6 disabled:opacity-50"
      data-testid="button-google-login"
    >
      <GoogleIcon className="w-5 h-5" />
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
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

  const handleGoogleLoginStart = () => {
    setError('');
    setLoading(true);
  };

  const handleGoogleLoginSuccess = async (accessToken: string) => {
    try {
      const token = await loginWithGoogle(accessToken);
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
              <GoogleLoginButton
                onLoginStart={handleGoogleLoginStart}
                onLoginSuccess={handleGoogleLoginSuccess}
                onLoginError={handleGoogleLoginError}
                loading={loading}
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
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
            powered by <span className="text-blue-400">ledewire</span>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
