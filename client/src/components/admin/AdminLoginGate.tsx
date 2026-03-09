import { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginGateProps {
  onAuthenticated: (token: string) => void;
}

export function AdminLoginGate({ onAuthenticated }: AdminLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data = await response.json();
      sessionStorage.setItem('adminAuthenticated', 'true');
      sessionStorage.setItem('adminToken', data.adminToken);
      onAuthenticated(data.adminToken);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl text-white mb-2 font-bold text-center">Admin Access</h2>
        <p className="text-slate-400 text-center mb-6 text-sm">Enter your credentials to access the admin panel</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" data-testid="text-admin-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="admin@example.com"
              required
              data-testid="input-admin-email"
            />
          </div>
          
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required
              data-testid="input-admin-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-lg transition-all font-medium shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-6"
            data-testid="button-admin-login"
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
