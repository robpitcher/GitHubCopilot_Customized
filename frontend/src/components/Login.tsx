import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { syncWithApi, wishlistCount } = useWishlist();
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSyncing(false);
    setSyncSuccess(false);
    try {
      const hasLocalItems = wishlistCount > 0;
      if (hasLocalItems) setSyncing(true);
      if (mode === 'login') {
        await login(email, password, syncWithApi);
      } else {
        await register(email, name, password, syncWithApi);
      }
      if (hasLocalItems) {
        setSyncing(false);
        setSyncSuccess(true);
        setTimeout(() => navigate('/'), 1200);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      setSyncing(false);
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      // Extract API error message if available
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error ?? message);
    }
  };

  return (
    <div className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} flex items-center justify-center px-4 transition-colors duration-300`}>
      <div className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 transition-colors duration-300`}>
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-6 transition-colors duration-300`}>
          {mode === 'login' ? 'Login' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        {syncing && (
          <div className="bg-blue-500/10 border border-blue-500 text-blue-500 rounded-md p-3 mb-4 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Syncing your wishlist...
          </div>
        )}

        {syncSuccess && (
          <div className="bg-green-500/10 border border-green-500 text-green-600 rounded-md p-3 mb-4">
            ✓ Wishlist synced successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className={`block ${darkMode ? 'text-light' : 'text-gray-700'} mb-2 transition-colors duration-300`}>Display Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-800'} rounded px-3 py-2 transition-colors duration-300`}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block ${darkMode ? 'text-light' : 'text-gray-700'} mb-2 transition-colors duration-300`}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-800'} rounded px-3 py-2 transition-colors duration-300`}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className={`block ${darkMode ? 'text-light' : 'text-gray-700'} mb-2 transition-colors duration-300`}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-800'} rounded px-3 py-2 transition-colors duration-300`}
              required
              minLength={mode === 'register' ? 6 : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={syncing}
            className="w-full bg-primary hover:bg-accent text-white py-2 px-4 rounded transition-colors disabled:opacity-60"
          >
            {mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === 'login' ? (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className="text-primary hover:text-accent underline"
              >
                Register
              </button>
            </p>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="text-primary hover:text-accent underline"
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}