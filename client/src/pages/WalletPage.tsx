import { Wallet, CreditCard, ArrowUpRight, Clock } from 'lucide-react';

export default function WalletPage() {
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
          <div className="text-4xl font-bold mb-2">$24.50</div>
          <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            Add Funds
          </button>
        </div>

        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 backdrop-blur-sm col-span-2">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Payment Methods
          </h3>
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-3">
            <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center text-xs font-bold tracking-wider">VISA</div>
            <div className="flex-1">
              <div className="font-medium">Visa ending in 4242</div>
              <div className="text-sm text-slate-400">Expires 12/28</div>
            </div>
            <button className="text-slate-400 hover:text-white text-sm">Edit</button>
          </div>
          <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium px-2">
            <ArrowUpRight className="w-4 h-4" />
            Add new payment method
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Transaction History
          </h3>
        </div>
        <div className="divide-y divide-slate-800">
          {[
            { title: 'Web Development Masterclass - Ep 1', date: 'Today, 2:30 PM', amount: -9.99 },
            { title: 'Wallet Fund', date: 'Yesterday', amount: +50.00 },
            { title: 'Creative Photography - Ep 2', date: 'Oct 24, 2023', amount: -14.99 },
          ].map((tx, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div>
                <div className="font-medium text-slate-200">{tx.title}</div>
                <div className="text-sm text-slate-500">{tx.date}</div>
              </div>
              <div className={`font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-slate-300'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
