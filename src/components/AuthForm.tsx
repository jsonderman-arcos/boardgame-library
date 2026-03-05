import { useState } from 'react';
import { signIn, signUp } from '../lib/auth';
import { BookOpen } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-cream linen-texture border thin-rule rule-line container-radius p-12">
          <div className="flex flex-col items-center mb-12">
            <BookOpen className="w-12 h-12 text-terracotta-600 mb-6" strokeWidth={1.5} />
            <h1 className="text-4xl font-display font-light text-slate-900 tracking-wide text-center">
              The Catalogue
            </h1>
            <div className="h-px w-16 bg-slate-300 mt-4 mb-2" />
            <p className="text-xs font-body text-slate-500 tracking-widest text-center">
              {isSignUp ? 'Registration' : 'Authentication'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="username" className="block text-xs font-body text-slate-500 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-cream border thin-rule rule-line input-radius focus:outline-none focus:bg-white transition font-body text-sm"
                  required={isSignUp}
                  autoComplete="username"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-body text-slate-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-cream border thin-rule rule-line input-radius focus:outline-none focus:bg-white transition font-body text-sm"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-body text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-cream border thin-rule rule-line input-radius focus:outline-none focus:bg-white transition font-body text-sm"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <div className="bg-terracotta-50 border thin-rule border-terracotta-300 text-terracotta-900 px-4 py-3 text-sm font-body input-radius">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-cream py-3 font-body text-sm uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed input-radius"
            >
              {loading ? 'Processing...' : isSignUp ? 'Register' : 'Enter'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t thin-rule rule-line text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs font-body text-slate-600 hover:text-slate-900 uppercase tracking-wider transition"
            >
              {isSignUp ? 'Return to Sign In' : 'Create New Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
