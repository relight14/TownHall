import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, XCircle, Loader2, Plus, Minus } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useVideoStore } from '../context/VideoStoreContext';

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  amount: string;
}

function InlinePaymentForm({ clientSecret, onSuccess, onCancel, amount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Amount</span>
          <span className="text-white">${parseFloat(amount || '0').toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
          <span className="text-slate-300 font-medium">Total</span>
          <span className="text-white font-medium">${parseFloat(amount || '0').toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors border border-slate-700 font-medium"
          data-testid="button-cancel-inline-payment"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-pay-inline"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay ${parseFloat(amount || '0').toFixed(2)}
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Secure payment powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" data-testid="link-ledewire-inline">Ledewire</a> & Stripe
      </p>
    </form>
  );
}

interface AddFundsModalProps {
  onClose: () => void;
  onSuccess: () => void;
  suggestedAmount?: number;
}

export default function AddFundsModal({ onClose, onSuccess, suggestedAmount }: AddFundsModalProps) {
  const { createPaymentSession, refreshWalletBalance } = useVideoStore();
  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toFixed(2) : '10.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const quickAmounts = [5, 10, 25, 50];

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountCents) || amountCents < 100) {
        throw new Error('Minimum amount is $1.00');
      }

      const result = await createPaymentSession(amountCents);
      
      if (result.stripe_publishable_key) {
        setStripePromise(loadStripe(result.stripe_publishable_key));
      }
      setClientSecret(result.client_secret);
      setShowPaymentForm(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start payment');
    } finally {
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

  const incrementAmount = () => {
    const current = parseFloat(amount) || 0;
    setAmount((current + 5).toFixed(2));
  };

  const decrementAmount = () => {
    const current = parseFloat(amount) || 0;
    if (current > 5) {
      setAmount((current - 5).toFixed(2));
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showPaymentForm) onClose();
      }}
    >
      <div className="bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-white font-bold">Add Funds</h2>
            {!showPaymentForm && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
                data-testid="button-close-add-funds"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {!showPaymentForm ? (
            <form onSubmit={handleStartPayment} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-3 font-medium">Select Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(quickAmount.toFixed(2))}
                      className={`py-2 rounded-lg transition-colors font-medium ${
                        parseFloat(amount) === quickAmount
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                      data-testid={`button-amount-${quickAmount}`}
                    >
                      ${quickAmount}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={decrementAmount}
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white border border-slate-700"
                    data-testid="button-decrement-amount"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-500 transition-colors"
                      data-testid="input-amount"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={incrementAmount}
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white border border-slate-700"
                    data-testid="button-increment-amount"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium border border-slate-700"
                  data-testid="button-cancel-add-funds"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="button-continue-payment"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : clientSecret && stripePromise ? (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#3b82f6',
                    colorBackground: '#1e293b',
                    colorText: '#f8fafc',
                    colorDanger: '#ef4444',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <InlinePaymentForm
                clientSecret={clientSecret}
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
