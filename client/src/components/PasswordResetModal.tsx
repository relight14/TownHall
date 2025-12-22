import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

interface PasswordResetModalProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

export default function PasswordResetModal({ onClose, onBackToLogin }: PasswordResetModalProps) {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/password/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          reset_code: resetCode, 
          password: newPassword 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center gap-3">
            {step !== 'success' && (
              <button
                onClick={onBackToLogin}
                className="text-slate-400 hover:text-white transition-colors"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl text-white font-bold">
              {step === 'email' && 'Reset Password'}
              {step === 'code' && 'Enter Code'}
              {step === 'success' && 'Password Reset'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="button-close-reset"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" data-testid="text-error">
              {error}
            </div>
          )}

          {step === 'email' && (
            <>
              <p className="text-slate-400 mb-6">
                Enter your email address and we'll send you a code to reset your password.
              </p>
              <form onSubmit={handleRequestCode}>
                <div className="mb-6">
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
                      data-testid="input-reset-email"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium border border-slate-700"
                    data-testid="button-cancel-reset"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    data-testid="button-send-code"
                  >
                    {loading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <p className="text-slate-400 mb-6">
                We've sent a 6-digit code to <span className="text-white">{email}</span>. Enter it below along with your new password.
              </p>
              <form onSubmit={handleResetPassword}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-slate-300 mb-2 text-sm font-medium">Reset Code</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="000000"
                      maxLength={6}
                      required
                      data-testid="input-reset-code"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2 text-sm font-medium">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                        required
                        data-testid="input-new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2 text-sm font-medium">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                        required
                        data-testid="input-confirm-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium border border-slate-700"
                    data-testid="button-back"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || resetCode.length !== 6}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    data-testid="button-reset-password"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl text-white font-semibold mb-2">Password Reset Successful</h3>
              <p className="text-slate-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                data-testid="button-back-to-signin"
              >
                Back to Sign In
              </button>
            </div>
          )}
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
