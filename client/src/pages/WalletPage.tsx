import { useState, useEffect, useCallback } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { Wallet, CreditCard, Clock, Plus, CheckCircle, XCircle, X, ArrowLeft, ExternalLink, FileText, Video, Loader2 } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface Purchase {
  id: string;
  content_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  timestamp: string;
  status: string;
  title: string;
  source_url: string | null;
  content_type: string;
}

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  amount: string;
  inline?: boolean;
}

export function PaymentForm({ clientSecret, onSuccess, onCancel, amount, inline = false }: PaymentFormProps) {
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

      if (inline) {
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
      } else {
        const { error: paymentError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/wallet?payment=success`,
          },
        });

        if (paymentError) {
          throw new Error(paymentError.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-parchment border border-navy/10 rounded-lg p-4 mb-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="bg-parchment border border-navy/10 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate font-sans">Amount</span>
          <span className="text-navy font-sans">${parseFloat(amount || '0').toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-navy/10">
          <span className="text-navy font-sans font-medium">Total</span>
          <span className="text-navy font-sans font-medium">${parseFloat(amount || '0').toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-parchment hover:bg-cool-grey text-navy py-3 rounded transition-colors border border-navy/10 font-sans font-medium"
          data-testid="button-cancel-payment"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="flex-1 bg-gold hover:bg-gold-light text-white py-3 rounded transition-colors font-sans font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-pay"
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

      <p className="text-xs text-slate/40 text-center font-sans">
        Secure payment powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-gold/60 hover:text-gold transition-colors" data-testid="link-ledewire-payment">Ledewire</a> & Stripe
      </p>
    </form>
  );
}

export default function WalletPage() {
  const { walletBalance, user, createPaymentSession, refreshWalletBalance, ledewireToken } = useVideoStore();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();
  
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState('');

  const fetchPurchases = useCallback(async () => {
    if (!ledewireToken) return;
    
    setPurchasesLoading(true);
    setPurchasesError('');
    
    try {
      const response = await fetch('/api/wallet/purchases', {
        headers: {
          'Authorization': `Bearer ${ledewireToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase history');
      }
      
      const data = await response.json();
      setPurchases(data);
    } catch (err: any) {
      console.error('Failed to fetch purchases:', err);
      setPurchasesError(err.message || 'Failed to load purchase history');
    } finally {
      setPurchasesLoading(false);
    }
  }, [ledewireToken]);

  useEffect(() => {
    if (ledewireToken) {
      fetchPurchases();
    }
  }, [ledewireToken, fetchPurchases]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      setSuccessMessage('Payment successful! Your wallet has been topped up.');
      refreshWalletBalance();
      window.history.replaceState({}, '', '/wallet');
    } else if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled.');
      window.history.replaceState({}, '', '/wallet');
    }
  }, [location, refreshWalletBalance]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      
      if (amountCents < 100) {
        throw new Error('Minimum amount is $1.00');
      }
      
      const session = await createPaymentSession(amountCents);
      console.log('Payment session response:', session);
      
      if (session.client_secret && session.public_key) {
        setStripePromise(loadStripe(session.public_key));
        setClientSecret(session.client_secret);
        setShowPaymentForm(true);
        setLoading(false);
      } else if (session.checkout_url) {
        window.location.href = session.checkout_url;
      } else if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Payment checkout not available. Please try again later.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create payment session');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setShowAddFunds(false);
    setClientSecret(null);
    setSuccessMessage('Payment successful! Your wallet has been topped up.');
    refreshWalletBalance();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setShowAddFunds(false);
    setClientSecret(null);
    setStripePromise(null);
  };

  const presetAmounts = [5, 10, 25, 50];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20 bg-white rounded-xl border border-navy/8">
          <p className="text-slate text-xl font-body">Please sign in to view your wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gold hover:text-gold-dark transition-colors mb-4 font-sans text-sm"
          data-testid="link-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <span className="section-label block mb-2">Account</span>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2">My Wallet</h1>
        <p className="text-slate font-sans">Manage your funds and transaction history</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3" data-testid="text-success">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-sans">{successMessage}</span>
        </div>
      )}

      {error && !showAddFunds && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3" data-testid="text-error">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-sans">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-navy rounded-xl p-6 border border-navy-light/30 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Wallet className="w-6 h-6 text-gold" />
            </div>
            <span className="text-parchment/60 text-xs font-sans font-medium uppercase tracking-wider">Current Balance</span>
          </div>
          <div className="text-4xl font-serif font-bold text-white mb-3" data-testid="text-balance">${walletBalance.toFixed(2)}</div>
          <button 
            onClick={() => {
              setShowAddFunds(true);
              setError('');
              setSuccessMessage('');
            }}
            className="w-full py-2.5 bg-gold hover:bg-gold-light rounded text-white text-sm font-sans font-semibold transition-colors flex items-center justify-center gap-2"
            data-testid="button-add-funds"
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border border-navy/8 col-span-2">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Ledewire Wallet
          </h3>
          <div className="p-4 bg-parchment rounded-lg border border-navy/5">
            <div className="text-navy mb-2 font-sans">
              Your wallet is powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:text-gold-dark transition-colors" data-testid="link-ledewire-wallet">Ledewire</a>
            </div>
            <div className="text-sm text-slate font-sans">
              Secure micropayment system for content purchases. Add funds using your credit or debit card.
            </div>
          </div>
        </div>
      </div>

      {showAddFunds && !showPaymentForm && (
        <div 
          className="fixed inset-0 bg-navy/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => {
            setShowAddFunds(false);
            setError('');
          }}
        >
          <div 
            className="bg-white border border-navy/10 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-navy/20 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-navy">Add Funds</h2>
              <button 
                onClick={() => {
                  setShowAddFunds(false);
                  setError('');
                }}
                className="text-slate/40 hover:text-navy transition-colors"
                data-testid="button-close-add-funds"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2 font-sans">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddFunds} className="space-y-6">
              <div>
                <label className="block text-navy text-sm font-sans font-medium mb-3">Select Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toFixed(2))}
                      className={`py-2 rounded text-sm font-sans font-medium transition-colors ${
                        parseFloat(amount) === preset
                          ? 'bg-navy text-white'
                          : 'bg-parchment text-navy hover:bg-cool-grey border border-navy/10'
                      }`}
                      data-testid={`button-preset-${preset}`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate text-lg font-sans">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-parchment border border-navy/10 rounded pl-8 pr-4 py-3 text-navy text-lg font-sans focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
                    required
                    data-testid="input-amount"
                  />
                </div>
              </div>

              <div className="bg-parchment border border-navy/5 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate font-sans">Amount</span>
                  <span className="text-navy font-sans">${parseFloat(amount || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-navy/10">
                  <span className="text-navy font-sans font-medium">Total</span>
                  <span className="text-navy font-sans font-medium">${parseFloat(amount || '0').toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFunds(false);
                    setError('');
                  }}
                  className="flex-1 bg-parchment hover:bg-cool-grey text-navy py-3 rounded transition-colors border border-navy/10 font-sans font-medium"
                  data-testid="button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gold hover:bg-gold-light text-white py-3 rounded transition-colors font-sans font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="button-continue"
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

              <p className="text-xs text-slate/40 text-center font-sans">
                Secure payment powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-gold/60 hover:text-gold transition-colors" data-testid="link-ledewire-modal">Ledewire</a> & Stripe
              </p>
            </form>
          </div>
        </div>
      )}

      {showPaymentForm && clientSecret && stripePromise && (
        <div 
          className="fixed inset-0 bg-navy/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={handlePaymentCancel}
        >
          <div 
            className="bg-white border border-navy/10 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-navy/20 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-navy">Complete Payment</h2>
              <button 
                onClick={handlePaymentCancel}
                className="text-slate/40 hover:text-navy transition-colors"
                data-testid="button-close-payment"
              >
                <X className="w-5 h-5" />
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
                    colorDanger: '#dc2626',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    borderRadius: '6px',
                  },
                },
              }}
            >
              <PaymentForm 
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                amount={amount}
              />
            </Elements>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-navy/8 overflow-hidden">
        <div className="p-6 border-b border-navy/5">
          <h3 className="text-lg font-serif font-semibold text-navy flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate/40" />
            Purchase History
          </h3>
        </div>
        <div className="divide-y divide-navy/5">
          {purchasesLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 text-slate/40 animate-spin mx-auto" />
              <p className="text-slate mt-2 font-sans">Loading purchases...</p>
            </div>
          ) : purchasesError ? (
            <div className="p-6 text-center text-red-600 font-sans">
              <p>{purchasesError}</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-6 text-center text-slate">
              <p className="font-sans">No purchases yet</p>
              <p className="text-sm mt-2 font-sans text-slate/60">Your purchases will appear here</p>
            </div>
          ) : (
            purchases.map((purchase) => (
              <div key={purchase.id} className="p-4 hover:bg-parchment transition-colors" data-testid={`purchase-item-${purchase.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-parchment flex items-center justify-center flex-shrink-0">
                      {purchase.content_type === 'video' ? (
                        <Video className="w-5 h-5 text-gold" />
                      ) : (
                        <FileText className="w-5 h-5 text-navy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {purchase.source_url ? (
                        <a 
                          href={purchase.source_url} 
                          className="text-navy font-serif font-medium hover:text-gold-dark transition-colors flex items-center gap-1.5 truncate"
                          data-testid={`purchase-link-${purchase.id}`}
                        >
                          <span className="truncate">{purchase.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-navy font-serif font-medium truncate block">{purchase.title}</span>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate font-sans">
                        <span>{new Date(purchase.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                        <span className="text-slate/30">·</span>
                        <span className="capitalize">{purchase.content_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-navy font-sans font-medium">
                      ${(purchase.amount_cents / 100).toFixed(2)}
                    </span>
                    <div className="text-xs text-green-700 mt-0.5 capitalize font-sans">
                      {purchase.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
