import { useState } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { Wallet, CreditCard, ArrowUpRight, Clock, Plus } from 'lucide-react';

export default function WalletPage() {
  const { walletBalance, user, createPaymentSession, refreshWalletBalance } = useVideoStore();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const session = await createPaymentSession(amountCents);
      
      // In a production app, you would use Stripe Elements here
      // For now, we just show success and refresh balance
      alert(`Payment session created: ${session.session_id}\n\nIn production, this would open a Stripe payment form.`);
      
      await refreshWalletBalance();
      setShowAddFunds(false);
      setAmount('10.00');
    } catch (err: any) {
      setError(err.message || 'Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
        <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-xl">Please login to view your wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-slate-400">Manage your funds and transaction history</p>
      </div>

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
            onClick={() => setShowAddFunds(true)}
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
              Your wallet is powered by <span className="text-blue-400 font-semibold">Ledewire</span>
            </div>
            <div className="text-sm text-slate-400">
              Secure micropayment system for content purchases
            </div>
          </div>
        </div>
      </div>

      {showAddFunds && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl text-white mb-6 font-bold">Add Funds</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2 text-sm font-medium">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                  data-testid="input-amount"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  In production, this would open a Stripe payment form to securely add funds to your wallet.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-colors border border-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Transaction History
          </h3>
        </div>
        <div className="p-6 text-center text-slate-400">
          <p>Transaction history coming soon</p>
          <p className="text-sm mt-2">Your purchases will appear here</p>
        </div>
      </div>
    </div>
  );
}
