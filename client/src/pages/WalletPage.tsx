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
}

function PaymentForm({ clientSecret, onSuccess, onCancel, amount }: PaymentFormProps) {
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

      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/wallet?payment=success`,
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message);
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
          data-testid="button-cancel-payment"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
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

      <p className="text-xs text-slate-500 text-center">
        Secure payment powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" data-testid="link-ledewire-payment">Ledewire</a> & Stripe
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
        <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-xl">Please sign in to view your wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <div className="mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          data-testid="link-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-slate-400">Manage your funds and transaction history</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3" data-testid="text-success">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{successMessage}</span>
        </div>
      )}

      {error && !showAddFunds && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3" data-testid="text-error">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 border border-blue-500/30 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-200 text-sm font-medium">Current Balance</span>
          </div>
          <div className="text-4xl font-bold mb-2" data-testid="text-balance">${walletBalance.toFixed(2)}</div>
          <button 
            onClick={() => {
              setShowAddFunds(true);
              setError('');
              setSuccessMessage('');
            }}
            className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            data-testid="button-add-funds"
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
        </div>

        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 backdrop-blur-sm col-span-2">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Ledewire Wallet
          </h3>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-slate-300 mb-2">
              Your wallet is powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors" data-testid="link-ledewire-wallet">Ledewire</a>
            </div>
            <div className="text-sm text-slate-400">
              Secure micropayment system for content purchases. Add funds using your credit or debit card.
            </div>
          </div>
        </div>
      </div>

      {showAddFunds && !showPaymentForm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => {
            setShowAddFunds(false);
            setError('');
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-white font-bold">Add Funds</h2>
              <button 
                onClick={() => {
                  setShowAddFunds(false);
                  setError('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
                data-testid="button-close-add-funds"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddFunds} className="space-y-6">
              <div>
                <label className="block text-slate-300 mb-3 text-sm font-medium">Select Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toFixed(2))}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        parseFloat(amount) === preset
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                      data-testid={`button-preset-${preset}`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                    data-testid="input-amount"
                  />
                </div>
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
                  onClick={() => {
                    setShowAddFunds(false);
                    setError('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors border border-slate-700 font-medium"
                  data-testid="button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
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

              <p className="text-xs text-slate-500 text-center">
                Secure payment powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" data-testid="link-ledewire-modal">Ledewire</a> & Stripe
              </p>
            </form>
          </div>
        </div>
      )}

      {showPaymentForm && clientSecret && stripePromise && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={handlePaymentCancel}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-white font-bold">Complete Payment</h2>
              <button 
                onClick={handlePaymentCancel}
                className="text-slate-400 hover:text-white transition-colors"
                data-testid="button-close-payment"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#3b82f6',
                    colorBackground: '#1e293b',
                    colorText: '#e2e8f0',
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
              />
            </Elements>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Purchase History
          </h3>
        </div>
        <div className="divide-y divide-slate-800">
          {purchasesLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
              <p className="text-slate-400 mt-2">Loading purchases...</p>
            </div>
          ) : purchasesError ? (
            <div className="p-6 text-center text-red-400">
              <p>{purchasesError}</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <p>No purchases yet</p>
              <p className="text-sm mt-2">Your purchases will appear here</p>
            </div>
          ) : (
            purchases.map((purchase) => (
              <div key={purchase.id} className="p-4 hover:bg-slate-800/50 transition-colors" data-testid={`purchase-item-${purchase.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {purchase.content_type === 'video' ? (
                        <Video className="w-5 h-5 text-blue-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {purchase.source_url ? (
                        <a 
                          href={purchase.source_url} 
                          className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate"
                          data-testid={`purchase-link-${purchase.id}`}
                        >
                          <span className="truncate">{purchase.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-white font-medium truncate block">{purchase.title}</span>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <span>{new Date(purchase.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                        <span>•</span>
                        <span className="capitalize">{purchase.content_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-white font-medium">
                      ${(purchase.amount_cents / 100).toFixed(2)}
                    </span>
                    <div className="text-xs text-green-400 mt-0.5 capitalize">
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
