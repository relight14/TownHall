import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, XCircle } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useVideoStore } from '../context/VideoStoreContext';
import { PaymentForm } from '../pages/WalletPage';

interface AddFundsModalProps {
  onClose: () => void;
  onSuccess: () => void;
  suggestedAmount?: number;
}

const presetAmounts = [5, 10, 25, 50];

export default function AddFundsModal({ onClose, onSuccess, suggestedAmount }: AddFundsModalProps) {
  const { createPaymentSession, refreshWalletBalance } = useVideoStore();
  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toFixed(2) : '10.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      
      if (amountCents < 100) {
        throw new Error('Minimum amount is $1.00');
      }
      
      const session = await createPaymentSession(amountCents);
      
      if (session.client_secret && session.public_key) {
        setStripePromise(loadStripe(session.public_key));
        setClientSecret(session.client_secret);
        setShowPaymentForm(true);
        setLoading(false);
      } else {
        throw new Error('Payment checkout not available. Please try again later.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create payment session');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await refreshWalletBalance();
    onSuccess();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-navy/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={() => {
        if (!showPaymentForm) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white border border-navy/10 rounded-xl p-8 max-w-md w-full shadow-xl shadow-navy/20 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!showPaymentForm ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-navy font-serif font-bold">Add Funds</h2>
              <button 
                onClick={onClose}
                className="text-slate hover:text-navy transition-colors"
                data-testid="button-close-add-funds-inline"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddFunds} className="space-y-6">
              <div>
                <label className="block text-navy mb-3 text-sm font-sans font-medium">Select Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toFixed(2))}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        parseFloat(amount) === preset
                          ? 'bg-gold text-white'
                          : 'bg-parchment text-navy hover:bg-cool-grey border border-navy/10'
                      }`}
                      data-testid={`button-preset-inline-${preset}`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-parchment border border-navy/10 rounded-lg pl-8 pr-4 py-3 text-navy text-lg focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
                    required
                    data-testid="input-amount-inline"
                  />
                </div>
              </div>

              <div className="bg-parchment border border-navy/8 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate font-sans">Amount</span>
                  <span className="text-navy">${parseFloat(amount || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-navy/8">
                  <span className="text-navy font-medium font-sans">Total</span>
                  <span className="text-navy font-medium">${parseFloat(amount || '0').toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-parchment hover:bg-cool-grey text-navy py-3 rounded-lg transition-colors border border-navy/10 font-medium"
                  data-testid="button-cancel-inline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gold hover:bg-gold-light text-white py-3 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="button-continue-inline"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Continue to Payment
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate/50 text-center font-sans">
                Secure payment powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-gold/60 hover:text-gold transition-colors" data-testid="link-ledewire-inline">Ledewire</a> & Stripe
              </p>
            </form>
          </>
        ) : clientSecret && stripePromise ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-navy font-serif font-bold">Complete Payment</h2>
              <button 
                onClick={handlePaymentCancel}
                className="text-slate hover:text-navy transition-colors"
                data-testid="button-close-payment-inline"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#C8963E',
                    colorBackground: '#F9F7F3',
                    colorText: '#1B2A4A',
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm 
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                amount={amount}
                inline={true}
              />
            </Elements>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
